/* ----------------------------------------------------------------------------
 * Board of Directors — terms, nominations, seating and the director record.
 *
 * `board_service` is one row per person per term. status runs
 * nominee → active (seated) → past, or nominee → withdrawn. The five
 * eligibility flags and four process dates live on the row; every tick is
 * mirrored into `eligibility_audit` as {item: {by, by_id, at}} so the record
 * shows who verified what and when. Reviews, documents and board-only notes
 * have their own tables. Seating inserts the board_member role in
 * person_roles (that is what grants board access on the site); ending
 * service swaps it for past_board_member.
 *
 * RLS: is_board_manager() — board, the executive director and the
 * Nominations & Elections chair — for every write.
 * -------------------------------------------------------------------------- */
import { select, patch, insert, remove, headers, SB_URL, ensureSession } from '@/lib/supabase'

export const SEATS_PER_TERM = 3
export const ELIGIBILITY: { key: EligKey; label: string; auto: boolean }[] = [
  { key: 'is_member', label: 'Current AOI member (dues paid in full)', auto: true },
  { key: 'level1_cert', label: 'Level 1 Certification (minimum)', auto: true },
  { key: 'good_standing', label: 'Good professional standing (licence, no disciplinary)', auto: false },
  { key: 'active_involvement', label: 'Attended an Advanced Seminar within 12 months', auto: false },
  { key: 'coi_disclosed', label: 'Conflict-of-interest disclosure submitted', auto: false },
]
export const PROCESS: { key: ProcKey; label: string; date: ProcDate }[] = [
  { key: 'nominated', label: 'Nominated', date: 'nominated_date' },
  { key: 'accepted_nomination', label: 'Accepted nomination', date: 'accepted_nomination_date' },
  { key: 'elected', label: 'Elected by board vote', date: 'elected_date' },
  { key: 'accepted_role', label: 'Accepted the role', date: 'accepted_role_date' },
]
export type EligKey = 'is_member' | 'level1_cert' | 'good_standing' | 'active_involvement' | 'coi_disclosed'
export type ProcKey = 'nominated' | 'accepted_nomination' | 'elected' | 'accepted_role'
export type ProcDate = 'nominated_date' | 'accepted_nomination_date' | 'elected_date' | 'accepted_role_date'
export type AuditEntry = { by: string; by_id: string | null; at: string }
export type Audit = Partial<Record<EligKey | ProcKey | 'seated' | 'ended' | 'withdrawn', AuditEntry>>

export type Person = {
  id: string; first_name: string; last_name: string; credentials: string | null; membership_status: string | null; membership_expires: string | null
  cert_level: string | null; photo_url: string | null; deceased_on: string | null
  person_roles?: { id: number; role_key: string; committees: { name: string } | null }[]
  person_certifications?: { technique: string; level: string }[]
  instructor_records?: { level: string | null; status: string | null }[]
}
export type Term = {
  id: number; person_id: string | null; person_name: string | null; term_label: string | null; term_start: string | null; term_end: string | null
  status: string | null; service_start: string | null; nominated_by: string | null
  nominated: boolean | null; nominated_date: string | null; accepted_nomination: boolean | null; accepted_nomination_date: string | null
  elected: boolean | null; elected_date: string | null; accepted_role: boolean | null; accepted_role_date: string | null
  is_member: boolean | null; level1_cert: boolean | null; good_standing: boolean | null; active_involvement: boolean | null; coi_disclosed: boolean | null
  resignation_date: string | null; end_reason: string | null; notes: string | null; eligibility_audit: Audit | null
  people: Person | null
}
export type Review = { id: number; person_id: string; board_service_id: number | null; review_date: string; title: string; outcome: string | null; summary: string | null; reviewer_name: string | null; created_at: string }
export type Doc = { id: number; person_id: string; label: string; doc_date: string | null; kind: string | null; storage_path: string; file_name: string | null; size_bytes: number | null; uploaded_by_name: string | null; created_at: string }
export type BoardNote = { id: number; person_id: string; text: string; by_name: string | null; created_at: string }

const TERM_SELECT = '*,people!board_service_person_id_fkey(id,first_name,last_name,credentials,membership_status,membership_expires,cert_level,photo_url,deceased_on,person_roles(id,role_key,committees(name)),person_certifications(technique,level),instructor_records!instructor_records_person_id_fkey(level,status))'

/* ------------------------------------------------------------------ reads */
export async function terms(): Promise<{ rows: Term[]; error?: string }> {
  const r = await select<Term>('board_service', `select=${TERM_SELECT}&order=term_start.asc`)
  return { rows: r.data ?? [], error: r.error }
}
export const reviews = async (personId: string) => (await select<Review>('board_reviews', `select=*&person_id=eq.${personId}&order=review_date.desc`)).data ?? []
export const documents = async (personId: string) => (await select<Doc>('board_documents', `select=*&person_id=eq.${personId}&order=doc_date.desc,created_at.desc`)).data ?? []
export const boardNotes = async (personId: string) => (await select<BoardNote>('board_notes', `select=*&person_id=eq.${personId}&order=created_at.desc`)).data ?? []

export type Hit = Person & { practice_name: string | null }
export async function searchPeople(q: string): Promise<Hit[]> {
  const t = q.trim().replace(/[,.*()]/g, '')
  if (t.length < 2) return []
  const r = await select<Hit>('people', `select=id,first_name,last_name,credentials,membership_status,membership_expires,cert_level,photo_url,deceased_on,practice_name,person_certifications(technique,level)&deceased_on=is.null&or=(first_name.ilike.*${t}*,last_name.ilike.*${t}*)&order=last_name.asc&limit=8`)
  return r.data ?? []
}

/* ----------------------------------------------------------------- derive */
export const fullName = (p: Pick<Person, 'first_name' | 'last_name' | 'credentials'> | null, fallback?: string | null) => p ? `${p.first_name} ${p.last_name}${p.credentials ? ', ' + p.credentials : ''}` : (fallback ?? '—').replace(/^Dr\.?\s*/, '')
export const initials = (p: Pick<Person, 'first_name' | 'last_name'> | null, fallback?: string | null) => p ? `${p.first_name?.[0] ?? ''}${p.last_name?.[0] ?? ''}`.toUpperCase() : (fallback ?? '?').replace(/^Dr\.?\s*/, '').split(/\s+/).map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase()
export const isCurrentMember = (p: Person | null, now = new Date()) => !!p && /(current|active|good|member)/i.test(p.membership_status ?? '') && (!p.membership_expires || new Date(p.membership_expires + 'T12:00:00Z') >= now)
export const hasLevel1 = (p: Person | null) => !!p && ((p.person_certifications ?? []).some((c) => c.technique === 'Advanced Orthogonal' && /level_1|level_2/.test(c.level)) || /level_1|level_2/.test(p.cert_level ?? ''))
export const eligDone = (t: Term) => ELIGIBILITY.filter((e) => t[e.key]).length
export const procDone = (t: Term) => PROCESS.filter((s) => t[s.key]).length
export const isReady = (t: Term) => eligDone(t) === ELIGIBILITY.length && procDone(t) === PROCESS.length
/** The term a new class is seated into: Oct 1 of this year if before Oct 1, else next year. */
export function nextTermLabel(now = new Date()): string {
  const y = now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear()
  return `${y}–${y + 3}`
}
export const termDates = (label: string) => { const y = Number(label.slice(0, 4)); return { start: `${y}-10-01`, end: `${y + 3}-09-30` } }
export const seatedIn = (rows: Term[], label: string) => rows.filter((t) => t.term_label === label && (t.status === 'active' || t.status === 'seated'))
export const fmtD = (iso?: string | null) => (iso ? new Date(iso.slice(0, 10) + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '')

/* ----------------------------------------------------------------- writes */
const stamp = (t: Term, key: keyof Audit, who: { name: string; id: string | null }): Audit => ({ ...(t.eligibility_audit ?? {}), [key]: { by: who.name, by_id: who.id, at: new Date().toISOString() } })
const unstamp = (t: Term, key: keyof Audit): Audit => { const a = { ...(t.eligibility_audit ?? {}) }; delete a[key]; return a }

export async function tick(t: Term, key: EligKey | ProcKey, on: boolean, who: { name: string; id: string | null }, date?: string | null) {
  const body: Record<string, unknown> = { [key]: on, eligibility_audit: on ? stamp(t, key, who) : unstamp(t, key) }
  const step = PROCESS.find((s) => s.key === key)
  if (step) body[step.date] = on ? (date ?? t[step.date] ?? new Date().toISOString().slice(0, 10)) : null
  return patch('board_service', `id=eq.${t.id}`, body)
}
export const setProcDate = (t: Term, dateKey: ProcDate, value: string | null) => patch('board_service', `id=eq.${t.id}`, { [dateKey]: value })
export const setNominatedBy = (t: Term, v: string) => patch('board_service', `id=eq.${t.id}`, { nominated_by: v || null })
export const setServiceStart = (t: Term, v: string) => patch('board_service', `id=eq.${t.id}`, { service_start: v || null })

export async function addNominee(p: Person, label: string, nominatedBy: string, date: string, who: { name: string; id: string | null }) {
  const d = termDates(label)
  const audit: Audit = { nominated: { by: who.name, by_id: who.id, at: new Date().toISOString() } }
  const member = isCurrentMember(p), l1 = hasLevel1(p)
  if (member) audit.is_member = { by: 'system', by_id: null, at: new Date().toISOString() }
  if (l1) audit.level1_cert = { by: 'system', by_id: null, at: new Date().toISOString() }
  return insert('board_service', [{ person_id: p.id, person_name: `Dr. ${p.first_name} ${p.last_name}`, term_label: label, term_start: d.start, term_end: d.end, status: 'nominee', nominated_by: nominatedBy || null, nominated: true, nominated_date: date, is_member: member, level1_cert: l1, eligibility_audit: audit }])
}
export const withdraw = (t: Term, who: { name: string; id: string | null }) => patch('board_service', `id=eq.${t.id}`, { status: 'withdrawn', eligibility_audit: stamp(t, 'withdrawn', who) })

/** Seat a nominee: status active (or seated if the term has not started), audit, and the board_member role. */
export async function seat(t: Term, who: { name: string; id: string | null }): Promise<{ ok?: true; error?: string }> {
  const started = !t.term_start || new Date(t.term_start + 'T12:00:00Z') <= new Date()
  const r = await patch('board_service', `id=eq.${t.id}`, { status: started ? 'active' : 'seated', eligibility_audit: stamp(t, 'seated', who) })
  if (r.error || !t.person_id) return r
  const has = (t.people?.person_roles ?? []).some((x) => x.role_key === 'board_member')
  if (!has) {
    await remove('person_roles', `person_id=eq.${t.person_id}&role_key=eq.past_board_member`)
    const i = await insert('person_roles', [{ person_id: t.person_id, role_key: 'board_member' }])
    if (i.error) return { error: 'Seated, but the board role was refused: ' + i.error }
  }
  return { ok: true }
}
export async function endService(t: Term, reason: string, date: string, who: { name: string; id: string | null }): Promise<{ ok?: true; error?: string }> {
  const body: Record<string, unknown> = { status: 'past', end_reason: reason, eligibility_audit: stamp(t, 'ended', who) }
  if (reason === 'resigned') body.resignation_date = date
  if (date) body.term_end = date
  const r = await patch('board_service', `id=eq.${t.id}`, body)
  if (r.error || !t.person_id) return r
  await remove('person_roles', `person_id=eq.${t.person_id}&role_key=eq.board_member`)
  const has = (t.people?.person_roles ?? []).some((x) => x.role_key === 'past_board_member')
  if (!has) { const i = await insert('person_roles', [{ person_id: t.person_id, role_key: 'past_board_member' }]); if (i.error) return { error: 'Ended, but the past-board role was refused: ' + i.error } }
  return { ok: true }
}

export const addReview = (personId: string, termId: number | null, v: { title: string; outcome: string; summary: string; review_date: string }, who: { name: string; id: string | null }) =>
  insert('board_reviews', [{ person_id: personId, board_service_id: termId, ...v, reviewer_id: who.id, reviewer_name: who.name }])
export const addBoardNote = (personId: string, text: string, who: { name: string; id: string | null }) =>
  insert('board_notes', [{ person_id: personId, text, by_id: who.id, by_name: who.name }])

/* ---- documents: private bucket ---------------------------------------------- */
export async function uploadDocument(personId: string, termId: number | null, file: File, label: string, docDate: string | null, who: { name: string; id: string | null }): Promise<{ ok?: true; error?: string }> {
  await ensureSession()
  const safe = file.name.replace(/[^A-Za-z0-9._-]+/g, '_')
  const path = `${personId}/${Date.now()}-${safe}`
  const res = await fetch(`${SB_URL}/storage/v1/object/board-documents/${path}`, { method: 'POST', headers: { ...headers(), 'Content-Type': file.type || 'application/octet-stream', 'x-upsert': 'false' }, body: file })
  if (!res.ok) return { error: await res.text() }
  const kind = (file.name.split('.').pop() ?? '').toUpperCase().slice(0, 5) || 'FILE'
  return insert('board_documents', [{ person_id: personId, board_service_id: termId, label, doc_date: docDate, kind, storage_path: path, file_name: file.name, size_bytes: file.size, uploaded_by_id: who.id, uploaded_by_name: who.name }])
}
export async function documentUrl(d: Doc): Promise<string | null> {
  await ensureSession()
  const res = await fetch(`${SB_URL}/storage/v1/object/sign/board-documents/${d.storage_path}`, { method: 'POST', headers: headers(true), body: JSON.stringify({ expiresIn: 600 }) })
  if (!res.ok) return null
  const j = (await res.json()) as { signedURL?: string }
  return j.signedURL ? `${SB_URL}/storage/v1${j.signedURL}` : null
}
export async function deleteDocument(d: Doc): Promise<{ ok?: true; error?: string }> {
  await ensureSession()
  await fetch(`${SB_URL}/storage/v1/object/board-documents/${d.storage_path}`, { method: 'DELETE', headers: headers() })
  return remove('board_documents', `id=eq.${d.id}`)
}
