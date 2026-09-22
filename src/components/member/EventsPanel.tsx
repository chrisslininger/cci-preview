/* ----------------------------------------------------------------------------
 * Events — every seminar, course, conference, board meeting, committee sync
 * and deadline in one date-ordered list, with the full create/edit form,
 * the detail popup and registrations & check-in.
 *
 * Everyone signed in sees what RLS gives them (published events for members;
 * drafts too for board, the executive director and the seminar committee).
 * The controls appear for board, the executive director and the seminar
 * committee chair — the same people the database lets write.
 * -------------------------------------------------------------------------- */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAccess } from '@/lib/queries/AccessProvider'
import { useToast } from '@/components/ui/Toast'
import {
  listEvents, venues as loadVenues, committees as loadCommittees, registrations, searchPeople,
  createEvent, updateEvent, setStatus, deleteEvent, saveSpeakers, saveSessions, duplicateEvent, checkIn,
  CATEGORIES, TYPES, TIMEZONES, catLabel, typeLabel, isGov, isPast, activeRegs, confirmedRegs, pendingRegs, recentRegs, unverifiedRegs, setVerification, slugify, rsvpCandidates, manualRsvp, canManageRsvps,
  dateBlock, whenText, money, zoned, MON, MONL,
} from '@/lib/queries/eventsAdmin'
import type { RsvpCandidate, EventRow, EventInput, Venue, Committee, Speaker, Session, Reg, PersonHit } from '@/lib/queries/eventsAdmin'

type Tab = 'all' | 'upcoming' | 'seminars' | 'gov' | 'drafts'
const TABS: [Tab, string][] = [['all', 'All events'], ['upcoming', 'Upcoming'], ['seminars', 'Seminars & courses'], ['gov', 'Board & committee'], ['drafts', 'Drafts']]

const initials = (n: string) => n.replace(/^Dr\.?\s*/i, '').split(/\s+/).map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase()

function Pill({ kind = '', children }: { kind?: string; children: React.ReactNode }) {
  return <span className={`cpill ${kind}`}>{children}</span>
}

function Chips({ e }: { e: EventRow }) {
  const gov = isGov(e)
  const n = confirmedRegs(e).length; const pend = pendingRegs(e).length; const fresh = recentRegs(e).length; const unv = unverifiedRegs(e).length
  const p = money(e.price)
  return (
    <div className="cert-chips" style={{ marginBottom: 0, marginTop: 9 }}>
      {e.status === 'published' ? <Pill kind="ok">Live on site</Pill> : <Pill kind="warn">Draft</Pill>}
      {e.is_keystone && <Pill kind="gold">Keystone</Pill>}
      {unv > 0 && <Pill kind="warn">{unv} to verify</Pill>}
      <small className="muted evt-facts">{[gov ? typeLabel(e.event_type) : (e.category ? catLabel(e.category) : typeLabel(e.event_type)), !gov && e.category && e.event_type && !['seminar', 'Other'].includes(e.event_type) ? typeLabel(e.event_type) : null, e.ce_credits ? 'CE credits' : null, isPast(e) ? 'Past' : null, n > 0 ? `${n} registered` : null, fresh > 0 ? `${fresh} new this week` : null, pend > 0 ? `${pend} awaiting payment` : null, p && !gov ? `${p}${e.member_price != null ? ` · members ${money(e.member_price)}` : ''}${e.free_with_membership ? ' · free w/ membership' : ''}` : null].filter(Boolean).join(' · ')}</small>
    </div>
  )
}

export default function EventsPanel() {
  const toast = useToast()
  const { access, can } = useAccess()
  const canManage = can('full_admin') || can('board') || can('manage_seminars')
  const meId = access.person?.id ?? null
  const [rows, setRows] = useState<EventRow[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [committees, setCommittees] = useState<Committee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('upcoming')
  const [q, setQ] = useState('')
  const [view, setView] = useState<'list' | 'cal'>('list')
  const [open, setOpen] = useState<number | null>(null)
  const [edit, setEdit] = useState<EventRow | 'new' | null>(null)
  const [confirm, setConfirm] = useState<EventRow | null>(null)
  const [regsFor, setRegsFor] = useState<EventRow | null>(null)

  const load = useCallback(async () => {
    const r = await listEvents()
    setError(r.error ? `The events could not be read — the database answered: ${r.error.slice(0, 200)}` : null)
    setRows(r.rows); setLoading(false)
  }, [])
  useEffect(() => { void load() }, [load])
  useEffect(() => { if (canManage) { void loadVenues().then(setVenues); void loadCommittees().then(setCommittees) } }, [canManage])

  const counts = useMemo(() => ({
    all: rows.length, upcoming: rows.filter((e) => !isPast(e)).length, seminars: rows.filter((e) => !isGov(e)).length,
    gov: rows.filter(isGov).length, drafts: rows.filter((e) => e.status !== 'published').length,
  }), [rows])

  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return rows.filter((e) => {
      if (tab === 'upcoming' && isPast(e)) return false
      if (tab === 'seminars' && isGov(e)) return false
      if (tab === 'gov' && !isGov(e)) return false
      if (tab === 'drafts' && e.status === 'published') return false
      if (!t) return true
      return [e.title, e.subtitle, e.location, e.venue?.name, e.venue?.city, catLabel(e.category), typeLabel(e.event_type), e.audience, (e.event_speakers ?? []).map((s) => s.name).join(' ')]
        .filter(Boolean).some((v) => String(v).toLowerCase().includes(t))
    }).sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
  }, [rows, tab, q])

  function exportCsv() {
    const cols = ['id', 'slug', 'title', 'subtitle', 'category', 'event_type', 'status', 'starts_at', 'ends_at', 'timezone', 'location', 'price', 'member_price', 'student_price', 'free_with_membership', 'faculty_free', 'ce_credits', 'capacity', 'registrations']
    const csv = [cols.join(','), ...list.map((e) => cols.map((c) => `"${String(c === 'registrations' ? activeRegs(e).length : (e as Record<string, unknown>)[c] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = `events-${tab}-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(a.href)
  }

  async function onDuplicate(e: EventRow) {
    const r = await duplicateEvent(e, meId)
    if (r.error) { toast('The database refused the copy: ' + r.error.slice(0, 140)); return }
    await load(); setOpen(null)
    const copy = (await listEvents()).rows.find((x) => x.id === r.id)
    toast('Duplicated as a draft — change the dates and publish when ready')
    if (copy) setEdit(copy)
  }
  async function onRemove(e: EventRow) {
    const r = await deleteEvent(e.id)
    if (r.error) { toast('The database refused the removal: ' + r.error.slice(0, 140)); return }
    setConfirm(null); setOpen(null); await load(); toast('Event removed')
  }
  async function onUnpublish(e: EventRow) {
    const r = await setStatus(e.id, 'draft')
    if (r.error) { toast('Could not unpublish: ' + r.error.slice(0, 140)); return }
    setConfirm(null); await load(); toast('Taken off the public site (kept as draft)')
  }

  if (loading) return <><h1>Events</h1><div className="ma-sub">Reading the Institute calendar…</div><div className="ma-panel"><p className="ma-empty">One moment.</p></div></>

  const upcoming = list.filter((e) => !isPast(e))
  const past = list.filter(isPast).reverse()
  const card = (e: EventRow) => {
    const d = dateBlock(e)
    const where = e.venue ? `${e.venue.name}${e.venue.city ? ` · ${e.venue.city}, ${e.venue.state ?? ''}` : ''}` : e.location
    return (
      <article key={e.id} className={`evt${isPast(e) ? ' past' : ''}${e.status !== 'published' ? ' draft' : ''}`} tabIndex={0} role="button" aria-label={`Open ${e.title}`}
        onClick={() => setOpen(e.id)} onKeyDown={(k) => { if ((k.key === 'Enter' || k.key === ' ') && k.target === k.currentTarget) { k.preventDefault(); setOpen(e.id) } }}>
        <div className="dt"><span className="mo">{d.mo}</span><span className="dy">{d.dy}</span><span className="yr">{d.yr}</span>{d.tm && <span className="tm">{d.tm}</span>}</div>
        <div className="ti"><h4>{e.title}</h4>{e.subtitle && <div className="st">{e.subtitle}</div>}{where && <div className="lc">{where}</div>}<Chips e={e} /></div>
        <div className="ac" onClick={(k) => k.stopPropagation()}>
          {canManage && <>
            <button type="button" className="b s-btn on-light xs" onClick={() => setEdit(e)}>Edit</button>
            <button type="button" className="b s-btn on-light xs" onClick={() => void onDuplicate(e)}>Duplicate</button>
            <button type="button" className="b dgr xs" onClick={() => setConfirm(e)}>Remove</button>
          </>}
        </div>
      </article>
    )
  }
  const months: Record<string, { y: number; m: number; items: EventRow[] }> = {}
  if (view === 'cal') for (const e of list) { const z = zoned(e.starts_at, e.timezone); if (!z) continue; const k = `${z.y}-${String(z.m).padStart(2, '0')}`; (months[k] ??= { y: z.y, m: z.m, items: [] }).items.push(e) }
  const current = open ? rows.find((x) => x.id === open) ?? null : null

  return (
    <>
      <div className="cert-head">
        <div><h1>Events</h1><div className="ma-sub" style={{ marginBottom: 0, maxWidth: '80ch' }}>Every seminar, course, conference, board meeting, committee sync and deadline — one list, in date order. Click a card for the full details.</div></div>
        <div className="cert-actions">{canManage && <button type="button" className="b p-btn sm" onClick={() => setEdit('new')}>+ Create event</button>}<button type="button" className="b s-btn on-light sm" onClick={exportCsv}>↓ Export CSV</button></div>
      </div>
      {error && <div className="cert-err" role="alert">{error}</div>}
      <div className="cert-tiles">{TABS.map(([k, l]) => <button type="button" key={k} className={`cert-tile${tab === k ? ' on' : ''}`} onClick={() => setTab(k)} aria-pressed={tab === k}><span>{l}</span><b>{counts[k]}</b></button>)}</div>
      <div className="cert-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        <input type="text" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Escape' && setQ('')} autoComplete="off" placeholder="Search by title, venue, category, speaker…" aria-label="Search events" />
        {q && <button type="button" className="clr" aria-label="Clear search" onClick={() => setQ('')}>×</button>}
      </div>
      <div className="evt-bar"><span className="cnt">{list.length} {list.length === 1 ? 'event' : 'events'}{q ? ` matching “${q}”` : ''} · sorted by date</span>
        <div className="evt-seg"><button type="button" className={view === 'list' ? 'on' : ''} onClick={() => setView('list')}>List</button><button type="button" className={view === 'cal' ? 'on' : ''} onClick={() => setView('cal')}>Calendar</button></div></div>
      {list.length === 0 && <div className="cert-card" style={{ textAlign: 'center', color: 'var(--color-content-muted)', padding: 30 }}>{q ? `Nothing matches “${q}”.` : 'No events in this list.'}</div>}
      {view === 'list'
        ? <>{upcoming.length > 0 && <div className="evt-grp">Upcoming</div>}{upcoming.map(card)}{past.length > 0 && <div className="evt-grp">Past</div>}{past.map(card)}</>
        : Object.keys(months).sort().map((k) => <div key={k}><div className="evt-grp">{MONL[months[k]!.m]} {months[k]!.y}</div>{months[k]!.items.map(card)}</div>)}

      {current && <DetailDialog e={current} canManage={canManage} onClose={() => setOpen(null)} onEdit={() => { setOpen(null); setEdit(current) }} onDuplicate={() => void onDuplicate(current)} onRegs={() => { setOpen(null); setRegsFor(current) }} />}
      {edit && <FormDialog e={edit === 'new' ? null : edit} venues={venues} committees={committees} meId={meId} onClose={() => setEdit(null)} onSaved={async (m) => { setEdit(null); await load(); toast(m) }} onRemove={(e) => { setEdit(null); setConfirm(e) }} />}
      {confirm && (
        <div className="cert-veil" onClick={(e) => e.target === e.currentTarget && setConfirm(null)}>
          <div className="cert-modal" role="dialog" aria-modal="true">
            <div className="mh"><div><h3>Remove “{confirm.title}”?</h3><p>{activeRegs(confirm).length > 0 ? `${activeRegs(confirm).length} registration${activeRegs(confirm).length > 1 ? 's' : ''} will be deleted with it. Consider unpublishing instead.` : 'This deletes the event with its speakers and sessions.'}</p></div><button type="button" className="x" aria-label="Close" onClick={() => setConfirm(null)}>×</button></div>
            <div className="mf">{confirm.status === 'published' && <button type="button" className="b s-btn on-light sm" onClick={() => void onUnpublish(confirm)}>Unpublish instead</button>}<button type="button" className="b s-btn on-light sm" onClick={() => setConfirm(null)}>Keep</button><button type="button" className="b dgr sm" onClick={() => void onRemove(confirm)}>Remove</button></div>
          </div>
        </div>
      )}
      {regsFor && <RegsDialog e={regsFor} canManage={canManage} onClose={() => setRegsFor(null)} onBack={() => { setRegsFor(null); setOpen(regsFor.id) }} onChanged={load} />}
    </>
  )
}

/* --------------------------------------------------------------- detail -- */

function DetailDialog({ e, canManage, onClose, onEdit, onDuplicate, onRegs }: { e: EventRow; canManage: boolean; onClose: () => void; onEdit: () => void; onDuplicate: () => void; onRegs: () => void }) {
  useEffect(() => { const k = (ev: KeyboardEvent) => ev.key === 'Escape' && onClose(); document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k) }, [onClose])
  const gov = isGov(e)
  const regs = activeRegs(e)
  const v = e.venue
  const speakers = [...(e.event_speakers ?? [])].sort((a, b) => a.sort - b.sort)
  const sessions = [...(e.event_sessions ?? [])].sort((a, b) => (a.sort - b.sort) || String(a.starts_at).localeCompare(String(b.starts_at)))
  const agenda = (e.agenda ?? '').split('\n').filter(Boolean)
  const eb = e.early_bird && e.early_bird_price != null ? zoned(e.early_bird_until, e.timezone) : null
  const rw = [e.reg_opens ? `Opens ${whenText({ starts_at: e.reg_opens, ends_at: null, timezone: e.timezone, category: null })}` : null, e.reg_closes ? `Closes ${whenText({ starts_at: e.reg_closes, ends_at: null, timezone: e.timezone, category: null })}` : null].filter(Boolean).join(' · ')
  const kv = (k: string, val: React.ReactNode) => <><span>{k}</span><div>{val}</div></>
  return (
    <div className="cert-veil" onClick={(ev) => ev.target === ev.currentTarget && onClose()}>
      <div className="cert-modal evt-detail cc" role="dialog" aria-modal="true">
        <div className="evt-hero">{e.primary_image ? <img src={e.primary_image} alt="" onError={(ev) => (ev.currentTarget.style.display = 'none')} /> : null}<div className="ph">{gov ? typeLabel(e.event_type) : catLabel(e.category)}{!e.primary_image && ' · no hero image yet'}</div><button type="button" className="xh" aria-label="Close" onClick={onClose}>×</button></div>
        <div className="evt-dh"><Chips e={e} /><h3>{e.title}</h3>{e.subtitle && <div className="st">{e.subtitle}</div>}</div>
        <div className="evt-dsec">
          <div className="sec">When</div>
          <div className="kv">{kv('Dates', whenText(e))}{e.audience && kv('Audience', e.audience)}{rw && kv('Registration', rw)}{!gov && kv('Seats', e.capacity ? `${Math.max(0, e.capacity - regs.length)} of ${e.capacity} seats remaining` : 'No cap set')}</div>
          <div className="sec">Where</div>
          {v ? <div className="kv">{kv('Venue', <><b>{v.name}</b><br />{[v.address, [v.city, v.state].filter(Boolean).join(', ')].filter(Boolean).join(', ')}{(v.address || v.city) && <><br /><a href={`https://maps.google.com/?q=${encodeURIComponent([v.name, v.address, v.city, v.state].filter(Boolean).join(', '))}`} target="_blank" rel="noreferrer">Open in maps</a></>}</>)}{e.location && e.location !== v.name && kv('Notes', e.location)}</div>
            : <div className="kv">{kv('Location', e.location || 'To be announced')}</div>}
          {e.zoom_url && <div className="kv" style={{ marginTop: 6 }}>{kv('Zoom', <a href={e.zoom_url} target="_blank" rel="noreferrer">{e.zoom_url}</a>)}</div>}
          {e.room_block_hotel && <><div className="sec">Room block</div><div className="kv">{kv('Hotel', e.room_block_hotel)}{kv('Rate', e.room_block_rate || '—')}{kv('Book by', e.room_block_by || '—')}</div></>}
          {e.description && <><div className="sec">About</div>{e.description.split(/\n\n+/).map((p, i) => <p key={i}>{p}</p>)}</>}
          {e.prerequisites && <div className="kv" style={{ marginTop: 6 }}>{kv('Prerequisites', e.prerequisites)}</div>}
          {(agenda.length > 0 || sessions.length > 0) && <><div className="sec">Agenda</div><ul className="agenda">
            {sessions.map((s, i) => { const z = zoned(s.starts_at, e.timezone); const z2 = zoned(s.ends_at, e.timezone); return <li key={s.id ?? i}><b>{z ? `${MON[z.m]} ${z.d} · ${z.time}` : ''}{z2 ? `–${z2.time}` : ''}</b><span>{s.title}{s.speaker ? ` — ${s.speaker}` : ''}{s.ce_hours ? <em className="muted"> ({s.ce_hours} CE hrs)</em> : null}</span></li> })}
            {agenda.map((line, i) => { const m = line.match(/^(\d+\.|Day \d+:|MOD \d+|[A-Z][a-z]+day, [A-Za-z]+ \d+:)\s*(.*)$/); return <li key={`a${i}`}><b>{m ? m[1]!.replace(/:$/, '') : ''}</b><span>{m ? m[2] : line}</span></li> })}
          </ul></>}
          {speakers.length > 0 && <><div className="sec">Speakers</div><div className="evt-spk">{speakers.map((s, i) => <div key={s.id ?? i} className={`s${s.is_keynote ? ' key' : ''}`}><div className="av">{initials(s.name)}</div><div><b>{s.name}</b><small>{s.speaker_title || s.note || (s.is_keynote ? 'Keynote' : 'Speaker')}</small></div></div>)}</div></>}
          {!gov && (e.price != null || e.free_with_membership || e.student_price != null) && <><div className="sec">Pricing</div><div className="evt-price">
            {e.price != null && <div className="p"><small>Doctors</small><b>{money(e.price)}</b>{eb && <i>Early bird {money(e.early_bird_price)}{eb ? ` until ${MONL[eb.m]} ${eb.d}` : ''}</i>}</div>}
            {e.free_with_membership ? <div className="p m"><small>Members</small><b>FREE</b><i>included with current membership</i></div>
              : e.member_price != null && <div className="p m"><small>Members</small><b>{money(e.member_price)}</b>{e.price != null && <i>save {money(Number(e.price) - Number(e.member_price))}</i>}</div>}
            {e.student_price != null && <div className="p"><small>Students</small><b>{money(e.student_price)}</b></div>}
            {e.faculty_free && <div className="p"><small>Faculty</small><b>FREE</b><i>college faculty attend free</i></div>}
          </div></>}
          {!gov && <><div className="sec">CE credits</div>{e.ce_credits ? <div className="kv">{kv('CE credits', `Yes${e.ce_mode ? ` · ${e.ce_mode === 'addon' ? 'paid add-on' : e.ce_mode}` : ''}${e.ce_price != null ? ` · ${money(e.ce_price)}` : ''}`)}{e.ce_school && kv('Sponsoring school', e.ce_school)}</div> : <p className="muted">No CE credits offered.</p>}</>}
          {e.refund_policy && <><div className="sec">Refund policy</div><p>{e.refund_policy}</p></>}
          {e.video_url && <div className="kv" style={{ marginTop: 6 }}>{kv('Video', <a href={e.video_url} target="_blank" rel="noreferrer">{e.video_url}</a>)}</div>}
          {(e.gallery_images?.length ?? 0) > 0 && <><div className="sec">Gallery</div><div className="evt-gal">{e.gallery_images!.map((u, i) => <img key={i} src={u} alt="" onError={(ev) => (ev.currentTarget.style.display = 'none')} />)}</div></>}
          <div className="sec">Public page</div>
          <div className="kv">{kv('URL', e.status === 'published' ? <a href={`/seminars/${e.slug ?? ''}`} target="_blank" rel="noreferrer">advancedorthogonal.com/seminars/{e.slug}</a> : <span className="muted" style={{ margin: 0 }}>Not on the public site until published · /seminars/{e.slug}</span>)}</div>
        </div>
        <div className="mf evt-foot">
          <div className="r">{!gov && canManage && <button type="button" className="b s-btn on-light sm" onClick={onRegs}>Registrations &amp; check-in ({regs.length})</button>}</div>
          <div className="r">{canManage && <><button type="button" className="b s-btn on-light sm" onClick={onEdit}>Edit</button><button type="button" className="b s-btn on-light sm" onClick={onDuplicate}>Duplicate</button></>}<button type="button" className="b p-btn sm" onClick={onClose}>Close</button></div>
        </div>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------- registrations -- */

const TIER: Record<string, string> = { doctor: 'Doctor', student: 'Student', faculty: 'College faculty', member: 'Member RSVP' }
function RegsDialog({ e, canManage, onClose, onBack, onChanged }: { e: EventRow; canManage: boolean; onClose: () => void; onBack: () => void; onChanged: () => Promise<void> }) {
  const toast = useToast()
  const [rows, setRows] = useState<Reg[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [cands, setCands] = useState<RsvpCandidate[]>([])
  const [canRsvp, setCanRsvp] = useState(false)
  const [view, setView] = useState<'attending' | 'awaiting'>('attending')
  const [q, setQ] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const memberFree = e.free_with_membership === true
  const load = useCallback(async () => {
    const r = await registrations(e.id); setErr(r.error ? r.error.slice(0, 160) : null); setRows(r.rows)
    if (memberFree) { const [ok, c] = await Promise.all([canManageRsvps(), rsvpCandidates(e.id)]); setCanRsvp(ok); setCands(c) }
  }, [e.id, memberFree])
  async function confirmRsvp(c: RsvpCandidate) {
    if (!confirm(`Confirm ${c.full_name}'s RSVP for ${e.title}? They will move to the attendee list as a member (no charge).`)) return
    setBusyId(c.person_id)
    const x = await manualRsvp(e.id, c.person_id)
    setBusyId(null)
    if (x.error) { toast('Could not confirm: ' + x.error.slice(0, 140)); return }
    toast(`${c.full_name} is now attending`)
    await load(); await onChanged()
  }
  const shown = cands.filter((c) => !q.trim() || `${c.full_name} ${c.email ?? ''}`.toLowerCase().includes(q.trim().toLowerCase()))
  useEffect(() => { void load() }, [load])
  useEffect(() => { const k = (ev: KeyboardEvent) => ev.key === 'Escape' && onClose(); document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k) }, [onClose])
  const live = rows.filter((r) => r.registration_status !== 'cancelled' && (r.payment_status === 'paid' || r.payment_status === 'free'))
  const pending = rows.filter((r) => r.registration_status !== 'cancelled' && r.payment_status === 'pending').length
  const paid = live.filter((r) => r.payment_status === 'paid').length
  const inn = live.filter((r) => r.checked_in_at).length
  const rev = live.reduce((s, r) => s + (r.payment_status === 'paid' ? r.price_paid_cents : 0), 0) / 100
  async function toggle(r: Reg) {
    const x = await checkIn(r.id, !!r.checked_in_at)
    if (x.error) { toast('Could not update check-in: ' + x.error.slice(0, 120)); return }
    await load(); await onChanged()
  }
  function exportRoster() {
    const cols = ['full_name', 'email', 'phone', 'practice_name', 'reg_type', 'is_member_at_registration', 'discount_applied', 'price_paid_cents', 'payment_status', 'verification_status', 'registration_status', 'checked_in_at', 'created_at']
    const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => `"${String((r as Record<string, unknown>)[c] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = `${e.slug ?? 'event'}-roster.csv`; a.click(); URL.revokeObjectURL(a.href)
  }
  return (
    <div className="cert-veil" onClick={(ev) => ev.target === ev.currentTarget && onClose()}>
      <div className="cert-modal wide" role="dialog" aria-modal="true">
        <div className="mh"><div><h3>Registrations &amp; check-in — {e.title}</h3><p>{whenText(e)}</p></div><button type="button" className="x" aria-label="Close" onClick={onClose}>×</button></div>
        <div className="mb">
          {err && <div className="cert-err">{err}</div>}
          <div className="evt-regstats"><div className="s"><small>Attending</small><b>{live.length}</b></div><div className="s"><small>Paid</small><b>{paid}</b></div>{memberFree && <div className="s"><small>Members RSVP'd</small><b>{live.filter((r) => r.reg_type === 'member').length}</b></div>}{memberFree && <div className="s"><small>CE certificates</small><b>{live.filter((r) => r.ce_credits).length}</b></div>}{pending > 0 && <div className="s"><small>Awaiting payment</small><b>{pending}</b></div>}<div className="s"><small>Checked in</small><b>{inn}</b></div><div className="s"><small>Revenue</small><b>{money(rev) ?? '$0'}</b></div></div>
          {memberFree && (
            <div className="viewsw" style={{ margin: '4px 0 10px' }}>
              <button type="button" className={view === 'attending' ? 'on' : ''} onClick={() => setView('attending')}>Attending ({live.length})</button>
              <button type="button" className={view === 'awaiting' ? 'on' : ''} onClick={() => setView('awaiting')}>Members awaiting RSVP ({cands.length})</button>
            </div>
          )}
          {memberFree && view === 'awaiting' ? (
            <div className="evt-tbl">
              <p className="muted" style={{ margin: '0 0 8px', fontSize: 13 }}>Every current member has a seat included with membership. These members have not RSVP'd yet. {canRsvp ? 'If one confirms by phone, text or email, confirm it here and they move to Attending.' : 'Directors and the Seminar chair can confirm an RSVP received by phone, text or email.'}</p>
              <input className="fi" placeholder="Search members…" value={q} onChange={(ev) => setQ(ev.target.value)} style={{ marginBottom: 8 }} />
              <table><thead><tr><th>Member</th><th>Membership</th><th></th></tr></thead><tbody>
                {shown.length === 0 && <tr><td colSpan={3} className="muted">{cands.length === 0 ? 'Every current member has RSVP\u2019d.' : 'No members match.'}</td></tr>}
                {shown.map((c) => <tr key={c.person_id}>
                  <td><b>{c.full_name}{c.credentials ? `, ${c.credentials}` : ''}</b><br /><small>{c.email ? <a href={`mailto:${c.email}`}>{c.email}</a> : <i className="muted">no email</i>}{c.phone ? ` · ${c.phone}` : ''}</small></td>
                  <td><small>{c.membership_expires ? `through ${new Date(c.membership_expires + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'current'}{c.member_since ? ` · since ${c.member_since.slice(0, 4)}` : ''}</small></td>
                  <td>{canRsvp ? <button type="button" className="b s-btn on-light xs" disabled={busyId === c.person_id} onClick={() => void confirmRsvp(c)}>{busyId === c.person_id ? 'Saving…' : 'Confirm RSVP'}</button> : '—'}</td>
                </tr>)}
              </tbody></table>
            </div>
          ) : (
          <div className="evt-tbl"><table><thead><tr><th>Attendee</th><th>Ticket</th><th>Paid</th><th>Registered</th><th>Check-in</th><th></th></tr></thead><tbody>
            {rows.length === 0 && <tr><td colSpan={6} className="muted">No registrations yet.</td></tr>}
            {[...rows].sort((a, b) => b.created_at.localeCompare(a.created_at)).map((r) => <tr key={r.id} className={r.registration_status === 'cancelled' ? 'off' : ''}>
              <td><b>{r.full_name}</b><br /><small><a href={`mailto:${r.email}`}>{r.email}</a>{r.practice_name ? ` · ${r.practice_name}` : ''}{r.phone ? ` · ${r.phone}` : ''}</small></td>
              <td>{TIER[r.reg_type] ?? r.reg_type}{r.is_member_at_registration && r.reg_type !== 'member' ? ' · member' : ''}{r.source === 'manual_rsvp' ? <><br /><small className="muted">{r.notes ?? 'confirmed by hand'}</small></> : null}{r.discount_applied ? <><br /><small className="muted">{r.discount_applied.replace(/\+/g, ' + ')}</small></> : null}{r.registration_status === 'cancelled' ? <><br /><Pill kind="bad">cancelled</Pill></> : null}
                {r.verification_status === 'pending' && r.registration_status !== 'cancelled' ? <><br /><Pill kind="warn">eligibility to confirm</Pill>{canManage && <> <button type="button" className="flink" onClick={async () => { const x = await setVerification(r.id, 'verified'); if (x.error) return toast('Could not update: ' + x.error.slice(0, 120)); await load(); await onChanged() }}>confirm</button></>}</> : r.verification_status === 'verified' ? <><br /><Pill kind="ok">verified</Pill></> : null}</td>
              <td>{money(r.price_paid_cents / 100) ?? '$0'}{r.reg_type === 'member' && r.ce_credits ? <><br /><small className="muted">CE certificate</small></> : null}<br /><Pill kind={r.payment_status === 'paid' || r.payment_status === 'free' ? 'ok' : r.payment_status === 'pending' ? 'warn' : 'bad'}>{r.payment_status === 'pending' ? 'awaiting payment' : r.payment_status === 'free' && r.reg_type === 'member' ? 'member' : r.payment_status}</Pill></td>
              <td><small>{new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}<br />{new Date(r.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</small></td>
              <td>{r.checked_in_at ? <><Pill kind="ok">Checked in</Pill><br /><small className="muted">{new Date(r.checked_in_at).toLocaleString()}</small></> : (canManage && r.registration_status !== 'cancelled' ? <button type="button" className="b s-btn on-light xs" onClick={() => void toggle(r)}>Check in</button> : '—')}</td>
              <td>{r.checked_in_at && canManage && <button type="button" className="flink" onClick={() => void toggle(r)}>undo</button>}</td>
            </tr>)}
          </tbody></table></div>
          )}
        </div>
        <div className="mf"><button type="button" className="b s-btn on-light sm" onClick={exportRoster}>↓ Export roster</button><button type="button" className="b s-btn on-light sm" onClick={onBack}>Back</button><button type="button" className="b p-btn sm" onClick={onClose}>Close</button></div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ form -- */

type Step = 'basics' | 'when' | 'price' | 'content' | 'people' | 'images'
const STEPS: [Step, string][] = [['basics', 'Basics'], ['when', 'Schedule & venue'], ['price', 'Pricing & CE'], ['content', 'Content'], ['people', 'Speakers & sessions'], ['images', 'Images']]
type FormState = EventInput & { speakers: Speaker[]; sessions: Session[] }

const blank = (): FormState => ({
  slug: '', title: '', subtitle: '', description: '', category: 'fundamentals', event_type: 'seminar', status: 'draft', is_keystone: false,
  starts_at: '', ends_at: null, timezone: 'America/New_York', location: '', location_id: null, audience: '', agenda: '', prerequisites: '', refund_policy: '',
  price: null, member_price: null, student_price: null, early_bird: false, early_bird_price: null, early_bird_until: null, free_with_membership: false, faculty_free: false,
  ce_credits: false, ce_school: '', ce_mode: '', ce_price: null, capacity: null, reg_opens: null, reg_closes: null,
  primary_image: '', social_image: '', gallery_images: [], room_block_hotel: '', room_block_rate: '', room_block_by: null, zoom_url: '', video_url: '', committee_id: null,
  speakers: [], sessions: [],
})
const fromRow = (e: EventRow): FormState => ({ ...blank(), ...(Object.fromEntries(Object.entries(e).filter(([k]) => k in blank())) as Partial<FormState>), speakers: [...(e.event_speakers ?? [])].sort((a, b) => a.sort - b.sort), sessions: [...(e.event_sessions ?? [])].sort((a, b) => a.sort - b.sort) })

/** ISO → value for <input type=datetime-local> in the event's zone; and back. */
function toLocal(iso: string | null | undefined, tz: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso); if (Number.isNaN(d.getTime())) return ''
  try {
    const f = new Intl.DateTimeFormat('en-CA', { timeZone: tz || 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
    const o: Record<string, string> = {}; for (const p of f.formatToParts(d)) o[p.type] = p.value
    return `${o.year}-${o.month}-${o.day}T${o.hour === '24' ? '00' : o.hour}:${o.minute}`
  } catch { return d.toISOString().slice(0, 16) }
}
function fromLocal(v: string, tz: string | null | undefined): string | null {
  if (!v) return null
  // Interpret the wall-clock value in the event's zone: find the offset that zone has at that moment.
  const guess = new Date(`${v}:00Z`)
  try {
    const f = new Intl.DateTimeFormat('en-US', { timeZone: tz || 'America/New_York', timeZoneName: 'longOffset' })
    const part = f.formatToParts(guess).find((p) => p.type === 'timeZoneName')?.value ?? 'GMT'
    const m = part.match(/GMT([+-])(\d{2}):?(\d{2})?/)
    const off = m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0)) : 0
    return new Date(guess.getTime() - off * 60_000).toISOString()
  } catch { return new Date(v).toISOString() }
}

function FormDialog({ e, venues, committees, meId, onClose, onSaved, onRemove }: { e: EventRow | null; venues: Venue[]; committees: Committee[]; meId: string | null; onClose: () => void; onSaved: (m: string) => void; onRemove: (e: EventRow) => void }) {
  const [v, setV] = useState<FormState>(() => (e ? fromRow(e) : blank()))
  const [step, setStep] = useState<Step>('basics')
  const [rb, setRb] = useState(!!e?.room_block_hotel)
  const [slugTouched, setSlugTouched] = useState(!!e)
  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)
  useEffect(() => { const k = (ev: KeyboardEvent) => ev.key === 'Escape' && onClose(); document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k) }, [onClose])
  const gov = isGov(v)
  const set = <K extends keyof FormState>(k: K, val: FormState[K]) => setV((s) => ({ ...s, [k]: val }))
  const txt = (k: keyof EventInput) => (ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const val = ev.target.value
    setV((s) => {
      const n = { ...s, [k]: val } as FormState
      if (k === 'title' && !slugTouched) n.slug = slugify(val)
      if (k === 'slug') setSlugTouched(true)
      return n
    })
  }
  const num = (k: keyof EventInput) => (ev: React.ChangeEvent<HTMLInputElement>) => set(k, (ev.target.value === '' ? null : Number(ev.target.value)) as never)
  const dt = (k: keyof EventInput) => (ev: React.ChangeEvent<HTMLInputElement>) => set(k, fromLocal(ev.target.value, v.timezone) as never)
  const chk = (k: keyof EventInput) => (ev: React.ChangeEvent<HTMLInputElement>) => set(k, ev.target.checked as never)

  async function save(status: 'draft' | 'published') {
    setErr(null)
    if (!v.title.trim()) { setStep('basics'); setErr('A title is required.'); return }
    if (!v.starts_at) { setStep('when'); setErr('A start date and time are required.'); return }
    const slug = (v.slug || slugify(v.title)).trim()
    const { speakers, sessions, ...cols } = v
    const input: EventInput = { ...cols, slug, status, gallery_images: (v.gallery_images ?? []).filter(Boolean), room_block_hotel: rb ? v.room_block_hotel : null, room_block_rate: rb ? v.room_block_rate : null, room_block_by: rb ? v.room_block_by : null }
    if (gov) Object.assign(input, { category: null, price: null, member_price: null, student_price: null, early_bird: false, early_bird_price: null, early_bird_until: null, free_with_membership: false, faculty_free: false, ce_credits: false, ce_school: null, ce_mode: null, ce_price: null, capacity: null })
    setSaving(true)
    let id = e?.id ?? null
    if (id) { const r = await updateEvent(id, input); if (r.error) { setSaving(false); setErr(friendly(r.error)); return } }
    else { const r = await createEvent(input, meId); if (r.error || !r.id) { setSaving(false); setErr(friendly(r.error ?? 'no id returned')); return }; id = r.id }
    const s1 = await saveSpeakers(id, speakers); if (s1.error) { setSaving(false); setErr('Event saved, but speakers were refused: ' + s1.error.slice(0, 140)); return }
    const s2 = await saveSessions(id, sessions); if (s2.error) { setSaving(false); setErr('Event saved, but sessions were refused: ' + s2.error.slice(0, 140)); return }
    setSaving(false)
    onSaved(status === 'published' ? (e ? 'Saved — live on the public site.' : 'Created and published.') : (e ? 'Saved as draft.' : 'Created as draft.'))
  }
  const idx = STEPS.findIndex((s) => s[0] === step)
  const go = (s: Step) => { setStep(s); bodyRef.current?.scrollTo({ top: 0 }) }
  const venue = venues.find((x) => x.id === v.location_id)

  return (
    <div className="cert-veil" onClick={(ev) => ev.target === ev.currentTarget && onClose()}>
      <div className="cert-modal evt-form" role="dialog" aria-modal="true">
        <div className="mh"><div><span className="evt-kick">{e ? 'Edit event' : 'Create new event'}</span><h3>{v.title || 'New event'}</h3></div><button type="button" className="x" aria-label="Close" onClick={onClose}>×</button></div>
        <div className="evt-tabs">{STEPS.map(([k, l]) => <button type="button" key={k} className={step === k ? 'on' : ''} onClick={() => go(k)}>{l}</button>)}</div>
        <div className="mb" ref={bodyRef}>
          {err && <div className="cert-err">{err}</div>}
          <div className="cert-grid mform evt-grid">
            {step === 'basics' && <>
              <F l="TITLE *" full><input className="fi" value={v.title} onChange={txt('title')} placeholder="e.g. Fundamental 1 — Des Moines" /></F>
              <F l="SUBTITLE" full><input className="fi" value={v.subtitle ?? ''} onChange={txt('subtitle')} placeholder="One line shown under the title" /></F>
              <F l="EVENT TYPE"><select className="fi" value={v.event_type ?? 'seminar'} onChange={txt('event_type')}>{TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></F>
              {gov ? <F l="COMMITTEE"><select className="fi" value={v.committee_id ?? ''} onChange={(ev) => set('committee_id', ev.target.value ? Number(ev.target.value) : null)}><option value="">— none —</option>{committees.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></F>
                : <F l="CATEGORY"><select className="fi" value={v.category ?? ''} onChange={txt('category')}><option value="">— choose —</option>{CATEGORIES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></F>}
              <F l="AUDIENCE"><input className="fi" value={v.audience ?? ''} onChange={txt('audience')} placeholder="Doctors & Students" /></F>
              <F l="PUBLIC URL"><div className="evt-slug"><span>/seminars/</span><input className="fi" value={v.slug ?? ''} onChange={txt('slug')} placeholder="auto from title" /></div></F>
              <div className="full evt-togrow"><Tog on={!!v.is_keystone} onChange={chk('is_keystone')} l="Keystone event" sub="Highlighted on the Overview pulse" /></div>
            </>}
            {step === 'when' && <>
              <F l="STARTS *"><input className="fi" type="datetime-local" value={toLocal(v.starts_at, v.timezone)} onChange={dt('starts_at')} /></F>
              <F l="ENDS"><input className="fi" type="datetime-local" value={toLocal(v.ends_at, v.timezone)} onChange={dt('ends_at')} /></F>
              <F l="TIME ZONE"><select className="fi" value={v.timezone ?? 'America/New_York'} onChange={txt('timezone')}>{TIMEZONES.map((t) => <option key={t} value={t}>{t.replace('America/', '').replace('_', ' ')}</option>)}</select></F>
              {gov ? <F l="ZOOM LINK"><input className="fi" type="url" value={v.zoom_url ?? ''} onChange={txt('zoom_url')} placeholder="https://zoom.us/j/…" /></F>
                : <F l="CAPACITY"><input className="fi" type="number" min={0} value={v.capacity ?? ''} onChange={num('capacity')} placeholder="no cap" /></F>}
              {!gov && <><F l="REGISTRATION OPENS"><input className="fi" type="datetime-local" value={toLocal(v.reg_opens, v.timezone)} onChange={dt('reg_opens')} /></F>
                <F l="REGISTRATION CLOSES" hint="Blank = open until the event starts"><input className="fi" type="datetime-local" value={toLocal(v.reg_closes, v.timezone)} onChange={dt('reg_closes')} /></F></>}
              <div className="cert-fh full">Venue</div>
              <F l="VENUE" full><select className="fi" value={v.location_id ?? ''} onChange={(ev) => { const id = ev.target.value ? Number(ev.target.value) : null; const l = venues.find((x) => x.id === id); setV((s) => ({ ...s, location_id: id, location: s.location || (l ? `${l.name} · ${l.city}, ${l.state}` : '') })) }}><option value="">— pick from the venue list, or leave blank —</option>{venues.map((l) => <option key={l.id} value={l.id}>{l.name} — {l.city}, {l.state}</option>)}</select></F>
              <F l="LOCATION AS SHOWN ON THE SITE" full hint={venue ? `${venue.address ?? ''}${venue.address ? ', ' : ''}${venue.city ?? ''}, ${venue.state ?? ''}` : undefined}><input className="fi" value={v.location ?? ''} onChange={txt('location')} placeholder="Tampa, FL · Pierce Clinic" /></F>
              {!gov && (rb ? <><div className="cert-fh full">Room block</div><F l="HOTEL" full><input className="fi" value={v.room_block_hotel ?? ''} onChange={txt('room_block_hotel')} /></F><F l="RATE"><input className="fi" value={v.room_block_rate ?? ''} onChange={txt('room_block_rate')} placeholder="$119 (2-room suite)" /></F><F l="BOOK BY"><input className="fi" type="date" value={v.room_block_by ?? ''} onChange={(ev) => set('room_block_by', ev.target.value || null)} /></F></>
                : <div className="full"><button type="button" className="flink" onClick={() => setRb(true)}>+ Add a room block</button></div>)}
              {!gov && <F l="ZOOM LINK (ONLINE EVENTS)" full><input className="fi" type="url" value={v.zoom_url ?? ''} onChange={txt('zoom_url')} placeholder="https://zoom.us/j/…" /></F>}
            </>}
            {step === 'price' && (gov ? <p className="muted full">Board, committee and deadline items have no pricing or CE.</p> : <>
              <F l="DOCTORS ($)"><input className="fi" type="number" min={0} value={v.price ?? ''} onChange={num('price')} placeholder="0 = free" /></F>
              <F l="MEMBERS ($)"><input className="fi" type="number" min={0} value={v.member_price ?? ''} onChange={num('member_price')} placeholder="blank = same as doctors" /></F>
              <F l="STUDENTS ($)"><input className="fi" type="number" min={0} value={v.student_price ?? ''} onChange={num('student_price')} /></F>
              <div className="full evt-togrow"><Tog on={!!v.free_with_membership} onChange={chk('free_with_membership')} l="Free with membership" sub="Current members pay nothing" /><Tog on={!!v.faculty_free} onChange={chk('faculty_free')} l="Faculty free" sub="College faculty attend free" /><Tog on={!!v.early_bird} onChange={chk('early_bird')} l="Early-bird price" sub="Lower price until a date" /></div>
              {v.early_bird && <><F l="EARLY-BIRD PRICE ($)"><input className="fi" type="number" min={0} value={v.early_bird_price ?? ''} onChange={num('early_bird_price')} /></F><F l="EARLY-BIRD ENDS"><input className="fi" type="datetime-local" value={toLocal(v.early_bird_until, v.timezone)} onChange={dt('early_bird_until')} /></F></>}
              <div className="cert-fh full">Continuing education</div>
              <div className="full evt-togrow"><Tog on={!!v.ce_credits} onChange={chk('ce_credits')} l="CE credits offered" sub="Shows the CE chip on the card and site" /></div>
              {v.ce_credits && <><F l="SPONSORING SCHOOL"><input className="fi" value={v.ce_school ?? ''} onChange={txt('ce_school')} placeholder="e.g. Sherman College" /></F>
                <F l="HOW CE IS CHARGED"><select className="fi" value={v.ce_mode ?? ''} onChange={txt('ce_mode')}><option value="">—</option><option value="included">Included in price</option><option value="addon">Paid add-on</option></select></F>
                {v.ce_mode === 'addon' && <F l="CE ADD-ON ($)"><input className="fi" type="number" min={0} value={v.ce_price ?? ''} onChange={num('ce_price')} /></F>}</>}
            </>)}
            {step === 'content' && <>
              <F l="ABOUT" full><textarea className="fi" rows={7} value={v.description ?? ''} onChange={txt('description')} placeholder="What the event is, who it is for, what they will leave with." /></F>
              <F l="AGENDA" full hint="One line per item. For a timed schedule with CE hours, use Sessions instead."><textarea className="fi" rows={4} value={v.agenda ?? ''} onChange={txt('agenda')} placeholder={'Day 1: Fundamentals I\nDay 2: Fundamentals II'} /></F>
              {!gov && <><F l="PREREQUISITES" full><input className="fi" value={v.prerequisites ?? ''} onChange={txt('prerequisites')} placeholder="e.g. Fundamental 1" /></F>
                <F l="REFUND POLICY" full><textarea className="fi" rows={2} value={v.refund_policy ?? ''} onChange={txt('refund_policy')} /></F></>}
              <F l="VIDEO URL" full><input className="fi" type="url" value={v.video_url ?? ''} onChange={txt('video_url')} placeholder="YouTube / Mux link" /></F>
            </>}
            {step === 'people' && <>
              <div className="cert-fh full" style={{ borderTop: 0, paddingTop: 0 }}>Speakers</div>
              <div className="full evt-rows">{v.speakers.length === 0 && <p className="muted">No speakers yet.</p>}{v.speakers.map((s, i) => <SpeakerRow key={i} s={s} onChange={(n) => set('speakers', v.speakers.map((x, j) => (j === i ? n : x)))} onRemove={() => set('speakers', v.speakers.filter((_, j) => j !== i))} />)}</div>
              <div className="full"><button type="button" className="b s-btn on-light xs" onClick={() => set('speakers', [...v.speakers, { person_id: null, name: '', speaker_title: '', note: null, is_keynote: false, sort: v.speakers.length }])}>+ Add speaker</button> <span className="evt-hint" style={{ display: 'inline', marginLeft: 8 }}>Start typing a member's name to link their record and headshot.</span></div>
              <div className="cert-fh full">Sessions</div>
              <div className="full evt-rows">{v.sessions.length === 0 && <p className="muted">No timed sessions — the Agenda text is used instead.</p>}{v.sessions.map((s, i) => <div key={i} className="rr sess">
                <input className="fi" placeholder="Session title" value={s.title ?? ''} onChange={(ev) => set('sessions', v.sessions.map((x, j) => (j === i ? { ...x, title: ev.target.value } : x)))} />
                <input className="fi" type="datetime-local" value={toLocal(s.starts_at, v.timezone)} onChange={(ev) => set('sessions', v.sessions.map((x, j) => (j === i ? { ...x, starts_at: fromLocal(ev.target.value, v.timezone) } : x)))} />
                <input className="fi" type="datetime-local" value={toLocal(s.ends_at, v.timezone)} onChange={(ev) => set('sessions', v.sessions.map((x, j) => (j === i ? { ...x, ends_at: fromLocal(ev.target.value, v.timezone) } : x)))} />
                <input className="fi" type="number" step={0.5} min={0} placeholder="CE h" value={s.ce_hours ?? ''} onChange={(ev) => set('sessions', v.sessions.map((x, j) => (j === i ? { ...x, ce_hours: ev.target.value === '' ? null : Number(ev.target.value) } : x)))} />
                <button type="button" className="del" aria-label="Remove session" onClick={() => set('sessions', v.sessions.filter((_, j) => j !== i))}>×</button></div>)}</div>
              <div className="full"><button type="button" className="b s-btn on-light xs" onClick={() => set('sessions', [...v.sessions, { title: '', starts_at: v.starts_at || null, ends_at: null, ce_hours: null, speaker: null, sort: v.sessions.length }])}>+ Add session</button></div>
            </>}
            {step === 'images' && <>
              <div className="full evt-img"><div className="pv">{v.primary_image ? <img src={v.primary_image} alt="" onError={(ev) => (ev.currentTarget.style.display = 'none')} /> : 'HERO'}</div><F l="HERO IMAGE" hint="Shown at the top of the event page and popup. 1600×900 works best."><input className="fi" type="url" value={v.primary_image ?? ''} onChange={txt('primary_image')} placeholder="https://…" /></F></div>
              <div className="full evt-img"><div className="pv">{v.social_image ? <img src={v.social_image} alt="" onError={(ev) => (ev.currentTarget.style.display = 'none')} /> : 'SOCIAL'}</div><F l="SOCIAL SHARE IMAGE" hint="Used when the link is shared on Facebook or in email. 1200×630."><input className="fi" type="url" value={v.social_image ?? ''} onChange={txt('social_image')} /></F></div>
              <F l="GALLERY" full><textarea className="fi" rows={3} value={(v.gallery_images ?? []).join('\n')} onChange={(ev) => set('gallery_images', ev.target.value.split('\n').map((s) => s.trim()).filter(Boolean))} placeholder="One image URL per line" /></F>
            </>}
          </div>
        </div>
        <div className="mf evt-foot">
          <div className="r">{idx > 0 && <button type="button" className="b s-btn on-light sm" onClick={() => go(STEPS[idx - 1]![0])}>‹ {STEPS[idx - 1]![1]}</button>}{idx < STEPS.length - 1 && <button type="button" className="b s-btn on-light sm" onClick={() => go(STEPS[idx + 1]![0])}>{STEPS[idx + 1]![1]} ›</button>}{e && <button type="button" className="b dgr sm" onClick={() => onRemove(e)}>Remove</button>}</div>
          <div className="r"><button type="button" className="b s-btn on-light sm" onClick={onClose}>Cancel</button><button type="button" className="b s-btn on-light sm" disabled={saving} onClick={() => void save('draft')}>Save as draft</button><button type="button" className="b p-btn sm" disabled={saving} onClick={() => void save('published')}>{saving ? 'Saving…' : v.status === 'published' && e ? 'Save & keep live' : 'Publish live'}</button></div>
        </div>
      </div>
    </div>
  )
}

function F({ l, children, full = false, hint }: { l: string; children: React.ReactNode; full?: boolean; hint?: string }) {
  return <div className={full ? 'full' : ''}><label className="flabel">{l}</label>{children}{hint && <div className="evt-hint">{hint}</div>}</div>
}
function Tog({ on, onChange, l, sub }: { on: boolean; onChange: (ev: React.ChangeEvent<HTMLInputElement>) => void; l: string; sub?: string }) {
  return <label className={`evt-tog${on ? ' on' : ''}`}><input type="checkbox" checked={on} onChange={onChange} /><span><b>{l}</b>{sub && <small>{sub}</small>}</span></label>
}

function friendly(err: string): string {
  if (/events_slug_unique/.test(err)) return 'That public URL is already used by another event — change the slug on Basics.'
  if (/events_category_check/.test(err)) return 'Pick a category from the list.'
  if (/events_event_type_check/.test(err)) return 'Pick an event type from the list.'
  if (/row-level security/.test(err)) return 'The database did not allow that — only board, the executive director and the seminar committee chair can change events.'
  return 'The database refused the change: ' + err.slice(0, 160)
}

function SpeakerRow({ s, onChange, onRemove }: { s: Speaker; onChange: (s: Speaker) => void; onRemove: () => void }) {
  const [hits, setHits] = useState<PersonHit[]>([])
  const [openList, setOpenList] = useState(false)
  useEffect(() => {
    if (!openList || s.person_id || s.name.trim().length < 2) { setHits([]); return }
    const t = setTimeout(() => { void searchPeople(s.name).then(setHits) }, 180)
    return () => clearTimeout(t)
  }, [s.name, s.person_id, openList])
  return (
    <div className="rr">
      <div className="cert-who">
        <input className="fi" placeholder="Name" value={s.name} onChange={(ev) => { onChange({ ...s, name: ev.target.value, person_id: null }); setOpenList(true) }} onFocus={() => setOpenList(true)} onBlur={() => setTimeout(() => setOpenList(false), 150)} />
        {openList && hits.length > 0 && <div className="list" style={{ top: '100%' }}>{hits.map((h) => <div key={h.id} onMouseDown={() => { onChange({ ...s, name: `Dr. ${h.first_name ?? ''} ${h.last_name ?? ''}`.replace(/\s+/g, ' ').trim(), person_id: h.id }); setOpenList(false) }}>{h.first_name} {h.last_name}{h.credentials ? `, ${h.credentials}` : ''} <small>· link record</small></div>)}</div>}
        {s.person_id && <div className="evt-hint">Linked to member record</div>}
      </div>
      <input className="fi" placeholder="Title / role" value={s.speaker_title ?? ''} onChange={(ev) => onChange({ ...s, speaker_title: ev.target.value })} />
      <label className="cert-tog" style={{ marginTop: 0 }}><input type="checkbox" checked={!!s.is_keynote} onChange={(ev) => onChange({ ...s, is_keynote: ev.target.checked })} /> Keynote</label>
      <button type="button" className="del" aria-label="Remove speaker" onClick={onRemove}>×</button>
    </div>
  )
}
