/* ----------------------------------------------------------------------------
 * Access context.
 *
 * Calls `get_my_access()` once after sign-in and hands the result to the whole
 * member area. Components never read a role — they ask `can('manage_seminars')`.
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
}

/** Exported for the build-time preview harness only; the app uses the provider. */
export const AccessContext = createContext<AccessState>({
  access: NO_ACCESS,
  loading: false,
  signedIn: false,
  can: () => false,
  refresh: async () => {},
})

export function useAccess() {
  return useContext(AccessContext)
}

export function AccessProvider({ children }: { children: ReactNode }) {
  const [access, setAccess] = useState<Access>(NO_ACCESS)
  const [loading, setLoading] = useState(Boolean(session.token))
  const [signedIn, setSignedIn] = useState(Boolean(session.token))

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

  const can = useCallback(
    (capability: Capability) => access.capabilities.includes(capability),
    [access],
  )

  const value = useMemo<AccessState>(
    () => ({ access, loading, signedIn, can, refresh }),
    [access, loading, signedIn, can, refresh],
  )

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>
}
