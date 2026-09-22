/**
 * Build.
 *
 * Four steps, in order:
 *   1. bundle the client                  -> dist/client/assets/client-[hash].js
 *   2. bundle the server renderer         -> dist/server/entry-server.js
 *   3. render every public route to disk  -> dist/client/<route>/index.html
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
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

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
  (await readFile(join(root, 'src/styles/tokens.css'), 'utf-8')) +
  '\n' +
  (await readFile(join(root, 'src/styles/components.css'), 'utf-8'))
const cssMin = await build({
  stdin: { contents: css, loader: 'css', resolveDir: join(root, 'src/styles') },
  bundle: true,
  minify: true,
  write: false,
})
const cssOut = cssMin.outputFiles[0].text
const cssHash = createHash('sha256').update(cssOut).digest('hex').slice(0, 8)
const cssName = `assets/site-${cssHash}.css`
await mkdir(join(clientDir, 'assets'), { recursive: true })
await writeFile(join(clientDir, cssName), cssOut, 'utf-8')
console.log(`  ${cssName}  ${(cssOut.length / 1024).toFixed(1)} kB`)

/* ---------------------------------------------------------------- client */

console.log('▸ client bundle')
const clientBuild = await build({
  entryPoints: [join(root, 'src/entry-client.tsx')],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2022'],
  jsx: 'automatic',
  minify: true,
  sourcemap: true,
  write: false,
  outfile: join(clientDir, 'assets', 'client.js'),
  define: { 'process.env.NODE_ENV': '"production"' },
  plugins: [alias],
})
const jsFile = clientBuild.outputFiles.find((f) => !f.path.endsWith('.map'))
const mapFile = clientBuild.outputFiles.find((f) => f.path.endsWith('.map'))
if (!jsFile) {
  throw new Error(
    `esbuild produced no JS output. Files: ${clientBuild.outputFiles.map((f) => f.path).join(', ')}`,
  )
}
const jsHash = createHash('sha256').update(jsFile.text).digest('hex').slice(0, 8)
const jsName = `assets/client-${jsHash}.js`
await writeFile(join(clientDir, jsName), jsFile.text, 'utf-8')
if (mapFile) await writeFile(join(clientDir, `${jsName}.map`), mapFile.text, 'utf-8')
console.log(`  ${jsName}  ${(jsFile.text.length / 1024).toFixed(1)} kB`)

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
  packages: 'external',
})

/* ------------------------------------------------------------ public/ ---- */

console.log('▸ static assets')
await cp(join(root, 'public'), clientDir, { recursive: true })

/* ------------------------------------------------------------- prerender */

console.log('▸ prerender')
const { render, manifest } = await import(join(serverDir, 'entry-server.js'))

const shell = (head, html) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Figtree:wght@400;500;600;700;800&display=swap"
    />
    <link rel="stylesheet" href="/${cssName}" />
    ${head}
  </head>
  <body>
    <div id="root">${html}</div>
    <script type="module" src="/${jsName}"></script>
  </body>
</html>
`

let written = 0
for (const path of manifest.paths) {
  const { html, head } = render(path)
  const page = shell(head, html)
  const outFile =
    path === '/'
      ? join(clientDir, 'index.html')
      : join(clientDir, path.replace(/^\//, ''), 'index.html')
  await mkdir(dirname(outFile), { recursive: true })
  await writeFile(outFile, page, 'utf-8')
  console.log(`  ${path.padEnd(52)} ${(Buffer.byteLength(page) / 1024).toFixed(1)} kB`)
  written += 1
}

// Client-only routes still need a shell so a direct hit does not 404.
for (const entry of manifest.entries.filter((e) => !e.prerender)) {
  const { head } = render(entry.path)
  const outFile = join(clientDir, entry.path.replace(/^\//, ''), 'index.html')
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
