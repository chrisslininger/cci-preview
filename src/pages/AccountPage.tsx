/* ----------------------------------------------------------------------------
 * Member account.
 *
 * Client-only and noindex — this is the one area that is deliberately NOT
 * prerendered, because it is per-visitor and should never be crawled.
 *
 * Signed out, this is the sign-in card. Signed in, it is the role-scoped shell,
 * whose menu is generated from the capabilities the database reports for this
 * person. Nothing here decides access; it renders what access says.
 *
 * The preview-mode bypass that shipped for board review is gone — the README
 * flagged it as scaffolding to remove before public launch, and the site is now
 * public.
 * -------------------------------------------------------------------------- */
import { useState } from 'react'
import { Link } from '@/lib/router'
import { signIn, sendMagicLink, linkError, clearLinkError } from '@/lib/supabase'
import { useAccess } from '@/lib/queries/AccessProvider'
import MemberShell from '@/components/member/MemberShell'
import { useToast } from '@/components/ui/Toast'

export default function AccountPage() {
  const toast = useToast()
  const { signedIn, loading, refresh } = useAccess()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(() => (typeof window === 'undefined' ? null : linkError()))

  async function handleSignIn(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    if (!email.trim() || !password) {
      setError('Enter your email address and password.')
      return
    }
    setBusy(true)
    try {
      await signIn(email.trim(), password)
      setPassword('')
      await refresh()
    } catch (err) {
      setError((err as Error).message || 'Sign-in failed.')
    }
    setBusy(false)
  }

  async function handleMagicLink() {
    setError(null)
    if (!email.trim()) {
      setError('Enter your email address first and we will send you a link.')
      return
    }
    setBusy(true)
    try {
      await sendMagicLink(email.trim(), `${window.location.origin}/account`)
      toast('Check your email — a sign-in link is on its way.')
    } catch (err) {
      setError((err as Error).message || 'Could not send the link.')
    }
    setBusy(false)
  }

  if (signedIn) return <MemberShell />

  return (
    <>
      <div className="hero-img short">
        <div className="bg ph-b" />
        <div className="duo" />
        <div className="duo2" />
        <div className="scrim" />
        <div className="wrap inner">
          <div className="crumbs">
            <Link to="/">HOME</Link> <b>/</b> MEMBER AREA
          </div>
          <div className="kick">AOI Members</div>
          <h1>Member Login</h1>
          <p className="sub">
            One login for everything — your registrations, certifications, CE credits, billing, and
            any Institute roles you hold.
          </p>
        </div>
      </div>

      <section className="tight">
        <div className="wrap" style={{ maxWidth: '460px' }}>
          <div className="acct-card">
            <h3>
              Sign in<span className="gr" />
            </h3>
            {notice && (
              <div className="li-err" role="alert" style={{ marginBottom: '16px' }}>
                {notice} Request a new one below.
                <button type="button" className="li-err-x" aria-label="Dismiss"
                  onClick={() => { clearLinkError(); setNotice(null) }}>×</button>
              </div>
            )}
            <form onSubmit={handleSignIn}>
              <label className="flabel" htmlFor="li-email">
                EMAIL
              </label>
              <input
                className="fi"
                id="li-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@practice.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError(null)
                }}
              />
              <label className="flabel" htmlFor="li-pass">
                PASSWORD
              </label>
              <input
                className="fi"
                id="li-pass"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError(null)
                }}
              />
              {error && (
                <div className="li-err" role="alert">
                  {error}
                </div>
              )}
              <div style={{ marginTop: '20px', display: 'grid', gap: '10px' }}>
                <button
                  type="submit"
                  className="b p-btn"
                  style={{ justifyContent: 'center' }}
                  disabled={busy || loading}
                >
                  {busy ? 'One moment…' : 'Sign In'}
                </button>
                <button
                  type="button"
                  className="b s-btn on-light"
                  style={{ justifyContent: 'center' }}
                  onClick={() => void handleMagicLink()}
                  disabled={busy}
                >
                  Email Me a Sign-In Link
                </button>
                <Link className="t-link acct-reset" to="/reset-password">
                  Forgot your password?
                </Link>
              </div>
            </form>
            <p className="acct-help">
              Accounts are created automatically when you register for an event or course. Trouble
              signing in?{' '}
              <Link className="t-link" style={{ fontSize: '11px' }} to="/contact">
                Contact us
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
