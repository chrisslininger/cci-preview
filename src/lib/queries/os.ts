/* ----------------------------------------------------------------------------
 * The executive data layer — the reads behind the Full CCI OS surface.
 *
 * Everything here goes through the same anon endpoint and the same row-level
 * policies as every other query in the site. Nothing is privileged by being on
 * this screen: an executive director sees the whole Institute because the
 * database grants it, and anyone else calling these functions gets back exactly
 * what their own policies allow. The surface is a view, not a back door.
 *
 * Counts use PostgREST's exact-count header rather than fetching rows, so the
 * pulse strip costs a few hundred bytes regardless of how large the roster is.
 * -------------------------------------------------------------------------- */
import { select, count, patch } from '@/lib/supabase'

/* Membership status is free text in `people`. These are the values the edge
 * functions already treat as "a member" — mirrored, never re-invented. */
const MEMBER_STATES = ['active', 'current', 'member', 'good', 'good_standing']
const memberFilter = `membership_status=in.(${MEMBER_STATES.join(',')})`

export type Pulse = {
  people: number
  members: number
  membersWithAccount: number
  membersNoEmail: number
  accounts: number
  eventsPublished: number
  eventsDraft: number
  registrations: number
  revenueCents: number
  enquiriesNew: number
  tasksOpen: number
  instructors: number
  certifications: number
  committeesSeated: number
  committeesTotal: number
}

export type OsEvent = {
  id: number
  slug?: string | null
  title?: string | null
  category?: string | null
  status?: string | null
  starts_at?: string | null
  location?: string | null
  price?: number | string | null
  member_price?: number | string | null
  capacity?: number | null
  /** Filled client-side from the registration rows. */
  regs?: number
  revenueCents?: number
}

export type OsRegistration = {
  event_id: number
  payment_status?: string | null
  registration_status?: string | null
  price_paid_cents?: number | null
}

export type OsCommittee = {
  id: number
  key: string
  name: string
  chairs: number
  members: number
}

export type OsInstructor = {
  person_name?: string | null
  person_id?: string | null
  level?: string | null
  status?: string | null
  /** True when the record is attached to a real person row. */
  linked: boolean
  /** True when that person also holds the `instructor` role that grants access. */
  hasRole: boolean
}

export type OsEnquiry = {
  id: number
  full_name?: string | null
  email?: string | null
  subject?: string | null
  status?: string | null
  created_at?: string | null
}

export type OsTask = {
  id: number
  title?: string | null
  assigned_name?: string | null
  due_date?: string | null
  status?: string | null
  priority?: string | null
}

/* --------------------------------------------------------------- the pulse */

export async function pulse(): Promise<Pulse> {
  const [
    people, members, membersWithAccount, membersNoEmail, accounts,
    eventsPublished, eventsDraft, enquiriesNew, tasksOpen, instructors,
    certifications, committeesTotal,
  ] = await Promise.all([
    count('people'),
    count('people', memberFilter),
    count('people', `${memberFilter}&auth_user_id=not.is.null`),
    count('people', `${memberFilter}&email=is.null`),
    count('people', 'auth_user_id=not.is.null'),
    count('events', 'status=eq.published'),
    count('events', 'status=eq.draft'),
    count('contact_submissions', 'status=is.null'),
    count('tasks', 'status=neq.done'),
    count('instructor_records', 'status=eq.current'),
    count('person_certifications'),
    count('committees', 'active=is.true'),
  ])

  const regs = await select<OsRegistration>(
    'event_registrations',
    'select=event_id,payment_status,registration_status,price_paid_cents&limit=2000',
  )
  const rows = regs.data ?? []
  const counted = rows.filter((r) => r.registration_status !== 'cancelled')
  const revenueCents = counted
    .filter((r) => r.payment_status === 'paid')
    .reduce((sum, r) => sum + (Number(r.price_paid_cents) || 0), 0)

  const seats = await select<{ committee_id: number | null; role_key: string }>(
    'person_roles',
    'select=committee_id,role_key&committee_id=not.is.null&limit=500',
  )
  const seated = new Set(
    (seats.data ?? [])
      .filter((r) => ['committee_chair', 'committee_cochair', 'research_director'].includes(r.role_key))
      .map((r) => r.committee_id),
  )

  return {
    people, members, membersWithAccount, membersNoEmail, accounts,
    eventsPublished, eventsDraft,
    registrations: counted.length,
    revenueCents,
    enquiriesNew, tasksOpen, instructors, certifications,
    committeesSeated: seated.size,
    committeesTotal,
  }
}

/* -------------------------------------------------------------- the events */

/** Every event, drafts included — reading base `events` is correct here because
 *  this surface is staff-only. The public catalog still reads `v_public_events`. */
export async function allEvents(): Promise<OsEvent[]> {
  const [events, regs] = await Promise.all([
    select<OsEvent>(
      'events',
      'select=id,slug,title,category,status,starts_at,location,price,member_price,capacity&order=starts_at.desc&limit=200',
    ),
    select<OsRegistration>(
      'event_registrations',
      'select=event_id,payment_status,registration_status,price_paid_cents&limit=2000',
    ),
  ])

  const byEvent = new Map<number, { n: number; cents: number }>()
  for (const r of regs.data ?? []) {
    if (r.registration_status === 'cancelled') continue
    const cur = byEvent.get(r.event_id) ?? { n: 0, cents: 0 }
    cur.n += 1
    if (r.payment_status === 'paid') cur.cents += Number(r.price_paid_cents) || 0
    byEvent.set(r.event_id, cur)
  }

  return (events.data ?? []).map((e) => ({
    ...e,
    regs: byEvent.get(e.id)?.n ?? 0,
    revenueCents: byEvent.get(e.id)?.cents ?? 0,
  }))
}

/** Publish or unpublish. This is the one write on the surface, and it is the
 *  act that decides whether the public site can sell a seminar at all. */
export async function setEventStatus(id: number, status: 'published' | 'draft') {
  return patch('events', `id=eq.${id}`, { status })
}

/* ---------------------------------------------------------- the org, live */

export async function committeeSeats(): Promise<OsCommittee[]> {
  const [coms, roles] = await Promise.all([
    select<{ id: number; key: string; name: string }>(
      'committees',
      'select=id,key,name&active=is.true&order=sort',
    ),
    select<{ committee_id: number | null; role_key: string }>(
      'person_roles',
      'select=committee_id,role_key&committee_id=not.is.null&limit=500',
    ),
  ])

  return (coms.data ?? []).map((c) => {
    const mine = (roles.data ?? []).filter((r) => r.committee_id === c.id)
    return {
      ...c,
      chairs: mine.filter((r) =>
        ['committee_chair', 'committee_cochair', 'research_director'].includes(r.role_key),
      ).length,
      members: mine.length,
    }
  })
}

/** The instructor register, cross-checked against the roles that grant access.
 *  Both halves have to agree or a teaching instructor cannot reach their tools. */
export async function instructorRegister(): Promise<OsInstructor[]> {
  const [records, roles] = await Promise.all([
    select<{ person_name?: string; person_id?: string | null; level?: string; status?: string }>(
      'instructor_records',
      'select=person_name,person_id,level,status&order=level,person_name&limit=200',
    ),
    select<{ person_id: string }>(
      'person_roles',
      'select=person_id&role_key=eq.instructor&limit=200',
    ),
  ])

  const withRole = new Set((roles.data ?? []).map((r) => r.person_id))
  return (records.data ?? []).map((r) => ({
    person_name: r.person_name,
    person_id: r.person_id ?? null,
    level: r.level,
    status: r.status,
    linked: Boolean(r.person_id),
    hasRole: Boolean(r.person_id && withRole.has(r.person_id)),
  }))
}

export async function enquiries(): Promise<OsEnquiry[]> {
  const q = await select<OsEnquiry>(
    'contact_submissions',
    'select=id,full_name,email,subject,status,created_at&order=created_at.desc&limit=25',
  )
  return q.data ?? []
}

export async function openTasks(): Promise<OsTask[]> {
  const q = await select<OsTask>(
    'tasks',
    'select=id,title,assigned_name,due_date,status,priority&status=neq.done&order=due_date&limit=25',
  )
  return q.data ?? []
}
