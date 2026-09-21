// CCI Website — confirm-checkout (v1)
// The visitor lands on /registration-confirmed?session_id=… after paying.
// This asks Stripe directly whether that session is paid and, if so, records
// the registration through the same finalizer the webhook uses. It is the
// belt to the webhook's braces: a misconfigured webhook secret, a Stripe
// delivery delay, or a webhook that arrives later all still end with the
// sale recorded once and the Institute told once.
// Returns what the confirmation page shows. Never exposes another
// registrant's data: only the session id the visitor came back with is
// looked up, and only summary fields are returned.
// Requires env: STRIPE_SECRET_KEY.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { finalizePaidSession, notifyRegistration, eventFor } from "./finalize.ts";

const STRIPE_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });
  let body: any;
  try { body = await req.json(); } catch { return json(400, { error: "invalid_json" }); }
  const sessionId = String(body?.session_id ?? "").trim();
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) return json(400, { error: "invalid_session" });
  if (!STRIPE_KEY) return json(503, { error: "payments_not_configured" });

  const r = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, { headers: { Authorization: `Bearer ${STRIPE_KEY}` } });
  const session = await r.json();
  if (!r.ok) return json(404, { error: "session_not_found" });

  const paid = session.payment_status === "paid";
  if (!paid) {
    return json(200, { status: session.status === "expired" ? "expired" : "pending", event_id: Number(session.metadata?.event_id ?? 0) || null });
  }
  const { row, newlyPaid } = await finalizePaidSession(session);
  if (row && newlyPaid) await notifyRegistration(row, "paid");
  const ev = row ? await eventFor(Number(row.event_id)) : null;
  return json(200, {
    status: "paid",
    recorded: !!row,
    event_title: ev?.title ?? null,
    starts_at: ev?.starts_at ?? null,
    reg_type: row?.reg_type ?? session.metadata?.reg_type ?? "doctor",
    amount_cents: session.amount_total ?? null,
    email: session.customer_details?.email ?? session.metadata?.email ?? null,
    needs_verification: row?.verification_status === "pending",
  });
});
