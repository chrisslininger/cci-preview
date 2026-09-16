/* ----------------------------------------------------------------------------
 * Minimal Supabase client for the public site.
 *
 * The browser only ever holds the publishable key. Everything that needs the
 * service role — pricing, registration writes, contact submissions — runs in an
 * Edge Function. Ported from the v4.8 build with the same endpoints and the
 * same session handling, so the checkout path that has already taken real money
 * is unchanged.
 * -------------------------------------------------------------------------- */

export const SB_URL = 'https://hwbvbqmunjhkpefubfhq.supabase.co'
export const SB_KEY = 'sb_publishable_2FqwETbdoEJqlDuhP00E-w_aNlt1Ny5'

export type SupabaseUser = { id: string; email?: string }

type SessionState = { token: string | null; user: SupabaseUser | null }

export const session: SessionState = { token: null, user: null }

const STORAGE_KEY = 'aoi.session'

/** Restores a session across reloads, and adopts one from a magic-link hash. */
export function initSession(): void {
  if (typeof window === 'undefined') return

  if (window.location.hash.includes('access_token=')) {
    const match = window.location.hash.match(/access_token=([^&]+)/)
    if (match?.[1]) {
      session.token = decodeURIComponent(match[1])
      persist()
      window.history.replaceState({}, '', window.location.pathname + window.location.search)
      return
    }
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as SessionState
      session.token = parsed.token
      session.user = parsed.user
    }
  } catch {
    /* storage unavailable — sign-in simply will not persist */
  }
}

function persist(): void {
  try {
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ token: session.token, user: session.user }),
    )
  } catch {
    /* ignore */
  }
}

export function headers(json = false): Record<string, string> {
  const h: Record<string, string> = {
    apikey: SB_KEY,
    Authorization: `Bearer ${session.token ?? SB_KEY}`,
  }
  if (json) h['Content-Type'] = 'application/json'
  return h
}

export async function signIn(email: string, password: string): Promise<SupabaseUser> {
  const res = await fetch(`${SB_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: SB_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error_description || data.msg || data.message || 'Sign-in failed')
  }
  session.token = data.access_token
  session.user = data.user
  persist()
  return data.user
}

export async function sendMagicLink(email: string, redirect: string): Promise<void> {
  const res = await fetch(`${SB_URL}/auth/v1/otp`, {
    method: 'POST',
    headers: { apikey: SB_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      create_user: false,
      options: { email_redirect_to: redirect },
    }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error_description || data.msg || 'Could not send link')
  }
}

export function signOut(): void {
  session.token = null
  session.user = null
  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export async function select<T = unknown>(
  table: string,
  params: string,
): Promise<{ data: T[] | null; error?: string }> {
  const res = await fetch(`${SB_URL}/rest/v1/${table}?${params}`, { headers: headers() })
  if (!res.ok) return { data: null, error: await res.text() }
  return { data: (await res.json()) as T[] }
}

export async function patch(
  table: string,
  params: string,
  body: Record<string, unknown>,
): Promise<{ ok?: true; error?: string }> {
  const res = await fetch(`${SB_URL}/rest/v1/${table}?${params}`, {
    method: 'PATCH',
    headers: headers(true),
    body: JSON.stringify(body),
  })
  return res.ok ? { ok: true } : { error: await res.text() }
}

export async function insert(
  table: string,
  rows: Record<string, unknown>[],
): Promise<{ ok?: true; error?: string }> {
  if (rows.length === 0) return { ok: true }
  const res = await fetch(`${SB_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...headers(true), Prefer: 'return=minimal' },
    body: JSON.stringify(rows),
  })
  return res.ok ? { ok: true } : { error: await res.text() }
}

export async function remove(
  table: string,
  params: string,
): Promise<{ ok?: true; error?: string }> {
  const res = await fetch(`${SB_URL}/rest/v1/${table}?${params}`, {
    method: 'DELETE',
    headers: headers(),
  })
  return res.ok ? { ok: true } : { error: await res.text() }
}

export async function rpc<T = unknown>(name: string): Promise<T | null> {
  const res = await fetch(`${SB_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: headers(true),
    body: '{}',
  })
  if (!res.ok) return null
  return (await res.json()) as T
}

export async function getUser(): Promise<SupabaseUser | null> {
  if (!session.token) return null
  if (session.user) return session.user
  const res = await fetch(`${SB_URL}/auth/v1/user`, { headers: headers() })
  if (!res.ok) return null
  session.user = await res.json()
  persist()
  return session.user
}

/** POSTs to an Edge Function with whatever credentials the visitor has. */
export async function invoke<T = unknown>(
  name: string,
  body: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(`${SB_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers() },
    body: JSON.stringify(body),
  })
  return (await res.json()) as T
}
