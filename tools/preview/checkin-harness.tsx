/** Design harness for the check-in room and pay page. Stubs RPCs with fictional rows. Not shipped. */
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from '@/lib/router'
import { ToastProvider } from '@/components/ui/Toast'
import CheckinRoom from '@/components/member/CheckinRoom'
import PayPage from '@/pages/PayPage'

const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
const tomorrow = new Date(Date.parse(today + 'T12:00:00Z') + 86400000).toISOString().slice(0, 10)
const at = (h: number, m: number) => new Date(`${today}T${String(h + 4).padStart(2, '0')}:${String(m).padStart(2, '0')}:00Z`).toISOString()
const base = { reg_id: null, person_id: null, email: null, phone: null, practice: null, place: null, member: true, membership_expires: '2027-06-30', last_renewed: '2026-06-30', member_since: '2012-01-01', speaker: false, sponsor: false, checkins: [] as { day: string; at: string; by: string | null }[] }
const R = (o: Record<string, unknown>) => ({ ...base, ...o })
const rows = [
  R({ key: 'r:1', reg_id: '1', name: 'Dr. Alan Marsh', email: 'alan@example.com', practice: 'Marsh Family Chiropractic', place: 'Tampa, FL', member: false, reg_type: 'doctor', payment_status: 'paid', price_paid_cents: 79700, registered_at: '2026-09-14T15:00:00Z', status: 'registered', ce: 'included', checkins: [{ day: today, at: at(8, 12), by: 'Chris Slininger' }] }),
  R({ key: 'r:2', reg_id: '2', name: 'Dr. Beth Carrow', email: 'beth@example.com', phone: '(727) 555-0133', reg_type: 'member', payment_status: 'free', price_paid_cents: 0, registered_at: '2026-09-02T15:00:00Z', status: 'rsvp', ce: 'not_paid' }),
  R({ key: 'r:3', reg_id: '3', name: 'Dr. Colin Park', email: 'colin@example.com', reg_type: 'member', payment_status: 'paid', price_paid_cents: 5000, registered_at: '2026-08-20T15:00:00Z', status: 'rsvp', ce: 'with_payment', ce_text: '', checkins: [] }),
  R({ key: 'r:4', reg_id: '4', name: 'Dr. Dana Ruiz', email: 'dana@example.com', reg_type: 'doctor', payment_status: 'free', price_paid_cents: 0, registered_at: '2026-09-01T15:00:00Z', status: 'speaker', speaker: true, talks: 'Upper cervical imaging — Fri 10:30', ce: 'not_paid', checkins: [{ day: today, at: at(7, 55), by: 'Chris Slininger' }] }),
  R({ key: 'r:5', reg_id: '5', name: 'Dr. Evan Holt', email: 'evan@example.com', phone: '(813) 555-0190', member: false, reg_type: 'doctor', payment_status: 'pending', price_paid_cents: 79700, registered_at: today + 'T12:20:00Z', source: 'door', status: 'pending', ce: 'with_payment', pay_link_sent_at: at(8, 20), checkins: [{ day: today, at: at(8, 21), by: 'Chris Slininger' }] }),
  R({ key: 'r:6', reg_id: '6', name: 'Fiona Grant', email: 'fiona@example.com', member: false, practice: 'Orthogonal Instruments Co.', reg_type: 'doctor', payment_status: 'free', price_paid_cents: 0, registered_at: '2026-09-10T15:00:00Z', status: 'registered', sponsor: true, ce: 'not_paid' }),
  R({ key: 'r:7', reg_id: '7', name: 'Dr. Grace Lin', email: 'grace@example.com', reg_type: 'member', payment_status: 'free', registered_at: '2026-09-05T15:00:00Z', source: 'manual_rsvp', status: 'rsvp', ce: 'link_sent', pay_link_sent_at: at(8, 30) }),
  R({ key: 'r:8', reg_id: '8', name: 'Dr. Henry Oduya', email: 'henry@example.com', member: false, reg_type: 'student', payment_status: 'paid', price_paid_cents: 29700, registered_at: '2026-09-11T15:00:00Z', status: 'registered', ce: 'included' }),
  R({ key: 'p:9', person_id: '9', name: 'Dr. Irene Walsh', email: 'irene@example.com', status: 'awaiting', ce: 'not_paid' }),
  R({ key: 'p:10', person_id: '10', name: 'Dr. Jack Moreno', email: 'jack@example.com', status: 'awaiting', ce: 'not_paid' }),
]
const FIX = {
  event: { id: 13, title: '2026 Annual Conference', slug: 'annual-conference-2026', starts_at: today + 'T12:00:00Z', ends_at: tomorrow + 'T22:00:00Z', timezone: 'America/New_York', location: 'Pierce Clinic of Chiropractic · St. Petersburg, FL', ce_price: 50, price: 797, student_price: 297, free_with_membership: true, ce_credits: true },
  rows, log: [{ at: at(8, 21), by: 'Chris Slininger', name: 'Dr. Evan Holt', day: today }, { at: at(8, 12), by: 'Chris Slininger', name: 'Dr. Alan Marsh', day: today }, { at: at(7, 55), by: 'Chris Slininger', name: 'Dr. Dana Ruiz', day: today }],
}
const json = (v: unknown) => new Response(JSON.stringify(v), { status: 200, headers: { 'content-type': 'application/json' } })
const real = window.fetch.bind(window)
window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input)
  if (url.includes('/functions/v1/pay-link')) {
    const b = JSON.parse(String(init?.body))
    if (b.action === 'info') return json({ kind: 'ce', amount_cents: 5000, paid: false, name: 'Dr. Beth Carrow', email: 'beth@example.com', event: { title: '2026 Annual Conference', slug: 'annual-conference-2026', dates: 'Nov 6–7, 2026', location: 'Pierce Clinic of Chiropractic, St. Petersburg, FL', ce_school: 'Life University', ce_mode: '12 CE hours' } })
    const r = rows.find((x) => x.reg_id === b.registration_id); if (r) { r.ce = b.kind === 'ce' ? 'link_sent' : r.ce; r.pay_link_sent_at = new Date().toISOString() }
    return json({ url: 'https://www.advancedorthogonal.com/seminars/annual-conference-2026/pay?t=0000', emailed: true, email: r?.email, amount_cents: 5000 })
  }
  if (!url.includes('/rest/v1/rpc/')) return real(input, init)
  const name = url.split('/rpc/')[1]!.split('?')[0]
  const b = init?.body ? JSON.parse(String(init.body)) : {}
  if (name === 'checkin_roster') return json(FIX)
  if (name === 'checkin_set') {
    const r = rows.find((x) => (b.p_reg && x.reg_id === b.p_reg) || (!b.p_reg && x.person_id === b.p_person))!
    if (!r.reg_id) { r.reg_id = 'n' + r.person_id; r.key = 'r:' + r.reg_id; r.status = 'rsvp'; (r as Record<string, unknown>).registered_at = new Date().toISOString(); (r as Record<string, unknown>).source = 'checkin' }
    r.checkins = b.p_on ? [...r.checkins.filter((c) => c.day !== b.p_day), { day: b.p_day, at: new Date().toISOString(), by: 'Chris Slininger' }] : r.checkins.filter((c) => c.day !== b.p_day)
    return json(r.reg_id)
  }
  return json(null)
}) as typeof window.fetch

const pay = new URLSearchParams(location.search).has('t')
createRoot(document.getElementById('root')!).render(
  <BrowserRouter><ToastProvider>{pay ? <PayPage /> : <CheckinRoom eventId={13} onClose={() => {}} />}</ToastProvider></BrowserRouter>)
