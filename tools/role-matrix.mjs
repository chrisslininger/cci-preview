/**
 * Prints the menu each role resolves to, using the real nav logic.
 * Capability strings are measured from the live database.
 * Run from the project root: node tools/role-matrix.mjs
 */
import { build } from 'esbuild'
import { existsSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = process.cwd()
const alias = {
  name: 'alias', setup(b) {
    b.onResolve({ filter: /^@\// }, (a) => {
      const base = resolve(root, 'src', a.path.slice(2))
      for (const e of ['.tsx','.ts','']) if (existsSync(base+e) && statSync(base+e).isFile()) return { path: base+e }
      return { errors: [{ text: 'unresolved '+a.path }] }
    })
  },
}
const out = await build({
  entryPoints: [join(root,'src/lib/nav.ts')],
  bundle: true, format: 'esm', platform: 'node', write: false, jsx: 'automatic',
  plugins: [alias], packages: 'external',
})
const mod = await import('data:text/javascript;base64,' + Buffer.from(out.outputFiles[0].text).toString('base64'))

// Capability sets measured from the live database, verbatim.
const PEOPLE = [
  ['Chris Slininger (Exec Dir)', 'member',
   'account, board, full_admin, instructor_tools, manage_board, manage_certifications, manage_colleges, manage_curriculum, manage_instructors, manage_internships, manage_leads, manage_marketing, manage_research, manage_seminars, member', 'level_2', true],
  ['April McLain (Administrator)', 'guest',
   'account, board, full_admin, manage_board, manage_certifications, manage_colleges, manage_curriculum, manage_instructors, manage_internships, manage_leads, manage_marketing, manage_research, manage_seminars', null, true],
  ['Dutch D\'Amico (Board · Cert Chair)', 'member',
   'account, board, committee:certification, manage_certifications, manage_leads, member', 'level_2', true],
  ['Kevin Lyter (Board · Nominations Chair)', 'member',
   'account, board, committee:nominations, manage_board, manage_leads, member', 'level_2', true],
  ['David Miranda (Board · Research Dir)', 'member',
   'account, board, committee:research, instructor_tools, manage_leads, manage_research, member', 'level_1', true],
  ['James Beadle (Board · Curriculum Chair)', 'member',
   'account, board, committee:curriculum, instructor_tools, manage_curriculum, manage_leads, member', 'level_2', true],
  ['Jeff Fowler (Board)', 'member', 'account, board, manage_leads, member', 'level_2', true],
  // Not yet real logins — the shapes the model has to handle next.
  ['A committee chair who is not on the Board', 'member',
   'account, committee:seminar, manage_seminars, member', 'level_1', false],
  ['An instructor', 'member', 'account, instructor_tools, member', 'level_1', false],
  ['A plain member', 'member', 'account, member', 'level_1', false],
  ['A member with no certification', 'member', 'account, member', 'none', false],
  ['A student', 'student', 'account, student', 'none', false],
  ['A signed-in guest', 'guest', 'account', 'none', false],
]

console.log()
for (const [who, tier, caps, cert, admin] of PEOPLE) {
  const access = {
    person: { cert_level: cert }, staff_role: null, tier,
    roles: [], committees: [], can_admin_roles: admin,
    capabilities: caps.split(',').map(s=>s.trim()),
  }
  const groups = mod.navFor(access)
  const total = groups.reduce((n,g)=>n+g.items.length,0)
  console.log(`${who}`)
  console.log(`  tier ${tier} · ${total} tabs`)
  for (const g of groups) {
    console.log(`    ${mod.GROUP_LABEL[g.group].padEnd(14)} ${g.items.map(i=>i.label).join(' · ')}`)
  }
  console.log()
}
