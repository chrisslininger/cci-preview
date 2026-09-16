/* ----------------------------------------------------------------------------
 * The signed-in member area.
 *
 * The rail is generated from the capability list, so what a person sees is a
 * consequence of the roles they hold. Assigning a role in the roster is the
 * only administrative act needed — no code changes, no per-person switches.
 * -------------------------------------------------------------------------- */
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from '@/lib/router'
import { useAccess } from '@/lib/queries/AccessProvider'
import { navFor, findNav, GROUP_LABEL } from '@/lib/nav'
import { displayName, initials, primaryRole, roleLabel } from '@/lib/access'
import { signOut } from '@/lib/supabase'
import MemberPanel from './MemberPanel'
import Overview from './Overview'

export default function MemberShell() {
  const { access, refresh } = useAccess()
  const navigate = useNavigate()
  const { hash } = useLocation()
  const groups = navFor(access)

  // The rail uses the hash so a tab can be linked to and the back button works,
  // without adding 20 indexable routes to a page that must stay noindex.
  const requested = (hash || '#overview').slice(1)
  const allowed = groups.some((g) => g.items.some((i) => i.key === requested))
  const [tab, setTab] = useState(allowed ? requested : 'overview')

  useEffect(() => {
    const next = (hash || '#overview').slice(1)
    const ok = groups.some((g) => g.items.some((i) => i.key === next))
    setTab(ok ? next : 'overview')
  }, [hash, access])

  const item = findNav(tab)

  return (
    <>
      <div className="ma-top">
        <div className="in">
          <div className="ma-who">
            <div className="ma-av">{initials(access)}</div>
            <div>
              <b>{displayName(access)}</b>
              <span>{primaryRole(access)}</span>
            </div>
          </div>
          <button
            type="button"
            className="b sm s-btn on-dark"
            onClick={() => {
              signOut()
              void refresh()
              navigate('/account')
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="ma">
        <nav className="ma-rail" aria-label="Member area">
          {groups.map((group) => (
            <div key={group.group}>
              <span className="grp">{GROUP_LABEL[group.group]}</span>
              {group.items.map((nav) => (
                <Link
                  key={nav.key}
                  to={`/account#${nav.key}`}
                  className={nav.key === tab ? 'on' : undefined}
                  aria-current={nav.key === tab ? 'page' : undefined}
                >
                  {nav.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <main className="ma-main">
          {tab === 'overview' ? (
            <Overview onOpen={(key) => navigate(`/account#${key}`)} />
          ) : (
            <MemberPanel tab={tab} label={item?.label ?? tab} />
          )}
        </main>
      </div>
    </>
  )
}

/** The person's roles, as chips. Shown on Overview. */
export function RoleChips() {
  const { access } = useAccess()
  const gold = new Set(['executive_director', 'board_member', 'committee_chair', 'research_director'])
  return (
    <div className="ma-chips">
      {access.tier === 'member' && <span className="rolechip gold">AOI MEMBER</span>}
      {access.tier === 'student' && <span className="rolechip">STUDENT</span>}
      {access.tier === 'expired' && <span className="rolechip">MEMBERSHIP EXPIRED</span>}
      {access.roles
        .filter((r) => !r.role_key.startsWith('past_'))
        .map((role) => (
          <span
            className={`rolechip${gold.has(role.role_key) ? ' gold' : ''}`}
            key={`${role.role_key}-${role.committee_id ?? ''}`}
          >
            {roleLabel(role).toUpperCase()}
          </span>
        ))}
      {access.staff_role === 'administrator' && <span className="rolechip gold">ADMINISTRATOR</span>}
    </div>
  )
}
