/* ----------------------------------------------------------------------------
 * Site header.
 *
 * Every item here was previously `onclick="go('x')"` with no href — which is
 * why the site had one URL. They are all real <Link>/<a href> now, so they can
 * be middle-clicked, copied, bookmarked, crawled and cited.
 * -------------------------------------------------------------------------- */
import { useEffect, useState } from 'react'
import { Link, useLocation } from '@/lib/router'
import AccountMenu from './AccountMenu'

type Item = { label: string; to: string }
type Group = { label: string; to: string; key: string; items: (Item | { group: string })[] }

const ABOUT: Group = {
  label: 'About',
  to: '/about',
  key: 'about',
  items: [
    { label: 'About the Institute', to: '/about' },
    { label: 'The AdvO Difference', to: '/advo-difference' },
    { label: 'Board of Directors', to: '/board-of-directors' },
    { group: 'KNOWLEDGE' },
    { label: 'Research', to: '/research' },
    { label: 'Articles', to: '/articles' },
  ],
}

const SEMINARS: Group = {
  label: 'Seminars',
  to: '/seminars',
  key: 'seminars',
  items: [
    { label: 'Intro to AdvO (FREE)', to: '/seminars/intro-to-advo' },
    { group: 'FUNDAMENTALS SERIES' },
    { label: 'Fundamental 1', to: '/seminars/fundamental-1' },
    { label: 'Fundamental 2', to: '/seminars/fundamental-2' },
    { label: 'Fundamental 3', to: '/seminars/fundamental-3' },
    { group: 'ADVANCED TRAINING' },
    { label: 'AdvO Intensive (West)', to: '/seminars/advo-intensive-west' },
    { label: 'AdvO Bootcamp 2027', to: '/seminars/advo-bootcamp-2027' },
    { label: '2026 Annual Conference', to: '/seminars/annual-conference-2026' },
    { group: 'IN PRACTICE' },
    { label: 'Internships', to: '/seminars/internships' },
    { label: 'View All Events →', to: '/seminars' },
  ],
}

const CERTIFICATION: Group = {
  label: 'Certification',
  to: '/certification',
  key: 'certification',
  items: [
    { label: 'Certification Overview', to: '/certification' },
    { label: 'AdvO Level 1', to: '/certification/advo-level-1' },
    { label: 'AdvO Level 2', to: '/certification/advo-level-2' },
  ],
}

const GROUPS = [ABOUT, SEMINARS, CERTIFICATION]

/** Which top-level menu item is highlighted for a given path. */
function activeKey(pathname: string): string {
  if (pathname === '/') return 'home'
  if (pathname.startsWith('/seminars')) return 'seminars'
  if (pathname.startsWith('/certification')) return 'certification'
  if (pathname.startsWith('/membership')) return 'membership'
  if (pathname.startsWith('/contact')) return 'contact'
  if (
    pathname.startsWith('/about') ||
    pathname.startsWith('/advo-difference') ||
    pathname.startsWith('/board-of-directors') ||
    pathname.startsWith('/research') ||
    pathname.startsWith('/articles')
  ) {
    return 'about'
  }
  if (pathname.startsWith('/clinical-challenges')) return 'home'
  return ''
}

export default function SiteHeader() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const active = activeKey(pathname)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // The home hero sizes itself against the real header height rather than a guess.
  useEffect(() => {
    const sync = () => {
      const header = document.querySelector('header.site')
      if (header) {
        document.documentElement.style.setProperty(
          '--hdrh',
          `${Math.round(header.getBoundingClientRect().height)}px`,
        )
      }
    }
    sync()
    window.addEventListener('resize', sync)
    document.fonts?.ready?.then(sync).catch(() => {})
    return () => window.removeEventListener('resize', sync)
  }, [])

  return (
    <header className="site">
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <div className="wrap">
        <div className="logorow">
          <div className="lr-l">
            <button
              className="burger"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
              aria-expanded={open}
              aria-controls="mpanel"
              type="button"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
          <Link to="/" className="logo" aria-label="Advanced Orthogonal Institute — home">
            <img
              className="logoimg"
              src="/images/logo.webp"
              alt="Advanced Orthogonal Institute"
              width={456}
              height={110}
            />
          </Link>
          <div className="lr-r">
            <AccountMenu />
          </div>
        </div>
      </div>

      <div className="navrow">
        <div className="wrap">
          <nav className="menu" aria-label="Primary">
            <div className="mi">
              <Link to="/" className={active === 'home' ? 'on' : undefined}>
                Home
              </Link>
            </div>

            {GROUPS.map((group) => (
              <div className="mi" key={group.key}>
                <Link to={group.to} className={active === group.key ? 'on' : undefined}>
                  {group.label} <span className="car">▼</span>
                </Link>
                <div className="drop">
                  {group.items.map((item, i) =>
                    'group' in item ? (
                      <div className="grp" key={`g${i}`}>
                        {item.group}
                      </div>
                    ) : (
                      <Link to={item.to} key={item.to + i}>
                        {item.label}
                      </Link>
                    ),
                  )}
                </div>
              </div>
            ))}

            <div className="mi">
              <Link to="/membership" className={active === 'membership' ? 'on' : undefined}>
                Membership
              </Link>
            </div>

            <Link
              className={`b s-btn on-dark hdr-btn menu-btn${active === 'contact' ? ' active-pg' : ''}`}
              to="/contact"
            >
              Contact
            </Link>
          </nav>
        </div>
      </div>

      <div className={`mpanel${open ? ' open' : ''}`} id="mpanel">
        <Link to="/">Home</Link>
        <div className="grp">ABOUT</div>
        {ABOUT.items
          .filter((i): i is Item => !('group' in i))
          .map((i) => (
            <Link className="sub" to={i.to} key={i.to}>
              {i.label}
            </Link>
          ))}
        <div className="grp">SEMINARS</div>
        {SEMINARS.items
          .filter((i): i is Item => !('group' in i))
          .map((i, n) => (
            <Link className="sub" to={i.to} key={i.to + n}>
              {i.label.replace(' →', '')}
            </Link>
          ))}
        <div className="grp">CERTIFICATION</div>
        {CERTIFICATION.items
          .filter((i): i is Item => !('group' in i))
          .map((i) => (
            <Link className="sub" to={i.to} key={i.to}>
              {i.label}
            </Link>
          ))}
        <div className="grp">MORE</div>
        <Link to="/membership">Membership</Link>
        <Link to="/account">Member Login</Link>
        <Link to="/contact">Contact</Link>
      </div>
    </header>
  )
}
