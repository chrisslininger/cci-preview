import { useEffect, useState } from 'react'
import { Link } from '@/lib/router'
import { invoke } from '@/lib/supabase'

/* ----------------------------------------------------------------------------
 * /seminars/<event>/pay?t=<token> — the page a payment link opens.
 *
 * Sent from the check-in desk: a $50 CE certificate for a member or speaker
 * whose seat is already covered, or the full ticket for someone registered at
 * the door. The token identifies one registration; the amount comes from the
 * server, never the URL. "Pay" opens Stripe Checkout, and Stripe's return
 * lands on /registration-confirmed, which records the payment the same way
 * the webhook does — so the desk sees it turn green within seconds.
 * -------------------------------------------------------------------------- */

type Info = {
  kind?: 'ce' | 'registration'
  amount_cents?: number
  paid?: boolean
  name?: string
  email?: string
  event?: { title?: string; slug?: string; dates?: string; location?: string; ce_school?: string | null; ce_mode?: string | null }
  error?: string
  detail?: string
}

const money = (c?: number) => (c == null ? '' : `$${(c / 100).toLocaleString('en-US', { minimumFractionDigits: c % 100 ? 2 : 0 })}`)

export default function PayPage() {
  const token = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('t') : null
  const [info, setInfo] = useState<Info | 'loading'>(token ? 'loading' : { error: 'invalid_link' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    invoke<Info>('pay-link', { action: 'info', token }).then(setInfo).catch(() => setInfo({ error: 'network' }))
  }, [token])

  async function pay() {
    setBusy(true); setErr(null)
    try {
      const r = await invoke<{ url?: string; error?: string; detail?: string }>('pay-link', { action: 'checkout', token, origin: window.location.origin })
      if (r.url) { window.location.href = r.url; return }
      setErr(r.error === 'already_paid' ? 'This has already been paid — thank you.' : r.detail ?? 'Payment could not be started. Please try again or see the registration desk.')
    } catch { setErr('Could not reach the payment service. Check your connection and try again.') }
    setBusy(false)
  }

  const i = info === 'loading' ? null : info
  const ce = i?.kind === 'ce'
  const title = info === 'loading' ? 'One moment…'
    : !i || i.error ? 'This link isn’t valid'
    : i.paid ? 'Already paid — thank you'
    : ce ? 'CE credit certificate' : 'Complete your registration'

  return (
    <>
      <div className="hero-img short">
        <div className="bg ph-a" /><div className="duo" /><div className="duo2" /><div className="scrim" />
        <div className="wrap inner" style={{ textAlign: 'center' }}>
          {i?.event?.title && <div className="eyebrow" style={{ justifyContent: 'center' }}>{i.event.title}</div>}
          <h1 style={{ maxWidth: 'none' }}>{title}</h1>
        </div>
      </div>
      <section className="tight">
        <div className="wrap" style={{ maxWidth: '560px' }}>
          {info === 'loading' ? <p className="muted" style={{ textAlign: 'center' }}>Loading your payment details…</p>
            : !i || i.error ? (
              <div className="paycard">
                <p>{i?.detail ?? 'This payment link is no longer valid. Please ask the registration desk for a new one.'}</p>
                <Link className="b s-btn on-light" to="/seminars">Browse events</Link>
              </div>
            ) : i.paid ? (
              <div className="paycard">
                <p>{ce ? `Your CE certificate for ${i.event?.title} is paid. It will be issued after the event.` : `Your registration for ${i.event?.title} is paid and confirmed.`} A receipt was sent to {i.email}.</p>
                <Link className="b s-btn on-light" to={`/seminars/${i.event?.slug ?? ''}`}>Event details</Link>
              </div>
            ) : (
              <div className="paycard">
                <div className="paylabel">For</div>
                <div className="payname">{i.name}</div>
                <div className="paymeta">{[i.event?.dates, i.event?.location].filter(Boolean).join(' · ')}</div>
                <div className="payline">
                  <span>{ce ? 'Continuing education certificate' : 'Event registration — CE included'}</span>
                  <b>{money(i.amount_cents)}</b>
                </div>
                {ce && (i.event?.ce_mode || i.event?.ce_school) && <p className="paynote">{[i.event?.ce_mode, i.event?.ce_school ? `through ${i.event.ce_school}` : ''].filter(Boolean).join(' ')}. Your seat is already confirmed.</p>}
                {!ce && <p className="paynote">You’re checked in. Your seat is confirmed the moment payment goes through.</p>}
                {err && <div className="cert-err" style={{ margin: '10px 0' }}>{err}</div>}
                <button type="button" className="b p-btn paygo" disabled={busy} onClick={() => void pay()}>{busy ? 'Opening secure checkout…' : `Pay ${money(i.amount_cents)}`}</button>
                <p className="paysmall">Secure payment by Stripe. A receipt is emailed to {i.email}.</p>
              </div>
            )}
        </div>
      </section>
    </>
  )
}
