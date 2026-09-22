// CCI Website — create-checkout (v7)
// Public checkout entry. Prices ALWAYS resolved server-side.
// v2: guest email matching a current member pauses and offers login for discount.
// v3: fixed column names to match the live CCI OS schema (early_bird_until /
//     early_bird_price), made the dollars->cents conversion deterministic, and
//     added published-only, registration-window, capacity and duplicate guards.
// v4: member pricing now comes from real columns (events.member_price /
//     events.free_with_membership) instead of a hardcoded $200 fallback;
//     escaped LIKE metacharacters in email lookups (an address containing "_"
//     was matching other people); added an origin allowlist on success_url /
//     cancel_url so the Stripe redirect can never be pointed off-site; and
//     refused registration for events that have already ended.
// v5: registrant tiers. The site now advertises doctor / student / AOI member /
//     college-faculty rates for the Annual Conference, so the server has to
//     honour them instead of charging everyone the doctor rate. reg_type is
//     read from the request, validated against the event's own configuration
//     (events.student_price, events.faculty_free) and priced here — a client
//     that asks for a tier the event does not offer is refused, never silently
//     upcharged. Self-declared student/faculty registrations are written with
//     verification_status='pending' so the Institute can confirm eligibility.
// v6: naming. The Stripe line-item description read "CranioCervical Institute",
//     which put the operating name on every receipt and card statement months
//     before the Board's announcement at the Annual Conference. Board decision
//     of 21 Jul 2026, reaffirmed 18 Aug 2026: all public-facing materials use
//     Advanced Orthogonal Institute naming until the conference. Changed here
//     and in the untitled-event fallback. No pricing or logic changed.
// v7: member RSVP. reg_type 'member' is a signed-in current member RSVPing for
//     themself to an event that is free with membership. Name, email and phone
//     come from their own record, never the form. Optional CE credit
//     certificate (events.ce_price, $50 for the conference) is the only thing a
//     member pays for: with ce=true a Stripe session for the CE fee is created;
//     without it the RSVP is recorded free on the spot. Rows carry
//     source='rsvp' and ce_credits so the Events tab can list attendees.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const MEMBER_DISCOUNT_CENTS = 20000;

// Where the Stripe redirect is allowed to land. Override/extend with the
// ALLOWED_ORIGINS secret (comma-separated) when the domain changes.
const DEFAULT_ORIGINS = [
  "https://chrisslininger.github.io",
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

const REG_TYPES = new Set(["doctor", "student", "faculty", "member"]);

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

function originAllowed(raw: unknown): boolean {
  let u: URL;
  try { u = new URL(String(raw)); } catch { return false; }
  if (u.protocol === "file:") return true;                       // local preview of the single-file site
  if (u.protocol !== "https:" && u.protocol !== "http:") return false;
  if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return true;
  if (u.protocol !== "https:") return false;
  return ALLOWED_ORIGINS.has(u.origin);
}

// PostgREST ilike passes the value straight to SQL LIKE, so % and _ are
// wildcards. Emails legitimately contain "_" — escape before matching.
function likeEscape(v: string): string {
  return v.replace(/([\\%_])/g, "\\$1");
}

async function sbFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return await fetch(`${SB_URL}${path}`, {
    ...init,
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
}

function isMemberStatus(ms: unknown): boolean {
  const v = String(ms ?? "").trim().toLowerCase();
  return v === "active" || v === "current" || v === "member" || v === "good" || v === "good_standing";
}

// The CCI OS price columns (price, member_price, student_price,
// early_bird_price, ce_price) are numeric DOLLARS. A *_cents integer column,
// if one is ever added, wins.
function centsFrom(row: Record<string, unknown>, base: string): number | null {
  const c = row[`${base}_cents`];
  if (typeof c === "number" && isFinite(c)) return Math.round(c);
  const d = row[base];
  const n = typeof d === "number" ? d : (typeof d === "string" && d.trim() !== "" ? Number(d) : NaN);
  if (isFinite(n)) return Math.round(n * 100);
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  let body: any;
  try { body = await req.json(); } catch { return json(400, { error: "invalid_json" }); }

  const { event_id, success_url, cancel_url } = body ?? {};
  let { full_name, email, phone } = body ?? {};
  const forceGuest = body?.force_guest === true;
  const wantsCE = body?.ce === true;

  // Registrant tier. Anything unrecognised is refused rather than quietly
  // downgraded, so a typo can never become a silent full-price charge.
  const regType = String(body?.reg_type ?? "doctor").trim().toLowerCase() || "doctor";
  if (!REG_TYPES.has(regType)) {
    return json(400, { error: "invalid_reg_type", allowed: [...REG_TYPES] });
  }
  const isRsvp = regType === "member";

  if (!event_id || !success_url || !cancel_url || (!isRsvp && (!full_name || !email))) {
    return json(400, { error: "missing_fields", required: ["event_id", "full_name", "email", "success_url", "cancel_url"] });
  }
  if (!isRsvp && !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(String(email))) return json(400, { error: "invalid_email" });
  if (!originAllowed(success_url) || !originAllowed(cancel_url)) {
    return json(400, { error: "bad_return_url", detail: "Return URLs must point at an approved Institute domain." });
  }

  const evRes = await sbFetch(`/rest/v1/events?id=eq.${encodeURIComponent(String(event_id))}&select=*&limit=1`);
  const evRows = await evRes.json();
  if (!Array.isArray(evRows) || evRows.length === 0) return json(404, { error: "event_not_found" });
  const ev = evRows[0] as Record<string, unknown>;

  // ---- only published events are purchasable from the public site ----
  if (String(ev["status"] ?? "").toLowerCase() !== "published") {
    return json(403, { error: "event_not_open", detail: "This event is not open for public registration." });
  }

  const now = new Date();

  // ---- the event has already happened ----
  const endRaw = ev["ends_at"] ?? ev["starts_at"];
  if (endRaw && now > new Date(String(endRaw))) {
    return json(409, { error: "event_over", ended_at: endRaw });
  }

  // ---- registration window ----
  if (ev["reg_opens"] && now < new Date(String(ev["reg_opens"]))) {
    return json(409, { error: "registration_not_open", opens_at: ev["reg_opens"] });
  }
  if (ev["reg_closes"] && now > new Date(String(ev["reg_closes"]))) {
    return json(409, { error: "registration_closed", closed_at: ev["reg_closes"] });
  }

  // ---- the requested tier has to exist on THIS event ----
  const studentCents = centsFrom(ev, "student_price");
  const facultyFree = ev["faculty_free"] === true;
  const freeWithMembership = ev["free_with_membership"] === true;
  if (regType === "student" && studentCents === null) {
    return json(409, { error: "tier_not_available", reg_type: regType, detail: "This event does not offer a student rate." });
  }
  if (regType === "faculty" && !facultyFree) {
    return json(409, { error: "tier_not_available", reg_type: regType, detail: "This event does not offer a college-faculty rate." });
  }
  if (isRsvp && !freeWithMembership) {
    return json(409, { error: "tier_not_available", reg_type: regType, detail: "This event is not free with membership — please register with the member rate." });
  }

  // ---- membership via JWT (signed-in flow) ----
  let authUserId: string | null = null;
  let personId: string | null = null;
  let isMember = false;
  let me: Record<string, any> | null = null;
  const jwt = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (jwt && jwt !== SERVICE_KEY) {
    const uRes = await fetch(`${SB_URL}/auth/v1/user`, { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${jwt}` } });
    if (uRes.ok) {
      const u = await uRes.json();
      authUserId = u?.id ?? null;
      if (authUserId) {
        const pRes = await sbFetch(`/rest/v1/people?auth_user_id=eq.${authUserId}&select=id,membership_status,membership_expires,first_name,last_name,credentials,email,mobile_phone,office_phone,practice_name&limit=1`);
        const pRows = await pRes.json();
        if (Array.isArray(pRows) && pRows[0]) {
          me = pRows[0];
          personId = pRows[0].id;
          isMember = isMemberStatus(pRows[0].membership_status);
        }
      }
    }
  }

  // ---- member RSVP: only a signed-in current member, only for themself ----
  if (isRsvp) {
    if (!authUserId || !me) return json(401, { error: "sign_in_required", detail: "Sign in to RSVP as a member." });
    if (!isMember) return json(403, { error: "not_a_member", detail: "Your membership is not current. Renew to RSVP free, or register at the doctor rate." });
    full_name = `${me.first_name ?? ""} ${me.last_name ?? ""}`.trim() + (me.credentials ? `, ${me.credentials}` : "");
    email = me.email ?? email;
    phone = me.mobile_phone ?? me.office_phone ?? phone ?? null;
    if (!email) return json(422, { error: "no_email_on_file", detail: "Your member record has no email address. Contact the Institute to update it." });
  }

  const emailLike = encodeURIComponent(likeEscape(String(email)));

  // ---- capacity ----
  const cap = typeof ev["capacity"] === "number" ? ev["capacity"] as number : null;
  if (cap && cap > 0) {
    const cRes = await sbFetch(
      `/rest/v1/event_registrations?event_id=eq.${encodeURIComponent(String(event_id))}` +
      `&registration_status=eq.registered&payment_status=in.(paid,free,pending)&select=id`,
      { headers: { Prefer: "count=exact", Range: "0-0" } },
    );
    const cr = cRes.headers.get("content-range") ?? "";
    const taken = Number(cr.split("/")[1] ?? "0");
    if (isFinite(taken) && taken >= cap) return json(409, { error: "event_full", capacity: cap });
  }

  // ---- already registered with this email (or, for a member, this person)? ----
  const dupFilter = personId
    ? `&or=(email.ilike.${emailLike},person_id.eq.${personId})`
    : `&email=ilike.${emailLike}`;
  const dupRes = await sbFetch(
    `/rest/v1/event_registrations?event_id=eq.${encodeURIComponent(String(event_id))}` +
    `${dupFilter}&payment_status=in.(paid,free)` +
    `&registration_status=eq.registered&select=id&limit=1`,
  );
  const dupRows = await dupRes.json();
  if (Array.isArray(dupRows) && dupRows[0]) {
    return json(409, { error: "already_registered", detail: isRsvp ? "You are already on the attendee list for this event." : "This email is already registered for this event." });
  }

  // ---- guest typed a member's email? offer login for the discount ----
  // Skipped for tiers that are already free — there is nothing left to save.
  const tierAlreadyFree = regType === "faculty" && facultyFree;
  if (!authUserId && !forceGuest && !tierAlreadyFree) {
    const mRes = await sbFetch(`/rest/v1/people?email=ilike.${emailLike}&select=membership_status&limit=1`);
    const mRows = await mRes.json();
    if (Array.isArray(mRows) && mRows[0] && isMemberStatus(mRows[0].membership_status)) {
      return json(200, { requires_login_for_discount: true, free_with_membership: freeWithMembership });
    }
  }

  const title = String(ev["title"] ?? "AOI Event");
  const source = isRsvp ? "rsvp" : "website";

  // ---- server-side price ----
  const discounts: string[] = [];
  let price = 0;
  let ceCredits = false;
  let lineName = title;
  let lineDesc = `Advanced Orthogonal Institute event registration — ${full_name}`;

  if (isRsvp) {
    // The seat is free with membership. The only charge a member can incur is the CE certificate.
    discounts.push("member");
    const ceCents = ev["ce_credits"] === true ? centsFrom(ev, "ce_price") : null;
    if (wantsCE) {
      if (ceCents === null) return json(409, { error: "ce_not_available", detail: "CE credit is not offered for this event." });
      if (ceCents > 0) { price = ceCents; ceCredits = true; lineName = `${title} — CE credit certificate`; lineDesc = `Continuing education credit (${String(ev["ce_mode"] ?? "").split("·")[0].trim() || "CE hours"}) — ${full_name}. Conference seat included with AOI membership.`; }
      else ceCredits = true;
    }
  } else {
    const priceFull = centsFrom(ev, "price_full") ?? centsFrom(ev, "price");
    if (priceFull === null) return json(422, { error: "event_pricing_not_set", detail: "This event has no price configured in CCI OS yet." });
    price = priceFull;

    // early bird: CCI OS columns are early_bird (bool), early_bird_price, early_bird_until
    const ebOn = ev["early_bird"] === true;
    const ebUntilRaw = ev["early_bird_until"];
    const ebUntil = ebUntilRaw ? new Date(String(ebUntilRaw)) : null;
    const ebPrice = centsFrom(ev, "early_bird_price");
    if (ebOn && ebPrice !== null && ebUntil && now < ebUntil && ebPrice < price) {
      price = ebPrice; discounts.push("early_bird");
    }

    // registrant tier. Applied before the member discount so the visitor always
    // ends up on whichever rate is genuinely lower.
    if (regType === "student" && studentCents !== null && studentCents < price) {
      price = studentCents; discounts.push("student");
    }
    if (regType === "faculty" && facultyFree) {
      price = 0; discounts.push("faculty");
    }

    if (isMember && price > 0) {
      if (freeWithMembership) { price = 0; discounts.push("member"); }
      else {
        const memberPrice = centsFrom(ev, "member_price") ?? centsFrom(ev, "price_member");
        const discounted = memberPrice !== null ? memberPrice : Math.max(0, price - MEMBER_DISCOUNT_CENTS);
        if (discounted < price) { price = discounted; discounts.push("member"); }
      }
    }
    // A paid ticket includes CE where the event offers it.
    ceCredits = ev["ce_credits"] === true && price > 0;
  }

  const discountApplied = discounts.length ? discounts.join("+") : null;
  // Student and faculty rates are self-declared at checkout. Flag them for the
  // Institute to confirm rather than trusting the form.
  const verificationStatus = (regType === "student" || regType === "faculty") ? "pending" : null;

  if (price <= 0) {
    const ins = await sbFetch(`/rest/v1/event_registrations`, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        event_id, full_name, email, phone: phone ?? null, practice_name: me?.practice_name ?? null,
        auth_user_id: authUserId, person_id: personId,
        is_member_at_registration: isMember,
        price_paid_cents: 0, discount_applied: discountApplied,
        reg_type: regType, verification_status: verificationStatus, ce_credits: ceCredits,
        payment_status: "free", registration_status: "registered", source,
      }),
    });
    if (!ins.ok) return json(500, { error: "registration_failed", detail: await ins.text() });
    const [row] = await ins.json();
    return json(200, {
      free: true, rsvp: isRsvp, registration_id: row.id, event_title: title,
      reg_type: regType, needs_verification: verificationStatus === "pending",
    });
  }

  if (!STRIPE_KEY) return json(503, { error: "payments_not_configured", detail: "STRIPE_SECRET_KEY is not set. Add Stripe keys to enable checkout." });

  const tierLabel = regType === "student" ? " (student rate)" : regType === "faculty" ? " (college faculty)" : "";

  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("success_url", `${success_url}${String(success_url).includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`);
  params.set("cancel_url", cancel_url);
  params.set("customer_email", email);
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", "usd");
  params.set("line_items[0][price_data][unit_amount]", String(price));
  params.set("line_items[0][price_data][product_data][name]", isRsvp ? lineName : `${title}${tierLabel}`);
  params.set("line_items[0][price_data][product_data][description]", lineDesc);
  params.set("metadata[event_id]", String(event_id));
  params.set("metadata[full_name]", full_name);
  params.set("metadata[email]", email);
  if (phone) params.set("metadata[phone]", phone);
  if (discountApplied) params.set("metadata[discount_applied]", discountApplied);
  params.set("metadata[reg_type]", regType);
  params.set("metadata[is_member]", String(isMember));
  params.set("metadata[ce]", String(ceCredits));
  params.set("metadata[source]", source);

  const sRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${STRIPE_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const session = await sRes.json();
  if (!sRes.ok) return json(502, { error: "stripe_error", detail: session?.error?.message ?? "unknown" });

  const insPending = await sbFetch(`/rest/v1/event_registrations`, {
    method: "POST",
    body: JSON.stringify({
      event_id, full_name, email, phone: phone ?? null, practice_name: me?.practice_name ?? null,
      auth_user_id: authUserId, person_id: personId,
      is_member_at_registration: isMember,
      price_paid_cents: price, discount_applied: discountApplied,
      reg_type: regType, verification_status: verificationStatus, ce_credits: ceCredits,
      payment_status: "pending", registration_status: "registered", source,
      stripe_checkout_session_id: session.id,
    }),
  });
  if (!insPending.ok) console.error("pending registration insert failed", await insPending.text());

  return json(200, {
    url: session.url, session_id: session.id, amount_cents: price, rsvp: isRsvp, ce: ceCredits,
    discount_applied: discountApplied, reg_type: regType,
    needs_verification: verificationStatus === "pending",
  });
});
