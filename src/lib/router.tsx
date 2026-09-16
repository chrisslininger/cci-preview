/* ----------------------------------------------------------------------------
 * Router.
 *
 * Deliberately written into the repo rather than pulled from the registry —
 * see ARCHITECTURE.md §"Deviations". It provides the slice of the React Router
 * API this site uses, against the real History API.
 *
 * The rule it exists to enforce: navigation is a real <a href>. Link renders an
 * anchor with a genuine href, so middle-click, copy-link, "open in new tab",
 * and every crawler get a real URL. The click handler is only an enhancement —
 * with JavaScript off, the anchor still works because every route is a real
 * static HTML file on disk.
 * -------------------------------------------------------------------------- */
import {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { AnchorHTMLAttributes, ReactElement, ReactNode } from 'react'

type LocationState = { pathname: string; search: string; hash: string; state: unknown }

type RouterValue = {
  location: LocationState
  navigate: (to: string, options?: { state?: unknown; replace?: boolean }) => void
  params: Record<string, string>
  setParams: (next: Record<string, string>) => void
  static: boolean
}

const RouterContext = createContext<RouterValue | null>(null)

function useRouter(): RouterValue {
  const ctx = useContext(RouterContext)
  if (!ctx) throw new Error('Router hooks must be used inside a Router')
  return ctx
}

export function useLocation(): LocationState {
  return useRouter().location
}

export function useParams(): Record<string, string> {
  return useRouter().params
}

export function useNavigate() {
  return useRouter().navigate
}

function parse(url: string): LocationState {
  const [pathAndSearch = '', hash = ''] = url.split('#')
  const [pathname = '/', search = ''] = pathAndSearch.split('?')
  return {
    pathname: pathname || '/',
    search: search ? `?${search}` : '',
    hash: hash ? `#${hash}` : '',
    state: null,
  }
}

/* ------------------------------------------------------------------ hosts */

export function BrowserRouter({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<LocationState>(() => ({
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
    state: window.history.state?.usr ?? null,
  }))
  const [params, setParams] = useState<Record<string, string>>({})

  useEffect(() => {
    const onPop = () => {
      setLocation({
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
        state: window.history.state?.usr ?? null,
      })
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = useCallback<RouterValue['navigate']>((to, options) => {
    const next = parse(to)
    next.state = options?.state ?? null
    const url = `${next.pathname}${next.search}${next.hash}`
    if (options?.replace) window.history.replaceState({ usr: next.state }, '', url)
    else window.history.pushState({ usr: next.state }, '', url)
    setLocation(next)
  }, [])

  const value = useMemo<RouterValue>(
    () => ({ location, navigate, params, setParams, static: false }),
    [location, navigate, params],
  )
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
}

/** Used by the build-time renderer; navigation is a no-op. */
export function StaticRouter({ location, children }: { location: string; children: ReactNode }) {
  const [params, setParams] = useState<Record<string, string>>({})
  const value = useMemo<RouterValue>(
    () => ({
      location: parse(location),
      navigate: () => {},
      params,
      setParams,
      static: true,
    }),
    [location, params],
  )
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
}

/* ------------------------------------------------------------------- Link */

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  to: string
  replace?: boolean
  state?: unknown
}

export function Link({ to, replace, state, onClick, children, ...rest }: LinkProps) {
  const { navigate, static: isStatic } = useContext(RouterContext) ?? {
    navigate: () => {},
    static: true,
  }
  const external = /^(https?:|mailto:|tel:)/.test(to)

  return (
    <a
      href={to}
      onClick={(event) => {
        onClick?.(event)
        if (external || isStatic) return
        // Let the browser handle anything that is not a plain left click.
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          rest.target
        ) {
          return
        }
        event.preventDefault()
        navigate(to, { replace, state })
      }}
      {...rest}
    >
      {children}
    </a>
  )
}

/* ----------------------------------------------------------------- Routes */

type RouteProps = { path: string; element: ReactElement }

export function Route(_props: RouteProps): ReactElement | null {
  return null
}

/** Matches a `/seminars/:slug` style pattern against a pathname. */
function match(pattern: string, pathname: string): Record<string, string> | null {
  if (pattern === '*') return {}
  const p = pattern.split('/').filter(Boolean)
  const a = pathname.split('/').filter(Boolean)
  if (p.length !== a.length) return null
  const params: Record<string, string> = {}
  for (let i = 0; i < p.length; i += 1) {
    const seg = p[i]!
    const val = a[i]!
    if (seg.startsWith(':')) params[seg.slice(1)] = decodeURIComponent(val)
    else if (seg !== val) return null
  }
  return params
}

export function Routes({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { pathname } = router.location

  const entries = Children.toArray(children).filter(
    (child): child is ReactElement<RouteProps> =>
      isValidElement(child) && typeof (child.props as RouteProps).path === 'string',
  )

  // Exact paths win over patterns; the catch-all is last.
  const exact = entries.find((e) => e.props.path === pathname)
  let chosen: ReactElement<RouteProps> | undefined = exact
  let params: Record<string, string> = {}

  if (!chosen) {
    for (const entry of entries) {
      if (entry.props.path === '*') continue
      const result = match(entry.props.path, pathname)
      if (result) {
        chosen = entry
        params = result
        break
      }
    }
  }
  if (!chosen) chosen = entries.find((e) => e.props.path === '*')

  // Params are read through context so nested components can reach them.
  const value = useMemo<RouterValue>(() => ({ ...router, params }), [router, params])

  if (!chosen) return null
  return <RouterContext.Provider value={value}>{chosen.props.element}</RouterContext.Provider>
}
