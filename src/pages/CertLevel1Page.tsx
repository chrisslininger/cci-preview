import { Link } from '@/lib/router'

export default function CertLevel1Page() {
  return (
    <>
      <div className="hero-img short">
          <div className="bg ph-c" id="certl1-bg"></div><div className="duo"></div><div className="duo2"></div><div className="scrim"></div>
          <div className="wrap inner">
            <div className="crumbs">HOME <b>/</b> CERTIFICATION <b>/</b> LEVEL 1</div>
            <div className="kick">The First Step to Mastery</div>
            <h1>Level 1 Certification</h1>
            <p className="sub">Certified Advanced Orthogonist &mdash; the Institute&rsquo;s recognition that you can deliver Advanced Orthogonal care to standard.</p>
          </div>
        </div>

        <div className="wrap">
          <div className="facts" style={{"gridTemplateColumns": "repeat(4,1fr)"}}>
            <div className="fact"><span>CREDENTIAL</span><b>Certified Advanced Orthogonist</b></div>
            <div className="fact"><span>APPLICATION FEE</span><b>$1,200</b></div>
            <div className="fact"><span>REVIEWERS</span><b>2 &middot; separate clinics</b></div>
            <div className="fact"><span>MAINTENANCE</span><b>1 Advanced Seminar / year</b></div>
          </div>
        </div>

        <section className="tight">
          <div className="wrap">
            <div className="kick">What It Certifies</div>
            <h2 className="t" style={{"fontSize": "26px"}}>The minimum standard, proven.</h2>
            <div className="goldrule"></div>
            <div className="prose">
              <p>Level 1 Certification confirms that a doctor meets the minimum standards required to deliver Advanced Orthogonal care. To earn it you demonstrate a solid understanding of the fundamentals, show that you can manage moderately difficult cases, and show that you can guide a patient through basic care.</p>
              <p>Two reviewers from separate clinics evaluate your application, your examination, and your x-ray analysis reports. Once every requirement is met, the Certification Committee issues your certification.</p>
            </div>
          </div>
        </section>

        <section className="mist">
          <div className="wrap">
            <div className="kick">Training Requirement</div>
            <h2 className="t">Complete any one of these pathways.</h2>
            <div className="goldrule"></div>
            <p className="lede" style={{"marginBottom": "30px"}}>There is more than one route into Level 1. Pick the one that fits how you learn and how your schedule works &mdash; the standard at the end is the same.</p>
            <div className="steps"><div className="step"><div className="n">PATHWAY 01</div><h3>Fundamentals 1&ndash;3</h3><p>Complete the full Fundamentals Series, then attend one Advanced Seminar.</p></div><div className="step"><div className="n">PATHWAY 02</div><h3>AdvO Bootcamp</h3><p>Complete the Advanced Orthogonal Bootcamp, then attend one Advanced Seminar.</p></div><div className="step"><div className="n">PATHWAY 03</div><h3>Fundamentals + Bootcamp</h3><p>Complete the full Fundamentals Series and the Bootcamp.</p></div><div className="step"><div className="n">PATHWAY 04</div><h3>Internship</h3><p>Complete an Advanced Orthogonal Internship, then attend one Advanced Seminar.</p></div><div className="step"><div className="n">PATHWAY 05</div><h3>Technique Transition</h3><p>Complete the Technique Transition Seminar, then attend one Advanced Seminar.</p></div><div className="step"><div className="n">PATHWAY 06</div><h3>College Elective</h3><p>Complete the Advanced Orthogonal elective at a chiropractic college, then attend one Advanced Seminar.</p></div></div>
          </div>
        </section>

        <section className="tight">
          <div className="wrap">
            <div className="kick">Then</div>
            <h2 className="t" style={{"fontSize": "26px"}}>Examination and reports.</h2>
            <div className="goldrule"></div>
            <div className="learn" style={{"marginTop": "24px"}}>
              <div className="li"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-accent)" strokeWidth="2.6"><path d="M20 6 9 17l-5-5" /></svg>Pass the Advanced Orthogonal Basic Examination.</div>
              <div className="li"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-accent)" strokeWidth="2.6"><path d="M20 6 9 17l-5-5" /></svg>Submit two post x-ray analysis reports, each with a completed HIPAA form.</div>
            </div>
            <div className="prose" style={{"marginTop": "40px"}}>
              <h3>Application fee</h3>
              <p>The Level 1 application fee is <b>$1,200</b>. It covers review, testing, processing, and the printing and shipping of your certificate &mdash; and it includes one year of free AOI membership, which carries full registration for the Annual Conference.</p>
              <h3>Maintaining active status</h3>
              <p>Attend one Advanced Seminar each year to keep your certification active.</p>
              <h3>If you do not pass an exam</h3>
              <p>You may retake the examination no sooner than one month and no later than twelve months from the date of the failure. A second failure means restarting the application process.</p>
              <h3>Chiropractic students</h3>
              <p>Students may apply, sit the examination, and submit their reports before graduating. Certification is held in pending status until a Doctor of Chiropractic diploma is submitted to the Institute.</p>
            </div>
            <div style={{"marginTop": "30px", "display": "flex", "gap": "14px", "flexWrap": "wrap"}}>
              <Link to="/contact" className="b p-btn">Apply for Level 1</Link>
              <Link to="/certification/advo-level-2" className="b s-btn on-light">See Level 2 &rarr;</Link>
            </div>
          </div>
        </section>

        <section className="ctaband tight">
          <div className="wrap">
            <div>
              <h3>Complete Level 1 and your first year of membership is free.</h3>
              <p>Full conference registration, directory listing, and every member benefit &mdash; our investment back into you.</p>
            </div>
            <Link to="/seminars/fundamental-1" className="b lg p-btn">Start with Fundamental 1</Link>
          </div>
        </section>
    </>
  )
}
