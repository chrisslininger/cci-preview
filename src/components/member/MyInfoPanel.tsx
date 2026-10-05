/* ----------------------------------------------------------------------------
 * Personal Information — a member's own name, phones and home address.
 *
 * Reads the member's own `people` row (matched by their sign-in) and saves
 * through `update_my_info`, a database function that changes only these
 * fields on the signed-in member's row. The home address columns are new; until
 * they and the function exist, saving says so and offers the contact form.
 *
 * Emails: the sign-in address changes through Supabase Auth, which mails a
 * confirmation link first. Extra addresses, and whether other members may see
 * each one, live in `person_emails` and save through `save_my_emails`. The
 * public email is the clinic's, under Business Information.
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
type Email = { email: string; show_members: boolean }

const looksLikeEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())
const missingFn = (status: number, text: string) => status === 404 || text.includes('PGRST202') || text.includes('PGRST205')

async function saveEmails(rows: Email[]): Promise<{ ok?: true; missing?: true; error?: string }> {
  await ensureSession()
  const res = await fetch(`${SB_URL}/rest/v1/rpc/save_my_emails`, {
    method: 'POST',
    headers: headers(true),
    body: JSON.stringify({ p_emails: rows.map((r) => ({ ...r, email: r.email.trim().toLowerCase() })) }),
  })
  if (res.ok) return { ok: true }
  const text = await res.text()
  return missingFn(res.status, text) ? { missing: true } : { error: text }
}

/** Supabase Auth mails a confirmation link to the new address; the sign-in changes when it is clicked. */
async function changeSignInEmail(email: string): Promise<{ ok?: true; error?: string }> {
  await ensureSession()
  const res = await fetch(`${SB_URL}/auth/v1/user?redirect_to=${encodeURIComponent(`${window.location.origin}/account`)}`, {
    method: 'PUT',
    headers: headers(true),
    body: JSON.stringify({ email: email.trim() }),
  })
  if (res.ok) return { ok: true }
  try { const j = await res.json(); return { error: String(j.msg ?? j.message ?? j.error_description ?? res.status) } } catch { return { error: String(res.status) } }
}

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
  if (missingFn(res.status, text)) return { missing: true }
  return { error: text }
}

export default function MyInfoPanel() {
  const { access } = useAccess()
  const id = access.person?.id
  const [v, setV] = useState<Form>(EMPTY)
  const [email, setEmail] = useState('')
  const [emails, setEmails] = useState<Email[]>([])
  const [loginMsg, setLoginMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'saving' | 'saved' | 'missing' | 'error'>('loading')
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!id) return
    void (async () => {
      await ensureSession()
      const me = `id=eq.${id}`
      const [r, h, e] = await Promise.all([
        select<Own>('people', `select=first_name,last_name,credentials,email,mobile_phone,personal_phone&${me}`),
        // The home address columns and person_emails may not exist yet; an error just leaves those empty.
        select<Home>('people', `select=home_address,home_city,home_state,home_zip&${me}`),
        select<Email>('person_emails', `select=email,show_members&person_id=eq.${id}&order=created_at`),
      ])
      const p = r.data?.[0]
      const home = h.data?.[0]
      const a = access.person
      setV({
        first: p?.first_name ?? a?.first_name ?? '', last: p?.last_name ?? a?.last_name ?? '', credentials: p?.credentials ?? a?.credentials ?? '',
        mobile: p?.mobile_phone ?? '', personal: p?.personal_phone ?? '',
        address: home?.home_address ?? '', city: home?.home_city ?? '', state: home?.home_state ?? '', zip: home?.home_zip ?? '',
      })
      const login = session.user?.email ?? p?.email ?? a?.email ?? ''
      setEmail(login)
      // The sign-in address is always first; its sharing choices are stored like any other.
      const stored = e.data ?? []
      const first = stored.find((x) => x.email.toLowerCase() === login.toLowerCase()) ?? { email: login, show_members: false }
      setEmails([first, ...stored.filter((x) => x !== first)])
      setState('ready')
    })()
  }, [id])

  const busy = state === 'loading' || state === 'saving'
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => { setV({ ...v, [k]: e.target.value }); if (!busy) setState('ready') }
  const field = (k: keyof Form, label: string, opts: { full?: boolean; type?: string; placeholder?: string } = {}) => (
    <div className={opts.full ? 'full' : ''}>
      <label className="flabel" htmlFor={`mi-${k}`}>{label}</label>
      <input id={`mi-${k}`} className="fi" type={opts.type ?? 'text'} value={v[k]} onChange={set(k)} placeholder={opts.placeholder} disabled={busy} />
    </div>
  )

  const setEmailRow = (i: number, patch: Partial<Email>) => { setEmails((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x))); if (!busy) setState('ready') }

  async function save() {
    if (!v.first.trim() || !v.last.trim()) { setErr('First and last name are needed.'); setState('error'); return }
    const login = (emails[0]?.email ?? '').trim()
    if (!looksLikeEmail(login)) { setErr('Your sign-in email needs to be a full email address.'); setState('error'); return }
    const extra = emails.slice(1).filter((x) => x.email.trim())
    const bad = extra.find((x) => !looksLikeEmail(x.email))
    if (bad) { setErr(`"${bad.email}" doesn't look like an email address.`); setState('error'); return }
    setState('saving'); setErr(''); setLoginMsg(null)
    // A new sign-in email is not changed directly: Supabase Auth mails a confirmation link first.
    const loginChanged = login.toLowerCase() !== email.toLowerCase()
    const [r, m, l] = await Promise.all([saveInfo(v), saveEmails([emails[0]!, ...extra]), loginChanged ? changeSignInEmail(login) : Promise.resolve(null)])
    if (l) setLoginMsg(l.ok ? { ok: true, text: `We sent a confirmation link to ${login}. Your sign-in email changes once you click it.` } : { ok: false, text: l.error ?? 'Could not start the sign-in email change.' })
    if (r.error || m.error) { setErr(r.error ?? m.error ?? 'Could not save.'); setState('error') }
    else if (r.missing || m.missing) setState('missing')
    else setState('saved')
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
          <div className="full mi-emails">
            <label className="flabel">EMAIL</label>
            {emails.map((row, i) => (
              <div key={i} className="mi-email-wrap">
                <div className="mi-email">
                  <input className="fi" type="email" value={row.email} onChange={(e) => setEmailRow(i, { email: e.target.value })} placeholder={i === 0 ? 'you@example.com' : 'another@example.com'} disabled={busy} aria-label={i === 0 ? 'Email you sign in with' : `Email ${i + 1}`} />
                  <label className="mi-share"><input type="checkbox" checked={row.show_members} onChange={(e) => setEmailRow(i, { show_members: e.target.checked })} disabled={busy} /> Show to members</label>
                  {i === 0
                    ? <span className="mi-x-space" aria-hidden="true" />
                    : <button type="button" className="mi-x" aria-label="Remove this email" onClick={() => setEmails((s) => s.filter((_, j) => j !== i))} disabled={busy}>×</button>}
                </div>
                {i === 0 && <div className="evt-hint">You sign in to the members area with this email. If you change it, we send a confirmation link to the new address first.</div>}
              </div>
            ))}
            {loginMsg && <div className={loginMsg.ok ? 'ml-ok mi-msg' : 'cert-err mi-msg'}>{loginMsg.text}</div>}
            <button type="button" className="flink" onClick={() => setEmails((s) => [...s, { email: '', show_members: false }])} disabled={busy}>+ Add another email</button>
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
