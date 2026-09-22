/** Design harness for EventsPanel. Stubs the REST layer with real-shaped rows. Not shipped. */
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from '@/lib/router'
import { AccessContext } from '@/lib/queries/AccessProvider'
import { ToastProvider } from '@/components/ui/Toast'
import EventsPanel from '@/components/member/EventsPanel'
import type { Access } from '@/lib/access'

const ACCESS = (window as unknown as { __ACCESS: Access }).__ACCESS
const FIX = (window as unknown as { __FIX: Record<string, unknown[]> }).__FIX
const real = window.fetch.bind(window)
window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input)
  if (!url.includes('/rest/v1/')) return real(input, init)
  const table = (url.split('/rest/v1/')[1] ?? '').split('?')[0]
  if (table.startsWith('rpc/')) {
    const name = table.slice(4)
    if (name === 'can_manage_rsvps') return new Response('true', { status: 200, headers: { 'content-type': 'application/json' } })
    if (name === 'event_rsvp_candidates') return new Response(JSON.stringify(FIX.rsvp_candidates ?? []), { status: 200, headers: { 'content-type': 'application/json' } })
    if (name === 'event_manual_rsvp') { const b = JSON.parse(String(init?.body)); const c = (FIX.rsvp_candidates ?? []).find((x) => (x as { person_id: string }).person_id === b.p_person_id) as Record<string, unknown> | undefined; FIX.rsvp_candidates = (FIX.rsvp_candidates ?? []).filter((x) => x !== c); FIX.event_registrations = [...(FIX.event_registrations ?? []), { id: 'r' + Date.now(), event_id: b.p_event_id, full_name: c?.full_name, email: c?.email, phone: c?.phone, reg_type: 'member', is_member_at_registration: true, price_paid_cents: 0, payment_status: 'free', registration_status: 'registered', ce_credits: false, source: 'manual_rsvp', notes: 'RSVP confirmed by Chris Slininger on Sep 22, 2026', created_at: new Date().toISOString(), checked_in_at: null }]; return new Response('"ok"', { status: 200, headers: { 'content-type': 'application/json' } }) }
    return new Response('null', { status: 200, headers: { 'content-type': 'application/json' } })
  }
  if (init?.method === 'POST' && table === 'events') { const body = JSON.parse(String(init.body)); const row = { ...body, id: 99, venue: null, event_speakers: [], event_sessions: [], event_registrations: [] }; FIX.events = [...(FIX.events ?? []), row]; return new Response(JSON.stringify([{ id: 99 }]), { status: 201, headers: { 'content-type': 'application/json' } }) }
  if (init?.method === 'PATCH' && table === 'events') { const body = JSON.parse(String(init.body)); const id = Number(url.match(/id=eq\.(\d+)/)?.[1]); FIX.events = (FIX.events ?? []).map((r) => ((r as { id: number }).id === id ? { ...(r as object), ...body } : r)); return new Response(null, { status: 204 }) }
  if (init?.method === 'DELETE' && table === 'events') { const id = Number(url.match(/id=eq\.(\d+)/)?.[1]); FIX.events = (FIX.events ?? []).filter((r) => (r as { id: number }).id !== id); return new Response(null, { status: 204 }) }
  if (init?.method && init.method !== 'GET') return new Response(null, { status: 204 })
  const rows = FIX[table] ?? []
  return new Response(JSON.stringify(rows), { status: 200, headers: { 'content-type': 'application/json' } })
}) as typeof window.fetch
const state = { access: ACCESS, loading: false, signedIn: true, can: (c: string) => ACCESS.capabilities.includes(c as never), refresh: async () => {} }
createRoot(document.getElementById('root')!).render(
  <BrowserRouter><ToastProvider><AccessContext.Provider value={state as never}>
    <main className="ma-main" style={{ maxWidth: 1180, margin: '0 auto' }}><EventsPanel /></main>
  </AccessContext.Provider></ToastProvider></BrowserRouter>)
