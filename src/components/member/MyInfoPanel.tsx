/* ----------------------------------------------------------------------------
 * Personal Information — a member's own name, birthday, emails, phones and
 * home address. None of it is public.
 *
 * Reads the member's own `people` row and saves through `update_my_info`, a
 * database function that changes only these fields on the signed-in member's
 * row. Birthday and home address are new columns; until they and the function
 * exist, saving says so and offers the contact form.
 *
 * Emails: the main email is the sign-in address and changes through Supabase
 * Auth, which mails a confirmation link first. The second email, and whether
 * other members may see each one, live in `person_emails` and save through
 * `save_my_emails`. The public email is the clinic's, under Business Information.
 * -------------------------------------------------------------------------- */
import { useEffect, useState } from 'react'
import { Link } from '@/lib/router'
import { useAccess } from '@/lib/queries/AccessProvider'
import { select, ensureSession, headers, session, SB_URL } from '@/lib/supabase'

type Form = {
  first: string; last: string; credentials: string; birthday: string; mobile: string; personal: string
  address: string; city: string; state: string; zip: string
}
const EMPTY: Form = { first: '', last: '', credentials: '', birthday: '', mobile: '', personal: '', address: '', city: '', state: '', zip: '' }

type Own = { first_name: string | null; last_name: string | null; credentials: string | null; email: string | null; mobile_phone: string | null; personal_phone: string | null }
type Extra = { birthday: string | null; home_address: string | null; home_city: string | null; home_state: string | null; home_zip: string | null }
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
      p_first_name: v.first, p_last_name: v.last, p_credentials: v.credentials, p_birthday: v.birthday || null,
      p_mobile_phone: v.mobile, p_personal_phone: v.personal,
      p_home_address: v.address, p_home_city: v.city, p_home_state: v.state.toUpperCase(), p_home_zip: v.zip,
    }),
  })
  if (res.ok) return { ok: true }
  const text = await res.text()
  return missingFn(res.status, text) ? { missing: true } : { error: text }
}

export default function MyInfoPanel() {
  const { access } = useAccess()
  const id = access.person?.id
  const [v, setV] = useState<Form>(EMPTY)
  const [login, setLogin] = useState('')
  const [emails, setEmails] = useState<[Email, Email]>([{ email: '', show_members: false }, { email: '', show_members: false }])
  const [loginMsg, setLoginMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'saving' | 'saved' | 'missing' | 'error'>('loading')
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!id) return
    void (async () => {
      await ensureSession()
      const me = `id=eq.${id}`
      const [r, x, e] = await Promise.all([
        select<Own>('people', `select=first_name,last_name,credentials,email,mobile_phone,personal_phone&${me}`),
        // Birthday, home address and person_emails may not exist yet; an error just leaves those empty.
        select<Extra>('people', `select=birthday,home_address,home_city,home_state,home_zip&${me}`),
        select<Email>('person_emails', `select=email,show_members&person_id=eq.${id}&order=created_at`),
      ])
      const p = r.data?.[0]
      const ex = x.data?.[0]
      const a = access.person
      setV({
        first: p?.first_name ?? a?.first_name ?? '', last: p?.last_name ?? a?.last_name ?? '', credentials: p?.credentials ?? a?.credentials ?? '',
        birthday: ex?.birthday ?? '', mobile: p?.mobile_phone ?? '', personal: p?.personal_phone ?? '',
        address: ex?.home_address ?? '', city: ex?.home_city ?? '', state: ex?.home_state ?? '', zip: ex?.home_zip ?? '',
      })
      const main = session.user?.email ?? p?.email ?? a?.email ?? ''
      setLogin(main)
      const stored = e.data ?? []
      const mainRow = stored.find((m) => m.email.toLowerCase() === main.toLowerCase()) ?? { email: main, show_members: false }
      const other = stored.find((m) => m !== mainRow) ?? { email: '', show_members: false }
      setEmails([mainRow, other])
      setState('ready')
    })()
  }, [id])

  const busy = state === 'loading' || state === 'saving'
  const touch = () => { if (!busy) setState('ready') }
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => { setV({ ...v, [k]: e.target.value }); touch() }
  const setEmail = (i: 0 | 1, patch: Partial<Email>) => {
    setEmails((s) => { const n = [...s] as [Email, Email]; n[i] = { ...n[i], ...patch }; return n }); touch()
  }
  const cell = (k: keyof Form, label: string, cls: string, opts: { type?: string; placeholder?: string } = {}) => (
    <label className={`ml-cell ${cls}`} htmlFor={`mi-${k}`}>
      <span className="ml-lbl">{label}</span>
      <input id={`mi-${k}`} className="ml-in" type={opts.type ?? 'text'} value={v[k]} onChange={set(k)} placeholder={opts.placeholder} disabled={busy} />
    </label>
  )
  const emailCell = (i: 0 | 1, label: string, note?: string) => (
    <div className="ml-cell mi-c6">
      <label className="ml-lbl" htmlFor={`mi-email-${i}`}>{label}</label>
      <input id={`mi-email-${i}`} className="ml-in" type="email" value={emails[i].email} onChange={(e) => setEmail(i, { email: e.target.value })}
        placeholder={i === 0 ? 'you@example.com' : 'Optional'} disabled={busy} />
      {note && <span className="ml-note">{note}</span>}
      <label className="mi-share"><input type="checkbox" checked={emails[i].show_members} onChange={(e) => setEmail(i, { show_members: e.target.checked })} disabled={busy} /> Share with other members</label>
    </div>
  )

  async function save() {
    if (!v.first.trim() || !v.last.trim()) { setErr('First and last name are needed.'); setState('error'); return }
    const main = emails[0].email.trim()
    if (!looksLikeEmail(main)) { setErr('Your main email needs to be a full email address.'); setState('error'); return }
    const other = emails[1].email.trim()
    if (other && !looksLikeEmail(other)) { setErr(`"${other}" doesn't look like an email address.`); setState('error'); return }
    setState('saving'); setErr(''); setLoginMsg(null)
    // A new main email is not changed directly: Supabase Auth mails a confirmation link first.
    const loginChanged = main.toLowerCase() !== login.toLowerCase()
    const [r, m, l] = await Promise.all([
      saveInfo(v),
      saveEmails(other ? emails : [emails[0]]),
      loginChanged ? changeSignInEmail(main) : Promise.resolve(null),
    ])
    if (l) setLoginMsg(l.ok ? { ok: true, text: `We sent a confirmation link to ${main}. You'll sign in with it once you click the link.` } : { ok: false, text: l.error ?? 'Could not start the email change.' })
    if (r.error || m.error) { setErr(r.error ?? m.error ?? 'Could not save.'); setState('error') }
    else if (r.missing || m.missing) setState('missing')
    else setState('saved')
  }

  return (
    <>
      <h1>Personal Information</h1>
      <div className="ma-sub">
        How the Institute reaches you. None of this is public; your clinic details are under{' '}
        <a href="#mylisting">Business Information</a>.
      </div>
      <div className="ma-panel">
        {state === 'error' && err && <div className="cert-err">{err}</div>}
        <div className="ml-table mi-table">
          {cell('first', 'First name', 'mi-c4')}
          {cell('last', 'Last name', 'mi-c4')}
          {cell('credentials', 'Credentials', 'mi-c2', { placeholder: 'DC' })}
          {cell('birthday', 'Birthday', 'mi-c2', { type: 'date' })}

          {emailCell(0, 'Main email · used to sign in')}
          {emailCell(1, 'Other email')}

          {cell('mobile', 'Mobile phone', 'mi-c6', { type: 'tel' })}
          {cell('address', 'Home address', 'mi-c6', { placeholder: 'Street' })}

          {cell('personal', 'Home phone', 'mi-c6', { type: 'tel' })}
          {cell('city', 'City', 'mi-c3')}
          {cell('state', 'State', 'mi-c1')}
          {cell('zip', 'ZIP', 'mi-c2')}
        </div>
        {loginMsg && <div className={loginMsg.ok ? 'ml-ok mi-msg' : 'cert-err mi-msg'}>{loginMsg.text}</div>}
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
