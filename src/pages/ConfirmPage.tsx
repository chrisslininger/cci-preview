import { Link, useLocation } from '@/lib/router'

export default function ConfirmPage() {
  const location = useLocation()
  const state = location.state as { message?: string } | null

  return (
    <>
      <div className="hero-img short">
        <div className="bg ph-a" />
        <div className="duo" />
        <div className="duo2" />
        <div className="scrim" />
        <div className="wrap inner" style={{ textAlign: 'center' }}>
          <div className="confirm-tick">
            <svg
              width="42"
              height="42"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-surface-inverse)"
              strokeWidth="3"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h1 style={{ maxWidth: 'none' }}>You&apos;re registered!</h1>
          <p className="sub confirm-sub">
            {state?.message ?? 'Your registration is confirmed. A receipt has been emailed to you.'}
          </p>
        </div>
      </div>
      <section className="tight">
        <div className="wrap" style={{ maxWidth: '720px' }}>
          <div className="steps" style={{ gridTemplateColumns: '1fr' }}>
            <div className="step">
              <div className="n">WHAT HAPPENS NEXT</div>
              <p>
                Your seat is reserved and your registration is recorded with the Institute.
                You&apos;ll receive event details and reminders by email as the date approaches. If
                you created or have a member login, this event now appears under{' '}
                <b>My Profile → My Registrations</b>.
              </p>
              <div style={{ marginTop: '18px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link className="b p-btn" to="/seminars">
                  Browse More Events
                </Link>
                <Link className="b s-btn on-light" to="/account">
                  My Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
