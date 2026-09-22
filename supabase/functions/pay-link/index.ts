// CCI Website — pay-link (v1)
// A payment link for someone already on an event's list:
//   kind 'ce'           — the $50 CE credit certificate for a member who RSVP'd
//                         (or a speaker / faculty guest) and wants CE after all
//   kind 'registration' — a door registration: the full ticket price
// Actions:
//   send     (staff only — Directors, ED, Seminar chair, oversight) creates or
//            reuses the link and emails it to the attendee. Returns the URL too,
//            so the check-in desk can copy or text it if email is slow.
//   info     (public, by token) what the pay page shows.
//   checkout (public, by token) opens a Stripe Checkout session for the amount
//            set by the server, never the browser.
// Stripe's confirmation comes back through stripe-webhook / confirm-checkout,
// which read metadata.kind and registration_id.
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY. Optional:
// RESEND_API_KEY, NOTIFY_FROM, REPLY_TO (default info@advancedorthogonal.com), SITE_ORIGIN.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const STRIPE_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const RESEND_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const NOTIFY_FROM = Deno.env.get("NOTIFY_FROM") ?? "Advanced Orthogonal Institute <registrations@advancedorthogonal.com>";
const REPLY_TO = Deno.env.get("REPLY_TO") ?? "info@advancedorthogonal.com";
const SITE_ORIGIN = (Deno.env.get("SITE_ORIGIN") ?? "https://www.advancedorthogonal.com").replace(/\/+$/, "");
const ALLOWED = new Set(["https://advancedorthogonal.com", "https://www.advancedorthogonal.com", SITE_ORIGIN]);

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const sb = (path: string, init: RequestInit = {}) => fetch(`${SB_URL}${path}`, { ...init, headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", ...(init.headers ?? {}) } });
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const money = (c: number) => `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const cents = (v: unknown) => { const n = typeof v === "number" ? v : Number(v); return isFinite(n) ? Math.round(n * 100) : null; };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function regBy(filter: string) {
  const r = await sb(`/rest/v1/event_registrations?${filter}&select=*,events(id,title,slug,starts_at,ends_at,timezone,location,price,student_price,ce_price,ce_school,ce_mode)&limit=1`);
  const rows = r.ok ? await r.json() : [];
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}
const isPaid = (reg: any) => reg.pay_kind === "ce" ? !!reg.ce_paid_at : reg.payment_status === "paid";
const dates = (ev: any) => {
  if (!ev?.starts_at) return "";
  const tz = ev.timezone || "America/New_York";
  const f = (iso: string, o: Intl.DateTimeFormatOptions) => new Date(iso).toLocaleDateString("en-US", { timeZone: tz, ...o });
  const a = f(ev.starts_at, { month: "long", day: "numeric" }), b = ev.ends_at ? f(ev.ends_at, { day: "numeric" }) : "";
  return `${a}${b && b !== f(ev.starts_at, { day: "numeric" }) ? `–${b}` : ""}, ${f(ev.starts_at, { year: "numeric" })}`;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });
  let body: any; try { body = await req.json(); } catch { return json(400, { error: "invalid_json" }); }
  const action = String(body?.action ?? "");

  /* ---------------------------------------------------------------- send */
  if (action === "send") {
    const jwt = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!jwt || jwt === SERVICE_KEY) return json(401, { error: "sign_in_required" });
    const ok = await fetch(`${SB_URL}/rest/v1/rpc/can_manage_rsvps`, { method: "POST", headers: { apikey: ANON_KEY || SERVICE_KEY, Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" }, body: "{}" });
    if (!ok.ok || (await ok.json()) !== true) return json(403, { error: "not_allowed" });

    const regId = String(body?.registration_id ?? "");
    const kind = body?.kind === "registration" ? "registration" : "ce";
    if (!UUID.test(regId)) return json(400, { error: "invalid_registration" });
    const reg = await regBy(`id=eq.${regId}`);
    if (!reg) return json(404, { error: "registration_not_found" });
    if (!reg.email) return json(422, { error: "no_email", detail: "This attendee has no email address on file." });
    const ev = reg.events ?? {};

    let amount: number | null;
    if (kind === "ce") {
      if (reg.ce_paid_at || (reg.payment_status === "paid" && ["doctor", "student"].includes(reg.reg_type))) return json(409, { error: "ce_already_covered", detail: "CE is already paid or included for this attendee." });
      amount = cents(ev.ce_price);
      if (!amount) return json(422, { error: "no_ce_price", detail: "This event has no CE price set." });
    } else {
      if (reg.payment_status === "paid") return json(409, { error: "already_paid" });
      amount = cents(reg.reg_type === "student" ? ev.student_price : ev.price);
      if (!amount) return json(422, { error: "no_price", detail: "This event has no ticket price set." });
    }

    const token = reg.pay_token && reg.pay_kind === kind ? reg.pay_token : crypto.randomUUID();
    const sentTo = String(body?.email ?? reg.email).trim();
    const up = await sb(`/rest/v1/event_registrations?id=eq.${regId}`, { method: "PATCH", body: JSON.stringify({ pay_token: token, pay_kind: kind, pay_amount_cents: amount, pay_link_sent_at: new Date().toISOString(), pay_link_sent_to: sentTo, updated_at: new Date().toISOString() }) });
    if (!up.ok) return json(500, { error: "save_failed", detail: await up.text() });

    const url = `${SITE_ORIGIN}/seminars/${ev.slug ?? "annual-conference-2026"}/pay?t=${token}`;
    const first = String(reg.full_name ?? "").replace(/^dr\.?\s+/i, "").split(/[\s,]+/)[0] || "there";
    const what = kind === "ce" ? `the CE credit certificate for ${ev.title}` : `your registration for ${ev.title}`;
    let emailed = false;
    if (RESEND_KEY) {
      const html = `<div style="font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:15px;color:#0b1e2b;max-width:520px">
        <p>Hi ${esc(first)},</p>
        <p>Here is the secure link to pay for ${esc(what)}${dates(ev) ? ` (${esc(dates(ev))})` : ""}.</p>
        <p style="font-size:22px;font-weight:700;margin:18px 0 6px">${money(amount)}</p>
        <p style="margin:0 0 22px;color:#56687a">${kind === "ce" ? `${esc(String(ev.ce_mode ?? "").split("·")[0].trim() || "CE hours")} through ${esc(ev.ce_school ?? "the CE sponsor")}. Your seat is already confirmed.` : "Your seat is held; it is confirmed the moment payment goes through."}</p>
        <p><a href="${url}" style="display:inline-block;background:#c9a24b;color:#0b1e2b;text-decoration:none;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:14px 26px;border-radius:3px">Pay ${money(amount)} now</a></p>
        <p style="font-size:13px;color:#7a8c97;margin-top:22px">Payments are processed by Stripe. If the button does not open, paste this link into your browser:<br>${esc(url)}</p>
        <p>— Advanced Orthogonal Institute</p></div>`;
      const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: NOTIFY_FROM, to: [sentTo], reply_to: REPLY_TO, subject: kind === "ce" ? `Your CE certificate — ${ev.title} (${money(amount)})` : `Complete your registration — ${ev.title}`, html }) });
      emailed = r.ok;
      if (!r.ok) console.error("pay-link email failed", r.status, await r.text());
    }
    return json(200, { url, emailed, email: sentTo, amount_cents: amount, kind });
  }

  /* -------------------------------------------------------- info / checkout */
  const token = String(body?.token ?? "");
  if (!UUID.test(token)) return json(400, { error: "invalid_link" });
  const reg = await regBy(`pay_token=eq.${token}`);
  if (!reg) return json(404, { error: "link_not_found", detail: "This payment link is no longer valid. Ask the Institute for a new one." });
  const ev = reg.events ?? {};
  const paid = isPaid(reg);

  if (action === "info") {
    return json(200, {
      kind: reg.pay_kind, amount_cents: reg.pay_amount_cents, paid, name: reg.full_name, email: reg.email,
      event: { title: ev.title, slug: ev.slug, dates: dates(ev), location: ev.location, ce_school: ev.ce_school, ce_mode: ev.ce_mode },
    });
  }

  if (action === "checkout") {
    if (paid) return json(409, { error: "already_paid" });
    if (!STRIPE_KEY) return json(503, { error: "payments_not_configured" });
    const origin = ALLOWED.has(String(body?.origin ?? "")) ? String(body.origin) : SITE_ORIGIN;
    const amount = Number(reg.pay_amount_cents ?? 0);
    if (!(amount > 0)) return json(422, { error: "no_amount" });
    const isCE = reg.pay_kind === "ce";
    const p = new URLSearchParams();
    p.set("mode", "payment");
    p.set("success_url", `${origin}/registration-confirmed?session_id={CHECKOUT_SESSION_ID}`);
    p.set("cancel_url", `${origin}/seminars/${ev.slug}/pay?t=${token}`);
    p.set("customer_email", reg.email);
    p.set("line_items[0][quantity]", "1");
    p.set("line_items[0][price_data][currency]", "usd");
    p.set("line_items[0][price_data][unit_amount]", String(amount));
    p.set("line_items[0][price_data][product_data][name]", isCE ? `${ev.title} — CE credit certificate` : `${ev.title}${reg.reg_type === "student" ? " (student rate)" : ""}`);
    p.set("line_items[0][price_data][product_data][description]", isCE ? `Continuing education credit — ${reg.full_name}` : `Advanced Orthogonal Institute event registration — ${reg.full_name}`);
    p.set("metadata[kind]", isCE ? "ce_payment" : "registration");
    p.set("metadata[registration_id]", reg.id);
    p.set("metadata[event_id]", String(reg.event_id));
    p.set("metadata[full_name]", reg.full_name);
    p.set("metadata[email]", reg.email);
    p.set("metadata[reg_type]", reg.reg_type ?? "doctor");
    p.set("metadata[ce]", "true");
    p.set("metadata[source]", isCE ? "ce_link" : "door");
    const s = await fetch("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: { Authorization: `Bearer ${STRIPE_KEY}`, "Content-Type": "application/x-www-form-urlencoded" }, body: p.toString() });
    const session = await s.json();
    if (!s.ok) return json(502, { error: "stripe_error", detail: session?.error?.message ?? "unknown" });
    const patch: Record<string, unknown> = isCE ? { ce_stripe_session_id: session.id } : { stripe_checkout_session_id: session.id };
    await sb(`/rest/v1/event_registrations?id=eq.${reg.id}`, { method: "PATCH", body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() }) });
    return json(200, { url: session.url });
  }

  return json(400, { error: "unknown_action" });
});
