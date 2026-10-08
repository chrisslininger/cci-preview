/**
 * One way to show a date in the members area: en-US, "Oct 6, 2026".
 * With a time: "Oct 6, 2026 · 7:00 PM ET". Times are read in the Institute's
 * zone (America/New_York) unless an event names its own, and carry its short label.
 * A plain "YYYY-MM-DD" is a calendar day and never shifts with the viewer's zone.
 */
const ZONE_ABBR: Record<string, string> = {
  'America/New_York': 'ET',
  'America/Chicago': 'CT',
  'America/Denver': 'MT',
  'America/Los_Angeles': 'PT',
  'America/Phoenix': 'MST',
}
export const ET = 'America/New_York'
export const zoneAbbr = (tz?: string | null) => ZONE_ABBR[tz || ET] ?? ''

export function fmtDate(
  iso: string | null | undefined,
  opts: { time?: boolean; long?: boolean; tz?: string | null } = {},
): string {
  if (!iso) return ''
  const dayOnly = /^\d{4}-\d{2}-\d{2}$/.test(iso)
  const d = new Date(dayOnly ? `${iso}T12:00:00Z` : iso)
  if (Number.isNaN(d.getTime())) return ''
  const zone = dayOnly ? 'UTC' : opts.tz || ET
  const day = d.toLocaleDateString('en-US', {
    ...(opts.long ? { weekday: 'long', month: 'long' } : { month: 'short' }),
    day: 'numeric',
    year: 'numeric',
    timeZone: zone,
  })
  if (!opts.time || dayOnly) return day
  return `${day} · ${fmtTime(iso, zone)}`
}

/** Just the time, in the Institute's zone: "7:00 PM ET". */
export const fmtTime = (iso: string | null | undefined, tz?: string | null): string => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const zone = tz || ET
  return `${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: zone })} ${zoneAbbr(zone)}`.trim()
}
