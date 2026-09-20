/* ----------------------------------------------------------------------------
 * Instructors — the teaching faculty per technique (Instructor / Senior
 * Instructor) and the pipeline toward each level. One instructor_records
 * row per person per technique. Certification criteria are read from the
 * register; the Train-the-Trainer and practice criteria are two-step
 * lock-ins stored the way CCI OS stores them:
 *   progress[key] = { completed: true, date, name }
 * Certify / end service also keep the site's instructor role and the legacy
 * people.instructor_status in step, so there is one source of truth.
 * -------------------------------------------------------------------------- */
import { select, patch, insert, remove, headers, SB_URL, ensureSession } from '@/lib/supabase'

export type Who = { name: string; id: string | null }
export type Stamp = { completed: true; date: string; name: string }
export type Stamps = Record<string, Stamp | undefined>
export type Level = 'instructor' | 'senior_instructor'
export type Status = 'upcoming' | 'current' | 'past'

export type PersonLite = {
  id: string; first_name: string; last_name: string; credentials: string | null; contact_type: string | null; email: string | null
  practice_name: string | null; practice_city: string | null; practice_state: string | null
  cert_level: string | null; instructor_status: string | null; membership_status: string | null
  person_certifications?: { technique: string; level: string }[]
  person_roles?: { id: number; role_key: string; instructor_level: string | null }[]
}
export type InstructorRecord = {
  id: number; person_id: string | null; person_name: string | null; technique: string; status: Status
  level: Level | null; target_level: Level | null; instructor_date: string | null; senior_date: string | null; certified_by: string | null
  end_reason: string | null; end_date: string | null; initiated_date: string | null; initiated_by_name: string | null; ended_by_name: string | null
  progress: Stamps | null; seminars: string[] | null; notes: string | null; created_at: string
  people: PersonLite | null
}
export type LogEntry = { id: number; record_id: number; kind: 'attendee_feedback' | 'peer_observation' | 'retraining' | 'note'; log_date: string; text: string; by_name: string | null; created_at: string }
export type Note = { id: number; text: string; by_name: string | null; created_at: string }

export const TECHNIQUES = ['Advanced Orthogonal', 'Atlas Orthogonal', 'Atlas Orthometrics', 'Orthospinology', 'EPIC']
export const SEMINARS = ['Fundamentals 1', 'Fundamentals 2', 'Fundamentals 3', 'Advanced Seminar', 'Intensive', 'Bridging', 'Train the Trainer']
export const LEVEL_LABEL: Record<string, string> = { instructor: 'Instructor', senior_instructor: 'Senior Instructor' }
export const END_REASONS: Record<string, string> = { retired: 'Retired', stepped_down: 'Stepped down', removed: 'Removed by the committee', term_expired: 'Contract term expired' }
export const LOG_KINDS: Record<LogEntry['kind'], string> = { attendee_feedback: 'Attendee feedback', peer_observation: 'Peer observation', retraining: 'Retraining plan', note: 'Note' }
/** Board Certified / Certified count as Level 2 for the single-ladder techniques. */
const RANK: Record<string, number> = { student: 0, level_1: 1, level_2: 2, board_certification: 2, certified: 2 }
const CERT_LABEL: Record<string, string> = { student: 'Student', level_1: 'Level 1', level_2: 'Level 2', board_certification: 'Board Certified', certified: 'Certified' }

export type Criterion = { key: string; label: string; auto?: 1 | 2 }
export const CRITERIA: Record<Level, Criterion[]> = {
  instructor: [
    { key: 'inst_l1', label: 'Level 1 certified in the technique', auto: 1 },
    { key: 'inst_practice', label: 'At least three years of active practice in the technique' },
    { key: 'inst_ttt', label: 'Train the Trainer completed' },
  ],
  senior_instructor: [
    { key: 'sr_l2', label: 'Level 2 certified in the technique', auto: 2 },
    { key: 'sr_ttt', label: 'Train the Trainer completed' },
  ],
}

/* ---- reads ------------------------------------------------------------------- */
const PERSON = 'id,first_name,last_name,credentials,contact_type,email,practice_name,practice_city,practice_state,cert_level,instructor_status,membership_status,person_certifications(technique,level),person_roles(id,role_key,instructor_level)'
export async function records(): Promise<{ rows: InstructorRecord[]; error?: string }> {
  const q = await select<InstructorRecord>('instructor_records', `select=*,people!instructor_records_person_id_fkey(${PERSON})&order=person_name&limit=1000`)
  if (q.data) return { rows: q.data }
  // fall back without the roles embed if that relationship is not visible to this user
  const q2 = await select<InstructorRecord>('instructor_records', `select=*,people!instructor_records_person_id_fkey(${PERSON.replace(',person_roles(id,role_key,instructor_level)', '')})&order=person_name&limit=1000`)
  return q2.data ? { rows: q2.data } : { rows: [], error: q.error ?? 'unknown' }
}
export async function logFor(recordId: number): Promise<LogEntry[]> {
  const q = await select<LogEntry>('instructor_log', `select=id,record_id,kind,log_date,text,by_name,created_at&record_id=eq.${recordId}&order=log_date.desc,created_at.desc`)
  return q.data ?? []
}
export async function notesFor(personId: string): Promise<Note[]> {
  const q = await select<Note>('contact_notes', `select=id,text,by_name,created_at&person_id=eq.${personId}&order=created_at.desc&limit=200`)
  return q.data ?? []
}
export async function searchPeople(term: string): Promise<PersonLite[]> {
  const t = encodeURIComponent(term.trim()); if (!t) return []
  const q = await select<PersonLite>('people', `select=${PERSON}&or=(first_name.ilike.*${t}*,last_name.ilike.*${t}*,practice_name.ilike.*${t}*)&order=last_name&limit=12`)
  if (q.data) return q.data
  const q2 = await select<PersonLite>('people', `select=${PERSON.replace(',person_roles(id,role_key,instructor_level)', '')}&or=(first_name.ilike.*${t}*,last_name.ilike.*${t}*,practice_name.ilike.*${t}*)&order=last_name&limit=12`)
  return q2.data ?? []
}

/* ---- derive ------------------------------------------------------------------ */
export const fullName = (p: PersonLite | null | undefined, fallback?: string | null) => p ? `${p.first_name} ${p.last_name}${p.credentials ? ', ' + p.credentials : ''}` : (fallback ?? '—').replace(/^Dr\.\s+/, '')
export const initials = (p: PersonLite | null | undefined, fallback?: string | null) => (p ? `${p.first_name?.[0] ?? ''}${p.last_name?.[0] ?? ''}` : (fallback ?? '?').replace(/^Dr\.\s+/, '').split(/\s+/).map((w) => w[0]).join('').slice(0, 2)).toUpperCase()
export const lastName = (r: InstructorRecord) => r.people?.last_name ?? (r.person_name ?? '').split(' ').pop() ?? ''
/** The person's certification level in a technique, per the register (with the legacy cert_level as a fallback for AdvO). */
export function certIn(p: PersonLite | null | undefined, technique: string): string | null {
  const rows = (p?.person_certifications ?? []).filter((c) => c.technique === technique)
  const best = rows.reduce<string | null>((b, c) => (RANK[c.level] ?? -1) > (b ? RANK[b] ?? -1 : -1) ? c.level : b, null)
  if (best) return best
  if (technique === 'Advanced Orthogonal' && p?.cert_level && p.cert_level !== 'none') return p.cert_level
  return null
}
export const certRank = (p: PersonLite | null | undefined, technique: string) => { const l = certIn(p, technique); return l ? (RANK[l] ?? -1) : -1 }
export const certLabel = (p: PersonLite | null | undefined, technique: string) => { const l = certIn(p, technique); return l ? (CERT_LABEL[l] ?? l) : 'no certification' }
export const critMet = (r: InstructorRecord, c: Criterion) => c.auto ? certRank(r.people, r.technique) >= c.auto : !!r.progress?.[c.key]?.completed
export const critDone = (r: InstructorRecord) => r.target_level ? CRITERIA[r.target_level].filter((c) => critMet(r, c)).length : 0
export const critAll = (r: InstructorRecord) => r.target_level ? CRITERIA[r.target_level].length : 0
export const isReady = (r: InstructorRecord) => !!r.target_level && critDone(r) === critAll(r)
export const inTraining = (r: InstructorRecord) => r.status === 'upcoming' || (r.status === 'current' && !!r.target_level)
const needRank = (r: InstructorRecord) => r.level === 'senior_instructor' ? 2 : r.level === 'instructor' ? 1 : 0
/** The quiet flag: a held level above what the certification register shows. */
export function registerGap(r: InstructorRecord): string | null {
  if (r.status === 'past' || !r.level) return null
  if (certRank(r.people, r.technique) >= needRank(r)) return null
  return `Register shows ${certLabel(r.people, r.technique)} in ${r.technique} — ${LEVEL_LABEL[r.level]} expects ${needRank(r) === 2 ? 'Level 2' : 'Level 1'}`
}
export const fmtD = (iso: string | null | undefined) => iso ? new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''
export const fmtM = (iso: string | null | undefined) => iso ? new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''
export const fmtTs = (iso: string) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })

/* ---- writes -------------------------------------------------------------------- */
const stamp = (date: string, who: Who): Stamp => ({ completed: true, date, name: who.name })
export async function tick(r: InstructorRecord, key: string, on: boolean, date: string, who: Who) {
  const cur = { ...(r.progress ?? {}) } as Record<string, Stamp | undefined>
  if (on) cur[key] = stamp(date, who); else delete cur[key]
  return patch('instructor_records', `id=eq.${r.id}`, { progress: cur })
}
/** Keep the site's instructor role and the legacy field in step with the record. */
async function syncRole(r: InstructorRecord, level: Level | null) {
  if (!r.person_id) return
  const instructorLevel = level === 'senior_instructor' ? 'level_2' : level === 'instructor' ? 'level_1' : null
  const existing = (r.people?.person_roles ?? []).find((x) => x.role_key === 'instructor')
  if (level) {
    if (existing) await patch('person_roles', `id=eq.${existing.id}`, { instructor_level: instructorLevel })
    else await insert('person_roles', [{ person_id: r.person_id, role_key: 'instructor', instructor_level: instructorLevel }])
    await patch('people', `id=eq.${r.person_id}`, { instructor_status: instructorLevel })
  } else {
    // only drop the role when no other current record keeps them an instructor
    const others = await select<{ id: number }>('instructor_records', `select=id&person_id=eq.${r.person_id}&status=eq.current&id=neq.${r.id}`)
    if ((others.data ?? []).length === 0) {
      if (existing) await remove('person_roles', `id=eq.${existing.id}`); else await remove('person_roles', `person_id=eq.${r.person_id}&role_key=eq.instructor`)
      await patch('people', `id=eq.${r.person_id}`, { instructor_status: 'none' })
    }
  }
}
export async function certify(r: InstructorRecord, date: string, who: Who) {
  if (!r.target_level) return { error: 'No level is being worked toward' }
  const level = r.target_level
  const body: Record<string, unknown> = { level, status: 'current', target_level: null, certified_by: who.name }
  if (level === 'instructor') body.instructor_date = date; else body.senior_date = date
  const w = await patch('instructor_records', `id=eq.${r.id}`, body)
  if (w.error) return w
  await syncRole(r, level)
  return w
}
export async function initiateSenior(r: InstructorRecord, date: string, who: Who) {
  return patch('instructor_records', `id=eq.${r.id}`, { target_level: 'senior_instructor', initiated_date: date, initiated_by_name: who.name })
}
export async function endService(r: InstructorRecord, reason: string, date: string, who: Who) {
  const w = await patch('instructor_records', `id=eq.${r.id}`, { status: 'past', end_reason: reason, end_date: date, ended_by_name: who.name, target_level: null })
  if (w.error) return w
  await syncRole(r, null)
  return w
}
export type RecordInput = { person: PersonLite; technique: string; level: Level | null; target_level: Level | null; status: Status; instructor_date: string; senior_date: string; certified_by: string; seminars: string[]; notes: string }
export async function saveRecord(id: number | null, v: RecordInput, existing: InstructorRecord | null): Promise<{ ok?: true; error?: string }> {
  await ensureSession()
  const row = {
    person_id: v.person.id, person_name: fullName(v.person), technique: v.technique, level: v.level, target_level: v.target_level, status: v.status,
    instructor_date: v.instructor_date || null, senior_date: v.senior_date || null, certified_by: v.certified_by || null, seminars: v.seminars, notes: v.notes || null,
  }
  const w = id ? await patch('instructor_records', `id=eq.${id}`, row) : await insert('instructor_records', [{ ...row, progress: {} }])
  if (w.error) return w
  const r: InstructorRecord = { ...(existing ?? ({} as InstructorRecord)), id: id ?? 0, person_id: v.person.id, people: v.person, technique: v.technique } as InstructorRecord
  await syncRole(r, v.status === 'current' ? v.level : null)
  return { ok: true }
}
export const removeRecord = (id: number) => remove('instructor_records', `id=eq.${id}`)
export const addLog = (r: InstructorRecord, kind: LogEntry['kind'], date: string, text: string, who: Who) =>
  insert('instructor_log', [{ record_id: r.id, person_id: r.person_id, kind, log_date: date, text, by_id: who.id, by_name: who.name }])
export const addNote = (personId: string, text: string, who: Who) => insert('contact_notes', [{ person_id: personId, text, by_name: who.name, by_id: who.id }])
export async function exportRows(): Promise<string> {
  await ensureSession()
  const res = await fetch(`${SB_URL}/rest/v1/instructor_records?select=person_name,technique,status,level,target_level,instructor_date,senior_date,certified_by,end_reason,end_date,initiated_date&order=person_name`, { headers: { ...headers(), Accept: 'text/csv' } })
  return res.ok ? await res.text() : ''
}
