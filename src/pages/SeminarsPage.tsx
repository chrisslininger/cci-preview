import { useState } from 'react'
import { Link } from '@/lib/router'
import SeminarCard from '@/components/blocks/SeminarCard'
import { SEMINARS } from '@/content/seminars'
import { useRegistration } from '@/components/blocks/RegistrationDialog'

/** `intro` is the featured START HERE banner, so it is not in the grid. */
const ORDER = ['fund1', 'fund2', 'fund3', 'intensive', 'bootcamp', 'conference', 'internship']

const FILTERS = [
  { cat: 'all', label: 'All Events' },
  { cat: 'fundamentals', label: 'Fundamentals' },
  { cat: 'intensive', label: 'Intensive' },
  { cat: 'bootcamp', label: 'Bootcamp' },
  { cat: 'conference', label: 'Conference' },
  { cat: 'free', label: 'Free' },
  { cat: 'internship', label: 'Internships' },
]

export default function SeminarsPage() {
  const [filter, setFilter] = useState('all')
  const register = useRegistration()

  const visible = ORDER.filter((id) => filter === 'all' || SEMINARS[id]?.cat === filter)
  const empty = visible.length === 0 && filter !== 'free'

  return (
    <>
      <div className="hero-img short">
        <div className="bg ph-b" />
        <div className="duo" />
        <div className="duo2" />
        <div className="scrim" />
        <div className="wrap inner">
          <div className="crumbs">
            <Link to="/">HOME</Link> <b>/</b> SEMINARS
          </div>
          <div className="kick">Train With Us</div>
          <h1>Seminars &amp; Events</h1>
          <p className="sub">
            From your first free course to full mastery — every training pathway through the
            Institute.
          </p>
        </div>
      </div>

      <section className="tight">
        <div className="wrap">
          <div
            style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '34px' }}
            id="filterrow"
            role="group"
            aria-label="Filter events by category"
          >
            {FILTERS.map((f) => (
              <button
                type="button"
                key={f.cat}
                className={`b sm ${filter === f.cat ? 'p-btn' : 's-btn on-light'} fchip`}
                aria-pressed={filter === f.cat}
                onClick={() => setFilter(f.cat)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* START HERE — featured free intro (always visible, every filter) */}
          <div className="featintro">
            <Link
              className="featintro-media"
              to="/seminars/intro-to-advo"
              aria-label="Intro to AdvO course details"
            >
              <div className="ph-c" style={{ position: 'absolute', inset: 0 }}>
                <div className="duo" />
                <div className="duo2" />
              </div>
              <div className="featintro-fade" />
            </Link>
            <div className="featintro-body">
              <span className="featintro-flag">START HERE · FREE</span>
              <div className="featintro-eyebrow">ONLINE · SELF-PACED · 2 HOURS</div>
              <h3>Intro to AdvO</h3>
              <p>
                New to Advanced Orthogonal? Start with our free two-hour Intro to AdvO course—a
                comprehensive overview of the technique, its principles, and the training pathways
                available through the Institute.
              </p>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button type="button" className="b p-btn" onClick={() => register('intro')}>
                  Sign Up Free
                </button>
                <Link className="t-link featintro-link" to="/seminars/intro-to-advo">
                  Course Details<span className="a">→</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="grid3" id="semgrid">
            {visible.map((id) => (
              <SeminarCard id={id} key={id} />
            ))}
          </div>
          {empty && (
            <p id="semempty" style={{ fontSize: '15px', color: 'var(--color-content-muted)', padding: '30px 0' }}>
              No events in this category right now — check back soon.
            </p>
          )}
        </div>
      </section>

      <section className="ctaband tight">
        <div className="wrap">
          <div>
            <h3>Members save $200 on every seminar.</h3>
            <p>And members save $600 on the AdvO Bootcamp.</p>
          </div>
          <Link className="b lg p-btn" to="/membership">
            Join &amp; Save
          </Link>
        </div>
      </section>
    </>
  )
}
