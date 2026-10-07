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
import { Suspense, lazy, useState } from 'react'
import { Link } from '@/lib/router'
import { signIn, sendMagicLink, linkError, clearLinkError } from '@/lib/supabase'
import { activateAccount } from '@/lib/queries/access'
import { useAccess } from '@/lib/queries/AccessProvider'
import { useToast } from '@/components/ui/Toast'

/* The members area is close to half the site's JavaScript, and only a signed-in
 * member ever needs it. Loading it here, on demand, keeps it out of every public
 * page. This route is client-only (no prerendered markup to hydrate), so a lazy
 * component is safe. */
const MemberShell = lazy(() => import('@/components/member/MemberShell'))

/** Shown while access is being read or the shell's code is on its way. Light on
 *  purpose: it must not look like a member's menu, because which menu is not
 *  known yet. */
function ShellPlaceholder() {
  return (
    <section className="tight" aria-busy="true">
      <div className="wrap" style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
        <p className="acct-help" style={{ color: 'var(--color-content-tertiary)' }}>Opening your account…</p>
      </div>
    </section>
  )
}

/** Signed in, but the Institute could not be reached on this load and nothing
 *  earlier is available to show. Not a sign-in card: the session is fine. */
function ShellUnavailable({ onRetry, busy }: { onRetry: () => void; busy: boolean }) {
  return (
    <section className="tight">
      <div className="wrap" style={{ maxWidth: '460px' }}>
        <div className="acct-card">
          <h3>
            Can&apos;t reach the Institute<span className="gr" />
          </h3>
          <p className="acct-help" style={{ marginBottom: 16 }}>
            You are still signed in, but your account could not be loaded just now. Check your
            connection and try again.
          </p>
          <button type="button" className="b p-btn" style={{ justifyContent: 'center', width: '100%' }} onClick={onRetry} disabled={busy}>
            {busy ? 'One moment…' : 'Try again'}
          </button>
        </div>
      </div>
    </section>
  )
}

export default function AccountPage() {
  const toast = useToast()
  const { signedIn, loading, ready, unavailable, refresh } = useAccess()
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

  const [setup, setSetup] = useState(false)
  const [setupEmail, setSetupEmail] = useState('')
  const [setupSent, setSetupSent] = useState(false)

  /** First time here: a current member sets up their own account. */
  async function handleSetup(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    if (!setupEmail.trim()) { setError('Enter the email address the Institute has for you.'); return }
    setBusy(true)
    try {
      await activateAccount(setupEmail.trim())
      setSetupSent(true)
    } catch {
      setError('Could not reach the Institute just now. Please try again in a moment.')
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

  if (signedIn) {
    // Nothing role-dependent renders until access has been read once: a
    // Director must not see the plain-member rail for a moment first.
    if (!ready) return unavailable ? <ShellUnavailable onRetry={() => void refresh()} busy={loading} /> : <ShellPlaceholder />
    return (
      <Suspense fallback={<ShellPlaceholder />}>
        <MemberShell />
      </Suspense>
    )
  }

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
            <div className="acct-setup">
              {setupSent ? (
                <p className="acct-help">
                  If that address belongs to a current member, a setup link is on its way. It can
                  take a few minutes — check your spam folder if you don&apos;t see it.
                </p>
              ) : setup ? (
                <form onSubmit={handleSetup}>
                  <p className="acct-help" style={{ marginBottom: 10 }}>
                    Enter the email address the Institute has for you and we&apos;ll send a link to
                    choose your password.
                  </p>
                  <input
                    id="setup-email"
                    className="fi"
                    type="email"
                    autoComplete="email"
                    placeholder="you@yourpractice.com"
                    value={setupEmail}
                    onChange={(e) => setSetupEmail(e.target.value)}
                  />
                  <button type="submit" className="b s-btn on-light" style={{ justifyContent: 'center', width: '100%', marginTop: 10 }} disabled={busy}>
                    {busy ? 'One moment…' : 'Send my setup link'}
                  </button>
                </form>
              ) : (
                <p className="acct-help">
                  First time here?{' '}
                  <button type="button" className="flink" onClick={() => { setSetup(true); setSetupEmail(email) }}>
                    Set up your member account
                  </button>
                  . Trouble signing in?{' '}
                  <Link className="t-link" style={{ fontSize: '11px' }} to="/contact">
                    Contact us
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
