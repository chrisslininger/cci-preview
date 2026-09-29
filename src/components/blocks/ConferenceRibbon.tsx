/* ----------------------------------------------------------------------------
 * Home: a full-width Annual Conference banner directly under the site menu.
 *
 * Prerendered like the rest of the page, so crawlers and first paint see it.
 * Once the conference has ended it hides itself in the browser; remove it (or
 * point it at the next conference) the next time the homepage is edited.
 * -------------------------------------------------------------------------- */
import { useEffect, useState } from 'react'
import { Link } from '@/lib/router'
import { SEMINARS } from '@/content/seminars'

const CONFERENCE = SEMINARS.conference
/* The day after the last day, Eastern time. */
const HIDE_FROM = new Date('2026-11-08T00:00:00-05:00')

export default function ConferenceRibbon() {
  const [over, setOver] = useState(false)

  useEffect(() => {
    if (Date.now() >= HIDE_FROM.getTime()) setOver(true)
  }, [])

  if (over) return null

  return (
    <Link to="/seminars/annual-conference-2026" className="confband">
      <div className="wrap">
        <div className="txt">
          <span className="what"><span className="dot" aria-hidden="true"></span>{CONFERENCE.title}</span>
          <span className="when"><span className="long">{CONFERENCE.dates}</span><span className="short">Nov 6–7</span> · {CONFERENCE.loc}</span>
          <span className="free">Free for members<span className="ce"> · 14 CE hours</span></span>
        </div>
        <span className="go">Register<span className="a">&rarr;</span></span>
      </div>
    </Link>
  )
}
