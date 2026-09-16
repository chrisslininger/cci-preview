import { Link, useParams } from '@/lib/router'
import { PROBLEMS, PROBLEM_ORDER, PROBLEM_SLUG, SLUG_TO_PROBLEM } from '@/content/problems'
import { SEMINAR_SLUG } from '@/content/seminars'
import NotFoundPage from './NotFoundPage'

/** The old renderer emitted `go(page, id)`; these become real paths. */
function hrefFor(target: [string, string?]): string {
  const [page, id] = target
  if (page === 'sem' && id) return `/seminars/${SEMINAR_SLUG[id] ?? id}`
  if (page === 'problem' && id) return `/clinical-challenges/${PROBLEM_SLUG[id] ?? id}`
  if (page === 'certification') return '/certification'
  if (page === 'membership') return '/membership'
  if (page === 'contact') return '/contact'
  if (page === 'seminars') return '/seminars'
  return '/'
}

export default function ProblemPage({ param }: { param?: string }) {
  const { slug } = useParams()
  const key = param ?? (slug ? SLUG_TO_PROBLEM[slug] : undefined)
  const problem = key ? PROBLEMS[key] : undefined

  if (!problem || !key) return <NotFoundPage />

  const others = PROBLEM_ORDER.filter((k) => k !== key)

  return (
    <>
      <div className="hero-img short">
        <div
          className="bg ph-b"
          style={
            problem.img
              ? {
                  backgroundImage: `url(/images/${problem.img}.webp)`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : undefined
          }
        />
        <div className="duo" />
        <div className="duo2" />
        <div className="scrim" />
        <div className="wrap inner">
          <div className="crumbs">
            <Link to="/">HOME</Link> <b>/</b> WHERE CASES GET HARD <b>/</b>{' '}
            <span>{problem.card.toUpperCase()}</span>
          </div>
          <div className="kick">{problem.kick}</div>
          <h1>{problem.h1}</h1>
          <p className="sub">{problem.sub}</p>
        </div>
      </div>

      <section>
        <div className="wrap">
          <div className="probwhy">
            <div>
              <div className="kick">What Is Actually Happening</div>
              <h2 className="t" style={{ fontSize: '27px' }}>
                {problem.h2}
              </h2>
              <div className="goldrule" />
              <div className="prose">
                {problem.prose.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
              </div>
            </div>
            <div className="answerbox">
              <div className="kick">The Advanced Orthogonal Answer</div>
              <h3>{problem.ah}</h3>
              <p>{problem.ap}</p>
              <ul className="answerlist">
                {problem.bul.map((item) => (
                  <li key={item.slice(0, 40)}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mist">
        <div className="wrap">
          <div className="kick">Your Starting Point</div>
          <h2 className="t">Where to begin.</h2>
          <div className="goldrule" />
          <div className="steps">
            <div className="step">
              <div className="n">STEP 01</div>
              <h3>Take the Free Intro Course</h3>
              <p>
                Two self-paced hours covering the principles, the procedures, and the clinical
                approach. No prerequisites, no cost.
              </p>
              <Link className="b sm p-btn" to="/seminars/intro-to-advo">
                Start the Free Course
              </Link>
            </div>
            <div className="step">
              <div className="n">STEP 02</div>
              <h3>{problem.step2.h}</h3>
              <p>{problem.step2.p}</p>
              <Link className="b sm s-btn on-light" to={hrefFor(problem.step2.go)}>
                {problem.step2.btn}
              </Link>
            </div>
            <div className="step">
              <div className="n">STEP 03</div>
              <h3>Work Toward Certification</h3>
              <p>
                Certification is how the Institute defines and confirms competence in the technique
                — and how the standard stays the same from one doctor to the next.
              </p>
              <Link className="b sm s-btn on-light" to="/certification">
                The Certification Path
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="kick">The Other Four</div>
          <h2 className="t" style={{ fontSize: '27px' }}>
            Does something else on this list sound familiar?
          </h2>
          <div className="goldrule" />
          <div className="othergrid">
            {others.map((k) => {
              const other = PROBLEMS[k]
              if (!other) return null
              return (
                <Link className="othercard" to={`/clinical-challenges/${PROBLEM_SLUG[k]}`} key={k}>
                  <div className="n">{other.n}</div>
                  <h4>{other.card}</h4>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="ctaband tight">
        <div className="wrap">
          <div>
            <h3>Start with the free two-hour Intro to Advanced Orthogonal.</h3>
            <p>No prerequisites · Self-paced · Free</p>
          </div>
          <Link className="b lg p-btn ctaband-invert" to="/seminars/intro-to-advo">
            Start the Free Intro Course
          </Link>
        </div>
      </section>
    </>
  )
}
