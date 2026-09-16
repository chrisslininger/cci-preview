/**
 * Design harness for the Full CCI OS surface.
 *
 * Stubs the Supabase REST layer with the shapes the live database returns, so
 * the layout can be reviewed without a session. NOT shipped: nothing under
 * tools/ is imported by entry-client.
 */
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from '@/lib/router'
import { AccessContext } from '@/lib/queries/AccessProvider'
import { ToastProvider } from '@/components/ui/Toast'
import OperatingSystem from '@/components/member/OperatingSystem'
import type { Access } from '@/lib/access'

const ACCESS = (window as unknown as { __ACCESS: Access }).__ACCESS
const FIX = (window as unknown as { __FIX: Record<string, unknown> }).__FIX

const real = window.fetch.bind(window)
window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input)
  if (!url.includes('/rest/v1/')) return real(input, init)
  const path = url.split('/rest/v1/')[1] ?? ''
  const table = path.split('?')[0]
  const wantsCount = (init?.headers as Record<string, string>)?.Prefer === 'count=exact'
  const query = decodeURIComponent(path.split('?')[1] ?? '')
    .replace('select=*&limit=1', '')
    .replace(/^&|&$/g, '')
  if (wantsCount) {
    const counts = FIX.counts as Record<string, number>
    const key = query ? `${table}?${query}` : table
    return new Response('[]', { status: 200, headers: { 'content-range': `0-0/${counts[key] ?? 0}` } })
  }
  // Some tables are read more than once with different filters; key on the
  // distinguishing fragment when the fixture provides one.
  const variant = Object.keys(FIX).find((k) => k.startsWith(`${table}?`) && query.includes(k.split('?')[1]!))
  const rows = ((FIX[variant ?? table]) as unknown[]) ?? []
  return new Response(JSON.stringify(rows), {
    status: 200, headers: { 'content-type': 'application/json' },
  })
}) as typeof window.fetch

const state = {
  access: ACCESS, loading: false, signedIn: true,
  can: (c: string) => ACCESS.capabilities.includes(c as never),
  refresh: async () => {},
}

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <ToastProvider>
      <AccessContext.Provider value={state as never}>
        <main className="ma-main os-harness">
          <OperatingSystem />
        </main>
      </AccessContext.Provider>
    </ToastProvider>
  </BrowserRouter>,
)
