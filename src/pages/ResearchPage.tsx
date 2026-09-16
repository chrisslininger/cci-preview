import { Link } from '@/lib/router'

export default function ResearchPage() {
  return (
    <>
      <div className="hero-img short">
          <div className="bg ph-a" id="rs-img" style={{"backgroundImage": "url(/images/analyze.webp)", "backgroundSize": "cover", "backgroundPosition": "center"}}></div><div className="duo"></div><div className="duo2"></div><div className="scrim"></div>
          <div className="wrap inner">
            <div className="crumbs">HOME <b>/</b> ABOUT <b>/</b> RESEARCH</div>
            <div className="kick">Evidence &amp; Investigation</div>
            <h1>Research at the Institute</h1>
            <p className="sub">A federally registered research organization building the evidence base for precision upper cervical care.</p>
          </div>
        </div>

        <section className="tight">
          <div className="wrap">
            <p className="lede" style={{"maxWidth": "900px"}}>Advanced Orthogonal has always been a measurement-first discipline &mdash; misalignment quantified from digital x-ray analysis, corrections delivered by instrument rather than by hand, outcomes monitored over time. That same rigor is what the Institute now brings to formal research. Our aim is straightforward: produce data of a quality that stands up outside our own profession.</p>
          </div>
        </section>

        <section className="mist">
          <div className="wrap">
            <div className="kick">Federal Registration</div>
            <h2 className="t" style={{"fontSize": "28px"}}>Certified to compete for federally funded research.</h2>
            <div className="goldrule"></div>
            <div className="grid2" style={{"gap": "32px", "marginTop": "34px", "alignItems": "stretch"}}>
              <div style={{"background": "var(--color-surface-base)", "border": "1px solid var(--color-border-subtle)", "borderRadius": "3px", "padding": "32px 34px"}}>
                <div className="kick" style={{"color": "var(--color-brand-primary-deep)"}}>SAM.gov</div>
                <h3 style={{"fontFamily": "'Outfit',sans-serif", "fontSize": "20px", "color": "var(--color-content-primary)", "margin": "8px 0 12px"}}>System for Award Management</h3>
                <p style={{"fontSize": "14.5px", "color": "var(--color-content-secondary)", "lineHeight": "1.75"}}>Registration in SAM.gov is the federal government's entity registry &mdash; the prerequisite for receiving any federal grant, contract, or award. Our active registration establishes the Institute as a recognized entity eligible to submit proposals, hold awards, and receive federal research funding.</p>
              </div>
              <div style={{"background": "var(--color-surface-base)", "border": "1px solid var(--color-border-subtle)", "borderRadius": "3px", "padding": "32px 34px"}}>
                <div className="kick" style={{"color": "var(--color-brand-primary-deep)"}}>EBRAP</div>
                <h3 style={{"fontFamily": "'Outfit',sans-serif", "fontSize": "20px", "color": "var(--color-content-primary)", "margin": "8px 0 12px"}}>Electronic Biomedical Research Application Portal</h3>
                <p style={{"fontSize": "14.5px", "color": "var(--color-content-secondary)", "lineHeight": "1.75"}}>EBRAP is the submission portal for the Department of Defense's Congressionally Directed Medical Research Programs. Our registration gives the Institute a direct path to submit pre-applications and full proposals to DoD biomedical research funding opportunities &mdash; including those addressing traumatic brain injury, chronic pain, and neurological conditions.</p>
              </div>
            </div>
            <p style={{"marginTop": "26px", "fontSize": "14px", "color": "var(--color-content-muted)", "maxWidth": "900px", "lineHeight": "1.75"}}><i>Together these registrations mean the Institute is positioned to pursue funded, peer-reviewed investigation &mdash; not merely to publish case reports, but to compete for the kind of support that produces trials the wider medical community reads.</i></p>
          </div>
        </section>

        <section>
          <div className="wrap">
            <div className="kick">Methodology</div>
            <h2 className="t" style={{"fontSize": "28px"}}>How we design a study.</h2>
            <div className="goldrule"></div>
            <div className="prose" style={{"maxWidth": "880px", "marginTop": "26px"}}>
              <h3>1 &middot; Objective, instrument-derived measurement</h3>
              <p>Every Advanced Orthogonal correction begins with a precise digital x-ray analysis and an instrument setting derived from those numbers. This produces something most manual-technique research cannot: a quantified pre- and post-intervention variable that does not depend on the examiner's hands. Study design starts there.</p>
              <h3>2 &middot; Reproducible protocol across sites</h3>
              <p>Because the adjusting instrument delivers a consistent, pre-set force based entirely on patient-specific variables, the intervention itself is reproducible from doctor to doctor and clinic to clinic. Multi-site data collection is therefore viable in a way it rarely is for hands-on techniques &mdash; and reproducibility is the foundation of any credible trial.</p>
              <h3>3 &middot; Validated outcome instruments</h3>
              <p>Clinical outcomes are captured using established, published instruments rather than internally invented scales, so results can be compared against the wider literature. Where physiological measures are appropriate, we pair patient-reported outcomes with objective data.</p>
              <h3>4 &middot; Ethical oversight and data integrity</h3>
              <p>Human-subjects research is conducted under appropriate institutional review, with informed consent, pre-specified endpoints, and de-identified data handling. Our practitioner network's data is protected under the same security standards that govern the Institute's member platform.</p>
              <h3>5 &middot; Publication and peer review</h3>
              <p>Findings are prepared for peer-reviewed publication regardless of whether they confirm our expectations. Research that only reports favorable results is advocacy, not science.</p>
            </div>
          </div>
        </section>

        <section className="dark quoteband">
          <div className="wrap">
            <div>
              <div className="kick">Why It Matters</div>
              <blockquote>A technique built on precise measurement should be held to <em>an equally exacting standard of evidence.</em></blockquote>
              <div className="attr">THE INSTITUTE'S <b>RESEARCH POSITION</b></div>
            </div>
            <div className="prose">
              <p style={{"color": "var(--color-content-on-inverse-muted)"}}>Upper cervical chiropractic has a long clinical record and a thin research record. Closing that gap is how the discipline earns a seat at the table with neurology, physical medicine, and military health &mdash; and how patients with complex, poorly served conditions eventually get referred to us rather than found by accident.</p>
            </div>
          </div>
        </section>

        <section className="mist tight">
          <div className="wrap">
            <div className="kick">Get Involved</div>
            <h2 className="t" style={{"fontSize": "28px"}}>Practitioner participation.</h2>
            <div className="goldrule"></div>
            <div className="prose" style={{"maxWidth": "880px"}}>
              <p>Certified Advanced Orthogonal doctors are the Institute's research network. Participation can mean contributing de-identified outcome data from your practice, serving as a data-collection site for a funded study, or submitting a case for publication support. If you would like to be included as opportunities open, contact the Institute and we will add you to the research roster.</p>
            </div>
            <Link to="/articles" className="t-link">Read Published Articles<span className="a">&rarr;</span></Link>
          </div>
        </section>

        <section className="ctaband tight">
          <div className="wrap">
            <div>
              <h3>Interested in contributing to a study?</h3>
              <p>Tell us about your practice and we'll add you to the research roster.</p>
            </div>
            <Link to="/contact" className="b lg p-btn">Contact the Institute</Link>
          </div>
        </section>
    </>
  )
}
