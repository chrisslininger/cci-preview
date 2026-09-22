/* ----------------------------------------------------------------------------
 * Check-in room. One RPC returns everyone who might walk through the door —
 * registrations, speakers with no registration yet, and (for events that are
 * free with membership) every current member who hasn't RSVP'd — each with the
 * day-by-day sign-ins and a single CE state. Writes are RPCs gated in the
 * database by can_manage_rsvps(); the pay link goes through the pay-link
 * function, which emails it and hands the URL back for copy / text.
 * -------------------------------------------------------------------------- */
import { rpc, invoke, headers, SB_URL, ensureSession } from '@/lib/supabase'

export type CeState = 'included' | 'paid' | 'with_payment' | 'link_sent' | 'not_paid'
export type RowStatus = 'registered' | 'rsvp' | 'pending' | 'speaker' | 'awaiting'
export type Checkin = { day: string; at: string; by: string | null }
export type Row = {
  key: string; reg_id: string | null; person_id: string | null
  name: string; email: string | null; phone: string | null; practice: string | null; place: string | null
  member: boolean; membership_expires: string | null; last_renewed: string | null; member_since: string | null
  reg_type?: string; payment_status?: string; price_paid_cents?: number; registered_at?: string; source?: string | null; notes?: string | null
  status: RowStatus; ce: CeState; pay_kind?: string | null; pay_link_sent_at?: string | null; pay_amount_cents?: number | null
  speaker: boolean; talks?: string | null; sponsor: boolean; checkins: Checkin[]
}
export type RoomEvent = { id: number; title: string; slug: string | null; starts_at: string; ends_at: string | null; timezone: string | null; location: string | null; ce_price: number | null; price: number | null; student_price: number | null; free_with_membership: boolean | null; ce_credits: boolean | null }
export type LogLine = { at: string; by: string | null; name: string; day: string }
export type Roster = { event: RoomEvent; rows: Row[]; log: LogLine[] }

export async function roster(eventId: number): Promise<Roster | null> {
  return await rpc<Roster>('checkin_roster', { p_event: eventId })
}

async function call<T>(name: string, args: Record<string, unknown>): Promise<{ data?: T; error?: string }> {
  await ensureSession()
  const res = await fetch(`${SB_URL}/rest/v1/rpc/${name}`, { method: 'POST', headers: headers(true), body: JSON.stringify(args) })
  if (res.ok) { const t = await res.text(); return { data: (t ? JSON.parse(t) : null) as T } }
  try { const j = await res.json(); return { error: String(j.message ?? j.hint ?? res.status) } } catch { return { error: String(res.status) } }
}

export const setCheckin = (eventId: number, row: Row, day: string, on: boolean) =>
  call<string>('checkin_set', { p_event: eventId, p_reg: row.reg_id, p_person: row.reg_id ? null : row.person_id, p_day: day, p_on: on })
export const ensureSeat = (eventId: number, personId: string) =>
  call<string>('checkin_ensure_registration', { p_event: eventId, p_person: personId })
export const walkup = (eventId: number, name: string, email: string, phone: string, regType: 'doctor' | 'student') =>
  call<string>('checkin_walkup', { p_event: eventId, p_name: name, p_email: email, p_phone: phone, p_reg_type: regType })
export const setRole = (regId: string, role: 'speaker' | 'sponsor' | null) =>
  call<null>('checkin_set_role', { p_reg: regId, p_role: role })

export type PayLinkResult = { url?: string; emailed?: boolean; email?: string; amount_cents?: number; error?: string; detail?: string }
export async function sendPayLink(regId: string, kind: 'ce' | 'registration', email?: string): Promise<PayLinkResult> {
  try { return await invoke<PayLinkResult>('pay-link', { action: 'send', registration_id: regId, kind, ...(email ? { email } : {}) }) }
  catch { return { error: 'network' } }
}

/* ----------------------------------------------------------------- derive */
/** The event's days in its own time zone, as YYYY-MM-DD. */
export function eventDays(ev: RoomEvent): string[] {
  const tz = ev.timezone || 'America/New_York'
  const ymd = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
  const a = ymd(new Date(ev.starts_at)), b = ymd(new Date(ev.ends_at ?? ev.starts_at))
  const out: string[] = []
  for (let d = new Date(a + 'T12:00:00Z'); ymd(d) <= b && out.length < 14; d = new Date(d.getTime() + 86400000)) out.push(d.toISOString().slice(0, 10))
  return out
}
export const todayIn = (tz?: string | null) => new Intl.DateTimeFormat('en-CA', { timeZone: tz || 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
export const dayLabel = (d: string) => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })
export const shortDate = (iso?: string | null) => iso ? new Date(iso.length === 10 ? iso + 'T12:00:00Z' : iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', ...(iso.length === 10 ? { timeZone: 'UTC' } : {}) }) : ''
export const clock = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
export const money = (c?: number | null) => c == null ? '' : `$${(c / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}`

/** Line 1 under the name: how they got on the list. */
export function statusLine(r: Row): string {
  if (r.status === 'awaiting') return 'Member · seat included · not yet RSVP’d'
  if (r.status === 'speaker' && !r.reg_id) return 'Speaker · complimentary seat'
  if (r.status === 'pending') return `Registered at the door · ${money(r.price_paid_cents)} payment pending`
  if (r.status === 'rsvp') return `RSVP’d ${shortDate(r.registered_at)}${r.source === 'manual_rsvp' || r.source === 'checkin' ? ' (confirmed by staff)' : ''}`
  if (r.status === 'speaker') return `Speaker · seated ${shortDate(r.registered_at)}`
  const paid = r.payment_status === 'paid' ? ` · paid ${money(r.price_paid_cents)}` : r.payment_status === 'free' ? ' · complimentary' : ''
  return `Registered ${shortDate(r.registered_at)}${paid}`
}
/** Line 2: the one thing the desk has to ask about. */
export function ceLine(r: Row): { text: string; kind: 'ok' | 'warn' | 'muted' } {
  switch (r.ce) {
    case 'included': return { text: 'CE included with ticket', kind: 'ok' }
    case 'paid': return { text: 'CE paid', kind: 'ok' }
    case 'with_payment': return { text: 'CE included once paid', kind: 'muted' }
    case 'link_sent': return { text: `CE not paid · link sent ${r.pay_link_sent_at ? clock(r.pay_link_sent_at) : ''}`, kind: 'warn' }
    default: return { text: 'CE not paid', kind: 'warn' }
  }
}
export const needsPayment = (r: Row) => r.status === 'pending'
export const canBuyCE = (r: Row) => r.ce === 'not_paid' || r.ce === 'link_sent'
