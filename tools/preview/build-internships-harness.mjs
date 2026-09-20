import { build } from 'esbuild'
import { existsSync, statSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
const root = '/home/claude/work/aoi'
const alias = { name:'alias', setup(b){ b.onResolve({filter:/^@\//}, a=>{ const base = resolve(root,'src',a.path.slice(2)); for(const e of ['.tsx','.ts','']) if(existsSync(base+e)&&statSync(base+e).isFile()) return {path:base+e}; return {errors:[{text:'unresolved '+a.path}]} })}}
mkdirSync('/tmp/harness/out/assets',{recursive:true})
await build({ entryPoints:[join(root,'tools/preview/internships-harness.tsx')], bundle:true, format:'esm', platform:'browser', jsx:'automatic', outfile:'/tmp/harness/out/assets/h.js', define:{'process.env.NODE_ENV':'"production"'}, plugins:[alias] })
const css = readFileSync(join(root,'src/styles/tokens.css'),'utf8')+'\n'+readFileSync(join(root,'src/styles/components.css'),'utf8')
writeFileSync('/tmp/harness/out/assets/h.css', css)
const access = { person:{id:'p1',first_name:'Chris',last_name:'Slininger',credentials:'DC',email:'x@y'}, staff_role:null, tier:'member', roles:[{role_key:'executive_director'}], committees:[], can_admin_roles:true, capabilities: process.argv[2] ? process.argv[2].split(',') : ['account','member','full_admin','manage_internships','board'] }
const fix = JSON.parse(readFileSync('/tmp/harness/fix-internships.json','utf8'))
writeFileSync('/tmp/harness/out/index.html', `<!doctype html><html><head><meta charset=utf8><link rel="stylesheet" href="/assets/h.css"></head><body><div id="root"></div>
<script>window.__ACCESS=${JSON.stringify(access)};window.__FIX=${JSON.stringify(fix)}</script><script type="module" src="/assets/h.js"></script></body></html>`)
console.log('built')
