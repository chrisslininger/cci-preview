/** Design harness for BoardPanel. Stubs the REST layer with real-shaped rows. Not shipped. */
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from '@/lib/router'
import { AccessContext } from '@/lib/queries/AccessProvider'
import { ToastProvider } from '@/components/ui/Toast'
import BoardPanel from '@/components/member/BoardPanel'
import type { Access } from '@/lib/access'

const ACCESS = (window as unknown as { __ACCESS: Access }).__ACCESS
const FIX = (window as unknown as { __FIX: Record<string, unknown[]> }).__FIX
const real = window.fetch.bind(window)
window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input)
  if (!url.includes('/rest/v1/')) return real(input, init)
  const table = (url.split('/rest/v1/')[1] ?? '').split('?')[0]
  if (init?.method === 'POST' && table === 'board_service') { const body = JSON.parse(String(init.body)); const row = { ...body, id: 'new-1', person_certifications: [], instructor_records: [], board_service: [], person_roles: [], contact_notes: [], practice_locations: [] }; FIX.board_service = [...(FIX.board_service ?? []), row]; return new Response(JSON.stringify([{ id: 'new-1' }]), { status: 201, headers: { 'content-type': 'application/json' } }) }
  if (init?.method === 'PATCH' && table === 'board_service') { const body = JSON.parse(String(init.body)); const id = String(url.match(/id=eq\.([^&]+)/)?.[1]); FIX.board_service = (FIX.board_service ?? []).map((r) => (String((r as { id: number }).id) === id ? { ...(r as object), ...body } : r)); return new Response(null, { status: 204 }) }
  if (init?.method === 'DELETE' && table === 'board_service') { const id = String(url.match(/id=eq\.([^&]+)/)?.[1]); FIX.board_service = (FIX.board_service ?? []).filter((r) => String((r as { id: number }).id) !== id); return new Response(null, { status: 204 }) }
  if (init?.method && init.method !== 'GET') return new Response(null, { status: 204 })
  const rows = FIX[table] ?? []
  return new Response(JSON.stringify(rows), { status: 200, headers: { 'content-type': 'application/json' } })
}) as typeof window.fetch
const state = { access: ACCESS, loading: false, signedIn: true, can: (c: string) => ACCESS.capabilities.includes(c as never), refresh: async () => {} }
createRoot(document.getElementById('root')!).render(
  <BrowserRouter><ToastProvider><AccessContext.Provider value={state as never}>
    <main className="ma-main" style={{ maxWidth: 1180, margin: '0 auto' }}><BoardPanel /></main>
  </AccessContext.Provider></ToastProvider></BrowserRouter>)
