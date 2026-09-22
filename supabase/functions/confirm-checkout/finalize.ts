// CCI Website — shared registration finalizer.
// Used by stripe-webhook (Stripe pushes the event) and confirm-checkout (the
// visitor lands back on the site). Both paths converge here so a registration
// is recorded exactly once, whichever arrives first, and the Institute is
// told about it exactly once.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY. Optional: RESEND_API_KEY,
// NOTIFY_FROM, NOTIFY_TO (comma-separated), SITE_ORIGIN.

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const NOTIFY_FROM = Deno.env.get("NOTIFY_FROM") ?? "Advanced Orthogonal Institute <registrations@advancedorthogonal.com>";
// Every email an attendee or member receives replies to the Institute's real inbox.
const REPLY_TO = Deno.env.get("REPLY_TO") ?? "info@advancedorthogonal.com";
const NOTIFY_TO = (Deno.env.get("NOTIFY_TO") ?? "drslininger@cerebralchiropractic.com").split(",").map((s: string) => s.trim()).filter(Boolean);
const SITE_ORIGIN = Deno.env.get("SITE_ORIGIN") ?? "https://advancedorthogonal.com";
const STRIPE_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";

export async function sbFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return await fetch(`${SB_URL}${path}`, {
    ...init,
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
}

const likeEscape = (v: string) => v.replace(/([\\%_])/g, "\\$1");

export async function linkOrCreatePerson(fullName: string, email: string, phone: string | null): Promise<string | null> {
  try {
    if (!email) return null;
    const q = await sbFetch(`/rest/v1/people?email=ilike.${encodeURIComponent(likeEscape(email))}&select=id&limit=1`);
    const rows = await q.json();
    if (Array.isArray(rows) && rows[0]) return rows[0].id;
    const parts = String(fullName ?? "").trim().split(/\s+/).filter(Boolean);
    const first = parts.shift() ?? "Unknown";
    const last = parts.join(" ") || "—"; // people.last_name is NOT NULL
    const ins = await sbFetch(`/rest/v1/people`, {
      method: "POST", headers: { Prefer: "return=representation" },
      body: JSON.stringify({ first_name: first, last_name: last, email, mobile_phone: phone, contact_type: "lead", notes: "Created automatically from a website event registration." }),
    });
    if (!ins.ok) { console.error("person create failed", await ins.text()); return null; }
    const [row] = await ins.json();
    return row?.id ?? null;
  } catch (e) { console.error("linkOrCreatePerson error", e); return null; }
}

export type Reg = Record<string, unknown> & { id: string; event_id: number; full_name: string; email: string; reg_type?: string; price_paid_cents?: number; payment_status?: string };

/** Records a paid Stripe Checkout session. Returns the registration row and whether this call is what marked it paid. */
export async function finalizePaidSession(session: Record<string, any>): Promise<{ row: Reg | null; newlyPaid: boolean; ceOnly?: boolean }> {
  const meta = session.metadata ?? {};
  const sessionId = String(session.id ?? "");
  const email = meta.email ?? session.customer_details?.email ?? "";
  const fullName = meta.full_name ?? session.customer_details?.name ?? "Unknown";
  const phone = meta.phone ?? null;

  // A CE certificate bought after the fact (pay link from the check-in desk):
  // the seat already exists, so only the CE fields change.
  if (meta.kind === "ce_payment" && meta.registration_id) {
    const q = await sbFetch(`/rest/v1/event_registrations?id=eq.${encodeURIComponent(meta.registration_id)}&select=*&limit=1`);
    const rows = q.ok ? await q.json() : [];
    const reg: Reg | null = Array.isArray(rows) && rows[0] ? rows[0] : null;
    if (!reg) return { row: null, newlyPaid: false };
    if (reg.ce_paid_at) return { row: reg, newlyPaid: false, ceOnly: true };
    const up = await sbFetch(`/rest/v1/event_registrations?id=eq.${reg.id}&ce_paid_at=is.null`, { method: "PATCH", headers: { Prefer: "return=representation" },
      body: JSON.stringify({ ce_credits: true, ce_paid_cents: Number(session.amount_total ?? 0), ce_paid_at: new Date().toISOString(), ce_stripe_session_id: sessionId, updated_at: new Date().toISOString() }) });
    const upRows = up.ok ? await up.json() : [];
    return Array.isArray(upRows) && upRows[0] ? { row: upRows[0], newlyPaid: true, ceOnly: true } : { row: reg, newlyPaid: false, ceOnly: true };
  }

  // What do we already have? (idempotency: a second webhook or a visitor refresh must not re-notify)
  const cur = await sbFetch(`/rest/v1/event_registrations?stripe_checkout_session_id=eq.${encodeURIComponent(sessionId)}&select=*&limit=1`);
  const curRows = cur.ok ? await cur.json() : [];
  let existing: Reg | null = Array.isArray(curRows) && curRows[0] ? curRows[0] : null;
  // A pay link can be opened more than once; the row keeps only the newest session id, so fall back to the id Stripe carries.
  if (!existing && meta.registration_id) {
    const q2 = await sbFetch(`/rest/v1/event_registrations?id=eq.${encodeURIComponent(meta.registration_id)}&select=*&limit=1`);
    const r2 = q2.ok ? await q2.json() : [];
    existing = Array.isArray(r2) && r2[0] ? r2[0] : null;
  }
  if (existing && existing.payment_status === "paid") return { row: existing, newlyPaid: false };

  const personId = await linkOrCreatePerson(fullName, email, phone);
  const patch: Record<string, unknown> = {
    payment_status: "paid", registration_status: "registered",
    stripe_payment_intent_id: session.payment_intent ?? null,
    updated_at: new Date().toISOString(),
  };
  if (typeof session.amount_total === "number") patch.price_paid_cents = session.amount_total;
  patch.stripe_checkout_session_id = sessionId;
  if (personId) patch.person_id = personId;
  if (meta.reg_type) patch.reg_type = meta.reg_type;
  if (meta.ce === "true") patch.ce_credits = true;

  if (existing) {
    const up = await sbFetch(`/rest/v1/event_registrations?id=eq.${existing.id}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(patch) });
    if (!up.ok) { console.error("registration finalize failed", await up.text()); return { row: existing, newlyPaid: false }; }
    const [row] = await up.json();
    return { row, newlyPaid: true };
  }
  // No pending row — the create-checkout insert failed. Recover from Stripe metadata so the sale is never lost.
  if (!meta.event_id) return { row: null, newlyPaid: false };
  const regType = String(meta.reg_type ?? "doctor");
  const rec = await sbFetch(`/rest/v1/event_registrations`, {
    method: "POST", headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      event_id: Number(meta.event_id), full_name: fullName, email, phone, person_id: personId,
      is_member_at_registration: String(meta.is_member) === "true",
      price_paid_cents: Number(session.amount_total ?? 0), discount_applied: meta.discount_applied ?? null,
      reg_type: regType, verification_status: regType === "student" || regType === "faculty" ? "pending" : null,
      payment_status: "paid", registration_status: "registered",
      stripe_checkout_session_id: sessionId, stripe_payment_intent_id: session.payment_intent ?? null,
      ce_credits: meta.ce === "true" || (regType !== "member"),
      source: meta.source ?? "website", notes: "Recovered at payment time: no pending row existed.",
    }),
  });
  if (!rec.ok) { console.error("registration recovery failed", await rec.text()); return { row: null, newlyPaid: false }; }
  const [row] = await rec.json();
  return { row, newlyPaid: true };
}

export async function eventFor(id: number): Promise<Record<string, any> | null> {
  const r = await sbFetch(`/rest/v1/events?id=eq.${id}&select=id,title,slug,starts_at,ends_at,timezone,location&limit=1`);
  const rows = r.ok ? await r.json() : [];
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const money = (cents: unknown) => `$${(Number(cents ?? 0) / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
const when = (ev: Record<string, any> | null) => {
  if (!ev?.starts_at) return "";
  const tz = ev.timezone || "America/New_York";
  const f = (iso: string) => new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric", timeZone: tz });
  return ev.ends_at && f(ev.ends_at) !== f(ev.starts_at) ? `${f(ev.starts_at)} – ${f(ev.ends_at)}` : f(ev.starts_at);
};

async function sendEmail(to: string[], subject: string, html: string, replyTo?: string): Promise<void> {
  if (!RESEND_KEY || !to.length) { console.log("email skipped (RESEND_API_KEY not set)", subject); return; }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: NOTIFY_FROM, to, subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
  });
  if (!r.ok) console.error("email send failed", r.status, await r.text());
}

/** Tells the Institute (and the registrant) about a registration that just became paid or free. */
export async function notifyRegistration(row: Reg, kind: "paid" | "free" | "ce" = "paid"): Promise<void> {
  try {
    if (kind === "ce") {
      const ev = await eventFor(Number(row.event_id));
      const title = ev?.title ?? "AOI event";
      const t = [["Name", row.full_name], ["Email", row.email], ["CE certificate", money(row.ce_paid_cents)], ["Event", title], ["Paid", new Date().toLocaleString("en-US", { timeZone: "America/New_York" }) + " ET"]]
        .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#5b6b76">${esc(k)}</td><td style="padding:4px 0"><b>${esc(v)}</b></td></tr>`).join("");
      await sendEmail(NOTIFY_TO, `CE paid — ${title}: ${row.full_name}`, `<div style="font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:14px;color:#0b1e2b"><p>A CE certificate payment came through.</p><table style="border-collapse:collapse">${t}</table></div>`, String(row.email ?? ""));
      if (row.email) await sendEmail([String(row.email)], `CE certificate confirmed — ${title}`, `<div style="font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:14px;color:#0b1e2b"><p>Hi ${esc(String(row.full_name).replace(/^dr\.?\s+/i, "").split(/[\s,]+/)[0])},</p><p>Your CE credit certificate for <b>${esc(title)}</b> is paid (${money(row.ce_paid_cents)}). Remember to sign in and out of every session to receive credit.</p><p>— Advanced Orthogonal Institute</p></div>`, REPLY_TO);
      return;
    }
    const ev = await eventFor(Number(row.event_id));
    const title = ev?.title ?? "AOI event";
    const tier = String(row.reg_type ?? "doctor");
    const tierLabel = tier === "student" ? "Student" : tier === "faculty" ? "College faculty" : tier === "member" ? "Member RSVP" : "Doctor";
    const verify = row.verification_status === "pending" ? " — eligibility to confirm" : "";
    const rows = [
      ["Name", row.full_name], ["Email", row.email], ["Phone", row.phone ?? "—"],
      ["Ticket", `${tierLabel}${row.is_member_at_registration ? " · AOI member" : ""}${verify}`],
      ["Paid", kind === "free" ? (tier === "member" ? "Free with membership" : "Free") : tier === "member" ? `${money(row.price_paid_cents)} — CE credit certificate` : `${money(row.price_paid_cents)}${row.discount_applied ? ` (${row.discount_applied})` : ""}`],
      ...(tier === "member" ? [["CE credit", row.ce_credits ? "Yes" : "No"]] : []),
      ["Event", `${title}${when(ev) ? " · " + when(ev) : ""}`],
      ["Registered", new Date().toLocaleString("en-US", { timeZone: "America/New_York" }) + " ET"],
    ];
    const table = rows.map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#5b6b76;white-space:nowrap">${esc(k)}</td><td style="padding:4px 0"><b>${esc(v)}</b></td></tr>`).join("");
    await sendEmail(NOTIFY_TO, `New registration — ${title}: ${row.full_name} (${tierLabel})`,
      `<div style="font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:14px;color:#0b1e2b"><p>A new registration just came through the website.</p><table style="border-collapse:collapse">${table}</table><p style="margin-top:16px"><a href="${SITE_ORIGIN}/account#events">Open the Events tab</a> to see the attendance list.</p></div>`,
      String(row.email ?? ""));
    if (row.email) {
      await sendEmail([String(row.email)], `You're registered — ${title}`,
        `<div style="font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:14px;color:#0b1e2b"><p>Hi ${esc(String(row.full_name).split(/\s+/)[0])},</p><p>Your registration for <b>${esc(title)}</b>${when(ev) ? ` (${esc(when(ev))})` : ""} is confirmed.</p><table style="border-collapse:collapse">${table}</table>${row.verification_status === "pending" ? "<p>We will confirm your student / faculty status by email before the event.</p>" : ""}<p style="margin-top:16px">Event details and reminders will follow as the date approaches. If you have a member login, this event now appears under My Profile → My Registrations.</p><p>— Advanced Orthogonal Institute</p></div>`, REPLY_TO);
    }
  } catch (e) { console.error("notifyRegistration error", e); }
}


/* ----------------------------------------------------------------------------
 * Membership dues. Members on the recurring yearly plan are billed by Stripe
 * as subscription invoices — no Checkout session, so the registration path
 * never sees them. invoice.paid lands here: we record the payment once (unique
 * on the invoice id), extend the member's expiry to the period end, remember
 * the Stripe customer id, and tell the Institute.
 * -------------------------------------------------------------------------- */
const ymd = (unix: number | null | undefined) => (unix ? new Date(unix * 1000).toISOString().slice(0, 10) : null);

async function stripeCustomerEmail(customerId: string): Promise<{ email: string | null; name: string | null }> {
  if (!STRIPE_KEY || !customerId) return { email: null, name: null };
  try {
    const r = await fetch(`https://api.stripe.com/v1/customers/${encodeURIComponent(customerId)}`, { headers: { Authorization: `Bearer ${STRIPE_KEY}` } });
    if (!r.ok) return { email: null, name: null };
    const c = await r.json();
    return { email: c?.email ?? null, name: c?.name ?? null };
  } catch { return { email: null, name: null }; }
}

/** Finds the member by email — the contact email first, then the login email on their profile. */
async function personByEmail(email: string): Promise<{ id: string; first_name: string; last_name: string; membership_expires: string | null; member_since: string | null } | null> {
  if (!email) return null;
  const sel = "id,first_name,last_name,membership_expires,member_since";
  let q = await sbFetch(`/rest/v1/people?email=ilike.${encodeURIComponent(likeEscape(email))}&select=${sel}&limit=1`);
  let rows = await q.json();
  if (Array.isArray(rows) && rows[0]) return rows[0];
  q = await sbFetch(`/rest/v1/profiles?email=ilike.${encodeURIComponent(likeEscape(email))}&select=person_id&limit=1`);
  rows = await q.json();
  const pid = Array.isArray(rows) ? rows[0]?.person_id : null;
  if (!pid) return null;
  q = await sbFetch(`/rest/v1/people?id=eq.${pid}&select=${sel}&limit=1`);
  rows = await q.json();
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

export type DuesResult = { recorded: boolean; person: Record<string, any> | null; email: string | null; amountCents: number; periodEnd: string | null; newExpiry: string | null };

/** A charge is membership dues when the old store platform made it as a recurring "subscription payment"
 *  (those charges carry an application id and that description); event tickets are Checkout payments. */
export function isMembershipCharge(ch: Record<string, any>): boolean {
  const d = String(ch.description ?? ch.statement_descriptor ?? "");
  return /subscription payment/i.test(d) || /membership/i.test(d);
}

/** Records membership dues from a Stripe invoice (Stripe Billing) or a charge (the old store's recurring payments)
 *  and extends the membership. Idempotent on the invoice / charge id. */
export async function recordMembershipInvoice(inv: Record<string, any>, kind: "invoice" | "charge" = "invoice"): Promise<DuesResult> {
  const isCharge = kind === "charge";
  const invoiceId = isCharge ? null : String(inv.id ?? "");
  const customerId = typeof inv.customer === "string" ? inv.customer : inv.customer?.id ?? null;
  let email: string | null = isCharge ? (inv.billing_details?.email ?? inv.receipt_email ?? null) : (inv.customer_email ?? null);
  let name: string | null = isCharge ? (inv.billing_details?.name ?? null) : (inv.customer_name ?? null);
  if (!email && customerId) { const c = await stripeCustomerEmail(customerId); email = c.email; name = name ?? c.name; }
  const line = inv.lines?.data?.[0] ?? {};
  const paidUnix: number | null = isCharge ? (inv.created ?? null) : (inv.status_transitions?.paid_at ?? inv.created ?? null);
  const paidAtIso = paidUnix ? new Date(paidUnix * 1000).toISOString() : new Date().toISOString();
  const periodStart = isCharge ? ymd(paidUnix) : ymd(line.period?.start ?? inv.period_start);
  const periodEnd = isCharge ? null : ymd(line.period?.end ?? inv.period_end);
  const amountCents = Number(isCharge ? (inv.amount_captured ?? inv.amount ?? 0) : (inv.amount_paid ?? inv.total ?? 0));
  const subscriptionId = isCharge ? null : (typeof inv.subscription === "string" ? inv.subscription : inv.subscription?.id ?? line.subscription ?? null);
  const chargeId = isCharge ? String(inv.id ?? "") : (typeof inv.charge === "string" ? inv.charge : inv.charge?.id ?? null);

  const person = email ? await personByEmail(email) : null;

  // Insert once. A duplicate delivery hits the unique index and we stop here.
  const ins = await sbFetch(`/rest/v1/membership_payments`, {
    method: "POST", headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      person_id: person?.id ?? null, email, stripe_customer_id: customerId, stripe_invoice_id: invoiceId, stripe_subscription_id: subscriptionId, stripe_charge_id: chargeId,
      amount_cents: amountCents, currency: inv.currency ?? "usd", paid_at: paidAtIso,
      period_start: periodStart, period_end: periodEnd, source: isCharge ? "stripe_charge" : "stripe_invoice",
      note: person ? null : `No member record matched ${email ?? customerId ?? "this customer"}${name ? ` (${name})` : ""} — link by hand.`,
      raw: { id: inv.id ?? null, number: inv.number ?? null, hosted_invoice_url: inv.hosted_invoice_url ?? inv.receipt_url ?? null, description: inv.description ?? line.description ?? null, application: inv.application ?? null },
    }),
  });
  if (!ins.ok) {
    const t = await ins.text();
    if (ins.status === 409 || /duplicate|unique/i.test(t)) return { recorded: false, person, email, amountCents, periodEnd, newExpiry: null };
    console.error("membership_payments insert failed", ins.status, t);
    return { recorded: false, person, email, amountCents, periodEnd, newExpiry: null };
  }

  let newExpiry: string | null = null;
  // A term already recorded for this member (a backfill, or a resent event with a new id) must not extend them twice.
  let alreadyCovered = false;
  if (person) {
    // Same term already on file: a row whose period reaches this one's end, or a payment within a week of this one.
    const selfKey = isCharge ? `stripe_charge_id.neq.${encodeURIComponent(chargeId ?? "")}` : `stripe_invoice_id.neq.${encodeURIComponent(invoiceId ?? "")}`;
    const selfNull = isCharge ? "stripe_charge_id.is.null" : "stripe_invoice_id.is.null";
    const lo = new Date(new Date(paidAtIso).getTime() - 7 * 86400000).toISOString(), hi = new Date(new Date(paidAtIso).getTime() + 7 * 86400000).toISOString();
    const cond = periodEnd ? `or=(period_end.gte.${periodEnd},and(paid_at.gte.${lo},paid_at.lte.${hi}))` : `paid_at=gte.${lo}&paid_at=lte.${hi}`;
    const q = await sbFetch(`/rest/v1/membership_payments?person_id=eq.${person.id}&${cond}&or=(${selfNull},${selfKey})&select=id&limit=1`);
    const rows = q.ok ? await q.json() : [];
    alreadyCovered = Array.isArray(rows) && rows.length > 0;
  }
  if (person && !alreadyCovered) {
    // Extend to the invoice period end, never backwards; a year from the old expiry if Stripe gave no period.
    const current = person.membership_expires ?? null;
    const base = current && current > (periodStart ?? "") ? current : (periodStart ?? new Date().toISOString().slice(0, 10));
    const plusYear = (d: string) => { const x = new Date(d + "T12:00:00Z"); x.setUTCFullYear(x.getUTCFullYear() + 1); return x.toISOString().slice(0, 10); };
    newExpiry = periodEnd && periodEnd > (current ?? "") ? periodEnd : plusYear(base);
    if (current && newExpiry <= current) newExpiry = plusYear(current);
    const patch: Record<string, unknown> = { membership_status: "active", membership_expires: newExpiry, updated_at: new Date().toISOString() };
    if (customerId) patch.stripe_customer_id = customerId;
    if (!person.member_since) patch.member_since = periodStart ?? new Date().toISOString().slice(0, 10);
    const up = await sbFetch(`/rest/v1/people?id=eq.${person.id}`, { method: "PATCH", body: JSON.stringify(patch) });
    if (!up.ok) console.error("people renewal patch failed", await up.text());
  }
  return { recorded: true, person, email, amountCents, periodEnd, newExpiry: newExpiry ?? (alreadyCovered ? (person?.membership_expires ?? null) : null) };
}

/** Tells the Institute a membership was renewed (or that a payment arrived we could not match). */
export async function notifyMembership(r: DuesResult, kind: "renewed" | "failed" | "cancelled" = "renewed"): Promise<void> {
  try {
    const who = r.person ? `${r.person.first_name} ${r.person.last_name}` : (r.email ?? "Unknown customer");
    const rows = [
      ["Member", who], ["Email", r.email ?? "—"], ["Amount", money(r.amountCents)],
      ...(kind === "renewed" ? [["Membership now runs to", r.newExpiry ?? r.periodEnd ?? "—"]] : []),
      ["Recorded", new Date().toLocaleString("en-US", { timeZone: "America/New_York" }) + " ET"],
    ];
    const table = rows.map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#5b6b76;white-space:nowrap">${esc(k)}</td><td style="padding:4px 0"><b>${esc(String(v))}</b></td></tr>`).join("");
    const subject = kind === "renewed"
      ? (r.person ? `Membership renewed — ${who}` : `Membership payment received — no member matched (${r.email ?? "no email"})`)
      : kind === "failed" ? `Membership payment failed — ${who}` : `Membership subscription cancelled — ${who}`;
    const lead = kind === "renewed"
      ? (r.person ? "A yearly membership payment came through Stripe and the member's expiry was extended." : "A membership payment came through Stripe but no contact record has this email. It is saved in the membership payments log for you to link by hand.")
      : kind === "failed" ? "Stripe could not collect this member's yearly dues. Stripe will retry on its own schedule; the membership expiry was not changed." : "This member's recurring membership was cancelled in Stripe. Their current term still runs to its expiry; nothing else was changed.";
    await sendEmail(NOTIFY_TO, subject, `<div style="font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:14px;color:#0b1e2b"><p>${lead}</p><table style="border-collapse:collapse">${table}</table><p style="margin-top:16px"><a href="${SITE_ORIGIN}/account#directory">Open Members</a></p></div>`);
  } catch (e) { console.error("notifyMembership error", e); }
}
