/* ----------------------------------------------------------------------------
 * Access context.
 *
 * Calls `get_my_access()` once after sign-in and hands the result to the whole
 * member area. Components never read a role — they ask `can('manage_seminars')`.
 *
 * "View as a member" swaps in a member's access — no offices, no committees —
 * so a Director can see the site the way an ordinary member does. It only ever
 * removes: the database still answers with the person's real permissions.
 * -------------------------------------------------------------------------- */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { rpc, session, isRecovery } from '@/lib/supabase'
import { NO_ACCESS } from '@/lib/access'
import type { Access, Capability } from '@/lib/access'

type AccessState = {
  access: Access
  loading: boolean
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
  signedIn: false,
  can: () => false,
  refresh: async () => {},
  canViewAsMember: false,
  viewingAsMember: false,
  setViewingAsMember: () => {},
})

const VIEW_KEY = 'aoi-view-as-member'

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
  const [signedIn, setSignedIn] = useState(Boolean(session.token))
  // Kept for this browser tab only, so it survives moving between pages but never sticks.
  const [viewingAsMember, setViewing] = useState(() => {
    try { return typeof window !== 'undefined' && sessionStorage.getItem(VIEW_KEY) === '1' } catch { return false }
  })
  const setViewingAsMember = useCallback((on: boolean) => {
    setViewing(on)
    try { if (on) sessionStorage.setItem(VIEW_KEY, '1'); else sessionStorage.removeItem(VIEW_KEY) } catch { /* private window */ }
  }, [])

  const refresh = useCallback(async () => {
    // A recovery token is a real session, but the person has not chosen a
    // password yet. Reporting "signed out" keeps the header on Member Login
    // and the shell closed until the reset page finishes the job.
    if (!session.token || isRecovery()) {
      setAccess(NO_ACCESS)
      setSignedIn(false)
      setLoading(false)
      return
    }
    setLoading(true)
    const result = await rpc<Access>('get_my_access')
    // A failed call must not look like "no permissions" — it looks like signed
    // out, which is the safe reading and prompts a fresh sign-in.
    setAccess(result ?? NO_ACCESS)
    setSignedIn(Boolean(result))
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
    () => ({ access: shown, loading, signedIn, can, refresh, canViewAsMember, viewingAsMember: viewing, setViewingAsMember }),
    [shown, loading, signedIn, can, refresh, canViewAsMember, viewing, setViewingAsMember],
  )

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>
}
