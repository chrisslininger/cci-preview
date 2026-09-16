/**
 * Design harness. Renders the member shell with a hand-written access object so
 * the layout can be reviewed without signing in as a real person.
 *
 * NOT part of the app: nothing under tools/ is imported by entry-client, so it
 * is never bundled or shipped. Run from the project root:
 *   node tools/preview/build-harness.mjs '<access json>'
 */
import { build } from 'esbuild'
import { existsSync, statSync, writeFileSync, mkdirSync, copyFileSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
const root = '/home/claude/work/aoi'
const alias = { name:'alias', setup(b){ b.onResolve({filter:/^@\//}, a=>{
  const base = resolve(root,'src',a.path.slice(2))
  for(const e of ['.tsx','.ts','']) if(existsSync(base+e)&&statSync(base+e).isFile()) return {path:base+e}
  return {errors:[{text:'unresolved '+a.path}]}
})}}
mkdirSync('/tmp/harness/out/assets',{recursive:true})
await build({ entryPoints:[join(root,'tools/preview/harness.tsx')], bundle:true, format:'esm', platform:'browser',
  jsx:'automatic', outfile:'/tmp/harness/out/assets/h.js',
  define:{'process.env.NODE_ENV':'"production"'}, plugins:[alias] })
const css = readFileSync(join(root,'src/styles/tokens.css'),'utf8')+'\n'+readFileSync(join(root,'src/styles/components.css'),'utf8')
writeFileSync('/tmp/harness/out/assets/h.css', css)
writeFileSync('/tmp/harness/out/index.html', `<!doctype html><html><head><meta charset=utf8>
<link rel="stylesheet" href="/assets/h.css"></head><body><div id="root"></div>
<script>window.__ACCESS=${JSON.stringify(JSON.parse(process.argv[2]))}</script>
<script type="module" src="/assets/h.js"></script></body></html>`)
console.log('harness built')
