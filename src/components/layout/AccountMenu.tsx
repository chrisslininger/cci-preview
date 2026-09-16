/* ----------------------------------------------------------------------------
 * The header's account control.
 *
 * Signed out it is the Member Login button, unchanged. Signed in it becomes the
 * person — their headshot, or their initials when there isn't one — with a
 * menu straight to the four things a member actually comes back for.
 *
 * The header is prerendered on every page, so the first client render has to
 * match the HTML the crawler and the browser were served. `mounted` holds the
 * signed-out markup for one frame and then swaps, which avoids a hydration
 * mismatch without making the whole header client-only.
 * -------------------------------------------------------------------------- */
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from '@/lib/router'
import { useAccess } from '@/lib/queries/AccessProvider'
import { displayName, initials, primaryRole } from '@/lib/access'
import { signOut } from '@/lib/supabase'

const ITEMS = [
  { label: 'My Profile', to: '/account#membership' },
  { label: 'My Events', to: '/account#events' },
  { label: 'My Certifications', to: '/account#mycert' },
  { label: 'My CE', to: '/account#myce' },
]

export default function AccountMenu() {
  const { access, signedIn, refresh } = useAccess()
  const navigate = useNavigate()
  const { pathname, hash } = useLocation()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)

  useEffect(() => setMounted(true), [])

  // Close on navigation, on Escape, and on a click anywhere else.
  useEffect(() => setOpen(false), [pathname, hash])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open])

  if (!mounted || !signedIn) {
    return (
      <Link className="b p-btn hdr-btn" to="/account">
        Member Login
      </Link>
    )
  }

  const photo = access.person?.photo_url
  const name = displayName(access)

  return (
    <div className="acctmenu" ref={wrap}>
      <button
        type="button"
        className="acctbtn"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Account menu for ${name}`}
      >
        {photo ? (
          <img className="acctav" src={photo} alt="" width={38} height={38} />
        ) : (
          <span className="acctav">{initials(access)}</span>
        )}
      </button>

      {open && (
        <div className="acctdrop" role="menu">
          <div className="acctwho">
            <b>{name}</b>
            <span>{primaryRole(access)}</span>
          </div>
          {ITEMS.map((item) => (
            <Link key={item.to} to={item.to} role="menuitem" onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
          <div className="acctsep" />
          <Link to="/account#overview" role="menuitem" onClick={() => setOpen(false)}>
            Member Area
          </Link>
          <button
            type="button"
            role="menuitem"
            className="acctout"
            onClick={() => {
              signOut()
              setOpen(false)
              void refresh()
              navigate('/account')
            }}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}
