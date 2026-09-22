// CCI Website — stripe-webhook (v4)
// Receives Stripe events, verifies the signature, finalizes registrations,
// links/creates the person in the directory, and tells the Institute.
// Requires env: STRIPE_WEBHOOK_SECRET. Optional: RESEND_API_KEY, NOTIFY_FROM, NOTIFY_TO.
// v3: finalize logic moved to finalize.ts (shared with confirm-checkout,
//     which lets the visitor's return to the site record the sale even if this
//     webhook is misconfigured); price_paid_cents now records Stripe's actual
//     amount_total; reg_type carried through on recovery; one notification
//     email per registration, never repeated on duplicate deliveries.
// v4: membership dues. Recurring yearly memberships bill as subscription
//     invoices (no Checkout session); invoice.paid now records the payment in
//     membership_payments, extends the member's expiry, and notifies the ED.
//     invoice.payment_failed and customer.subscription.deleted notify only.
//     charge.succeeded with a "Subscription payment" description (the old store
//     platform's yearly billing, which never produces a Stripe invoice) is dues too.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { sbFetch, finalizePaidSession, notifyRegistration, recordMembershipInvoice, notifyMembership, isMembershipCharge } from "./finalize.ts";

const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

// Stripe may send several v1 signatures during a secret rotation; accept any match.
async function verifyStripeSignature(payload: string, sigHeader: string, secret: string): Promise<boolean> {
  let t = "";
  const v1s: string[] = [];
  for (const part of sigHeader.split(",")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k === "t") t = v;
    else if (k === "v1") v1s.push(v);
  }
  if (!t || v1s.length === 0) return false;
  if (!isFinite(Number(t)) || Math.abs(Date.now() / 1000 - Number(t)) > 300) return false; // 5 minute tolerance
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${payload}`));
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  let matched = false;
  for (const v1 of v1s) {
    if (v1.length !== hex.length) continue;
    let diff = 0;
    for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ v1.charCodeAt(i);
    if (diff === 0) matched = true; // no early return — keep timing flat
  }
  return matched;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });
  if (!WEBHOOK_SECRET) return new Response("webhook secret not configured", { status: 503 });

  const payload = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";
  if (!(await verifyStripeSignature(payload, sig, WEBHOOK_SECRET))) return new Response("invalid signature", { status: 400 });

  let event: any;
  try { event = JSON.parse(payload); } catch { return new Response("bad payload", { status: 400 }); }

  const type = event?.type ?? "";
  const session = event?.data?.object ?? {};
  const sessionId = session?.id;

  if (type === "checkout.session.completed" || type === "checkout.session.async_payment_succeeded") {
    // completed with a delayed payment method (e.g. bank debit) is not paid yet — wait for async_payment_succeeded
    if (type === "checkout.session.completed" && session.payment_status && session.payment_status !== "paid") {
      return new Response(JSON.stringify({ received: true, waiting: "async_payment" }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    const { row, newlyPaid, ceOnly } = await finalizePaidSession(session);
    if (row && newlyPaid) await notifyRegistration(row, ceOnly ? "ce" : "paid");
  } else if (type === "invoice.paid" || type === "invoice.payment_succeeded") {
    // Every invoice is membership dues: event tickets are one-time payments and never produce an invoice.
    const r = await recordMembershipInvoice(session);
    if (r.recorded) await notifyMembership(r, "renewed");
  } else if (type === "charge.succeeded" && isMembershipCharge(session)) {
    // The old store platform bills yearly memberships as plain charges ("Subscription payment placed on store …"), not Stripe invoices.
    const r = await recordMembershipInvoice(session, "charge");
    if (r.recorded) await notifyMembership(r, "renewed");
  } else if (type === "invoice.payment_failed") {
    await notifyMembership({ recorded: false, person: null, email: session.customer_email ?? null, amountCents: Number(session.amount_due ?? 0), periodEnd: null, newExpiry: null }, "failed");
  } else if (type === "customer.subscription.deleted") {
    await notifyMembership({ recorded: false, person: null, email: session.customer_email ?? null, amountCents: Number(session.items?.data?.[0]?.price?.unit_amount ?? 0), periodEnd: null, newExpiry: null }, "cancelled");
  } else if (type === "checkout.session.expired") {
    await sbFetch(
      `/rest/v1/event_registrations?stripe_checkout_session_id=eq.${encodeURIComponent(sessionId)}&payment_status=eq.pending&or=(source.is.null,source.neq.door)`, // a door walk-up is already seated; an abandoned pay page must not cancel them
      { method: "PATCH", body: JSON.stringify({ payment_status: "cancelled", registration_status: "cancelled", updated_at: new Date().toISOString() }) },
    );
  } else if (type === "charge.refunded" || type === "checkout.session.async_payment_failed") {
    const pi = session.payment_intent ?? session.id;
    const refunded = type === "charge.refunded";
    const fully = refunded && session.refunded === true; // partial refunds keep the seat
    await sbFetch(
      `/rest/v1/event_registrations?stripe_payment_intent_id=eq.${encodeURIComponent(pi)}`,
      { method: "PATCH", body: JSON.stringify({ payment_status: refunded ? (fully ? "refunded" : "partially_refunded") : "failed", ...(fully ? { registration_status: "cancelled" } : {}), updated_at: new Date().toISOString() }) },
    );
  }

  return new Response(JSON.stringify({ received: true }), { status: 200, headers: { "Content-Type": "application/json" } });
});
