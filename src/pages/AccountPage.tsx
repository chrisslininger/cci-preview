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
import {
  signIn, sendMagicLink, requestPasswordReset, updatePassword,
  recoveryMode, linkError, clearLinkError, signOut,
} from '@/lib/supabase'
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
  const [sent, setSent] = useState(false)
  // A recovery link puts the page into "choose a new password" mode. The token
  // from the link is a real session, so the shell would otherwise render — we
  // hold it back until the password is actually set.
  const [recovering, setRecovering] = useState(recoveryMode)
  const [pw1, setPw1] = useState('')
  const [pw2, setPw2] = useState('')
  const [notice, setNotice] = useState<string | null>(linkError)

  async function handleReset() {
    setError(null)
    if (!email.trim()) {
      setError('Enter your email address first and we will send you a reset link.')
      return
    }
    setBusy(true)
    try {
      await requestPasswordReset(email.trim(), `${window.location.origin}/account`)
      setSent(true)
      toast('Check your email — a password reset link is on its way.')
    } catch (err) {
      setError((err as Error).message || 'Could not start the reset.')
    }
    setBusy(false)
  }

  async function handleNewPassword(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    if (pw1.length < 8) {
      setError('Choose a password of at least 8 characters.')
      return
    }
    if (pw1 !== pw2) {
      setError('Those two passwords do not match.')
      return
    }
    setBusy(true)
    try {
      await updatePassword(pw1)
      setPw1('')
      setPw2('')
      setRecovering(false)
      toast('Password updated. You are signed in.')
      await refresh()
    } catch (err) {
      setError((err as Error).message || 'Could not set the password.')
    }
    setBusy(false)
  }

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

  if (recovering) {
    return (
      <section className="tight">
        <div className="wrap" style={{ maxWidth: '460px' }}>
          <div className="acct-card">
            <h3>
              Choose a new password<span className="gr" />
            </h3>
            <p className="acct-help" style={{ marginTop: 0, marginBottom: '18px' }}>
              You followed a reset link, so you are already verified. Pick a password and you will
              be signed in.
            </p>
            <form onSubmit={handleNewPassword}>
              <label className="flabel" htmlFor="np-1">NEW PASSWORD</label>
              <input className="fi" id="np-1" type="password" autoComplete="new-password"
                value={pw1} onChange={(e) => { setPw1(e.target.value); setError(null) }} />
              <label className="flabel" htmlFor="np-2">CONFIRM</label>
              <input className="fi" id="np-2" type="password" autoComplete="new-password"
                value={pw2} onChange={(e) => { setPw2(e.target.value); setError(null) }} />
              {error && <div className="li-err" role="alert">{error}</div>}
              <div style={{ marginTop: '20px', display: 'grid', gap: '10px' }}>
                <button type="submit" className="b p-btn" style={{ justifyContent: 'center' }} disabled={busy}>
                  {busy ? 'One moment…' : 'Set Password & Sign In'}
                </button>
                <button type="button" className="b s-btn on-light" style={{ justifyContent: 'center' }}
                  onClick={() => { signOut(); setRecovering(false); void refresh() }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    )
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
                <button
                  type="button"
                  className="t-link acct-reset"
                  onClick={() => void handleReset()}
                  disabled={busy}
                >
                  {sent ? 'Reset link sent — check your email' : 'Forgot your password?'}
                </button>
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
