/* ----------------------------------------------------------------------------
 * Business Information — a member's own entry in the public directory (Find a Doctor).
 *
 * Reads the member's own `people` row and saves through `update_my_listing`,
 * a database function that changes only the clinic fields of the signed-in
 * member's row — a member cannot touch their level or membership from here.
 * Until that function exists, saving says so and offers the contact form.
 * -------------------------------------------------------------------------- */
import { useEffect, useState } from 'react'
import { Link } from '@/lib/router'
import { useAccess } from '@/lib/queries/AccessProvider'
import { select, ensureSession, headers, session, SB_URL } from '@/lib/supabase'
import { CERT_LABEL } from '@/lib/chips'

type Own = {
  practice_name: string | null; practice_address: string | null; practice_city: string | null; practice_state: string | null
  practice_zip: string | null; practice_phone: string | null; office_phone: string | null; practice_website: string | null; cert_level: string | null
}
type Form = { name: string; address: string; city: string; state: string; zip: string; phone: string; email: string; website: string }

const EMPTY: Form = { name: '', address: '', city: '', state: '', zip: '', phone: '', email: '', website: '' }

async function saveListing(v: Form): Promise<{ ok?: true; missing?: true; error?: string }> {
  await ensureSession()
  const res = await fetch(`${SB_URL}/rest/v1/rpc/update_my_listing`, {
    method: 'POST',
    headers: headers(true),
    body: JSON.stringify({ p_name: v.name, p_address: v.address, p_city: v.city, p_state: v.state.toUpperCase(), p_zip: v.zip, p_phone: v.phone, p_email: v.email.trim().toLowerCase(), p_website: v.website }),
  })
  if (res.ok) return { ok: true }
  const text = await res.text()
  if (res.status === 404 || text.includes('PGRST202')) return { missing: true }
  return { error: text }
}

export default function MyListingPanel() {
  const { access } = useAccess()
  const id = access.person?.id
  const [v, setV] = useState<Form>(EMPTY)
  const [level, setLevel] = useState<string | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'saving' | 'saved' | 'missing' | 'error'>('loading')
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!id) return
    void (async () => {
      await ensureSession()
      const [r, m] = await Promise.all([
        select<Own>('people', `select=practice_name,practice_address,practice_city,practice_state,practice_zip,practice_phone,office_phone,practice_website,cert_level&id=eq.${id}`),
        // practice_email is new; until it exists this just leaves the box empty.
        select<{ practice_email: string | null }>('people', `select=practice_email&id=eq.${id}`),
      ])
      const p = r.data?.[0]
      if (p) {
        setV({ name: p.practice_name ?? '', address: p.practice_address ?? '', city: p.practice_city ?? '', state: p.practice_state ?? '', zip: p.practice_zip ?? '', phone: p.office_phone ?? p.practice_phone ?? '', email: m.data?.[0]?.practice_email ?? '', website: p.practice_website ?? '' })
        setLevel(p.cert_level)
      } else {
        // Fall back to what the members area already knows.
        const a = access.person
        setV({ ...EMPTY, name: a?.practice_name ?? '', city: a?.practice_city ?? '', state: a?.practice_state ?? '' })
        setLevel(a?.cert_level ?? null)
      }
      setState('ready')
    })()
  }, [id])

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => { setV({ ...v, [k]: e.target.value }); if (state !== 'loading') setState('ready') }
  const field = (k: keyof Form, label: string, opts: { full?: boolean; type?: string; placeholder?: string } = {}) => (
    <div className={opts.full ? 'full' : ''}>
      <label className="flabel" htmlFor={`ml-${k}`}>{label}</label>
      <input id={`ml-${k}`} className="fi" type={opts.type ?? 'text'} value={v[k]} onChange={set(k)} placeholder={opts.placeholder} disabled={state === 'loading' || state === 'saving'} />
    </div>
  )

  async function save() {
    if (v.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) { setErr('The clinic email does not look like an email address.'); setState('error'); return }
    if (!v.name.trim() || !v.address.trim() || !v.city.trim() || !v.state.trim()) { setErr('Clinic name, street, city and state are needed for the directory.'); setState('error'); return }
    setState('saving'); setErr('')
    const r = await saveListing(v)
    if (r.ok) setState('saved')
    else if (r.missing) setState('missing')
    else { setErr(r.error ?? 'Could not save.'); setState('error') }
  }

  const levelText = level === 'level_2' || level === 'level_1' ? CERT_LABEL[level] : 'Member'

  return (
    <>
      <h1>Business Information</h1>
      <div className="ma-sub">
        Your clinic as patients see it in <Link to="/find-a-doctor">Find a Doctor</Link>. Every current member is listed; certified doctors show their level.
      </div>
      <div className="ma-panel">
        <div className="ma-row">
          <div><b>Shown as</b><span>{levelText} · your certification level is kept by the Institute</span></div>
        </div>
        {state === 'error' && err && <div className="cert-err">{err}</div>}
        <div className="cert-grid mform ml-form">
          {field('name', 'CLINIC NAME', { full: true })}
          {field('address', 'STREET ADDRESS', { full: true, placeholder: '123 Main St, Suite 4' })}
          <div className="full ml-place">
            {field('city', 'CITY')}
            {field('state', 'STATE', { placeholder: 'FL' })}
            {field('zip', 'ZIP')}
          </div>
          {field('phone', 'CLINIC PHONE', { type: 'tel' })}
          {field('email', 'CLINIC EMAIL', { type: 'email', placeholder: 'Shown to patients' })}
          {field('website', 'WEBSITE', { full: true, placeholder: 'yourclinic.com' })}
        </div>
        <div className="ml-actions">
          <button type="button" className="b sm p-btn" onClick={() => void save()} disabled={state === 'loading' || state === 'saving'}>
            {state === 'saving' ? 'Saving…' : 'Save business information'}
          </button>
          {state === 'saved' && <span className="ml-ok">Saved. Find a Doctor shows the change right away.</span>}
          {state === 'missing' && (
            <span className="ml-wait">
              Saving from here is being switched on. Until then, <Link to="/contact">send us the change</Link> and we will update it.
            </span>
          )}
        </div>
      </div>
    </>
  )
}
