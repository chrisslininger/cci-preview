// CCI Website — roll-calendar (v1)
// Keeps the standing event calendar stocked, so nobody creates events by hand
// each year. The Board adopted the calendar as weekday rules (effective 2027);
// for every rule, each occurrence that falls within the next HORIZON_DAYS gets
// an event, published, so registration is open on the website right away.
//
// A new event is a copy of the most recent event for the same rule — price,
// member price, venue, capacity, CE, description, sessions and speakers carry
// over, exactly like the Events tab's Copy button — with its dates moved to
// the new weekend (same local times) and a slug built from the rule and year.
// If an event for a rule has never been created, that rule is skipped and
// reported: the first one is made by hand, and the job copies it from then on.
//
// Safe to run any number of times: an existing slug is never touched.
// The rules below must match src/content/calendar.ts on the website.
//
// Call: POST, Authorization: Bearer <service role key>. Body (optional):
//   { "dry_run": true }  — report what would be created, change nothing.
// Meant to run daily from pg_cron; see the pull request for the schedule.
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY. Optional: HORIZON_DAYS (400).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const HORIZON_DAYS = Number(Deno.env.get("HORIZON_DAYS") ?? 400);

const json = (status: number, body: unknown) => new Response(JSON.stringify(body, null, 2), { status, headers: { "Content-Type": "application/json" } });
const sb = (path: string, init: RequestInit = {}) => fetch(`${SB_URL}${path}`, { ...init, headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", ...(init.headers ?? {}) } });

/* ------------------------------------------------------------------ rules */

type Rule = {
  id: string;
  /** Slug stem; the event slug is `<stem>-<year>` plus `-<mon>` when `withMonth`. */
  slug: string;
  withMonth: boolean;
  /** 0 = January. */
  month: number;
  /** 0 = Sunday, 1 = Monday, 2 = Tuesday, 5 = Friday. */
  weekday: number;
  nth: number;
  days: number;
};

const FIRST_YEAR = 2027;
const RULES: Rule[] = [
  { id: "intensive-feb", slug: "advo-intensive", withMonth: true, month: 1, weekday: 5, nth: 3, days: 2 },
  { id: "intensive-apr", slug: "advo-intensive", withMonth: true, month: 3, weekday: 5, nth: 3, days: 2 },
  { id: "bootcamp", slug: "advo-bootcamp", withMonth: false, month: 5, weekday: 1, nth: 3, days: 5 },
  { id: "intensive-aug", slug: "advo-intensive", withMonth: true, month: 7, weekday: 5, nth: 4, days: 2 },
];
// The Annual Conference follows its rule too (third Friday–Saturday of
// October), but each year's conference is planned as its own program, so it
// is created by hand rather than copied.

const MON = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** The nth weekday of a month, as a UTC-midnight calendar date. */
function nthWeekday(year: number, month: number, weekday: number, nth: number): Date {
  const first = new Date(Date.UTC(year, month, 1));
  const offset = (weekday - first.getUTCDay() + 7) % 7;
  return new Date(Date.UTC(year, month, 1 + offset + (nth - 1) * 7));
}

type Target = { rule: string; slug: string; start: Date; end: Date; prefix: string; year: number };

function targets(today: Date): Target[] {
  const out: Target[] = [];
  const horizon = new Date(today.getTime() + HORIZON_DAYS * 86_400_000);
  for (let year = today.getUTCFullYear() - 1; year <= horizon.getUTCFullYear() + 1; year++) {
    for (const r of year >= FIRST_YEAR ? RULES : []) {
      const start = nthWeekday(year, r.month, r.weekday, r.nth);
      const end = new Date(start.getTime() + (r.days - 1) * 86_400_000);
      if (end < today || start > horizon) continue;
      const suffix = r.withMonth ? `-${MON[r.month]}` : "";
      out.push({ rule: r.id, slug: `${r.slug}-${year}${suffix}`, start, end, prefix: r.slug, year });
    }
    // The Monthly Huddle (member Zoom) is one permanent event, not copied yearly.
  }
  return out;
}

/* -------------------------------------------------------------- copying */

/** Calendar date of an instant in a time zone, as UTC midnight. */
function localDate(iso: string, tz: string): Date {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" })
    .formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return new Date(Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day)));
}

/** Move an instant by whole days. Local times hold because every rule stays
 *  in the same month, so daylight saving is the same year to year. */
const shift = (iso: string | null, days: number) => iso ? new Date(new Date(iso).getTime() + days * 86_400_000).toISOString() : null;

const STRIP = new Set(["id", "created_at", "updated_at", "event_id", "event_speakers", "event_sessions", "event_registrations", "venue"]);
const clean = (row: Record<string, unknown>) => Object.fromEntries(Object.entries(row).filter(([k]) => !STRIP.has(k)));

async function latestTemplate(t: Target): Promise<any | null> {
  // Same rule, earlier year: for a month-keyed slug the month must match too.
  const like = t.rule === "member-zoom" || !t.slug.match(/-[a-z]{3}$/) ? `${t.prefix}-*` : `${t.prefix}-*-${t.slug.slice(-3)}`;
  const r = await sb(`/rest/v1/events?slug=like.${encodeURIComponent(like)}&select=*,event_sessions(*),event_speakers(*)&order=starts_at.desc&limit=1`);
  const rows = r.ok ? await r.json() : [];
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

async function create(t: Target, tpl: any, dry: boolean) {
  const tz = tpl.timezone || "America/New_York";
  const days = Math.round((t.start.getTime() - localDate(tpl.starts_at, tz).getTime()) / 86_400_000);
  const titleYear = String(tpl.title ?? "").replace(/\b20\d\d(-\d\d)?\b/, t.rule === "member-zoom" ? `${t.year}-${String(t.year + 1).slice(2)}` : String(t.year));
  const row = {
    ...clean(tpl),
    slug: t.slug,
    title: titleYear,
    status: "published",
    starts_at: shift(tpl.starts_at, days),
    ends_at: t.rule === "member-zoom" && tpl.ends_at
      ? shift(tpl.ends_at, Math.round((t.end.getTime() - localDate(tpl.ends_at, tz).getTime()) / 86_400_000))
      : shift(tpl.ends_at, days),
    reg_opens: null,
    reg_closes: shift(tpl.reg_closes, days),
    early_bird_until: shift(tpl.early_bird_until, days),
  };
  if (dry) return { slug: t.slug, from: tpl.slug, starts_at: row.starts_at, ends_at: row.ends_at, title: row.title, dry_run: true };

  const ins = await sb(`/rest/v1/events`, { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(row) });
  if (!ins.ok) return { slug: t.slug, error: `create failed: ${ins.status} ${await ins.text()}` };
  const [ev] = await ins.json();
  const children: string[] = [];
  for (const [table, list] of [["event_sessions", tpl.event_sessions], ["event_speakers", tpl.event_speakers]] as const) {
    if (!Array.isArray(list) || list.length === 0) continue;
    const rows = list.map((x: any) => ({ ...clean(x), event_id: ev.id, ...("starts_at" in x ? { starts_at: shift(x.starts_at, days), ends_at: shift(x.ends_at, days) } : {}) }));
    const c = await sb(`/rest/v1/${table}`, { method: "POST", body: JSON.stringify(rows) });
    if (!c.ok) children.push(`${table}: ${c.status} ${await c.text()}`);
  }
  return { slug: t.slug, id: ev.id, from: tpl.slug, starts_at: row.starts_at, ...(children.length ? { warnings: children } : {}) };
}

/* ---------------------------------------------------------------- serve */

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });
  if (req.headers.get("Authorization") !== `Bearer ${SERVICE_KEY}`) return json(401, { error: "unauthorized" });
  let body: any = {};
  try { body = await req.json(); } catch { /* empty body is fine */ }
  const dry = body?.dry_run === true;

  const today = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
  const created: unknown[] = [], skipped: unknown[] = [];

  for (const t of targets(today)) {
    const has = await sb(`/rest/v1/events?slug=eq.${encodeURIComponent(t.slug)}&select=id&limit=1`);
    if (has.ok && (await has.json()).length) continue;
    const tpl = await latestTemplate(t);
    if (!tpl) { skipped.push({ slug: t.slug, reason: `no earlier ${t.rule} event to copy — create the first one by hand` }); continue; }
    created.push(await create(t, tpl, dry));
  }
  return json(200, { dry_run: dry, created, skipped });
});
