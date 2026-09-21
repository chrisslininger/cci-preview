/** Design harness for ResearchPanel. Stubs the REST layer with real-shaped rows. Not shipped. */
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from '@/lib/router'
import { AccessContext } from '@/lib/queries/AccessProvider'
import { ToastProvider } from '@/components/ui/Toast'
import ResearchPanel from "@/components/member/ResearchPanel"

import type { Access } from '@/lib/access'

type Row = Record<string, unknown>
const ACCESS = (window as unknown as { __ACCESS: Access }).__ACCESS
const FIX = (window as unknown as { __FIX: Record<string, Row[]> }).__FIX
const real = window.fetch.bind(window)
let nextId = 1000
const byId = (t: string, id: unknown) => (FIX[t] ?? []).find((r) => String(r.id) === String(id)) ?? null
function embeds(table: string, r: Row): Row {
  if (table === 'preceptors') return { ...r, people: byId('people', r.person_id), preceptor_sites: (FIX.preceptor_sites ?? []).filter((s) => s.preceptor_id === r.id).map((s) => ({ location_id: s.location_id })), preceptor_colleges: (FIX.preceptor_colleges ?? []).filter((a) => a.preceptor_id === r.id) }
  if (table === 'interns' || table === 'instructor_records') return { ...r, people: byId('people', r.person_id) }
  if (table === 'research_projects') return { ...r, research_team: (FIX.research_team ?? []).filter((m) => m.project_id === r.id).map((m) => ({ ...m, people: m.person_id ? byId('people', m.person_id) : null })), research_ledger: (FIX.research_ledger ?? []).filter((e) => e.project_id === r.id) }
  if (table === 'research_team') return { ...r, people: r.person_id ? byId('people', r.person_id) : null, research_projects: byId('research_projects', r.project_id) }
  if (table === 'preceptor_colleges') return { ...r, preceptors: byId('preceptors', r.preceptor_id), locations: byId('locations', r.location_id) }
  if (table === 'college_contacts') return { ...r, people: r.person_id ? byId('people', r.person_id) : null }
  return r
}
function filter(table: string, url: string, rows: Row[]): Row[] {
  const qs = new URLSearchParams(url.split('?')[1] ?? '')
  let out = rows
  for (const [k, v] of qs.entries()) {
    const m = v.match(/^(eq|neq)\.(.*)$/)
    if (m && k !== 'select' && k !== 'order' && k !== 'limit' && k !== 'or') out = out.filter((r) => (m[1] === 'eq') === (String(r[k]) === m[2]))
    if (k === 'or' && table === 'people') { const t = (v.match(/ilike\.\*([^*]+)\*/)?.[1] ?? '').toLowerCase(); if (t) out = out.filter((r) => `${r.first_name} ${r.last_name} ${r.practice_name ?? ''}`.toLowerCase().includes(t)); const sid = v.match(/school_id\.eq\.(\d+)/)?.[1]; if (sid) out = out.filter((r) => String(r.school_id) === sid || r.school === decodeURIComponent(v.match(/school\.eq\.([^)]+)/)?.[1] ?? '')) }
  }
  return out
}
window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input)
  if (url.includes('/storage/v1/')) return new Response(JSON.stringify({ signedURL: '/object/sign/x' }), { status: 200, headers: { 'content-type': 'application/json' } })
  if (!url.includes('/rest/v1/')) return real(input, init)
  const table = (url.split('/rest/v1/')[1] ?? '').split('?')[0]
  const method = init?.method ?? 'GET'
  const ret = String((init?.headers as Record<string, string> | undefined)?.Prefer ?? '').includes('representation')
  if (method === 'POST') {
    const body = JSON.parse(String(init?.body)) as Row[]
    const added = body.map((b) => ({ ...b, id: b.id ?? nextId++ }))
    if (url.includes('on_conflict')) { FIX[table] = [...(FIX[table] ?? []).filter((r) => !added.some((a) => a.person_id === r.person_id && a.requirement_id === r.requirement_id)), ...added] }
    else FIX[table] = [...(FIX[table] ?? []), ...added]
    return new Response(ret ? JSON.stringify(added.map((a) => embeds(table, a))) : null, { status: 201, headers: { 'content-type': 'application/json' } })
  }
  if (method === 'PATCH') { const body = JSON.parse(String(init?.body)) as Row; const id = url.match(/id=eq\.([^&]+)/)?.[1]; FIX[table] = (FIX[table] ?? []).map((r) => (String(r.id) === String(id) ? { ...r, ...body } : r)); return new Response(null, { status: 204 }) }
  if (method === 'DELETE') { const before = FIX[table] ?? []; FIX[table] = filter(table, url, before).length ? before.filter((r) => !filter(table, url, [r]).length) : before; return new Response(null, { status: 204 }) }
  const rows = filter(table, url, FIX[table] ?? []).map((r) => embeds(table, r))
  return new Response(JSON.stringify(rows), { status: 200, headers: { 'content-type': 'application/json' } })
}) as typeof window.fetch
const state = { access: ACCESS, loading: false, signedIn: true, can: (c: string) => ACCESS.capabilities.includes(c as never), refresh: async () => {} }
const which = <ResearchPanel />
createRoot(document.getElementById('root')!).render(
  <BrowserRouter><ToastProvider><AccessContext.Provider value={state as never}>
    <main className="ma-main" style={{ maxWidth: 1180, margin: '0 auto' }}>{which}</main>
  </AccessContext.Provider></ToastProvider></BrowserRouter>)
