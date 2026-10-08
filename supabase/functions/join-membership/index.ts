// CCI Website — join-membership (v2)
// The way in. The site could take money for a seminar seat but never for a
// membership: the two "Become a Member" buttons were styled spans with nothing
// behind them, and the only working join flow lived on an outside store.
//
// This creates a Stripe Checkout session in subscription mode for the annual
// membership, after making sure the person has a contact record to hang the
// payment on. Nothing here marks anyone a member — Stripe does that by sending
// `invoice.paid` to stripe-webhook, which records the dues, extends the expiry
// and emails the new member their members-area link. One place decides who is
// a member, and it is the money.
//
// Actions:
//   price     (public) what joining costs today, for the page to display.
//   checkout  (public) find or create the contact record, then hand back a
//             Stripe URL. A current member is refused rather than charged twice.
//
// Deployed with verify_jwt DISABLED, and it has to stay that way. The public
// site holds a publishable key (sb_publishable_...), which is not a JWT, and
// Supabase's gateway rejects a non-JWT bearer token outright. A prospect
// joining the Institute is by definition signed out, so with verify_jwt on,
// every real join attempt would be refused before this code ran. Nothing here
// trusts the caller: the price is read from the server, the membership is
// granted only by Stripe's paid invoice.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY,
//      STRIPE_MEMBERSHIP_PRICE (the recurring yearly price id).
// Optional: STRIPE_MEMBERSHIP_PRICE_2027 + MEMBERSHIP_PRICE_CHANGES_ON to let
//      the rate change by itself, ALLOWED_ORIGINS, SITE_ORIGIN.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const PRICE_NOW = Deno.env.get("STRIPE_MEMBERSHIP_PRICE") ?? "";
const PRICE_NEXT = Deno.env.get("STRIPE_MEMBERSHIP_PRICE_2027") ?? "";
/** The day the higher rate takes over, Eastern. The site advertises 1 Jan 2027. */
const PRICE_CHANGES_ON = Deno.env.get("MEMBERSHIP_PRICE_CHANGES_ON") ?? "2027-01-01";
const SITE_ORIGIN = (Deno.env.get("SITE_ORIGIN") ?? "https://www.advancedorthogonal.com").replace(/\/+$/, "");

const DEFAULT_ORIGINS = [
  "https://advancedorthogonal.com",
  "https://www.advancedorthogonal.com",
  "https://craniocervicalinstitute.com",
  "https://www.craniocervicalinstitute.com",
];
const ALLOWED_ORIGINS = new Set(
  (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",").map((s) => s.trim().replace(/\/+$/, "")).filter(Boolean)
    .concat(DEFAULT_ORIGINS),
);

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const sbFetch = (path: string, init: RequestInit = {}) =>
  fetch(`${SB_URL}${path}`, {
    ...init,
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });

const likeEscape = (v: string) => v.replace(/([\\%_])/g, "\\$1");
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;
const clean = (v: unknown, max = 120) => String(v ?? "").trim().slice(0, max);

function originAllowed(raw: unknown): boolean {
  let u: URL;
  try { u = new URL(String(raw)); } catch { return false; }
  if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return true;
  if (u.protocol !== "https:") return false;
  return ALLOWED_ORIGINS.has(u.origin);
}

/** Which price applies today. Falls back to the current one when no future
 *  price is configured, so a missing second price never blocks a sale. */
function priceToday(): string {
  if (PRICE_NEXT && new Date().toISOString().slice(0, 10) >= PRICE_CHANGES_ON) return PRICE_NEXT;
  return PRICE_NOW;
}

type Person = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  membership_status: string | null;
  membership_expires: string | null;
};

const isCurrentMember = (p: Person) => {
  const today = new Date().toISOString().slice(0, 10);
  if (p.membership_expires) return p.membership_expires >= today;
  return ["active", "current", "good_standing"].includes(String(p.membership_status ?? "").toLowerCase());
};

async function personByEmail(email: string): Promise<Person | null> {
  const r = await sbFetch(
    `/rest/v1/people?email=ilike.${encodeURIComponent(likeEscape(email))}&select=id,first_name,last_name,email,membership_status,membership_expires&limit=1`,
  );
  const rows = r.ok ? await r.json() : [];
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

/** The contact record the payment will attach to. Created only with what the
 *  person typed; membership_status is left alone, because only a paid invoice
 *  may make someone a member. */
async function ensurePerson(d: { first: string; last: string; email: string; phone: string; practice: string }): Promise<Person | null> {
  const existing = await personByEmail(d.email);
  if (existing) {
    // Fill blanks the visitor just gave us; never overwrite what is on file.
    const patch: Record<string, unknown> = {};
    if (!existing.first_name && d.first) patch.first_name = d.first;
    if (!existing.last_name && d.last) patch.last_name = d.last;
    if (Object.keys(patch).length) {
      patch.updated_at = new Date().toISOString();
      await sbFetch(`/rest/v1/people?id=eq.${existing.id}`, { method: "PATCH", body: JSON.stringify(patch) });
    }
    return existing;
  }
  const ins = await sbFetch(`/rest/v1/people`, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      first_name: d.first,
      last_name: d.last,
      email: d.email,
      ...(d.phone ? { mobile_phone: d.phone } : {}),
      ...(d.practice ? { practice_name: d.practice } : {}),
      contact_type: "doctor",
      membership_status: "prospect",
    }),
  });
  if (!ins.ok) {
    console.error("person insert failed", ins.status, (await ins.text()).slice(0, 300));
    return null;
  }
  const rows = await ins.json().catch(() => []);
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  let body: any;
  try { body = await req.json(); } catch { return json(400, { error: "invalid_json" }); }
  const action = String(body?.action ?? "checkout");

  if (action === "price") {
    return json(200, { configured: !!priceToday(), price_id: priceToday() ? "set" : null });
  }

  if (action !== "checkout") return json(400, { error: "unknown_action" });

  const price = priceToday();
  if (!price) {
    console.error("STRIPE_MEMBERSHIP_PRICE is not set");
    return json(503, { error: "not_configured", detail: "Membership checkout is not switched on yet. Please contact the Institute." });
  }
  if (!STRIPE_KEY) return json(503, { error: "not_configured", detail: "Payments are not switched on yet." });

  const email = clean(body?.email, 160).toLowerCase();
  const first = clean(body?.first_name, 60);
  const last = clean(body?.last_name, 60);
  const phone = clean(body?.phone, 40);
  const practice = clean(body?.practice_name, 120);
  if (!EMAIL_RE.test(email)) return json(400, { error: "invalid_email", detail: "Please enter a valid email address." });
  if (!first || !last) return json(400, { error: "name_required", detail: "Please enter your first and last name." });

  const origin = originAllowed(body?.origin) ? String(body.origin).replace(/\/+$/, "") : SITE_ORIGIN;

  // Already a member? Say so rather than taking a second year's money.
  const existing = await personByEmail(email);
  if (existing && isCurrentMember(existing)) {
    return json(200, {
      already_member: true,
      expires_on: existing.membership_expires,
      detail: "That address already has a current membership.",
    });
  }

  const person = await ensurePerson({ first, last, email, phone, practice });

  const params = new URLSearchParams();
  params.set("mode", "subscription");
  params.set("line_items[0][price]", price);
  params.set("line_items[0][quantity]", "1");
  params.set("customer_email", email);
  params.set("client_reference_id", person?.id ?? email);
  params.set("allow_promotion_codes", "true");
  params.set("success_url", `${origin}/membership/welcome?s={CHECKOUT_SESSION_ID}`);
  params.set("cancel_url", `${origin}/membership`);
  // Read by stripe-webhook: a subscription session is membership, never a seat.
  params.set("metadata[kind]", "membership");
  params.set("metadata[person_id]", person?.id ?? "");
  params.set("metadata[full_name]", `${first} ${last}`.trim());
  params.set("subscription_data[metadata][kind]", "membership");
  params.set("subscription_data[metadata][person_id]", person?.id ?? "");
  // So the dues land on the right record even if the email later changes.
  params.set("subscription_data[description]", "AOI annual membership");

  const sRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${STRIPE_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const session = await sRes.json();
  if (!sRes.ok) {
    console.error("stripe session failed", sRes.status, JSON.stringify(session?.error ?? {}).slice(0, 300));
    return json(502, { error: "stripe_error", detail: session?.error?.message ?? "Stripe could not start the checkout." });
  }

  return json(200, { url: session.url, session_id: session.id });
});
