/* ----------------------------------------------------------------------------
 * Personal Information — a member's own name, phones and home address.
 *
 * Reads the member's own `people` row (matched by their sign-in) and saves
 * through `update_my_info`, a database function that changes only these
 * fields on the signed-in member's row. The home address columns are new; until
 * they and the function exist, saving says so and offers the contact form.
 * Email is the address they sign in with, so it is shown but not edited here.
 * -------------------------------------------------------------------------- */
import { useEffect, useState } from 'react'
import { Link } from '@/lib/router'
import { useAccess } from '@/lib/queries/AccessProvider'
import { select, ensureSession, headers, session, SB_URL } from '@/lib/supabase'

type Form = {
  first: string; last: string; credentials: string; mobile: string; personal: string
  address: string; city: string; state: string; zip: string
}
const EMPTY: Form = { first: '', last: '', credentials: '', mobile: '', personal: '', address: '', city: '', state: '', zip: '' }

type Own = { first_name: string | null; last_name: string | null; credentials: string | null; email: string | null; mobile_phone: string | null; personal_phone: string | null }
type Home = { home_address: string | null; home_city: string | null; home_state: string | null; home_zip: string | null }

async function saveInfo(v: Form): Promise<{ ok?: true; missing?: true; error?: string }> {
  await ensureSession()
  const res = await fetch(`${SB_URL}/rest/v1/rpc/update_my_info`, {
    method: 'POST',
    headers: headers(true),
    body: JSON.stringify({
      p_first_name: v.first, p_last_name: v.last, p_credentials: v.credentials, p_mobile_phone: v.mobile, p_personal_phone: v.personal,
      p_home_address: v.address, p_home_city: v.city, p_home_state: v.state.toUpperCase(), p_home_zip: v.zip,
    }),
  })
  if (res.ok) return { ok: true }
  const text = await res.text()
  if (res.status === 404 || text.includes('PGRST202')) return { missing: true }
  return { error: text }
}

export default function MyInfoPanel() {
  const access = useAccess()
  const signedIn = !!access.person
  const [v, setV] = useState<Form>(EMPTY)
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'loading' | 'ready' | 'saving' | 'saved' | 'missing' | 'error'>('loading')
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!signedIn) return
    void (async () => {
      await ensureSession()
      const me = `auth_user_id=eq.${session.user?.id ?? ''}`
      const [r, h] = await Promise.all([
        select<Own>('people', `select=first_name,last_name,credentials,email,mobile_phone,personal_phone&${me}`),
        // The home address columns may not exist yet; an error here just leaves those boxes empty.
        select<Home>('people', `select=home_address,home_city,home_state,home_zip&${me}`),
      ])
      const p = r.data?.[0]
      const home = h.data?.[0]
      const a = access.person
      setV({
        first: p?.first_name ?? a?.first_name ?? '', last: p?.last_name ?? a?.last_name ?? '', credentials: p?.credentials ?? a?.credentials ?? '',
        mobile: p?.mobile_phone ?? '', personal: p?.personal_phone ?? '',
        address: home?.home_address ?? '', city: home?.home_city ?? '', state: home?.home_state ?? '', zip: home?.home_zip ?? '',
      })
      setEmail(p?.email ?? a?.email ?? session.user?.email ?? '')
      setState('ready')
    })()
  }, [signedIn])

  const busy = state === 'loading' || state === 'saving'
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => { setV({ ...v, [k]: e.target.value }); if (!busy) setState('ready') }
  const field = (k: keyof Form, label: string, opts: { full?: boolean; type?: string; placeholder?: string } = {}) => (
    <div className={opts.full ? 'full' : ''}>
      <label className="flabel" htmlFor={`mi-${k}`}>{label}</label>
      <input id={`mi-${k}`} className="fi" type={opts.type ?? 'text'} value={v[k]} onChange={set(k)} placeholder={opts.placeholder} disabled={busy} />
    </div>
  )

  async function save() {
    if (!v.first.trim() || !v.last.trim()) { setErr('First and last name are needed.'); setState('error'); return }
    setState('saving'); setErr('')
    const r = await saveInfo(v)
    if (r.ok) setState('saved')
    else if (r.missing) setState('missing')
    else { setErr(r.error ?? 'Could not save.'); setState('error') }
  }

  return (
    <>
      <h1>Personal Information</h1>
      <div className="ma-sub">
        How the Institute reaches you. None of this appears in the public directory; your clinic details are under{' '}
        <a href="#mylisting">Business Information</a>.
      </div>
      <div className="ma-panel">
        {state === 'error' && err && <div className="cert-err">{err}</div>}
        <div className="cert-grid mform ml-form">
          <div className="full mi-name">
            {field('first', 'FIRST NAME')}
            {field('last', 'LAST NAME')}
            {field('credentials', 'CREDENTIALS', { placeholder: 'DC' })}
          </div>
          <div className="full">
            <label className="flabel" htmlFor="mi-email">EMAIL</label>
            <input id="mi-email" className="fi" type="email" value={email} disabled />
            <div className="evt-hint">This is the address you sign in with. To change it, <Link to="/contact">contact us</Link>.</div>
          </div>
          {field('mobile', 'MOBILE PHONE', { type: 'tel' })}
          {field('personal', 'HOME PHONE', { type: 'tel' })}
          {field('address', 'HOME ADDRESS', { full: true, placeholder: 'Street' })}
          <div className="full ml-place">
            {field('city', 'CITY')}
            {field('state', 'STATE')}
            {field('zip', 'ZIP')}
          </div>
        </div>
        <div className="ml-actions">
          <button type="button" className="b sm p-btn" onClick={() => void save()} disabled={busy}>
            {state === 'saving' ? 'Saving…' : 'Save personal information'}
          </button>
          {state === 'saved' && <span className="ml-ok">Saved.</span>}
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
