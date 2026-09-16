/* ----------------------------------------------------------------------------
 * Member-area data.
 *
 * Every query goes through here rather than being issued from a component, so
 * a change of source or a cache rule touches one file. Each one is also
 * row-level-security gated in the database: if a person is not entitled to a
 * row, Postgres does not return it. The capability check in the UI decides
 * whether to ask; RLS decides whether to answer.
 * -------------------------------------------------------------------------- */
import { select, session } from '@/lib/supabase'

export type Registration = {
  payment_status?: string
  registration_status?: string
  price_paid_cents?: number
  created_at?: string
  discount_applied?: string
  reg_type?: string
  events?: { title?: string; starts_at?: string; location?: string; slug?: string } | null
}

export type Certification = {
  technique?: string
  level?: string
  cert_date?: string
  certificate_number?: string
}

export type Completion = {
  ce_hours?: number
  certificate_number?: string
  issued_at?: string
}

export type PublicEvent = {
  id: number
  slug: string
  title?: string
  starts_at?: string | null
  ends_at?: string | null
  location?: string | null
  price?: number | string | null
  seats_remaining?: number | string | null
}

export type CommitteeReport = {
  id: string
  committee_id: number
  period_label?: string
  status?: string
  submitted_at?: string
  committees?: { name?: string } | null
}

export type BoardSeat = {
  id: string
  status?: string
  term_start?: string
  term_end?: string
  office?: string
  people?: { first_name?: string; last_name?: string } | null
}

export type DirectoryPerson = {
  id: string
  first_name?: string
  last_name?: string
  credentials?: string
  email?: string
  membership_status?: string
  cert_level?: string
  practice_city?: string
  practice_state?: string
}

const uid = () => session.user?.id ?? ''

export async function myRegistrations(): Promise<Registration[]> {
  const q = await select<Registration>(
    'event_registrations',
    'select=payment_status,registration_status,price_paid_cents,created_at,discount_applied,reg_type,' +
      `events(title,starts_at,location,slug)&auth_user_id=eq.${uid()}&order=created_at.desc`,
  )
  return q.data ?? []
}

export async function myCertifications(personId: string): Promise<Certification[]> {
  const q = await select<Certification>(
    'person_certifications',
    `select=technique,level,cert_date,certificate_number&person_id=eq.${personId}`,
  )
  return q.data ?? []
}

export async function myCompletions(personId: string): Promise<Completion[]> {
  const q = await select<Completion>(
    'completions',
    `select=ce_hours,certificate_number,issued_at&person_id=eq.${personId}&order=issued_at.desc`,
  )
  return q.data ?? []
}

export async function upcomingEvents(): Promise<PublicEvent[]> {
  const q = await select<PublicEvent>(
    'v_public_events',
    'select=id,slug,title,starts_at,ends_at,location,price,seats_remaining&order=starts_at',
  )
  return q.data ?? []
}

export async function committeeReports(): Promise<CommitteeReport[]> {
  const q = await select<CommitteeReport>(
    'committee_reports',
    'select=id,committee_id,period_label,status,submitted_at,committees(name)&order=submitted_at.desc',
  )
  return q.data ?? []
}

export async function boardSeats(): Promise<BoardSeat[]> {
  const q = await select<BoardSeat>(
    'board_service',
    'select=id,status,term_start,term_end,office,people(first_name,last_name)&order=term_end.desc',
  )
  return q.data ?? []
}

export async function directory(limit = 100): Promise<DirectoryPerson[]> {
  const q = await select<DirectoryPerson>(
    'people',
    'select=id,first_name,last_name,credentials,email,membership_status,cert_level,practice_city,practice_state' +
      `&order=last_name&limit=${limit}`,
  )
  return q.data ?? []
}

/* ------------------------------------------------------------ role admin -- */

export type RosterRow = {
  id: string
  first_name?: string
  last_name?: string
  email?: string
  person_roles?: { role_key: string; committee_id: number | null }[]
}

export async function roster(search: string): Promise<RosterRow[]> {
  const term = search.trim()
  const filter = term
    ? `&or=(last_name.ilike.*${encodeURIComponent(term)}*,first_name.ilike.*${encodeURIComponent(term)}*,email.ilike.*${encodeURIComponent(term)}*)`
    : '&person_roles=not.is.null'
  const q = await select<RosterRow>(
    'people',
    `select=id,first_name,last_name,email,person_roles(role_key,committee_id)&order=last_name&limit=40${filter}`,
  )
  return q.data ?? []
}

export async function committees(): Promise<{ id: number; key: string; name: string }[]> {
  const q = await select<{ id: number; key: string; name: string }>(
    'committees',
    'select=id,key,name&active=is.true&order=sort',
  )
  return q.data ?? []
}
