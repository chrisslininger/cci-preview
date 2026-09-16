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

type SessionState = {
  token: string | null
  refresh: string | null
  /** Epoch ms at which `token` stops being accepted. */
  expires: number
  user: SupabaseUser | null
}

export const session: SessionState = { token: null, refresh: null, expires: 0, user: null }

const STORAGE_KEY = 'aoi.session'

/* Supabase access tokens last an hour. Without the refresh token the member
 * area simply stopped working after that — every call came back unauthorised
 * and the shell read it as "signed out", which is what made sign-in feel
 * unreliable. We keep the refresh token and renew before expiry. */
const RENEW_MARGIN_MS = 60_000

/** True while the page is a password-recovery landing. */
export let recoveryMode = false

function store(): Storage | null {
  try {
    // localStorage so the session survives closing the tab. sessionStorage
    // signed people out every time they closed the window, which read as a bug.
    return window.localStorage
  } catch {
    return null
  }
}

function persist(): void {
  const s = store()
  if (!s) return
  try {
    s.setItem(
      STORAGE_KEY,
      JSON.stringify({
        token: session.token,
        refresh: session.refresh,
        expires: session.expires,
        user: session.user,
      }),
    )
  } catch {
    /* quota or private mode — the session simply will not survive a reload */
  }
}

function adopt(payload: {
  access_token?: string
  refresh_token?: string
  expires_in?: number | string
  user?: SupabaseUser
}): void {
  session.token = payload.access_token ?? null
  session.refresh = payload.refresh_token ?? null
  session.expires = Date.now() + (Number(payload.expires_in) || 3600) * 1000
  if (payload.user) session.user = payload.user
  persist()
}

/** Restores a session across reloads, and adopts one from a link in the hash. */
export function initSession(): void {
  if (typeof window === 'undefined') return

  const hash = window.location.hash
  if (hash.includes('access_token=')) {
    const params = new URLSearchParams(hash.slice(1))
    adopt({
      access_token: params.get('access_token') ?? undefined,
      refresh_token: params.get('refresh_token') ?? undefined,
      expires_in: params.get('expires_in') ?? undefined,
    })
    // A recovery link lands here too. The account page reads this to show the
    // "choose a new password" card instead of the signed-in shell.
    recoveryMode = params.get('type') === 'recovery'
    window.history.replaceState(
      {},
      '',
      window.location.pathname + window.location.search + (recoveryMode ? '#new-password' : ''),
    )
    return
  }

  // An expired or already-used link comes back as an error in the hash rather
  // than as a token. Surfacing it beats silently doing nothing.
  if (hash.includes('error_description=')) {
    const params = new URLSearchParams(hash.slice(1))
    linkError = (params.get('error_description') ?? 'That link is no longer valid.').replace(/\+/g, ' ')
    window.history.replaceState({}, '', window.location.pathname + window.location.search)
  }

  const s = store()
  if (!s) return
  try {
    const raw = s.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as SessionState
    session.token = parsed.token
    session.refresh = parsed.refresh
    session.expires = parsed.expires ?? 0
    session.user = parsed.user
  } catch {
    /* unreadable — start signed out */
  }
}

/** Set when a magic or recovery link could not be used. */
export let linkError: string | null = null
export function clearLinkError(): void {
  linkError = null
}

let renewing: Promise<void> | null = null

/** Renews the access token when it is close to expiring. Every data call awaits
 *  this, so a long session stays signed in instead of quietly going dead. */
export async function ensureSession(): Promise<void> {
  if (!session.token || !session.refresh) return
  if (Date.now() < session.expires - RENEW_MARGIN_MS) return
  if (renewing) return renewing

  renewing = (async () => {
    try {
      const res = await fetch(`${SB_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: { apikey: SB_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: session.refresh }),
      })
      if (!res.ok) {
        // The refresh token is spent or revoked. Clearing is correct: it sends
        // the visitor to a sign-in card rather than an endlessly failing page.
        signOut()
        return
      }
      adopt(await res.json())
    } catch {
      /* offline — keep what we have and try again on the next call */
    } finally {
      renewing = null
    }
  })()

  return renewing
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
  adopt(data)
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

/** Starts a password reset. Supabase emails a one-time link; the new password
 *  is chosen on our own page and sent straight to Supabase. Nothing about a
 *  password is ever stored or logged by this site. */
export async function requestPasswordReset(email: string, redirect: string): Promise<void> {
  const res = await fetch(`${SB_URL}/auth/v1/recover`, {
    method: 'POST',
    headers: { apikey: SB_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, options: { email_redirect_to: redirect } }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error_description || data.msg || 'Could not start the reset')
  }
}

/** Sets a new password for whoever the current token belongs to — either a
 *  signed-in member changing it, or someone arriving from a recovery link. */
export async function updatePassword(password: string): Promise<void> {
  await ensureSession()
  const res = await fetch(`${SB_URL}/auth/v1/user`, {
    method: 'PUT',
    headers: headers(true),
    body: JSON.stringify({ password }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error_description || data.msg || data.message || 'Could not set the password')
  }
  recoveryMode = false
}

export function signOut(): void {
  session.token = null
  session.refresh = null
  session.expires = 0
  session.user = null
  recoveryMode = false
  try {
    store()?.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export async function select<T = unknown>(
  table: string,
  params: string,
): Promise<{ data: T[] | null; error?: string }> {
  await ensureSession()
  const res = await fetch(`${SB_URL}/rest/v1/${table}?${params}`, { headers: headers() })
  if (!res.ok) return { data: null, error: await res.text() }
  return { data: (await res.json()) as T[] }
}

export async function patch(
  table: string,
  params: string,
  body: Record<string, unknown>,
): Promise<{ ok?: true; error?: string }> {
  await ensureSession()
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
  await ensureSession()
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
  await ensureSession()
  const res = await fetch(`${SB_URL}/rest/v1/${table}?${params}`, {
    method: 'DELETE',
    headers: headers(),
  })
  return res.ok ? { ok: true } : { error: await res.text() }
}

export async function rpc<T = unknown>(name: string): Promise<T | null> {
  await ensureSession()
  const res = await fetch(`${SB_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: headers(true),
    body: '{}',
  })
  if (!res.ok) return null
  return (await res.json()) as T
}

export async function getUser(): Promise<SupabaseUser | null> {
  await ensureSession()
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
  await ensureSession()
  const res = await fetch(`${SB_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers() },
    body: JSON.stringify(body),
  })
  return (await res.json()) as T
}

/** Row count without transferring rows. Uses PostgREST's Content-Range header. */
export async function count(table: string, params = ''): Promise<number> {
  await ensureSession()
  const res = await fetch(`${SB_URL}/rest/v1/${table}?select=*&limit=1${params ? `&${params}` : ''}`, {
    headers: { ...headers(), Prefer: 'count=exact' },
  })
  if (!res.ok) return 0
  const range = res.headers.get('content-range') ?? ''
  const total = range.split('/')[1]
  const n = Number(total)
  return Number.isFinite(n) ? n : 0
}
