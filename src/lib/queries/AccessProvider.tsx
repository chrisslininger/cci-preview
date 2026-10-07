/* ----------------------------------------------------------------------------
 * Access context.
 *
 * Calls `get_my_access()` once after sign-in and hands the result to the whole
 * member area. Components never read a role — they ask `can('manage_seminars')`.
 *
 * "View as a member" swaps in a member's access — no offices, no committees —
 * so a Director can see the site the way an ordinary member does. It only ever
 * removes: the database still answers with the person's real permissions.
 *
 * A failed call is not "signed out". Only a 401 on a token that should still be
 * good means that; a blip — no answer, a timeout, a 5xx — keeps whatever access
 * was last read, so a member mid-session never sees the sign-in card because
 * Supabase hiccuped.
 * -------------------------------------------------------------------------- */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { rpcResult, session, signOut, isRecovery } from '@/lib/supabase'
import { NO_ACCESS } from '@/lib/access'
import type { Access, Capability } from '@/lib/access'

type AccessState = {
  access: Access
  /** A read of `get_my_access` is in flight. */
  loading: boolean
  /** Access has been read at least once this session — or there is no token, so
   *  there is nothing to read. Until this is true, role-dependent UI should show
   *  a placeholder rather than guess. */
  ready: boolean
  /** Signed in, but the Institute could not be reached and nothing has been
   *  read yet, so there is no last good access to show. */
  unavailable: boolean
  signedIn: boolean
  can: (capability: Capability) => boolean
  /** Re-read after a role change, so the rail updates without a reload. */
  refresh: () => Promise<void>
  /** True when this person holds anything beyond membership, so "view as a member" means something. */
  canViewAsMember: boolean
  viewingAsMember: boolean
  setViewingAsMember: (on: boolean) => void
}

/** Exported for the build-time preview harness only; the app uses the provider. */
export const AccessContext = createContext<AccessState>({
  access: NO_ACCESS,
  loading: false,
  ready: true,
  unavailable: false,
  signedIn: false,
  can: () => false,
  refresh: async () => {},
  canViewAsMember: false,
  viewingAsMember: false,
  setViewingAsMember: () => {},
})

const VIEW_KEY = 'aoi-view-as-member'

/* A blip gets a second and a third try before the page gives up on this read.
 * Short, so a member who is genuinely offline sees the notice within seconds. */
const RETRY_DELAYS_MS = [1500, 4000]

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/** The same person, as an ordinary member would be: membership only. */
function asMember(a: Access): Access {
  return { ...a, staff_role: null, tier: 'member', roles: [], committees: [], can_admin_roles: false, capabilities: ['account', 'member'] }
}

export function useAccess() {
  return useContext(AccessContext)
}

export function AccessProvider({ children }: { children: ReactNode }) {
  const [access, setAccess] = useState<Access>(NO_ACCESS)
  const [loading, setLoading] = useState(Boolean(session.token))
  const [ready, setReadyState] = useState(!session.token)
  const [unavailable, setUnavailable] = useState(false)
  const [signedIn, setSignedIn] = useState(Boolean(session.token))
  // Each refresh gets a number; a slow older read must not overwrite a newer one.
  const generation = useRef(0)
  // Mirrors `ready` so `refresh` can read it without changing identity.
  const readyRef = useRef(ready)
  const setReady = (on: boolean) => {
    readyRef.current = on
    setReadyState(on)
  }
  // Kept for this browser tab only, so it survives moving between pages but never sticks.
  const [viewingAsMember, setViewing] = useState(() => {
    try { return typeof window !== 'undefined' && sessionStorage.getItem(VIEW_KEY) === '1' } catch { return false }
  })
  const setViewingAsMember = useCallback((on: boolean) => {
    setViewing(on)
    try { if (on) sessionStorage.setItem(VIEW_KEY, '1'); else sessionStorage.removeItem(VIEW_KEY) } catch { /* private window */ }
  }, [])

  const refresh = useCallback(async () => {
    const mine = ++generation.current
    const current = () => generation.current === mine

    const signedOut = () => {
      setAccess(NO_ACCESS)
      setSignedIn(false)
      setUnavailable(false)
      setReady(true)
      setLoading(false)
    }

    // A recovery token is a real session, but the person has not chosen a
    // password yet. Reporting "signed out" keeps the header on Member Login
    // and the shell closed until the reset page finishes the job.
    if (!session.token || isRecovery()) {
      signedOut()
      return
    }
    setLoading(true)
    setSignedIn(true)

    let result = await rpcResult<Access>('get_my_access')
    for (const delay of RETRY_DELAYS_MS) {
      if (result.data || !result.transient || !current()) break
      await sleep(delay)
      if (!current()) return
      result = await rpcResult<Access>('get_my_access')
    }
    if (!current()) return

    // `ensureSession` found the refresh token spent and cleared the session.
    if (!session.token) {
      signedOut()
      return
    }

    if (result.data) {
      setAccess(result.data)
      setSignedIn(true)
      setUnavailable(false)
      setReady(true)
      setLoading(false)
      return
    }

    // A 401 on a token that should still be good is the real thing: the session
    // was revoked elsewhere, or the token is forged or malformed. Clear it so the
    // sign-in card is honest. A 401 on an already-expired token that could not be
    // renewed is a blip, handled below.
    if (result.status === 401 && Date.now() < session.expires) {
      signOut()
      signedOut()
      return
    }

    // Anything else — no answer, a timeout, a 5xx, a 401 after a failed renewal —
    // keeps the last good access. The token is still ours; the Institute was
    // simply not reachable. With nothing read yet there is nothing to keep, and
    // the page says so instead of showing a sign-in card or a guessed menu.
    setUnavailable(!readyRef.current)
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const canViewAsMember =
    access.roles.length > 0 || Boolean(access.staff_role) || access.can_admin_roles ||
    access.capabilities.some((c) => !['account', 'member', 'student'].includes(c))
  const viewing = viewingAsMember && canViewAsMember
  const shown = useMemo(() => (viewing ? asMember(access) : access), [viewing, access])

  const can = useCallback(
    (capability: Capability) => shown.capabilities.includes(capability),
    [shown],
  )

  const value = useMemo<AccessState>(
    () => ({ access: shown, loading, ready, unavailable, signedIn, can, refresh, canViewAsMember, viewingAsMember: viewing, setViewingAsMember }),
    [shown, loading, ready, unavailable, signedIn, can, refresh, canViewAsMember, viewing, setViewingAsMember],
  )

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>
}
