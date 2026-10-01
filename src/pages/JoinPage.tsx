/* ----------------------------------------------------------------------------
 * Join the Institute.
 *
 * The page the two "Become a Member" buttons were always meant to open. It
 * collects only what the Institute needs to make a contact record, then hands
 * the visitor to Stripe. Nothing on this page decides who is a member — the
 * paid invoice does, through stripe-webhook, which also sends the new member
 * their members-area link.
 *
 * Prices are stated once, in the summary card, from the same copy the
 * membership page shows.
 * -------------------------------------------------------------------------- */
import { useState } from 'react'
import { Link } from '@/lib/router'
import { invoke } from '@/lib/supabase'

type Reply = {
  url?: string
  already_member?: boolean
  expires_on?: string | null
  error?: string
  detail?: string
}

const BENEFITS = [
  'Annual Conference registration included — a $797 value',
  '$600 off AdvO Bootcamp, $200 off every seminar',
  'Voting rights and board eligibility',
  'Doctor Directory listing once you are Level 1 certified',
  'Exclusive partner discounts',
]

const longDate = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  })

export default function JoinPage() {
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [practice, setPractice] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [member, setMember] = useState<string | null>(null)

  const bad = (v: string) => (error && !v.trim() ? ' bad' : '')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setError(null)
    setMember(null)

    if (!first.trim() || !last.trim()) return setError('Please enter your first and last name.')
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email.trim())) return setError('Please enter a valid email address.')

    setBusy(true)
    const r = await invoke<Reply>('join-membership', {
      action: 'checkout',
      first_name: first.trim(),
      last_name: last.trim(),
      email: email.trim(),
      phone: phone.trim(),
      practice_name: practice.trim(),
      origin: window.location.origin,
    }).catch((): Reply => ({ error: 'network' }))

    if (r.already_member) {
      setBusy(false)
      setMember(r.expires_on ? `Your membership is current through ${longDate(r.expires_on)}.` : 'That address already has a current membership.')
      return
    }
    if (r.url) {
      window.location.href = r.url
      return
    }
    setBusy(false)
    setError(
      r.error === 'not_configured'
        ? 'Membership checkout is not switched on yet. Please email info@advancedorthogonal.com and we will sign you up by hand.'
        : (r.detail ?? 'Something went wrong starting the checkout. Please try again, or email info@advancedorthogonal.com.'),
    )
  }

  return (
    <>
      <div className="hero-img short">
        <div className="bg ph-b" />
        <div className="duo" /><div className="duo2" /><div className="scrim" />
        <div className="wrap inner">
          <div className="crumbs">
            <Link to="/">HOME</Link> <b>/</b> <Link to="/membership">MEMBERSHIP</Link> <b>/</b> JOIN
          </div>
          <h1>Join the Institute</h1>
          <p className="sub">
            Annual membership includes your Annual Conference registration, discounts on every
            seminar, and a voice in how the Institute moves forward.
          </p>
        </div>
      </div>

      <section>
        <div className="wrap">
          <div className="joingrid">

            <form className="joinform" onSubmit={submit} noValidate>
              <div className="kick">Your details</div>
              <h2 className="t" style={{ fontSize: '26px' }}>Tell us who you are.</h2>
              <div className="goldrule" />

              <div className="joinrow">
                <div>
                  <label className={`flabel${bad(first)}`} htmlFor="join-first">FIRST NAME</label>
                  <input id="join-first" className={`fi${bad(first)}`} value={first} autoComplete="given-name"
                    onChange={(e) => { setFirst(e.target.value); setError(null) }} />
                </div>
                <div>
                  <label className={`flabel${bad(last)}`} htmlFor="join-last">LAST NAME</label>
                  <input id="join-last" className={`fi${bad(last)}`} value={last} autoComplete="family-name"
                    onChange={(e) => { setLast(e.target.value); setError(null) }} />
                </div>
              </div>

              <label className={`flabel${bad(email)}`} htmlFor="join-email">EMAIL</label>
              <input id="join-email" className={`fi${bad(email)}`} type="email" value={email} autoComplete="email"
                onChange={(e) => { setEmail(e.target.value); setError(null) }} />
              <p className="joinhint">This becomes your sign-in for the members area, so use the address you check.</p>

              <label className="flabel" htmlFor="join-phone">MOBILE PHONE <span className="opt">optional</span></label>
              <input id="join-phone" className="fi" type="tel" value={phone} autoComplete="tel"
                onChange={(e) => setPhone(e.target.value)} />

              <label className="flabel" htmlFor="join-practice">PRACTICE NAME <span className="opt">optional</span></label>
              <input id="join-practice" className="fi" value={practice} autoComplete="organization"
                onChange={(e) => setPractice(e.target.value)} />

              {error && <p className="joinerr" role="alert">{error}</p>}
              {member && (
                <div className="joinnote" role="status">
                  <p>{member}</p>
                  <p>
                    Nothing to pay. <Link to="/account">Sign in to the members area</Link>, or email
                    info@advancedorthogonal.com if that does not look right.
                  </p>
                </div>
              )}

              <button className="b lg p-btn joinbtn" type="submit" disabled={busy}>
                {busy ? 'Taking you to Stripe…' : 'Continue to Payment'}
              </button>
              <p className="joinsmall">
                Payment is handled securely by Stripe — the Institute never sees your card. Membership
                renews annually; you can cancel any time and your current year still runs to its end.
              </p>
            </form>

            <aside className="joinsum">
              <div className="kick" style={{ color: 'var(--color-brand-accent)' }}>Annual Membership</div>
              <div className="joinprice">
                <b>$799</b><i>/ year</i>
              </div>
              <p className="joinwhen">
                Joining or renewing before 31 December 2026 is $799. From 1 January 2027 annual
                membership is $999.
              </p>
              <ul className="joinlist">
                {BENEFITS.map((b) => <li key={b}>{b}</li>)}
              </ul>
              <p className="joinsum-note">
                Certified to Level 1? Your first year is on the Institute —{' '}
                <Link to="/certification">see the certification path</Link>.
              </p>
            </aside>

          </div>
        </div>
      </section>
    </>
  )
}
