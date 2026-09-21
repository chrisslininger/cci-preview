import { build } from 'esbuild'
import { existsSync, statSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
const root = '/home/claude/work/aoi'
const alias = { name:'alias', setup(b){ b.onResolve({filter:/^@\//}, a=>{ const base = resolve(root,'src',a.path.slice(2)); for(const e of ['.tsx','.ts','']) if(existsSync(base+e)&&statSync(base+e).isFile()) return {path:base+e}; return {errors:[{text:'unresolved '+a.path}]} })}}
mkdirSync('/tmp/harness/out/assets',{recursive:true})
await build({ entryPoints:[join(root,'tools/preview/ops-harness.tsx')], bundle:true, format:'esm', platform:'browser', jsx:'automatic', outfile:'/tmp/harness/out/assets/h.js', define:{'process.env.NODE_ENV':'"production"'}, plugins:[alias] })
const css = readFileSync(join(root,'src/styles/tokens.css'),'utf8')+'\n'+readFileSync(join(root,'src/styles/components.css'),'utf8')
writeFileSync('/tmp/harness/out/assets/h.css', css)
// role presets: ed | board | chair (Seminar chair, not board) | treasurer | instructor
const role = process.argv[2] ?? 'ed'
const P = { ed:{id:'9dd44e52-20a6-40dc-bd40-aecab3be3930',first_name:'Chris',last_name:'Slininger',credentials:'DC, DCCJP'}, board:{id:'p-fowler',first_name:'Jeff',last_name:'Fowler',credentials:'DC, BCAO'}, chair:{id:'p-ngo',first_name:'Duyen',last_name:'Ngo',credentials:'DC'}, treasurer:{id:'p-beadle',first_name:'James',last_name:'Beadle',credentials:'DC'}, instructor:{id:'p-miller',first_name:'Jeremy',last_name:'Miller',credentials:'DC'} }
const presets = {
  ed:{ roles:[{role_key:'executive_director'},{role_key:'board_member'}], committees:[], capabilities:['account','member','full_admin','board','manage_seminars','manage_finance'] },
  board:{ roles:[{role_key:'board_member'}], committees:[], capabilities:['account','member','board','manage_leads'] },
  chair:{ roles:[{role_key:'committee_chair',committee_id:16}], committees:[{id:16,key:'marketing',name:'Marketing Committee',leads:true}], capabilities:['account','member','committee:marketing','manage_marketing'] },
  treasurer:{ roles:[{role_key:'treasurer',committee_id:18},{role_key:'board_member'}], committees:[{id:18,key:'treasury',name:'Treasurer',leads:true}], capabilities:['account','member','board','committee:treasury','manage_finance','manage_leads'] },
  instructor:{ roles:[{role_key:'instructor'}], committees:[], capabilities:['account','member','instructor_tools'] },
}
const access = { person:P[role], staff_role:null, tier:'member', can_admin_roles: role==='ed', ...presets[role] }
const fix = JSON.parse(readFileSync('/tmp/harness/fix-ops.json','utf8'))
writeFileSync('/tmp/harness/out/index.html', `<!doctype html><html><head><meta charset=utf8><link rel="stylesheet" href="/assets/h.css"></head><body><div id="root"></div>
<script>window.__ACCESS=${JSON.stringify(access)};window.__FIX=${JSON.stringify(fix.tables)};window.__RPC=${JSON.stringify(fix.rpc)}</script><script type="module" src="/assets/h.js"></script></body></html>`)
console.log('built', role)
