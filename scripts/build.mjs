/**
 * Build.
 *
 * Four steps, in order:
 *   1. bundle the client                  -> dist/client/assets/client-[hash].js
 *   2. bundle the server renderer         -> dist/server/entry-server.js
 *   3. render every public route to disk  -> dist/client/<route>.html
 *      (`/` alone is index.html). Cloudflare Pages serves `about.html` at
 *      `/about` and redirects `/about/` back to it, so the served URL is the
 *      canonical one. The old `<route>/index.html` layout did the opposite:
 *      every canonical, sitemap entry and link was a 308 to the slash form.
 *   4. generate sitemap.xml / llms.txt / robots.txt
 *
 * Step 3 is the one that decides whether this site exists to ChatGPT, Claude
 * and Perplexity. `verify-prerender.mjs` runs after it and fails the build if
 * any page would arrive empty.
 */
import { build } from 'esbuild'
import { createHash } from 'node:crypto'
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { existsSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const clientDir = join(root, 'dist', 'client')
const serverDir = join(root, 'dist', 'server')

/** Resolves the `@/` alias the way tsconfig paths does, trying each extension. */
const alias = {
  name: 'alias-@',
  setup(b) {
    const exts = ['.tsx', '.ts', '.jsx', '.js', '.css', '']
    b.onResolve({ filter: /^@\// }, async (args) => {
      const base = resolve(root, 'src', args.path.slice(2))
      for (const ext of exts) {
        const candidate = base + ext
        if (existsSync(candidate) && statSync(candidate).isFile()) return { path: candidate }
      }
      for (const ext of ['.tsx', '.ts', '.js']) {
        const candidate = join(base, `index${ext}`)
        if (existsSync(candidate)) return { path: candidate }
      }
      return { errors: [{ text: `Cannot resolve alias ${args.path}` }] }
    })
  },
}

console.log('\n▸ cleaning')
await rm(join(root, 'dist'), { recursive: true, force: true })
await mkdir(clientDir, { recursive: true })

/* ------------------------------------------------------------------- CSS */

console.log('▸ stylesheet')
const css =
  (await readFile(join(root, 'src/styles/fonts.css'), 'utf-8')) +
  '\n' +
  (await readFile(join(root, 'src/styles/tokens.css'), 'utf-8')) +
  '\n' +
  (await readFile(join(root, 'src/styles/components.css'), 'utf-8'))
const cssMin = await build({
  stdin: { contents: css, loader: 'css', resolveDir: join(root, 'src/styles') },
  bundle: true,
  minify: true,
  write: false,
  // The font files are static assets copied from public/, not bundle inputs.
  external: ['/fonts/*'],
})
const cssOut = cssMin.outputFiles[0].text
const cssHash = createHash('sha256').update(cssOut).digest('hex').slice(0, 8)
const cssName = `assets/site-${cssHash}.css`
await mkdir(join(clientDir, 'assets'), { recursive: true })
await writeFile(join(clientDir, cssName), cssOut, 'utf-8')
console.log(`  ${cssName}  ${(cssOut.length / 1024).toFixed(1)} kB`)

/* ---------------------------------------------------------------- client */

console.log('▸ client bundle')
// Code splitting: a dynamic `import()` (the members area, from AccountPage)
// becomes its own chunk, fetched only when a signed-in member opens /account.
// esbuild names every output with a content hash, and the entry file is found
// through the metafile rather than assumed.
const clientBuild = await build({
  entryPoints: [join(root, 'src/entry-client.tsx')],
  bundle: true,
  splitting: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2022'],
  jsx: 'automatic',
  minify: true,
  // No source map in production: it would publish the full members-area source
  // next to the bundle and double the size of dist/client/assets.
  sourcemap: false,
  write: true,
  metafile: true,
  outdir: join(clientDir, 'assets'),
  entryNames: 'client-[hash]',
  chunkNames: 'chunk-[hash]',
  define: { 'process.env.NODE_ENV': '"production"' },
  plugins: [alias],
  loader: { '.md': 'text' },
})
const jsOutputs = Object.entries(clientBuild.metafile.outputs).filter(([p]) => p.endsWith('.js'))
const jsEntry = jsOutputs.find(([, o]) => o.entryPoint)
if (!jsEntry) {
  throw new Error(`esbuild produced no entry output. Files: ${jsOutputs.map(([p]) => p).join(', ')}`)
}
const jsName = relative(clientDir, resolve(root, jsEntry[0])).split(sep).join('/')
for (const [p, o] of jsOutputs) {
  console.log(`  ${relative(clientDir, resolve(root, p)).split(sep).join('/')}  ${(o.bytes / 1024).toFixed(1)} kB`)
}

/* ---------------------------------------------------------------- server */

console.log('▸ server bundle')
await mkdir(serverDir, { recursive: true })
await build({
  entryPoints: [join(root, 'src/entry-server.tsx')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: ['node20'],
  jsx: 'automatic',
  outfile: join(serverDir, 'entry-server.js'),
  define: { 'process.env.NODE_ENV': '"production"' },
  plugins: [alias],
  loader: { '.md': 'text' },
  packages: 'external',
})

/* ------------------------------------------------------------ public/ ---- */

console.log('▸ static assets')
await cp(join(root, 'public'), clientDir, { recursive: true })

/* ------------------------------------------------------------- prerender */

console.log('▸ prerender')
const { render, manifest } = await import(pathToFileURL(join(serverDir, 'entry-server.js')).href)

const shell = (head, html) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="preload" href="/fonts/outfit-latin.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="/fonts/figtree-latin.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="stylesheet" href="/${cssName}" />
    ${head}
  </head>
  <body>
    <div id="root">${html}</div>
    <script type="module" src="/${jsName}"></script>
  </body>
</html>
`

/** `/` -> index.html; every other route -> `<route>.html` (see the header). */
const fileFor = (path) =>
  path === '/' ? join(clientDir, 'index.html') : join(clientDir, `${path.replace(/^\//, '')}.html`)

let written = 0
for (const path of manifest.paths) {
  const { html, head } = render(path)
  const page = shell(head, html)
  const outFile = fileFor(path)
  await mkdir(dirname(outFile), { recursive: true })
  await writeFile(outFile, page, 'utf-8')
  console.log(`  ${path.padEnd(52)} ${(Buffer.byteLength(page) / 1024).toFixed(1)} kB`)
  written += 1
}

// Client-only routes still need a shell so a direct hit does not 404.
for (const entry of manifest.entries.filter((e) => !e.prerender)) {
  const { head } = render(entry.path)
  const outFile = fileFor(entry.path)
  await mkdir(dirname(outFile), { recursive: true })
  await writeFile(outFile, shell(head, ''), 'utf-8')
  console.log(`  ${entry.path.padEnd(52)} (client-only shell)`)
}

// 404 for Cloudflare Pages.
const notFound = render('/__not_found__')
await writeFile(join(clientDir, '404.html'), shell(notFound.head, notFound.html), 'utf-8')

console.log(`\n✓ ${written} routes prerendered`)

/* ------------------------------------------------------------- SEO files */

const origin = String(manifest.origin).replace(/\/$/, '')
const today = new Date().toISOString().slice(0, 10)
const indexable = manifest.entries.filter((e) => e.prerender && !e.meta.noindex)

await writeFile(
  join(clientDir, 'sitemap.xml'),
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...indexable.map((e) =>
      [
        '  <url>',
        `    <loc>${origin}${e.path}</loc>`,
        `    <lastmod>${(e.meta.updatedAt ?? today).slice(0, 10)}</lastmod>`,
        `    <changefreq>${e.meta.changefreq ?? 'monthly'}</changefreq>`,
        `    <priority>${(e.meta.priority ?? 0.5).toFixed(1)}</priority>`,
        '  </url>',
      ].join('\n'),
    ),
    '</urlset>',
    '',
  ].join('\n'),
  'utf-8',
)

const robotsPath = join(clientDir, 'robots.txt')
const robots = await readFile(robotsPath, 'utf-8')
await writeFile(
  robotsPath,
  robots
    .replace(/^# VitalID.*$/m, '# Advanced Orthogonal Institute — robots.txt')
    .replace(/^Sitemap: .*$/m, `Sitemap: ${origin}/sitemap.xml`),
  'utf-8',
)

await writeFile(
  join(clientDir, 'llms.txt'),
  [
    '# Advanced Orthogonal Institute',
    '',
    `> ${indexable.find((e) => e.path === '/')?.meta.description ?? ''}`,
    '',
    '## Pages',
    '',
    ...indexable.map((e) => `- [${e.meta.title}](${origin}${e.path}): ${e.meta.description}`),
    '',
  ].join('\n'),
  'utf-8',
)

console.log(`✓ sitemap.xml (${indexable.length} urls), llms.txt, robots.txt`)

/* -------------------------------------------------------------- manifest */

const files = await readdir(clientDir, { recursive: true })
console.log(`✓ ${files.length} files in dist/client\n`)
