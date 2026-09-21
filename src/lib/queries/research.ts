/* ----------------------------------------------------------------------------
 * Research — the Institute's projects: who runs them (research_team, linked
 * to Contacts or name-only for outside people), where they stand on funding
 * (research_ledger), and what they found (publication + outcomes).
 * pi_id / pi_name / co_investigators on research_projects are kept filled
 * from the team so CCI OS keeps reading them.
 * -------------------------------------------------------------------------- */
import { select, patch, insert, remove, headers, SB_URL, ensureSession } from '@/lib/supabase'

export type Who = { name: string; id: string | null }
export type Role = 'pi' | 'co_investigator' | 'project_manager' | 'researcher' | 'student' | 'external_partner' | 'assistant_director'
export const ROLE_LABEL: Record<Role, string> = { pi: 'Principal investigator', co_investigator: 'Co-investigator', project_manager: 'Project manager', researcher: 'Researcher', student: 'Student researcher', external_partner: 'External partner', assistant_director: 'Assistant Research Director' }
export type Kind = 'grant_received' | 'funding_other' | 'expense' | 'overhead'
export const KIND_LABEL: Record<Kind, string> = { grant_received: 'Grant received', funding_other: 'Other funding', expense: 'Expense', overhead: 'Institutional overhead' }

export type PersonLite = { id: string; first_name: string; last_name: string; credentials: string | null; email: string | null; practice_name: string | null; practice_city: string | null; practice_state: string | null; membership_status: string | null; contact_type: string | null; school: string | null }
export type Member = { id?: number; project_id?: number; person_id: string | null; name: string; role: Role; affiliation: string | null; sort?: number; people?: PersonLite | null }
export type Entry = { id: number; project_id: number; entry_date: string; kind: Kind; amount: number; note: string | null; by_name: string | null }
export type Project = {
  id: number; name: string; pi_id: string | null; pi_name: string | null; co_investigators: { id: string | null; name: string }[] | null
  irb: string | null; estimated_budget: number | null; estimated_funding: number | null; primary_location: string | null; overview: string | null
  status: 'active' | 'past'; published: boolean | null; published_date: string | null
  study_url: string | null; publication_citation: string | null; publication_doi: string | null; publication_url: string | null; outcomes: string | null
  research_team: Member[]; research_ledger: Entry[]
}
export type Note = { id: number; text: string; by_name: string | null; created_at: string }

const PERSON = 'id,first_name,last_name,credentials,email,practice_name,practice_city,practice_state,membership_status,contact_type,school'
export async function projects(): Promise<{ rows: Project[]; error?: string }> {
  const q = await select<Project>('research_projects', `select=*,research_team(id,person_id,name,role,affiliation,sort,people!research_team_person_id_fkey(${PERSON})),research_ledger(id,project_id,entry_date,kind,amount,note,by_name)&order=status,name&limit=500`)
  if (q.data) return { rows: q.data.map((p) => ({ ...p, research_team: (p.research_team ?? []).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || (a.id ?? 0) - (b.id ?? 0)), research_ledger: (p.research_ledger ?? []).map((e) => ({ ...e, amount: Number(e.amount) })) })) }
  return { rows: [], error: q.error ?? 'unknown' }
}
/** A person's research involvement, for their Contacts card. */
export async function researchFor(personId: string): Promise<{ project: Pick<Project, 'id' | 'name' | 'status' | 'published'>; role: Role }[]> {
  const q = await select<{ role: Role; research_projects: Pick<Project, 'id' | 'name' | 'status' | 'published'> | null }>('research_team', `select=role,research_projects(id,name,status,published)&person_id=eq.${personId}`)
  return (q.data ?? []).filter((r) => r.research_projects).map((r) => ({ project: r.research_projects!, role: r.role }))
}
export async function searchPeople(term: string): Promise<PersonLite[]> {
  const t = encodeURIComponent(term.trim()); if (!t) return []
  const q = await select<PersonLite>('people', `select=${PERSON}&or=(first_name.ilike.*${t}*,last_name.ilike.*${t}*,practice_name.ilike.*${t}*)&order=last_name&limit=10`)
  return q.data ?? []
}
export async function notesFor(personId: string): Promise<Note[]> {
  const q = await select<Note>('contact_notes', `select=id,text,by_name,created_at&person_id=eq.${personId}&order=created_at.desc&limit=100`)
  return q.data ?? []
}

/* ---- derive ------------------------------------------------------------------ */
export const fullName = (p: PersonLite | null | undefined, fallback?: string | null) => p ? `${p.first_name} ${p.last_name}${p.credentials ? ', ' + p.credentials : ''}` : (fallback ?? '—')
export const initials = (p: PersonLite | null | undefined, fallback?: string | null) => (p ? `${p.first_name?.[0] ?? ''}${p.last_name?.[0] ?? ''}` : (fallback ?? '?').replace(/^Dr\.\s+/, '').split(/\s+/).map((w) => w[0]).join('').slice(0, 2)).toUpperCase()
export const memberName = (m: Member) => m.people ? fullName(m.people) : m.name
export const pi = (p: Project) => p.research_team.find((m) => m.role === 'pi') ?? null
export const received = (p: Project) => p.research_ledger.filter((e) => e.kind === 'grant_received' || e.kind === 'funding_other').reduce((s, e) => s + e.amount, 0)
export const spent = (p: Project) => p.research_ledger.filter((e) => e.kind === 'expense').reduce((s, e) => s + e.amount, 0)
export const overhead = (p: Project) => p.research_ledger.filter((e) => e.kind === 'overhead').reduce((s, e) => s + e.amount, 0)
export const funded = (p: Project) => Math.max(Number(p.estimated_funding ?? 0), received(p))
export const money = (n: number | null | undefined) => n == null ? '—' : '$' + Math.round(Number(n)).toLocaleString('en-US')
export const fmtD = (iso: string | null | undefined) => iso ? new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''
export const fmtTs = (iso: string) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/* ---- writes -------------------------------------------------------------------- */
export type ProjectInput = {
  name: string; irb: string; primary_location: string; estimated_budget: string; estimated_funding: string; study_url: string; overview: string
  status: 'active' | 'past'; published: boolean; published_date: string; publication_citation: string; publication_doi: string; publication_url: string; outcomes: string
  team: Member[]
}
export async function saveProject(id: number | null, v: ProjectInput, existing: Project | null): Promise<{ ok?: true; id?: number; error?: string }> {
  await ensureSession()
  const P = v.team.find((m) => m.role === 'pi') ?? null
  const cos = v.team.filter((m) => m.role === 'co_investigator')
  const row: Record<string, unknown> = {
    name: v.name, irb: v.irb || null, primary_location: v.primary_location || null, estimated_budget: v.estimated_budget ? Number(v.estimated_budget) : null, estimated_funding: v.estimated_funding ? Number(v.estimated_funding) : null,
    study_url: v.study_url || null, overview: v.overview || null, status: v.status, published: v.published, published_date: v.published ? (v.published_date || null) : null,
    publication_citation: v.published ? (v.publication_citation || null) : null, publication_doi: v.published ? (v.publication_doi || null) : null, publication_url: v.published ? (v.publication_url || null) : null, outcomes: v.outcomes || null,
    // kept for CCI OS: only real UUIDs are written as ids
    pi_id: P && P.person_id && UUID.test(P.person_id) ? P.person_id : null, pi_name: P ? memberName(P) : null,
    co_investigators: cos.map((m) => ({ id: m.person_id && UUID.test(m.person_id) ? m.person_id : null, name: memberName(m) })),
    updated_at: new Date().toISOString(),
  }
  let pid = id
  if (pid) { const r = await patch('research_projects', `id=eq.${pid}`, row); if (r.error) return r }
  else {
    const res = await fetch(`${SB_URL}/rest/v1/research_projects`, { method: 'POST', headers: { ...headers(true), Prefer: 'return=representation' }, body: JSON.stringify([row]) })
    if (!res.ok) return { error: await res.text() }
    pid = ((await res.json()) as { id: number }[])[0]?.id ?? 0
  }
  // team: delete removed, update kept, insert new
  const keep = new Set(v.team.filter((m) => m.id).map((m) => m.id))
  for (const m of existing?.research_team ?? []) if (m.id && !keep.has(m.id)) { const r = await remove('research_team', `id=eq.${m.id}`); if (r.error) return r }
  let n = 0
  for (const m of v.team) {
    const body = { person_id: m.person_id && UUID.test(m.person_id) ? m.person_id : null, name: memberName(m), role: m.role, affiliation: m.affiliation || null, sort: n++ }
    const r = m.id ? await patch('research_team', `id=eq.${m.id}`, body) : await insert('research_team', [{ ...body, project_id: pid }])
    if (r.error) return r
  }
  return { ok: true, id: pid }
}
export const removeProject = (id: number) => remove('research_projects', `id=eq.${id}`)
export const addEntry = (projectId: number, date: string, kind: Kind, amount: number, note: string, who: Who) =>
  insert('research_ledger', [{ project_id: projectId, entry_date: date, kind, amount, note: note || null, by_id: who.id, by_name: who.name }])
export const removeEntry = (id: number) => remove('research_ledger', `id=eq.${id}`)
export const addNote = (personId: string, text: string, who: Who) => insert('contact_notes', [{ person_id: personId, text, by_name: who.name, by_id: who.id }])
