/* ----------------------------------------------------------------------------
 * The Directory as a member sees it — fellow current members, read-only (#67).
 * Staff get the full records instead (DirectoryPanel).
 *
 * Reads `member_directory()`, a database function that returns every current
 * member's name, credentials, level, photo and clinic (public anyway), plus
 * only the personal details each one allows members to see (My Account →
 * Personal). The database decides
 * what comes back; this page only lays it out and searches it. Until the
 * function exists the page says it is being switched on.
 * -------------------------------------------------------------------------- */
import { useEffect, useMemo, useState } from 'react'
import { ensureSession, headers, SB_URL } from '@/lib/supabase'
import { stateLabel } from '@/lib/queries/directory'

type Row = {
  person_id: string; first_name: string; last_name: string; credentials: string | null; cert_level: string | null; photo_url: string | null
  clinic_name: string | null; clinic_address: string | null; clinic_city: string | null; clinic_state: string | null; clinic_zip: string | null
  clinic_phone: string | null; office_email: string | null; clinic_website: string | null
  professional_email: string | null; personal_email: string | null; mobile_phone: string | null; home_phone: string | null
  home_address: string | null; home_city: string | null; home_state: string | null; home_zip: string | null
}

const LEVEL_CHIP: Record<string, { kind: string; label: string }> = {
  level_2: { kind: 'gold', label: 'Certified Level 2' },
  level_1: { kind: 'cert', label: 'Certified Level 1' },
}

const tel = (n: string) => `tel:${n.replace(/[^\d+]/g, '')}`
const webHost = (url: string) => url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '')
const href = (url: string) => (/^https?:\/\//.test(url) ? url : `https://${url}`)
const place = (city: string | null, state: string | null, zip: string | null) => [city, [state, zip].filter(Boolean).join(' ')].filter(Boolean).join(', ')
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘`]/g, "'").toLowerCase()

async function fetchMembers(): Promise<{ rows: Row[]; missing?: true; error?: string }> {
  await ensureSession()
  const res = await fetch(`${SB_URL}/rest/v1/rpc/member_directory`, { method: 'POST', headers: headers(true), body: '{}' })
  if (res.ok) return { rows: (await res.json()) as Row[] }
  const text = await res.text()
  if (res.status === 404 || text.includes('PGRST202')) return { rows: [], missing: true }
  return { rows: [], error: text }
}

function Face({ r }: { r: Row }) {
  const [broken, setBroken] = useState(false)
  const initials = `${r.first_name?.[0] ?? ''}${r.last_name?.[0] ?? ''}`.toUpperCase() || '·'
  return <span className="mdir-av" aria-hidden="true">{r.photo_url && !broken ? <img src={r.photo_url} alt="" loading="lazy" onError={() => setBroken(true)} /> : initials}</span>
}

function Card({ r }: { r: Row }) {
  const chip = r.cert_level ? LEVEL_CHIP[r.cert_level] : undefined
  const clinicPlace = place(r.clinic_city, r.clinic_state, r.clinic_zip)
  const homePlace = place(r.home_city, r.home_state, r.home_zip)
  const personal = [
    r.professional_email && <a key="w" href={`mailto:${r.professional_email}`}>{r.professional_email} <small>professional</small></a>,
    r.personal_email && <a key="e" href={`mailto:${r.personal_email}`}>{r.personal_email} <small>personal</small></a>,
    r.mobile_phone && <a key="m" href={tel(r.mobile_phone)}>{r.mobile_phone} <small>mobile</small></a>,
    r.home_phone && <a key="h" href={tel(r.home_phone)}>{r.home_phone} <small>home</small></a>,
  ].filter(Boolean)
  const hasClinic = r.clinic_name || r.clinic_address || clinicPlace || r.clinic_phone || r.office_email || r.clinic_website
  return (
    <article className={`mdir-card ${r.cert_level === 'level_2' ? 'l2' : r.cert_level === 'level_1' ? 'l1' : ''}`}>
      <div className="mdir-head">
        <Face r={r} />
        <div>
          <h3>Dr. {r.first_name} {r.last_name}{r.credentials ? `, ${r.credentials}` : ''}</h3>
          <span className={`cpill ${chip?.kind ?? ''}`}>{chip?.label ?? 'Member'}</span>
        </div>
      </div>
      {hasClinic && (
        <div className="mdir-sec">
          {r.clinic_name && <b>{r.clinic_name}</b>}
          {(r.clinic_address || clinicPlace) && <p>{r.clinic_address && <>{r.clinic_address}<br /></>}{clinicPlace}</p>}
          <div className="mdir-links">
            {r.clinic_phone && <a href={tel(r.clinic_phone)}>{r.clinic_phone}</a>}
            {r.office_email && <a href={`mailto:${r.office_email}`}>{r.office_email}</a>}
            {r.clinic_website && <a href={href(r.clinic_website)} target="_blank" rel="noopener noreferrer">{webHost(r.clinic_website)}</a>}
          </div>
        </div>
      )}
      {(personal.length > 0 || r.home_address || homePlace) && (
        <div className="mdir-sec">
          <span className="mdir-lbl">Direct</span>
          <div className="mdir-links">{personal}</div>
          {(r.home_address || homePlace) && <p>{r.home_address && <>{r.home_address}<br /></>}{homePlace}</p>}
        </div>
      )}
      {!hasClinic && personal.length === 0 && !r.home_address && !homePlace && <p className="mdir-none">No contact details shared.</p>}
    </article>
  )
}

export default function MemberDirectoryPanel() {
  const [data, setData] = useState<{ rows: Row[]; missing?: true; error?: string } | null>(null)
  const [q, setQ] = useState('')

  useEffect(() => {
    let cancelled = false
    void fetchMembers().then((d) => { if (!cancelled) setData(d) })
    return () => { cancelled = true }
  }, [])

  const hits = useMemo(() => {
    const words = fold(q).split(/\s+/).filter(Boolean)
    if (!data || !words.length) return data?.rows ?? []
    return data.rows.filter((r) => {
      const hay = fold([
        r.first_name, r.last_name, r.credentials, r.clinic_name, r.clinic_city, r.clinic_state, r.clinic_state && stateLabel(r.clinic_state), r.clinic_zip,
        r.home_city, r.home_state,
      ].filter(Boolean).join(' '))
      return words.every((w) => hay.includes(w))
    })
  }, [data, q])

  return (
    <>
      <h1>Directory</h1>
      <div className="ma-sub">
        Current members of the Institute, their clinics, and any direct contact details each has chosen to share with
        members. To change what others see of you, open <a href="#myinfo">Personal Information</a>.
      </div>
      <div className="ma-panel">
        {!data && <p className="ma-empty">Loading the directory…</p>}
        {data?.missing && <p className="ma-empty">The Directory is being switched on for members. Check back soon.</p>}
        {data?.error && <div className="cert-err">Could not load the directory. {data.error}</div>}
        {data && !data.missing && !data.error && (
          <>
            <div className="dir-bar mdir-bar">
              <input className="fi" type="search" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Escape' && setQ('')}
                placeholder="Name, clinic, city or state…" aria-label="Search the Directory" autoComplete="off" />
            </div>
            <p className="dir-count">
              {q.trim() ? `${hits.length} of ${data.rows.length} members` : `${data.rows.length} members`}
            </p>
            {data.rows.length === 0 && <p className="ma-empty">Only current members can see the Directory.</p>}
            <div className="mdir-grid">
              {hits.map((r) => <Card r={r} key={r.person_id} />)}
            </div>
          </>
        )}
      </div>
    </>
  )
}
