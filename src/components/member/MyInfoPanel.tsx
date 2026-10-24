/* ----------------------------------------------------------------------------
 * Personal Information — a member's own name, birthday, emails, phones and
 * home address, and who may see each one.
 *
 * Who sees what (James, 2026-10-24): the Board sees everything. A personal
 * detail is shown to other members in the Directory only when the member ticks
 * "Members can see"; it is never public. The professional email alone can be
 * Board only, Members, or Public (Find a Doctor, and members too).
 *
 * Reads the member's own `people` row and saves through `update_my_info`, a
 * database function that changes only these fields on the signed-in member's
 * row. Until the function exists, saving says so and offers the contact form.
 *
 * Sign-in: chosen from the member's own addresses rather than typed again.
 * Picking a different one goes through Supabase Auth, which mails a
 * confirmation link to it first; `people.email` follows once it is clicked.
 * -------------------------------------------------------------------------- */
import { useEffect, useState } from 'react'
import { Link } from '@/lib/router'
import PhotoCard from './PhotoCard'
import { useAccess } from '@/lib/queries/AccessProvider'
import { select, ensureSession, headers, session, SB_URL } from '@/lib/supabase'

type Form = {
  first: string; last: string; credentials: string; birthday: string
  personalEmail: string; professionalEmail: string; mobile: string; personal: string
  address: string; city: string; state: string; zip: string
}
const EMPTY: Form = { first: '', last: '', credentials: '', birthday: '', personalEmail: '', professionalEmail: '', mobile: '', personal: '', address: '', city: '', state: '', zip: '' }

type Visibility = 'board' | 'members' | 'public'
/** Personal details other members may see; matches the share_* columns on people. */
type Share = { personal_email: boolean; mobile: boolean; home_phone: boolean; home_address: boolean }
const NONE: Share = { personal_email: false, mobile: false, home_phone: false, home_address: false }

/** Which address the member signs in with: one of their own, or the current one when it matches none. */
type Slot = 'personal' | 'professional' | 'office' | 'current'

type Own = {
  first_name: string | null; last_name: string | null; credentials: string | null; email: string | null; mobile_phone: string | null; personal_phone: string | null
  date_of_birth: string | null; mail_address_line1: string | null; mail_city: string | null; mail_region: string | null; mail_postal_code: string | null
}
type Extra = {
  personal_email: string | null; professional_email: string | null; practice_email: string | null; professional_email_visibility: Visibility
  share_personal_email: boolean; share_mobile: boolean; share_home_phone: boolean; share_home_address: boolean
}

const looksLikeEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())
const same = (a: string, b: string) => !!a.trim() && a.trim().toLowerCase() === b.trim().toLowerCase()
const missingFn = (status: number, text: string) => status === 404 || text.includes('PGRST202') || text.includes('PGRST205')

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

async function saveInfo(v: Form, vis: Visibility, sh: Share): Promise<{ ok?: true; missing?: true; error?: string }> {
  await ensureSession()
  const res = await fetch(`${SB_URL}/rest/v1/rpc/update_my_info`, {
    method: 'POST',
    headers: headers(true),
    body: JSON.stringify({
      p_first_name: v.first, p_last_name: v.last, p_credentials: v.credentials, p_birthday: v.birthday || null,
      p_personal_email: v.personalEmail, p_professional_email: v.professionalEmail, p_professional_email_visibility: vis,
      p_mobile_phone: v.mobile, p_personal_phone: v.personal,
      p_home_address: v.address, p_home_city: v.city, p_home_state: v.state.toUpperCase(), p_home_zip: v.zip,
      p_share_personal_email: sh.personal_email, p_share_mobile: sh.mobile, p_share_home_phone: sh.home_phone, p_share_home_address: sh.home_address,
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
  const [vis, setVis] = useState<Visibility>('board')
  const [share, setShare] = useState<Share>(NONE)
  const [login, setLogin] = useState('')
  const [office, setOffice] = useState('')
  const [slot, setSlot] = useState<Slot>('current')
  const [loginMsg, setLoginMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'saving' | 'saved' | 'missing' | 'error'>('loading')
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!id) return
    void (async () => {
      await ensureSession()
      const me = `id=eq.${id}`
      const [r, x] = await Promise.all([
        select<Own>('people', `select=first_name,last_name,credentials,email,mobile_phone,personal_phone,date_of_birth,mail_address_line1,mail_city,mail_region,mail_postal_code&${me}`),
        // The new email and sharing columns may not exist yet; an error just leaves the defaults.
        select<Extra>('people', `select=personal_email,professional_email,practice_email,professional_email_visibility,share_personal_email,share_mobile,share_home_phone,share_home_address&${me}`),
      ])
      const p = r.data?.[0]
      const ex = x.data?.[0]
      const a = access.person
      const signIn = session.user?.email ?? p?.email ?? a?.email ?? ''
      // Before anyone has sorted their addresses, the sign-in one starts as the personal email (Board only).
      let personalEmail = ex?.personal_email ?? ''
      const professionalEmail = ex?.professional_email ?? ''
      const officeEmail = ex?.practice_email ?? ''
      if (!personalEmail && !same(professionalEmail, signIn) && !same(officeEmail, signIn)) personalEmail = signIn
      setV({
        first: p?.first_name ?? a?.first_name ?? '', last: p?.last_name ?? a?.last_name ?? '', credentials: p?.credentials ?? a?.credentials ?? '',
        birthday: p?.date_of_birth ?? '', personalEmail, professionalEmail, mobile: p?.mobile_phone ?? '', personal: p?.personal_phone ?? '',
        address: p?.mail_address_line1 ?? '', city: p?.mail_city ?? '', state: p?.mail_region ?? '', zip: p?.mail_postal_code ?? '',
      })
      if (ex) {
        setVis(ex.professional_email_visibility ?? 'board')
        setShare({ personal_email: ex.share_personal_email, mobile: ex.share_mobile, home_phone: ex.share_home_phone, home_address: ex.share_home_address })
      }
      setLogin(signIn)
      setOffice(officeEmail)
      setSlot(same(personalEmail, signIn) ? 'personal' : same(professionalEmail, signIn) ? 'professional' : same(officeEmail, signIn) ? 'office' : 'current')
      setState('ready')
    })()
  }, [id])

  const busy = state === 'loading' || state === 'saving'
  const touch = () => { if (!busy) setState('ready') }
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => { setV({ ...v, [k]: e.target.value }); touch() }
  const shareBox = (k: keyof Share) => (
    <label className="mi-share">
      <input type="checkbox" checked={share[k]} onChange={(e) => { setShare({ ...share, [k]: e.target.checked }); touch() }} disabled={busy} /> Members can see
    </label>
  )
  const cell = (k: keyof Form, label: string, cls: string, opts: { type?: string; placeholder?: string; share?: keyof Share } = {}) => (
    <div className={`ml-cell ${cls}`}>
      <label className="ml-lbl" htmlFor={`mi-${k}`}>{label}</label>
      <input id={`mi-${k}`} className="ml-in" type={opts.type ?? 'text'} value={v[k]} onChange={set(k)} placeholder={opts.placeholder} disabled={busy} />
      {opts.share && shareBox(opts.share)}
    </div>
  )

  // The addresses a member can sign in with: their own, plus the current one if it is none of them.
  const choices: { slot: Slot; label: string; email: string }[] = [
    { slot: 'personal' as Slot, label: 'Personal', email: v.personalEmail.trim() },
    { slot: 'professional' as Slot, label: 'Professional', email: v.professionalEmail.trim() },
    { slot: 'office' as Slot, label: 'Office', email: office.trim() },
  ].filter((c) => c.email)
  if (login && !choices.some((c) => same(c.email, login))) choices.push({ slot: 'current', label: 'Current', email: login })
  const chosen = choices.find((c) => c.slot === slot) ?? choices.find((c) => same(c.email, login))
  const signInChanges = !!chosen && !same(chosen.email, login)

  async function save() {
    if (!v.first.trim() || !v.last.trim()) { setErr('First and last name are needed.'); setState('error'); return }
    for (const [label, e] of [['personal', v.personalEmail], ['professional', v.professionalEmail]] as const) {
      if (e.trim() && !looksLikeEmail(e)) { setErr(`Your ${label} email doesn't look like an email address.`); setState('error'); return }
    }
    if (!chosen) { setErr('Choose the email you sign in with.'); setState('error'); return }
    setState('saving'); setErr(''); setLoginMsg(null)
    const [r, l] = await Promise.all([
      saveInfo(v, vis, share),
      signInChanges ? changeSignInEmail(chosen.email) : Promise.resolve(null),
    ])
    if (l) setLoginMsg(l.ok ? { ok: true, text: `We sent a confirmation link to ${chosen.email}. You'll sign in with it once you click the link.` } : { ok: false, text: l.error ?? 'Could not start the email change.' })
    if (r.error) { setErr(r.error); setState('error') }
    else if (r.missing) setState('missing')
    else setState('saved')
  }

  return (
    <>
      <h1>Personal Information</h1>
      <div className="ma-sub">
        The Board can see everything on this page. Tick <b>Members can see</b> to show an item to other members in the
        Directory. Your clinic details, which are public, are under <a href="#mylisting">Business Information</a>.
      </div>
      <div className="ma-panel">
        <PhotoCard />
        {state === 'error' && err && <div className="cert-err">{err}</div>}
        <div className="ml-table mi-table">
          {cell('first', 'First name', 'mi-c4')}
          {cell('last', 'Last name', 'mi-c4')}
          {cell('credentials', 'Credentials', 'mi-c2', { placeholder: 'DC' })}
          {cell('birthday', 'Birthday', 'mi-c2', { type: 'date' })}

          <h2 className="mi-h">Email</h2>
          {cell('personalEmail', 'Personal email', 'mi-c6', { type: 'email', placeholder: 'you@gmail.com', share: 'personal_email' })}
          <div className="ml-cell mi-c6">
            <label className="ml-lbl" htmlFor="mi-professionalEmail">Professional email</label>
            <input id="mi-professionalEmail" className="ml-in" type="email" value={v.professionalEmail} onChange={set('professionalEmail')} placeholder="drsmith@yourclinic.com" disabled={busy} />
            <label className="mi-vis">
              Who can see it
              <select value={vis} onChange={(e) => { setVis(e.target.value as Visibility); touch() }} disabled={busy}>
                <option value="board">Board only</option>
                <option value="members">Members</option>
                <option value="public">Public · Find a Doctor and members</option>
              </select>
            </label>
          </div>
          <div className="ml-cell mi-c6">
            <label className="ml-lbl" htmlFor="mi-signin">Sign in with</label>
            <select id="mi-signin" className="ml-in" value={chosen?.slot ?? ''} onChange={(e) => { setSlot(e.target.value as Slot); touch() }} disabled={busy || !choices.length}>
              {choices.map((c) => <option key={c.slot} value={c.slot}>{c.label} · {c.email}</option>)}
            </select>
            <span className="ml-note">
              {signInChanges
                ? `When you save, we'll email a confirmation link to ${chosen!.email}. Until you click it, keep signing in with ${login}.`
                : 'The address you use to sign in to this site. It is never shown to anyone.'}
            </span>
          </div>
          <div className="ml-cell mi-c6">
            <span className="ml-lbl">Office email</span>
            <span className="ml-note mi-office">
              {office ? <>{office} is public. Change it under <a href="#mylisting">Business Information</a>.</> : <>Add your front-desk email under <a href="#mylisting">Business Information</a>. It is public.</>}
            </span>
          </div>

          <h2 className="mi-h">Phone and home address</h2>
          {cell('mobile', 'Mobile phone', 'mi-c6', { type: 'tel', share: 'mobile' })}
          {cell('personal', 'Home phone', 'mi-c6', { type: 'tel', share: 'home_phone' })}
          {cell('address', 'Home address', 'mi-c6', { placeholder: 'Street', share: 'home_address' })}
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
