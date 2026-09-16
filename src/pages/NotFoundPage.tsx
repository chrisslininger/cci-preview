import { Link } from '@/lib/router'

export default function NotFoundPage() {
  return (
    <>
      <div className="hero-img short">
        <div className="bg ph-a" />
        <div className="duo" />
        <div className="duo2" />
        <div className="scrim" />
        <div className="wrap inner">
          <div className="kick">404</div>
          <h1>That page could not be found</h1>
          <p className="sub">
            The link may be out of date. Everything the Institute publishes is reachable from the
            pages below.
          </p>
        </div>
      </div>
      <section className="tight">
        <div className="wrap" style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <Link className="b p-btn" to="/seminars">
            Seminars &amp; Events
          </Link>
          <Link className="b s-btn on-light" to="/certification">
            Certification
          </Link>
          <Link className="b s-btn on-light" to="/membership">
            Membership
          </Link>
          <Link className="b s-btn on-light" to="/contact">
            Contact
          </Link>
        </div>
      </section>
    </>
  )
}
