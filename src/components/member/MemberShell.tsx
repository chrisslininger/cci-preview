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
import { signOut, session } from '@/lib/supabase'
import { attention, EMPTY, markEventsSeen, logSignInOnce, logActivity } from '@/lib/queries/attention'
import type { Attention } from '@/lib/queries/attention'
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

  // Red dots: what needs this person right now — a report they owe, a task due, new registrations.
  const [att, setAtt] = useState<Attention>(EMPTY)
  const uid = session.user?.id ?? null
  useEffect(() => {
    let alive = true
    logSignInOnce(uid)
    const run = () => { void attention(access, uid).then((a) => { if (alive) setAtt(a) }) }
    run()
    const t = setInterval(run, 5 * 60 * 1000)
    return () => { alive = false; clearInterval(t) }
  }, [access, uid, tab])
  useEffect(() => {
    void logActivity('tab_open', tab)
    if (tab === 'events') { markEventsSeen(uid); setAtt((a) => ({ ...a, events: { count: 0 } })) }
  }, [tab, uid])
  const dot = (key: string): { n: number; urgent: boolean; title: string } | null => {
    if (key === 'reports' && att.reports.count) return { n: att.reports.count, urgent: att.reports.overdue, title: att.reports.label }
    if (key === 'tasks' && att.tasks.count) return { n: att.tasks.count, urgent: att.tasks.overdue > 0, title: att.tasks.overdue ? `${att.tasks.overdue} overdue` : `${att.tasks.count} due soon` }
    if (key === 'events' && att.events.count) return { n: att.events.count, urgent: false, title: `${att.events.count} new registration${att.events.count > 1 ? 's' : ''}` }
    return null
  }

  // On a phone the rail is a horizontal strip; keep the current tab in view.
  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth > 760) return
    document.querySelector('.ma-rail a.on')?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [tab])

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
                  {dot(nav.key) && <span className={`ma-dot${dot(nav.key)!.urgent ? ' urgent' : ''}`} title={dot(nav.key)!.title} aria-label={dot(nav.key)!.title} />}
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
