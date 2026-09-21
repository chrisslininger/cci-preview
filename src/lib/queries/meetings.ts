/* ----------------------------------------------------------------------------
 * The Board meeting is the clock the Institute runs on. Meetings are rows in
 * `events` (event_type = 'board', third Tuesday, booked through 2027); this
 * turns them into the reporting cycle every other tab reads:
 *
 *   previous meeting ──► the cycle opens the next day
 *   report month      = the month before the next meeting's month
 *   due               = 14 days before the next meeting  (the red dot)
 *   next meeting      ──► submitted reports lock and file into Records
 * -------------------------------------------------------------------------- */
import { select } from '@/lib/supabase'

export type Meeting = { id: number; starts_at: string; date: string; title: string; zoom_url: string | null; has_zoom: boolean; location: string | null; agenda: string | null }

const ET = 'America/New_York'
/** YYYY-MM-DD in Eastern time for an ISO timestamp (or now). */
export const dayET = (iso?: string | Date) => {
  const d = iso ? new Date(iso) : new Date()
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: ET, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d)
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? ''
  return `${g('year')}-${g('month')}-${g('day')}`
}
export const addDays = (ymd: string, n: number) => { const d = new Date(ymd + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
export const monthOf = (ymd: string) => ymd.slice(0, 7)
export const prevMonth = (ym: string) => { const [y, m] = ym.split('-').map(Number); const d = new Date(Date.UTC(y!, m! - 2, 1)); return d.toISOString().slice(0, 7) }
export const nextMonth = (ym: string) => { const [y, m] = ym.split('-').map(Number); const d = new Date(Date.UTC(y!, m!, 1)); return d.toISOString().slice(0, 7) }
export const monthLabel = (ym: string) => new Date(ym + '-15T12:00:00Z').toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
export const fmtD = (ymd: string | null | undefined) => ymd ? new Date(ymd.slice(0, 10) + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : ''
export const daysUntil = (ymd: string, from = dayET()) => Math.round((Date.parse(ymd + 'T12:00:00Z') - Date.parse(from + 'T12:00:00Z')) / 86400000)

/** Third Tuesday of a month, as a fallback when no meeting row exists. */
export function thirdTuesday(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  const first = new Date(Date.UTC(y!, m! - 1, 1))
  const off = (2 - first.getUTCDay() + 7) % 7
  return new Date(Date.UTC(y!, m! - 1, 1 + off + 14)).toISOString().slice(0, 10)
}

export async function boardMeetings(): Promise<Meeting[]> {
  const q = await select<{ id: number; starts_at: string; title: string; zoom_url: string | null; has_zoom: boolean; location: string | null; agenda: string | null }>(
    'v_calendar', `select=id,starts_at,title,zoom_url,has_zoom,location,agenda&event_type=eq.board&status=eq.published&order=starts_at&limit=60`)
  return (q.data ?? []).map((m) => ({ ...m, date: dayET(m.starts_at) }))
}

export type Cycle = {
  /** The month being reported, YYYY-MM. */
  reportMonth: string
  /** The meeting the report is for. */
  meeting: Meeting | null
  meetingDate: string
  dueDate: string
  /** The day the cycle opened (day after the previous meeting). */
  opens: string
  /** True once the report month has ended, i.e. the auto-filled numbers are final. */
  monthClosed: boolean
  previous: Meeting | null
}

/** The cycle in force today: reports are for the month before the next meeting's month. */
export function currentCycle(meetings: Meeting[], today = dayET()): Cycle {
  const next = meetings.find((m) => m.date >= today) ?? null
  const previous = [...meetings].reverse().find((m) => m.date < today) ?? null
  const meetingDate = next?.date ?? thirdTuesday(nextMonth(monthOf(today)))
  const reportMonth = prevMonth(monthOf(meetingDate))
  return {
    reportMonth, meeting: next, meetingDate, dueDate: addDays(meetingDate, -14),
    opens: previous ? addDays(previous.date, 1) : addDays(meetingDate, -45),
    monthClosed: today >= nextMonth(reportMonth) + '-01', previous,
  }
}
/** The cycle that just closed (its meeting has passed) — for late filing and for Records. */
export function previousCycle(meetings: Meeting[], today = dayET()): Cycle | null {
  const prev = [...meetings].reverse().find((m) => m.date < today)
  if (!prev) return null
  return currentCycle(meetings, addDays(prev.date, -1))
}
/** The cycle for any meeting date, used when filing a report for a given month. */
export function cycleForMonth(ym: string, meetings: Meeting[]): { meetingDate: string; dueDate: string } {
  const mm = nextMonth(ym)
  const meetingDate = meetings.find((m) => monthOf(m.date) === mm)?.date ?? thirdTuesday(mm)
  return { meetingDate, dueDate: addDays(meetingDate, -14) }
}
