import { Link } from '@/lib/router'

export default function CertificationPage() {
  return (
    <>
      <div className="hero-img short">
          <div className="bg ph-c" id="cert-bg" style={{"backgroundImage": "url(/images/level.webp)", "backgroundSize": "cover", "backgroundPosition": "center 35%"}}></div><div className="duo"></div><div className="duo2"></div><div className="scrim"></div>
          <div className="wrap inner">
            <div className="crumbs">HOME <b>/</b> CERTIFICATION</div>
            <div className="kick">Establish Your Mastery</div>
            <h1>Get Certified</h1>
            <p className="sub">Anyone can practice this work — the Institute officially recognizes those who prove their proficiency.</p>
          </div>
        </div>

        <section className="tight">
          <div className="wrap">
            <div className="prose">
              <p>Certification in the Advanced Orthogonal Technique ensures that there is a minimum standard being kept by all doctors and students that practice the procedure. Anyone can practice this work, but the Institute will only officially recognize the proficiency of those individuals who have gone through the certification process.</p>
            </div>
            <div className="steps" style={{"marginTop": "40px", "gridTemplateColumns": "1fr 1fr", "maxWidth": "820px"}}>
              <div className="step" style={{"borderTop": "4px solid var(--color-brand-primary)"}} id="cert-l1">
                <div className="n" style={{"color": "var(--color-brand-primary-deep)"}}>ADVANCED ORTHOGONAL</div>
                <h3>Level 1 Certification</h3>
                <p>Level 1 Certification proves your proficiency to safely and effectively correct the upper cervical spine with the Percussive Sound Wave Instrument. Completing Level 1 also earns you one free year of AOI membership.</p>
                <Link to="/certification/advo-level-1" className="b sm p-btn">Level 1 Requirements</Link>
              </div>
              <div className="step" style={{"borderTop": "4px solid var(--color-brand-accent)"}} id="cert-l2">
                <div className="n">ADVANCED ORTHOGONAL</div>
                <h3>Level 2 Certification</h3>
                <p>Level 2 Certification is proof of mastery of the Advanced Orthogonal technique and opens you up to become an instructor within the Institute.</p>
                <Link to="/certification/advo-level-2" className="b sm p-btn">Level 2 Requirements</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mist">
          <div className="wrap">
            <div className="kick">The Process</div>
            <h2 className="t">Four steps to certification.</h2>
            <div className="goldrule"></div>
            <div className="steps" style={{"gridTemplateColumns": "repeat(4,1fr)"}}>
              <div className="step"><div className="n">STEP 1</div><p>Ensure that you have met the requirements (other than testing) for the level of certification that you are applying.</p></div>
              <div className="step"><div className="n">STEP 2</div><p>Submit your application, fees, documents, and X-rays to the Certification Committee.</p></div>
              <div className="step"><div className="n">STEP 3</div><p>You will be assigned Reviewers who will administer your testing and review your documentation, X-rays, reports, and application until all requirements are met.</p></div>
              <div className="step"><div className="n">STEP 4</div><p>Once all requirements are approved, you will be officially issued your certification.</p></div>
            </div>
            <div className="prose" style={{"marginTop": "38px"}}>
              <h3>Fees for Certification</h3>
              <p>Application fees for certification will be paid to the Advanced Orthogonal Institute. These fees cover the costs for the review, testing, processing of the application, and printing and shipping the Certificate.</p>
              <h3>Grandfathering</h3>
              <p>All doctors and students who have trained with Advanced Orthogonal Techniques and Procedures, or the Institute's predecessor organizations, and have completed their training according to the standards that were present at the time they were trained have been grandfathered into appropriate certification levels based on experience. Grandfathering is determined on a case by case basis by the Certification Committee based on attendance to prior seminars and active practice experience in the Advanced Orthogonal technique.</p>
              <p>Any doctor that has not been "grandfathered" into certification and believes that the standard for certification has been met may send a request for review by the Certification Committee.</p>
              <Link to="/contact" className="t-link">Contact the Certification Committee<span className="a">→</span></Link>
            </div>
          </div>
        </section>

        <section className="ctaband tight">
          <div className="wrap">
            <div>
              <h3>Complete Level 1 and your first year of membership is free.</h3>
              <p>Full conference registration, directory listing, and every member benefit — our investment back into you.</p>
            </div>
            <Link to="/seminars/fundamental-1" className="b lg p-btn">Start with Fundamental 1</Link>
          </div>
        </section>
    </>
  )
}
