import { Link } from '@/lib/router'
import { PROBLEMS, PROBLEM_ORDER, PROBLEM_SLUG } from '@/content/problems'

export default function ProblemGrid() {
  return (
    <div className="probgrid" id="probgrid">
      {PROBLEM_ORDER.map((key) => {
        const problem = PROBLEMS[key]
        if (!problem) return null
        return (
          <Link className="probcard" to={`/clinical-challenges/${PROBLEM_SLUG[key]}`} key={key}>
            <div className="n">{problem.n}</div>
            <h3>{problem.card}</h3>
            <p>{problem.blurb}</p>
            <div className="go">
              See the fix <i>→</i>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
