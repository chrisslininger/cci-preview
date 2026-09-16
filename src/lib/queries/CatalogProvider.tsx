/* ----------------------------------------------------------------------------
 * Live catalog context.
 *
 * Components never call Supabase directly — they read this. Fetching happens
 * once per page load, after hydration, so the prerendered HTML is what a
 * crawler sees and the live overlay is what a visitor sees.
 * -------------------------------------------------------------------------- */
import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { fetchCatalog } from './events'
import type { EventCatalog } from './events'

const EMPTY: EventCatalog = { synced: false, byKey: {} }

const CatalogContext = createContext<EventCatalog>(EMPTY)

export function useCatalog() {
  return useContext(CatalogContext)
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<EventCatalog>(EMPTY)

  useEffect(() => {
    let cancelled = false
    void fetchCatalog().then((next) => {
      if (!cancelled) setCatalog(next)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return <CatalogContext.Provider value={catalog}>{children}</CatalogContext.Provider>
}
