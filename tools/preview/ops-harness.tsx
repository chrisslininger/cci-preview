/** Design harness for the operations tabs (Tasks, Reports, Calendar, Stats, Records). Stubs the REST layer with real-shaped rows. Not shipped. */
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from '@/lib/router'
import { AccessContext } from '@/lib/queries/AccessProvider'
import { ToastProvider } from '@/components/ui/Toast'
import TasksPanel from '@/components/member/TasksPanel'
import ReportsPanel from '@/components/member/ReportsPanel'
import CalendarPanel from '@/components/member/CalendarPanel'
import StatsPanel from '@/components/member/StatsPanel'
import RecordsPanel from '@/components/member/RecordsPanel'
import ControlPanel from '@/components/member/ControlPanel'
import type { Access } from '@/lib/access'

type Row = Record<string, unknown>
const ACCESS = (window as unknown as { __ACCESS: Access }).__ACCESS
const FIX = (window as unknown as { __FIX: Record<string, Row[]> }).__FIX
const RPC = (window as unknown as { __RPC: Record<string, unknown> }).__RPC
const real = window.fetch.bind(window)
let nextId = 1000
const byId = (t: string, id: unknown) => (FIX[t] ?? []).find((r) => String(r.id) === String(id)) ?? null
function embeds(table: string, r: Row): Row {
  if (table === 'committee_reports') return { ...r, committee_report_metrics: (FIX.committee_report_metrics ?? []).filter((m) => m.report_id === r.id), committees: byId('committees', r.committee_id) }
  if (table === 'tasks') return { ...r, committees: r.committee_id ? byId('committees', r.committee_id) : null }
  if (table === 'person_roles') return { ...r, people: byId('people', r.person_id) }
  return r
}
function filter(table: string, url: string, rows: Row[]): Row[] {
  const qs = new URLSearchParams(url.split('?')[1] ?? '')
  let out = rows
  for (const [k, v] of qs.entries()) {
    if (['select', 'order', 'limit', 'or'].includes(k)) continue
    const m = v.match(/^(eq|neq|gt|gte|lt|lte|in|is|not\.is)\.(.*)$/)
    if (!m) continue
    const op = m[1]!, val = m[2]!
    out = out.filter((r) => {
      const x = r[k]
      if (op === 'eq') return String(x) === val
      if (op === 'neq') return String(x) !== val
      if (op === 'is') return val === 'null' ? x == null : String(x) === val
      if (op === 'not.is') return val === 'null' ? x != null : String(x) !== val
      if (op === 'in') return val.replace(/^\(|\)$/g, '').split(',').includes(String(x))
      if (op === 'gt') return String(x) > decodeURIComponent(val)
      if (op === 'gte') return String(x) >= decodeURIComponent(val)
      if (op === 'lt') return String(x) < decodeURIComponent(val)
      if (op === 'lte') return String(x) <= decodeURIComponent(val)
      return true
    })
  }
  const order = qs.get('order')
  if (order) { const [col, dir] = order.split(',')[0]!.split('.'); out = [...out].sort((a, b) => String(a[col!] ?? '').localeCompare(String(b[col!] ?? '')) * (dir === 'desc' ? -1 : 1)) }
  return out
}
window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input)
  if (url.includes('/storage/v1/object/sign/')) return new Response(JSON.stringify({ signedURL: '/object/sign/x' }), { status: 200, headers: { 'content-type': 'application/json' } })
  if (url.includes('/storage/v1/')) return new Response(JSON.stringify({ Key: 'x' }), { status: 200, headers: { 'content-type': 'application/json' } })
  if (url.includes('/rest/v1/rpc/')) {
    const name = url.split('/rest/v1/rpc/')[1]!.split('?')[0]!
    const args = init?.body ? JSON.parse(String(init.body)) as Row : {}
    if (name === 'log_activity') { FIX.activity_log = [...(FIX.activity_log ?? []), { id: nextId++, ...args }]; return new Response('null', { status: 200, headers: { 'content-type': 'application/json' } }) }
    if (name === 'snapshot_stats') { const period = String(args.p_period); if (!(FIX.stat_snapshots ?? []).some((s) => s.period === period)) FIX.stat_snapshots = [...(FIX.stat_snapshots ?? []), { id: nextId++, period, members_current: 23, members_total: 30, cert_level1: 50, cert_level2: 16, instructors: 11, created_at: new Date().toISOString() }]; return new Response('null', { status: 200, headers: { 'content-type': 'application/json' } }) }
    if (name === 'stats_list') return new Response(JSON.stringify((RPC.stats_list as Record<string, unknown>)[String(args.p_kind)] ?? []), { status: 200, headers: { 'content-type': 'application/json' } })
    if (name === 'report_autofill') return new Response(JSON.stringify((RPC.report_autofill as Record<string, unknown>)[String(args.p_key)] ?? { nums: {}, lists: {} }), { status: 200, headers: { 'content-type': 'application/json' } })
    return new Response(JSON.stringify(RPC[name] ?? null), { status: 200, headers: { 'content-type': 'application/json' } })
  }
  if (!url.includes('/rest/v1/')) return real(input, init)
  const table = (url.split('/rest/v1/')[1] ?? '').split('?')[0]!
  const method = init?.method ?? 'GET'
  const ret = String((init?.headers as Record<string, string> | undefined)?.Prefer ?? '').includes('representation')
  if (method === 'POST') {
    const body = JSON.parse(String(init?.body)) as Row[]
    const added = body.map((b) => ({ ...b, id: b.id ?? nextId++, created_at: b.created_at ?? new Date().toISOString() }))
    FIX[table] = [...(FIX[table] ?? []), ...added]
    return new Response(ret ? JSON.stringify(added.map((a) => embeds(table, a))) : null, { status: 201, headers: { 'content-type': 'application/json' } })
  }
  if (method === 'PATCH') { const body = JSON.parse(String(init?.body)) as Row; const hit = filter(table, url, FIX[table] ?? []); FIX[table] = (FIX[table] ?? []).map((r) => (hit.includes(r) ? { ...r, ...body } : r)); return new Response(ret ? JSON.stringify(hit.map((r) => ({ ...r, ...body }))) : null, { status: ret ? 200 : 204, headers: { 'content-type': 'application/json' } }) }
  if (method === 'DELETE') { const hit = filter(table, url, FIX[table] ?? []); FIX[table] = (FIX[table] ?? []).filter((r) => !hit.includes(r)); return new Response(null, { status: 204 }) }
  const rows = filter(table, url, FIX[table] ?? []).map((r) => embeds(table, r))
  return new Response(JSON.stringify(rows), { status: 200, headers: { 'content-type': 'application/json' } })
}) as typeof window.fetch
const state = { access: ACCESS, loading: false, signedIn: true, can: (c: string) => ACCESS.capabilities.includes(c as never), refresh: async () => {} }
const tab = (location.hash || '#tasks').slice(1)
const which = tab === 'reports' ? <ReportsPanel /> : tab === 'calendar' ? <CalendarPanel /> : tab === 'stats' ? <StatsPanel /> : tab === 'records' ? <RecordsPanel /> : tab === 'control' ? <ControlPanel /> : <TasksPanel />
createRoot(document.getElementById('root')!).render(
  <BrowserRouter><ToastProvider><AccessContext.Provider value={state as never}>
    <main className="ma-main" style={{ maxWidth: 1180, margin: '0 auto' }}>{which}</main>
  </AccessContext.Provider></ToastProvider></BrowserRouter>)
