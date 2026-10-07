/* ----------------------------------------------------------------------------
 * Overview — the first thing a signed-in person sees.
 *
 * Every figure here is read from the database for this person. Where a number
 * is not available yet the card says so rather than showing a placeholder that
 * looks like a fact.
 * -------------------------------------------------------------------------- */
import { useEffect, useState } from 'react'
import { useAccess } from '@/lib/queries/AccessProvider'
import { useRegKey } from '@/lib/queries/CatalogProvider'
import { useRegistration } from '@/components/blocks/RegistrationDialog'
import { myRegistrations, upcomingEvents, myCompletions, eventZoom } from '@/lib/queries/member'
import type { Registration, PublicEvent, Completion } from '@/lib/queries/member'
import { RoleChips } from './MemberShell'
import PhotoCard from './PhotoCard'
import { TIER_LABEL } from '@/lib/access'

function daysUntil(iso?: string | null): number | null {
  if (!iso) return null
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return null
  return Math.ceil((then - Date.now()) / 86_400_000)
}

function greeting(): string {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

type Card = {
  key: string
  urgency: 'now' | 'soon' | 'ok'
  label: string
  big: string
  detail: string
  go: string
  tab: string
  /** Opens the sign-up window instead of a tab. */
  reg?: string
  /** Opens this link (a Zoom call) instead of a tab. */
  href?: string
}

export default function Overview({ onOpen }: { onOpen: (tab: string) => void }) {
  const { access } = useAccess()
  const regKey = useRegKey()
  const register = useRegistration()
  const [regs, setRegs] = useState<Registration[] | null>(null)
  const [events, setEvents] = useState<PublicEvent[] | null>(null)
  const [ce, setCe] = useState<Completion[] | null>(null)
  const [zoom, setZoom] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const [r, e] = await Promise.all([myRegistrations(), upcomingEvents()])
      if (cancelled) return
      setRegs(r)
      setEvents(e)
      if (access.person?.id) {
        const c = await myCompletions(access.person.id)
        if (!cancelled) setCe(c)
      } else {
        setCe([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [access.person?.id])

  const person = access.person
  const next = (events ?? [])
    .filter((e) => daysUntil(e.starts_at) !== null && (daysUntil(e.starts_at) as number) >= 0)
    .sort((a, b) => String(a.starts_at).localeCompare(String(b.starts_at)))[0]
  const registeredSlugs = new Set((regs ?? []).map((r) => r.events?.slug).filter(Boolean))
  const nextSlug = next?.slug && registeredSlugs.has(next.slug) ? next.slug : null
  useEffect(() => {
    if (!nextSlug) { setZoom(null); return }
    let cancelled = false
    void eventZoom(nextSlug).then((z) => { if (!cancelled) setZoom(z) })
    return () => { cancelled = true }
  }, [nextSlug])
  const hours = (ce ?? []).reduce((sum, c) => sum + Number(c.ce_hours ?? 0), 0)

  const cards: Card[] = []

  if (next) {
    const d = daysUntil(next.starts_at)
    const already = registeredSlugs.has(next.slug)
    const reg = already ? null : regKey(next.slug)
    const join = already && zoom ? zoom : null
    cards.push({
      key: 'next-event',
      urgency: already ? 'ok' : d !== null && d <= 30 ? 'now' : 'soon',
      label: next.title ?? 'Next event',
      big: already ? 'Registered' : d === null ? '—' : `${d} days`,
      detail: already
        ? `${next.location ?? 'Location to be confirmed'} — you are registered`
        : `until ${next.title ?? 'this event'}${next.location ? ` · ${next.location}` : ''}`,
      go: join ? 'Join on Zoom →' : already ? 'View the event →' : 'Register →',
      tab: 'events',
      ...(reg ? { reg } : {}),
      ...(join ? { href: join } : {}),
    })
  }

  cards.push({
    key: 'membership',
    urgency: access.tier === 'member' ? 'ok' : access.tier === 'expired' ? 'now' : 'soon',
    label: 'Membership',
    big: TIER_LABEL[access.tier],
    detail:
      access.tier === 'member' && person?.membership_expires
        ? `renews ${new Date(person.membership_expires).toLocaleDateString()}`
        : access.tier === 'member'
          ? 'active'
          : 'Members save $200 on every Intensive and $600 on Bootcamp, and the Monthly Huddle and the Annual Conference are included',
    go: access.tier === 'member' ? 'Manage membership →' : 'Become a member →',
    tab: 'membership',
  })

  cards.push({
    key: 'certification',
    urgency: 'ok',
    label: 'Certification',
    big:
      person?.cert_level === 'level_2'
        ? 'Level 2'
        : person?.cert_level === 'level_1'
          ? 'Level 1'
          : 'Not yet',
    detail:
      person?.cert_level && person.cert_level !== 'none'
        ? 'active · maintained by one advanced seminar a year'
        : 'the Institute certifies doctors who prove the standard',
    go: 'View my record →',
    tab: 'mycert',
  })

  cards.push({
    key: 'ce',
    urgency: 'ok',
    label: 'Continuing Education',
    big: ce === null ? '—' : `${hours} ${hours === 1 ? 'hour' : 'hours'}`,
    detail:
      hours > 0
        ? 'recorded by the Institute · certificates ready to download'
        : 'credits appear here as you complete accredited events',
    go: 'Open my CE →',
    tab: 'myce',
  })

  const upcomingCount = (regs ?? []).filter(
    (r) => r.events?.starts_at && new Date(r.events.starts_at) >= new Date(),
  ).length

  cards.push({
    key: 'registrations',
    urgency: 'ok',
    label: 'My registrations',
    big: regs === null ? '—' : String(upcomingCount),
    detail:
      upcomingCount > 0
        ? 'upcoming · details and reminders by email'
        : 'nothing booked yet — the catalog is open',
    go: 'Open events →',
    tab: 'events',
  })

  if (access.committees.length > 0) {
    const leading = access.committees.filter((c) => c.leads)
    cards.push({
      key: 'committees',
      urgency: 'soon',
      label: leading.length ? 'Committees you lead' : 'Your committees',
      big: String(leading.length || access.committees.length),
      detail: (leading.length ? leading : access.committees)
        .map((c) => c.name.replace(/ Committee.*/, ''))
        .join(' · '),
      go: 'Open reports →',
      tab: 'reports',
    })
  }

  return (
    <>
      <h1>
        {greeting()}
        {person?.last_name ? `, Dr. ${person.last_name}.` : '.'}
      </h1>
      <div className="ma-sub">
        {access.roles.length > 0 || access.tier !== 'guest'
          ? 'Everything below is scoped to the roles you hold.'
          : 'Your account is active. Membership unlocks the rest.'}
      </div>
      <RoleChips />
      <PhotoCard />

      <div className="ma-grid" style={{ marginTop: '22px' }}>
        {cards.map((card) => (
          <button
            type="button"
            className={`ma-card ${card.urgency}`}
            key={card.key}
            onClick={() => (card.href ? window.open(card.href, '_blank', 'noopener') : card.reg ? register(card.reg) : onOpen(card.tab))}
          >
            <span className="rail" />
            <span className="k">{card.label}</span>
            <span className="big">{card.big}</span>
            <span className="d">{card.detail}</span>
            <span className="go">{card.go}</span>
          </button>
        ))}
      </div>

      {access.tier === 'guest' && access.roles.length === 0 && (
        <div className="ma-note">
          <b>Your access starts here.</b> An account is created automatically when you register
          for an event. Membership, committee seats and Institute roles are assigned by the
          Executive Director and appear in this menu as soon as they are.
        </div>
      )}
    </>
  )
}
