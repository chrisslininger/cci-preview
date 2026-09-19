/* ----------------------------------------------------------------------------
 * Members — the roster the Institute runs on.
 *
 * Four tiles filter it: All · Current · Recently expired · Inactive. Someone
 * who has died counts under Inactive and is labelled Deceased, listed in a
 * short section beneath the living. Every list is alphabetical by first name
 * and searchable. Names open the full contact card with a running notes log.
 * -------------------------------------------------------------------------- */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAccess } from '@/lib/queries/AccessProvider'
import { useToast } from '@/components/ui/Toast'
import { displayName } from '@/lib/access'
import {
  roster, state, tabOf, fullName, activeBoard, currentInstructor, advoLevel, otherCerts,
  saveProfile, createMember, addNote, addLocation, endInstructor, endBoard,
} from '@/lib/queries/members'
import type { Member, Profile } from '@/lib/queries/members'

type Tab = 'all' | 'current' | 'recent' | 'inactive'
const TABS: [Tab, string][] = [['all', 'All members'], ['current', 'Current'], ['recent', 'Recently expired'], ['inactive', 'Inactive']]
const LVL: Record<string, string> = { student: 'Student', level_1: 'Level 1', level_2: 'Level 2', board_certification: 'Board Certified', certified: 'Certified' }
const fmt = (d?: string | null) => (d ? new Date(d.slice(0, 10) + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '')
const byFirst = (a: Member, b: Member) => a.first_name.localeCompare(b.first_name, undefined, { sensitivity: 'base' }) || a.last_name.localeCompare(b.last_name, undefined, { sensitivity: 'base' })
const Pill = ({ children, kind = '' }: { children: React.ReactNode; kind?: string }) => <span className={`cpill ${kind}`}>{children}</span>

function StatusPill({ p }: { p: Member }) {
  const s = state(p)
  if (s === 'deceased') return <span className="mpill dec">Deceased{p.deceased_on ? ` · ${p.deceased_on.slice(0, 4)}` : ''}</span>
  if (s === 'current') return <span className="mpill cur">Current{activeBoard(p) && !(p.membership_expires && p.membership_expires >= new Date().toISOString().slice(0, 10)) ? ' · board' : p.membership_expires ? ` · exp ${fmt(p.membership_expires)}` : ''}</span>
  if (s === 'recent') return <span className="mpill rec">Recently expired · {fmt(p.membership_expires)}</span>
  return <span className="mpill ina">Inactive{p.membership_expires ? ` · exp ${fmt(p.membership_expires)}` : ''}</span>
}
function Chips({ p }: { p: Member }) {
  const lvl = advoLevel(p), instr = currentInstructor(p)
  const roles = (p.person_roles ?? []).filter((r) => !(r.role_key === 'instructor' && instr))
  const gold = new Set(['committee_chair', 'board_member', 'executive_director', 'research_director', 'committee_cochair'])
  const label = (k: string) => ({ committee_chair: 'Committee Chair', committee_cochair: 'Co-chair', committee_member: 'Committee', research_director: 'Research Director' } as Record<string, string>)[k] ?? k.replace(/_/g, ' ')
  return <div className="cert-chips" style={{ marginBottom: 0 }}>
    {lvl && <Pill kind="ok">{LVL[lvl]}</Pill>}
    {otherCerts(p).map((c) => <Pill key={c.id} kind="ok">{c.level === 'board_certification' ? 'Board Certified' : `${c.technique} · Certified`}</Pill>)}
    {instr && <Pill kind="info">{instr.level === 'senior_instructor' ? 'Instructor L2' : 'Instructor'}</Pill>}
    {roles.map((r) => <Pill key={r.id} kind={gold.has(r.role_key) ? 'gold' : ''}>{label(r.role_key)}{r.committees?.name ? ` · ${r.committees.name.replace(' Committee', '')}` : ''}</Pill>)}
  </div>
}

export default function MembersPanel() {
  const toast = useToast()
  const { access, can } = useAccess()
  const me = displayName(access), meId = access.person?.id ?? null
  const canEdit = can('full_admin') || can('manage_leads') || can('board')
  const [rows, setRows] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('all')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const [edit, setEdit] = useState<Member | 'new' | null>(null)

  const load = useCallback(async () => {
    const r = await roster()
    setError(r.error ? `The roster could not be read — the database answered: ${r.error.slice(0, 200)}` : null)
    setRows(r.rows); setLoading(false)
  }, [])
  useEffect(() => { void load() }, [load])

  const counts = useMemo(() => { const c: Record<Tab, number> = { all: 0, current: 0, recent: 0, inactive: 0 }; for (const p of rows) { c.all++; c[tabOf(p) as Tab]++ } return c }, [rows])
  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return rows.filter((p) => (tab === 'all' || tabOf(p) === tab) && (!t || [fullName(p), `${p.first_name} ${p.last_name}`, p.practice_name, p.email, p.practice_address, p.practice_city].filter(Boolean).some((v) => String(v).toLowerCase().includes(t)))).sort(byFirst)
  }, [rows, tab, q])

  function exportCsv() {
    const cols = ['Last', 'First', 'Credentials', 'Status', 'Member since', 'Expires', 'Email', 'Mobile', 'Office', 'Practice', 'Address', 'Website', 'Techniques', 'AdvO level', 'Board', 'Instructor']
    const csv = [cols.join(','), ...list.map((p) => [p.last_name, p.first_name, p.credentials, state(p), p.member_since, p.membership_expires, p.email, p.mobile_phone, p.office_phone, p.practice_name, p.practice_address, p.practice_website, (p.techniques ?? []).join('; '), LVL[advoLevel(p)] ?? '', (p.board_service ?? []).map((b) => `${b.term_label ?? ''} ${b.status ?? ''}`).join('; '), currentInstructor(p)?.level ?? ''].map((x) => `"${String(x ?? '').replace(/"/g, '""')}"`).join(','))].join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = `members-${tab}-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(a.href)
  }

  if (loading) return <><h1>Members</h1><div className="ma-sub">Reading the roster…</div><div className="ma-panel"><p className="ma-empty">One moment.</p></div></>
  const tabLabel = TABS.find(([k]) => k === tab)![1]
  const living = list.filter((p) => !p.deceased_on), gone = list.filter((p) => p.deceased_on)
  const card = (p: Member) => (
    <div className={`cert-card${p.deceased_on ? ' dead' : ''}`} key={p.id}>
      <div className="cert-nm"><a href="#" onClick={(e) => { e.preventDefault(); setOpen(p.id) }}>{fullName(p)}</a><StatusPill p={p} /></div>
      <div className="mline">{[p.email ? <a key="e" href={`mailto:${p.email}`}>{p.email}</a> : null, p.mobile_phone, p.office_phone ?? p.practice_phone, p.practice_name].filter(Boolean).map((x, i, arr) => <span key={i}>{x}{i < arr.length - 1 ? ' · ' : ''}</span>)}</div>
      <Chips p={p} />
    </div>
  )
  const current = open ? rows.find((x) => x.id === open) ?? null : null

  return (
    <>
      <div className="cert-head">
        <div><h1>Members</h1><div className="ma-sub" style={{ marginBottom: 0, maxWidth: '80ch' }}>Paid members and current or former board members — {rows.length} total. The full prospect list is under Leads. Recently expired = lapsed within six months and reactivatable; Inactive = longer than that.</div></div>
        <div className="cert-actions">{canEdit && <button type="button" className="b p-btn sm" onClick={() => setEdit('new')}>+ Add member</button>}<button type="button" className="b s-btn on-light sm" onClick={exportCsv}>↓ Export {tab === 'all' ? 'all' : tabLabel.toLowerCase()}</button></div>
      </div>
      {error && <div className="cert-err" role="alert">{error}</div>}
      <div className="cert-tiles four">{TABS.map(([k, l]) => <button type="button" key={k} className={`cert-tile${tab === k ? ' on' : ''}`} onClick={() => setTab(k)} aria-pressed={tab === k}><span>{l}</span><b>{counts[k]}</b></button>)}</div>
      <div className="cert-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        <input type="text" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Escape' && setQ('')} autoComplete="off" placeholder={`Search ${tab === 'all' ? 'members' : tabLabel.toLowerCase()} by name, practice or email…`} aria-label="Search this list" />
        {q && <button type="button" className="clr" aria-label="Clear search" onClick={() => setQ('')}>×</button>}
        {q && <div className="cnt">{list.length} of {counts[tab]} match “{q}”</div>}
      </div>
      {list.length === 0 && <div className="cert-card" style={{ textAlign: 'center', color: 'var(--color-content-muted)', padding: 30 }}>{q ? `No one in ${tabLabel} matches “${q}”.` : 'No one in this list.'}</div>}
      {tab === 'inactive' ? <>{living.map(card)}{gone.length > 0 && <div className="msec">Deceased · {gone.length}</div>}{gone.map(card)}</> : list.map(card)}

      {current && <ContactCard p={current} me={me} meId={meId} canEdit={canEdit} onClose={() => setOpen(null)} onEdit={() => setEdit(current)} onChanged={load} />}
      {edit && <EditDialog p={edit === 'new' ? null : edit} onClose={() => setEdit(null)} onSaved={async (m) => { setEdit(null); await load(); toast(m) }} />}
    </>
  )
}

function ContactCard({ p, me, meId, canEdit, onClose, onEdit, onChanged }: { p: Member; me: string; meId: string | null; canEdit: boolean; onClose: () => void; onEdit: () => void; onChanged: () => Promise<void> }) {
  const toast = useToast()
  const [note, setNote] = useState('')
  const s = state(p), instr = currentInstructor(p), boards = p.board_service ?? [], active = boards.find((b) => b.status === 'active')
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k) }, [onClose])
  const KV = ({ k, v }: { k: string; v: React.ReactNode }) => <><span>{k}</span><div>{v ?? '—'}</div></>
  const fail = (r: { error?: string }) => { if (r.error) { toast('The database refused that change: ' + r.error.slice(0, 140)); return true } return false }
  const locs = (p.practice_locations ?? []).slice().sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
  return (
    <div className="cert-veil" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cert-modal wide cc" role="dialog" aria-modal="true">
        <div className="mh"><div><h3>{fullName(p)}</h3></div><button type="button" className="x" aria-label="Close" onClick={onClose}>×</button></div>
        <div className="mb">
          <div className="cert-chips"><StatusPill p={p} /></div><Chips p={p} />
          {canEdit && <div style={{ margin: '12px 0 0' }}><button type="button" className="b s-btn on-light xs" onClick={onEdit}>✎ Edit profile</button></div>}
          <div className="sec">Contact</div><div className="kv"><KV k="Email" v={p.email ? <a href={`mailto:${p.email}`}>{p.email}</a> : null} /><KV k="Mobile" v={p.mobile_phone} /><KV k="Office" v={p.office_phone ?? p.practice_phone} /></div>
          <div className="sec">Office location</div>
          <div className="loc"><b>{p.practice_name ?? 'No practice on file'}</b>{p.practice_name && <Pill kind="info">Primary</Pill>}<div className="kv" style={{ marginTop: 8 }}><KV k="Address" v={p.practice_address ?? ([p.practice_city, p.practice_state].filter(Boolean).join(', ') || null)} /><KV k="Website" v={p.practice_website ? <a href={/^https?:/.test(p.practice_website) ? p.practice_website : `https://${p.practice_website}`} target="_blank" rel="noopener">{p.practice_website}</a> : null} /></div></div>
          {locs.map((l) => <div className="loc" key={l.id}><b>{l.name}</b><div className="kv" style={{ marginTop: 8 }}><KV k="Address" v={l.address} /><KV k="Website" v={l.website} /></div></div>)}
          {canEdit && <button type="button" className="t-link" onClick={async () => { const n = prompt('Location name'); if (!n) return; const a = prompt('Address') ?? ''; const w = prompt('Website') ?? ''; if (!fail(await addLocation(p.id, n, a, w))) await onChanged() }}>+ Add second location</button>}
          <div className="sec">Classification</div><div className="kv"><KV k="Type" v={p.contact_type === 'student' ? 'Student' : 'Doctor'} /><KV k="Technique(s)" v={(p.techniques ?? []).join(', ') || null} />{instr && <KV k="Instructor track" v={instr.level === 'senior_instructor' ? 'Senior Instructor' : 'Instructor'} />}</div>
          <div className="sec">Membership</div><div className="kv"><KV k="Status" v={s === 'deceased' ? `Deceased${p.deceased_on ? ' · ' + fmt(p.deceased_on) : ''}` : s === 'current' ? <>Active member {activeBoard(p) && <Pill kind="ok">Board — complimentary</Pill>}</> : s === 'recent' ? 'Recently expired — reactivatable' : 'Inactive'} /><KV k="Member since" v={p.member_since} /><KV k="Expires" v={p.membership_expires} /></div>
          <div className="sec">Certifications</div><div className="kv">{(p.person_certifications ?? []).length === 0 && <KV k="—" v="None on file" />}{(p.person_certifications ?? []).map((c) => <KV key={c.id} k={c.technique} v={`${LVL[c.level] ?? c.level}${c.grandfathered ? ' · Grandfathered on ' + fmt(c.cert_date) : c.cert_date ? ' · ' + fmt(c.cert_date) : ''}${c.certificate_number ? ' · Certificate #' + c.certificate_number : ''}${c.certified_by && !c.grandfathered ? ' · ' + c.certified_by : ''}`} />)}</div>
          {instr && <><div className="sec">Instructor</div><div className="kv"><KV k={instr.technique ?? 'Advanced Orthogonal'} v={instr.level === 'senior_instructor' ? 'Senior Instructor' : 'Instructor'} /></div>{canEdit && <div className="act"><button type="button" className="b s-btn on-light xs" onClick={async () => { const why = prompt('Reason for ending instructor service'); if (why === null) return; if (!fail(await endInstructor(p, why))) { toast('Instructor service ended.'); await onChanged() } }}>End instructor service</button></div>}</>}
          {boards.length > 0 && <><div className="sec">Board service</div><div className="kv">{boards.map((b) => <KV key={b.id} k={b.term_label ?? `${b.term_start ?? ''}–${b.term_end ?? ''}`} v={b.status === 'active' ? 'Active board member' : b.status === 'nominee' ? 'Nominee' : 'Past board member'} />)}</div>{active && canEdit && <div className="act"><button type="button" className="b s-btn on-light xs" onClick={async () => { if (!confirm('End board service? The seat is vacated and they become a past board member.')) return; if (!fail(await endBoard(p))) { toast('Board service ended.'); await onChanged() } }}>End board service</button></div>}</>}
          <div className="sec">Notes (running log)</div>
          {p.notes && <div className="ma-row"><div><b style={{ fontWeight: 500 }}>{p.notes}</b><span>From the original record</span></div></div>}
          {(p.contact_notes ?? []).length === 0 && !p.notes && <p className="muted">No notes yet.</p>}
          {(p.contact_notes ?? []).slice().sort((a, b) => b.created_at.localeCompare(a.created_at)).map((n) => <div className="ma-row" key={n.id}><div><b style={{ fontWeight: 500 }}>{n.text}</b><span>{n.by_name ?? '—'} · {fmt(n.created_at)}</span></div></div>)}
          {canEdit && <><textarea className="fi" value={note} placeholder="Add a note…" onChange={(e) => setNote(e.target.value)} style={{ marginTop: 8, minHeight: 70 }} /><div className="act"><button type="button" className="b s-btn on-light sm" disabled={!note.trim()} onClick={async () => { if (!fail(await addNote(p.id, note.trim(), me, meId))) { setNote(''); await onChanged() } }}>Add note</button></div></>}
        </div>
      </div>
    </div>
  )
}

function EditDialog({ p, onClose, onSaved }: { p: Member | null; onClose: () => void; onSaved: (m: string) => void }) {
  const [v, setV] = useState<Record<string, string>>({
    first_name: p?.first_name ?? '', last_name: p?.last_name ?? '', credentials: p?.credentials ?? 'DC', contact_type: p?.contact_type ?? 'doctor',
    email: p?.email ?? '', mobile_phone: p?.mobile_phone ?? '', office_phone: p?.office_phone ?? '', practice_website: p?.practice_website ?? '',
    practice_name: p?.practice_name ?? '', practice_address: p?.practice_address ?? '', techniques: (p?.techniques ?? []).join(', '),
    status: p?.deceased_on ? 'deceased' : (p?.membership_status ?? 'active'), deceased_on: p?.deceased_on ?? '', member_since: p?.member_since ?? '', membership_expires: p?.membership_expires ?? '',
  })
  const [err, setErr] = useState<string | null>(null); const [saving, setSaving] = useState(false)
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k) }, [onClose])
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV((s) => ({ ...s, [k]: e.target.value }))
  async function save() {
    setErr(null); if (!v.first_name.trim() || !v.last_name.trim()) { setErr('First and last name are required.'); return }
    const dead = v.status === 'deceased'
    const prof: Profile = { first_name: v.first_name.trim(), last_name: v.last_name.trim(), credentials: v.credentials || null, contact_type: v.contact_type, email: v.email || null, mobile_phone: v.mobile_phone || null, office_phone: v.office_phone || null, practice_website: v.practice_website || null, practice_name: v.practice_name || null, practice_address: v.practice_address || null, techniques: v.techniques.split(',').map((s) => s.trim()).filter(Boolean), member_since: v.member_since || null, membership_expires: v.membership_expires || null, deceased_on: dead ? (v.deceased_on || new Date().toISOString().slice(0, 10)) : null }
    if (!dead) prof.membership_status = v.status
    setSaving(true); const r = p ? await saveProfile(p.id, prof) : await createMember(prof); setSaving(false)
    if (r.error) { setErr('The database refused the change: ' + r.error.slice(0, 160)); return }
    onSaved(p ? 'Saved.' : `${prof.first_name} ${prof.last_name} added.`)
  }
  return (
    <div className="cert-veil" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cert-modal wide" role="dialog" aria-modal="true">
        <div className="mh"><div><h3>{p ? `Edit — ${fullName(p)}` : 'Add a member'}</h3><p>The people record. Roles, board seats and certifications are managed from their own tabs.</p></div><button type="button" className="x" aria-label="Close" onClick={onClose}>×</button></div>
        <div className="mb">{err && <div className="cert-err">{err}</div>}
          <div className="cert-grid mform">
            <div className="cert-fh full" style={{ borderTop: 0, paddingTop: 0 }}>Identity</div><MF k="first_name" l="FIRST NAME" type="text" full={false} v={v} set={set} /><MF k="last_name" l="LAST NAME" type="text" full={false} v={v} set={set} /><MF k="credentials" l="CREDENTIALS" type="text" full={false} v={v} set={set} /><div><label className="flabel" htmlFor="m_type">TYPE</label><select className="fi" id="m_type" value={v.contact_type} onChange={set('contact_type')}><option value="doctor">Doctor</option><option value="student">Student</option></select></div>
            <div className="cert-fh full">Contact</div><MF k="email" l="EMAIL" type="email" full={false} v={v} set={set} /><MF k="mobile_phone" l="MOBILE" type="text" full={false} v={v} set={set} /><MF k="office_phone" l="OFFICE PHONE" type="text" full={false} v={v} set={set} /><MF k="practice_website" l="WEBSITE" type="text" full={false} v={v} set={set} />
            <div className="cert-fh full">Practice</div><MF k="practice_name" l="PRACTICE NAME" type="text" full={false} v={v} set={set} /><MF k="practice_address" l="ADDRESS" type="text" full={false} v={v} set={set} /><MF k="techniques" l="TECHNIQUES (COMMA SEPARATED)" type="text" full={true} v={v} set={set} />
            <div className="cert-fh full">Membership</div><div><label className="flabel" htmlFor="m_status">STATUS</label><select className="fi" id="m_status" value={v.status} onChange={set('status')}><option value="active">Active</option><option value="expired">Expired</option><option value="never">Never a member</option><option value="deceased">Deceased</option></select></div><MF k="deceased_on" l="DATE OF PASSING (IF DECEASED)" type="date" full={false} v={v} set={set} /><MF k="member_since" l="MEMBER SINCE" type="date" full={false} v={v} set={set} /><MF k="membership_expires" l="EXPIRES" type="date" full={false} v={v} set={set} />
          </div>
        </div>
        <div className="mf"><button type="button" className="b s-btn on-light sm" onClick={onClose}>Cancel</button><button type="button" className="b p-btn sm" disabled={saving} onClick={() => void save()}>{saving ? 'Saving…' : 'Save'}</button></div>
      </div>
    </div>
  )
}

/** Module-level so React keeps the input mounted (and focused) between keystrokes. */
function MF({ k, l, type, full, v, set }: { k: string; l: string; type: string; full: boolean; v: Record<string, string>; set: (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void }) {
  return <div className={full ? 'full' : ''}><label className="flabel" htmlFor={`m_${k}`}>{l}</label><input className="fi" id={`m_${k}`} type={type} value={v[k] ?? ''} onChange={set(k)} /></div>
}
