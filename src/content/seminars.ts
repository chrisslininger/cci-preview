/* ----------------------------------------------------------------------------
 * Seminar and event catalog
 * Lifted verbatim from the v4.8 single-file build. Content lives here, outside
 * components, so the same object feeds the page, its metadata and its
 * structured data — what a human reads and what a machine reads cannot drift.
 * -------------------------------------------------------------------------- */

export type SeminarTier = {
  k: string
  p: string
  n: string
  hi?: boolean
  flag?: string
}

export type RegBand = {
  h: string
  sub: string
  btn: string
  tiers: SeminarTier[]
  note?: string
}

export type SeminarCE = {
  hours: string
  sponsor: string
  note: string
  approved: string[][]
  auto: string[]
  self: string[]
  pending: string[]
  notApplied: string[]
  special: string[][]
  disclaimer: string
}

export type Seminar = {
  photo?: string
  mux?: string
  video?: string
  cat: string
  title: string
  kicker?: string
  img?: string
  sub: string
  dates: string
  loc: string
  level: string
  format: string
  price: string
  fullPrice: number
  memPrice?: number
  studentPrice?: number
  facultyFree?: boolean
  mbText?: string
  sessions: string[][]
  hideSess?: boolean
  regBand?: RegBand
  member: string
  h2: string
  overview: string
  learn: string[]
  sched: string[][]
  ctaH: string
  spk?: string[]
  exhibitors?: string[]
  agenda?: unknown
  ce?: SeminarCE
}

export const SEMINARS = {
  intro:{
    photo:'intro',
    mux:'Ze5RbuV8YMhnPyv8th6N5FH3ERALc9GKvHSCg00FoEqQ', muxName:'Dr. Kevin Lyter',
    cat:'free', title:'Intro to AdvO', kicker:'Free Introductory Online Course', img:'ph-c',
    sub:'Discover the principles and power behind Advanced Orthogonal care.',
    dates:'Online · Anytime', loc:'Self-Paced', level:'No Prerequisites', format:'2-Hour Online Course', price:'FREE',
    fullPrice:0, memPrice:0, mbText:'This course is free for everyone — no membership required.',
    sessions:[], noSess:{kick:'Enrollment',h2:'Start any time',title:'This course is online and self-paced.',msg:'There is nothing to schedule \u2014 enroll and you have instant access to all two hours. Free for everyone, no membership required.',btn:'Start the Free Course',act:"regOpen('intro')",primary:true},
    member:'Free for everyone — no membership required. It is the recommended starting point for every training pathway at the Institute.',
    h2:'The starting point for everything.',
    overview:'<p>New to Advanced Orthogonal? Start with our free two-hour Intro to AdvO course—a comprehensive overview of the technique, its principles, and the training pathways available through the Institute.</p><p>You\'ll be introduced to the upper cervical philosophy behind the work, the percussive sound-wave instrument, the analysis protocol, and what the road from first seminar to full certification looks like.</p>',
    learn:['The upper cervical philosophy from B.J. Palmer to today','How the percussive sound-wave instrument works','The Advanced Orthogonal analysis protocol at a glance','How x-ray measurement drives the correction','The training pathway: Fundamentals → Intensive → Certification','How the Institute supports you at every stage'],
    sched:[['MODULE 1','Origins and principles of orthogonal-based upper cervical care.'],['MODULE 2','The Advanced Orthogonal protocol — analysis, correction, and monitoring.'],['MODULE 3','Training pathways, certification, and your next step.']],
    ctaH:'Start free, today.', ctaP:'Instant access — watch on your schedule.', ctaBtn:'Sign Up Free',
    spk:['cs'], keynote:null,
    agenda:[{day:null,items:[
      {t:'MOD 1',ap:'LECTURE',title:'Origins & Principles',desc:'Orthogonal-based upper cervical care from B.J. Palmer to today.',who:['cs']},
      {t:'MOD 2',ap:'LECTURE',title:'The AdvO Protocol',desc:'Analysis, correction, and monitoring at a glance.',who:['cs']},
      {t:'MOD 3',ap:'PATHWAYS',title:'Your Next Step',desc:'Training pathways, certification, and how the Institute supports you.',who:['cs']}]}]
  },
  fund1:{
    photo:'xray',
    cat:'fundamentals', title:'Fundamental 1', kicker:'Fundamentals Series · Part 1 of 3', img:'ph-a',
    sub:'Your foundation in Advanced Orthogonal analysis begins here.',
    dates:'Dates Announced Soon', loc:'Location Announced Soon', level:'Foundation', format:'Weekend Seminar', price:'$895',
    member:'AOI members save $200 on every seminar — Fundamental 1 is $695 for members.',
    fullPrice:895, memPrice:695,
    video:'https://player.vimeo.com/video/519671965',
    sessions:[], noSess:{title:'Dates for the next Fundamental 1 are being finalized.',msg:'There are no sessions on the calendar for this seminar right now. New dates are posted here the moment they are confirmed \u2014 tell us you are interested and we will let you know first.',btn:'Notify Me When Dates Are Set'},
    h2:'Where the foundation is poured.',
    overview:'<p>Fundamental 1 is the entry point to hands-on Advanced Orthogonal training. Working in small groups with experienced instructors, you\'ll build the observational and analytical foundation that everything else in the technique rests on.</p><p>The Fundamentals Series is sequential — each part builds directly on the last, and completing all three is a requirement on the Level 1 Certification track.</p>',
    learn:['Patient evaluation and nerve interference assessment','Upper cervical biomechanics and the atlas subluxation complex','Introduction to the specific three-dimensional x-ray series','Postural analysis and supine leg check protocol','Case history and patient management fundamentals','Instrument overview and safety'],
    sched:[['SATURDAY','Lecture and demonstration: evaluation protocol, biomechanics, and x-ray positioning. Afternoon hands-on labs in small groups.'],['SUNDAY','Supervised practice: analysis reps, evaluation workflow, and case review. Q&A and next steps on the certification track.']],
    ctaH:'Begin the Fundamentals Series.', ctaP:'Members save $200 · completing the series is a Level 1 requirement.', ctaBtn:'Ask About the Next Fundamental 1',
    spk:['cs','jk'], keynote:null,
    agenda:[{day:null,items:[
      {t:'SAT 9:00',ap:'AM · LECTURE',title:'Evaluation Protocol — Foundations',desc:'Nerve interference assessment and UC biomechanics.',who:['cs']},
      {t:'SAT 1:30',ap:'PM · LAB',title:'Postural Analysis Lab',desc:'Supervised reps: leg check, posture, and case history workflow.',who:['cs']},
      {t:'SUN 9:00',ap:'AM · LECTURE',title:'The 3-D X-Ray Series',desc:'Positioning and introduction to the specific x-ray series.',who:['jk']},
      {t:'SUN 1:00',ap:'PM · LAB',title:'Supervised Analysis Reps',desc:'Case review and next steps on the certification track.',who:['cs','jk']}]}]
  },
  fund2:{
    photo:'analyze',
    mux:'Cv8vCuTsBB02Mm9NRVBId5I45rNwogllO9af7GwSY5oA', muxName:'Dr. Zach Perry',
    cat:'fundamentals', title:'Fundamental 2', kicker:'Fundamentals Series · Part 2 of 3', img:'ph-a',
    sub:'X-ray analysis and line drawing — the measurement skill at the center of the technique.',
    dates:'Dates Announced Soon', loc:'Location Announced Soon', level:'Foundation · Requires F1', format:'Weekend Seminar', price:'$895',
    fullPrice:895, memPrice:695,
    sessions:[], noSess:{title:'Dates for the next Fundamental 2 are being finalized.',msg:'There are no sessions on the calendar for this seminar right now. New dates are posted here the moment they are confirmed \u2014 tell us you are interested and we will let you know first.',btn:'Notify Me When Dates Are Set'},
    member:'AOI members save $200 on every seminar — Fundamental 2 is $695 for members.',
    h2:'The analysis becomes precise.',
    overview:'<p>Fundamental 2 goes deep on the signature skill of the Advanced Orthogonal doctor: measuring the upper cervical misalignment on specific three-dimensional x-rays using digital software.</p><p>You\'ll learn to determine each patient\'s gravitational and neurological normal — taking genetic abnormalities into account — and translate that analysis into a patient-specific correction vector.</p>',
    learn:['Digital x-ray line drawing and analysis software','Measuring displacement against the patient\'s own normal','Accounting for genetic anomalies in the analysis','Deriving the correction vector from the misalignment variables','Inter- and intra-examiner reliability protocols','Analysis case labs with real film sets'],
    sched:[['SATURDAY','Digital analysis instruction and guided line-drawing labs.'],['SUNDAY','Correction vector derivation, reliability testing, and supervised case analysis.']],
    ctaH:'Continue the series.', ctaP:'Fundamental 1 is the prerequisite · members save $200.', ctaBtn:'Ask About the Next Fundamental 2',
    spk:['jk','cs'], keynote:null,
    agenda:[{day:null,items:[
      {t:'SAT 9:00',ap:'AM · LECTURE',title:'Digital Analysis Instruction',desc:'Line-drawing methodology and the analysis software.',who:['jk']},
      {t:'SAT 1:30',ap:'PM · LAB',title:'Guided Line-Drawing Labs',desc:'Real film sets, measured and drawn under instruction.',who:['jk']},
      {t:'SUN 9:00',ap:'AM · LAB',title:'Correction Vector Derivation',desc:'From misalignment variables to a patient-specific vector.',who:['cs']},
      {t:'SUN 1:00',ap:'PM · LAB',title:'Reliability Testing',desc:'Inter- and intra-examiner reliability protocols and case analysis.',who:['jk','cs']}]}]
  },
  fund3:{
    photo:'adjust',
    mux:'j4sZdYYoA3c2i7x1w8TocHVIFPYjI00xKL5XL602MD1Tk', muxName:'Dr. Josh Silver',
    cat:'fundamentals', title:'Fundamental 3', kicker:'Fundamentals Series · Part 3 of 3', img:'ph-a',
    sub:'The instrument, the correction, and the complete patient protocol.',
    dates:'Dates Announced Soon', loc:'Location Announced Soon', level:'Foundation · Requires F1 & F2', format:'Weekend Seminar', price:'$895',
    fullPrice:895, memPrice:695,
    sessions:[], noSess:{title:'Dates for the next Fundamental 3 are being finalized.',msg:'There are no sessions on the calendar for this seminar right now. New dates are posted here the moment they are confirmed \u2014 tell us you are interested and we will let you know first.',btn:'Notify Me When Dates Are Set'},
    member:'AOI members save $200 on every seminar — Fundamental 3 is $695 for members.',
    h2:'Everything comes together.',
    overview:'<p>Fundamental 3 completes the foundation: delivering the correction with the table-mounted percussive sound-wave instrument, positioning the patient with digital and laser alignment, and running the full protocol from evaluation through post-correction monitoring.</p><p>Graduates of the full Fundamentals Series are equipped to begin supervised practice of the technique and to enter the Level 1 Certification process.</p>',
    learn:['Percussive sound-wave instrument operation and settings','Patient positioning with digital and laser alignment','Delivering the patient-specific correction vector','Post-correction assessment and monitoring protocol','Care planning and the sustainable-corrections model','Preparing for Level 1 Certification'],
    sched:[['SATURDAY','Instrument instruction and supervised correction labs.'],['SUNDAY','Full-protocol run-throughs, monitoring workflow, and certification prep.']],
    ctaH:'Complete your foundation.', ctaP:'Finishing the series opens the Level 1 Certification track.', ctaBtn:'Ask About the Next Fundamental 3',
    spk:['cs','jk'], keynote:null,
    agenda:[{day:null,items:[
      {t:'SAT 9:00',ap:'AM · LECTURE',title:'Instrument Instruction',desc:'Percussive sound-wave instrument operation and settings.',who:['cs']},
      {t:'SAT 1:30',ap:'PM · LAB',title:'Supervised Correction Labs',desc:'Positioning with digital and laser alignment.',who:['cs']},
      {t:'SUN 9:00',ap:'AM · LAB',title:'Full-Protocol Run-Throughs',desc:'Evaluation through post-correction monitoring.',who:['cs','jk']},
      {t:'SUN 1:00',ap:'PM · PREP',title:'Certification Prep',desc:'The Level 1 process, requirements, and your application.',who:['jk']}]}]
  },
  intensive:{
    photo:'instrument',
    mux:'A21LSsljbccxw2O9500U9IuqeLq00g34T02hdZHFlFgUlw', muxName:'Dr. Jeff Kahrs',
    cat:'intensive', title:'AdvO Intensive (West)', kicker:'Advanced Training · Bridging the Gap from A.O. to AdvO', img:'ph-b',
    sub:'Refine precision and consistency — with an accelerated transition day for Atlas Orthogonal doctors.',
    dates:'Dates Announced Soon', loc:'Orem, UT', level:'Advanced', format:'2-Day Hands-On', price:'$1,295',
    fullPrice:1295, memPrice:1095,
    sessions:[], noSess:{title:'Dates for the next AdvO Intensive are being finalized.',msg:'There are no sessions on the calendar for this seminar right now. New dates are posted here the moment they are confirmed \u2014 tell us you are interested and we will let you know first.',btn:'Notify Me When Dates Are Set'},
    member:'AOI members save $200 — $1,095 for members.',
    h2:'For doctors ready to sharpen the edge.',
    overview:'<p>A focused, hands-on training event designed for experienced doctors ready to refine their precision and consistency with the Advanced Orthogonal technique.</p><p>The optional first day offers an accelerated transition course for Atlas Orthogonal certified doctors — bridging the gap between A.O. and AdvO in a single concentrated day of instruction and supervised reps.</p>',
    learn:['Advanced correction vector refinement','Troubleshooting difficult and atypical cases','Consistency drills with instructor feedback','A.O.-to-AdvO transition protocol (optional Day 1)','Post-correction monitoring at a mastery level','Case review with senior instructors'],
    sched:[['DAY 1 (OPTIONAL)','Bridging the Gap: accelerated transition course for Atlas Orthogonal certified doctors.'],['DAY 2','The Intensive: advanced hands-on refinement, consistency work, and complex case labs.']],
    ctaH:'Two days. Measurably sharper.', ctaP:'Orem, UT · next dates announced soon · members save $200.', ctaBtn:'Ask About the Next Intensive',
    spk:['cs','jk'], keynote:null,
    agenda:[{day:null,items:[
      {t:'FRI 9:00',ap:'AM · OPTIONAL',title:'Bridging the Gap: A.O. to AdvO',desc:'Accelerated transition course for Atlas Orthogonal certified doctors.',who:['cs']},
      {t:'SAT 9:00',ap:'AM · LAB',title:'Advanced Vector Refinement',desc:'Consistency drills with instructor feedback.',who:['cs']},
      {t:'SAT 1:30',ap:'PM · LAB',title:'Complex Case Labs',desc:'Troubleshooting difficult and atypical presentations.',who:['jk']},
      {t:'SAT 5:00',ap:'PM · REVIEW',title:'Case Review with Senior Instructors',desc:'Bring your hardest cases.',who:['cs','jk']}]}]
  },
  bootcamp:{
    photo:'setup',
    mux:'A9cxLKvjJcX5u02Qzh8agXEOPLMkmNzXTKHPrx02wnG2s', muxName:'Dr. Drew',
    cat:'bootcamp', title:'AdvO Bootcamp 2027', kicker:'The Immersive Week · Zero to Fully Equipped', img:'ph-a',
    sub:'Five days of hands-on training, guest experts, research updates — and the Friday night awards dinner.',
    dates:'Dates Announced Soon', loc:'Tampa Bay, FL', level:'All Levels', format:'5-Day Immersive', price:'$2,495',
    fullPrice:2495, memPrice:1895, mbText:'AOI members save $600 on AdvO Bootcamp — $1,895 for members.',
    sessions:[], noSess:{title:'Dates for the next AdvO Bootcamp are being finalized.',msg:'There are no sessions on the calendar for this seminar right now. New dates are posted here the moment they are confirmed \u2014 tell us you are interested and we will let you know first.',btn:'Notify Me When Dates Are Set'},
    member:'AOI members save $600 on AdvO Bootcamp — join before you register.',
    h2:'The fastest route from zero to equipped.',
    overview:'<p>Featuring hands-on training, expert guest speakers, clinical research updates, and a celebratory Friday night awards dinner, this event will bring together the entire Advanced Orthogonal community to honor our legacy and look to the future.</p><p>Bootcamp is our immersive, fast-paced program designed to take doctors from zero to fully equipped in a highly effective format — and it is free with AOI membership.</p>',
    learn:['The complete protocol, compressed into one immersive week','Daily supervised instrument labs','Analysis intensives with real case sets','Guest expert sessions and research updates','Practice-building and patient communication','Community — the entire AdvO family in one room'],
    sched:[['MON–TUE','Foundation compression: evaluation, biomechanics, and x-ray analysis intensives.'],['WED–THU','Instrument labs: positioning, correction delivery, and consistency drills.'],['FRIDAY','Capstone case day — and the awards dinner celebrating the community.']],
    ctaH:'Free with membership.', ctaP:'Tampa Bay, FL · next dates announced soon · included with AOI membership.', ctaBtn:'Ask About the Next Bootcamp',
    spk:['cs','jk','mr'], keynote:null,
    agenda:[
      {day:'Day 1–2',date:'MON–TUE',items:[
        {t:'9:00',ap:'AM · LECTURE',title:'Evaluation & Biomechanics Intensive',desc:'The complete evaluation workflow, compressed.',who:['cs']},
        {t:'1:30',ap:'PM · LAB',title:'X-Ray Analysis Intensive',desc:'Digital line-drawing on real film sets.',who:['jk']}]},
      {day:'Day 3–4',date:'WED–THU',items:[
        {t:'9:00',ap:'AM · LAB',title:'Instrument Labs',desc:'Positioning, correction delivery, and consistency drills.',who:['cs']},
        {t:'11:00',ap:'AM · GUEST',title:'Research Updates in UC Neurology',desc:'The newest findings on neurological change after correction.',who:['mr']},
        {t:'3:00',ap:'PM · LECTURE',title:'The Certification Pathway: Level 1 to Level 2',desc:'What each level requires and how to prepare for your case reviews.',who:['jk']}]},
      {day:'Day 5',date:'FRIDAY',items:[
        {t:'9:00',ap:'AM · CAPSTONE',title:'Capstone Case Day',desc:'Full-protocol run-throughs judged by the faculty.',who:['cs','jk']},
        {t:'7:00',ap:'PM · SOCIAL',title:'Awards Dinner',desc:'Celebrating the community — legacy awards and the year ahead.',who:[]}]}]
  },
  conference:{
    photo:'conference',
    cat:'conference', title:'2026 Annual Conference', kicker:'Inflection Point · The Homecoming of the AOI Community', img:'ph-c',
    sub:'Two days of advanced clinical training, imaging, research, and case studies with the doctors moving this work forward — November 6–7 at the Pierce Clinic of Chiropractic, St. Petersburg.',
    dates:'November 6–7, 2026', loc:'St. Petersburg, FL', level:'All Levels', format:'2 Days · 8 AM–6 PM', price:'$797',
    fullPrice:797, memPrice:0, studentPrice:347, facultyFree:true,
    mbText:'Conference registration is INCLUDED with AOI membership — a $797 value. Sign in when you register and the fee is waived.',
    sessions:[], hideSess:true,
    regBand:{
      h:'Register for the 2026 Annual Conference',
      sub:'November 6–7, 2026 · 8:00 AM–6:00 PM both days · Pierce Clinic of Chiropractic, St. Petersburg, FL · 14 CE hours through Sherman College of Chiropractic.',
      btn:'Register for the Conference',
      tiers:[
        {k:'Doctor',p:'$797',n:'Practicing chiropractors and everyone outside the tiers below.'},
        {k:'Student',p:'$347',n:'Currently enrolled chiropractic students.'},
        {k:'AOI Member',p:'FREE',n:'Included with your membership — sign in when you register and the fee is waived.',hi:true,flag:'INCLUDED'},
        {k:'College Faculty',p:'FREE',n:'Faculty of chiropractic colleges. Register as faculty and the Institute confirms your seat.',hi:true}
      ],
      note:'Members and chiropractic college faculty still register — the fee comes off at checkout. Members: sign in first so we can see your membership.'
    },
    member:'INCLUDED with AOI membership — plus 14 hours of CE.',
    h2:'This year’s theme: Inflection Point.',
    overview:'<p>An inflection point is the place on a curve where its direction changes. The Institute and the technique are at one: modernizing the work while building on the foundation that brought us here. Across two days at the Pierce Clinic of Chiropractic — the home of Advanced Orthogonal — the program takes that on directly: cone-beam CT and three-dimensional reference frames, updated terminology and corrective positioning, Sonus: Blueprint, the practice-based research project, and the clinical questions that decide whether a correction holds.</p><p>Thirteen presenters, fourteen instructional hours, and the case studies that only this community can share. It is also the Institute’s working weekend — the research initiative, the instructor pathway, and the announcements for 2027 — where the membership’s voice shapes the year ahead.</p>',
    learn:['Cervical-vestibular-ocular rehabilitation after the correction','Sorting the dizzy patient at the bedside — lecture and hands-on lab','Operator Syndrome in combat veterans, with a full case study','Why the correction doesn’t hold: suboccipital analysis and soft-tissue reactivation','Updated AdvO terminology, corrective positioning, and Sonus worksheets','Cone-beam CT: three-dimensional analysis, case selection, and reference frames','Finding and clearing fibrous adhesion in the cervical spine','Upper cervical case studies from three practices','Teaching as a clinical skill — protecting procedural fidelity','The Institute’s practice-based research project and how to take part'],
    sched:[['FRIDAY','Vestibular-ocular rehab, the dizzy patient, Operator Syndrome, suboccipital muscle analysis, and the updated AdvO protocol with a supervised lab.'],['SATURDAY','CBCT and 3D reference frames, scar tissue and the atlas, case studies, teaching as a clinical skill, and the practice-based research project.']],
    ce:{
      hours:'14.0', sponsor:'Sherman College of Chiropractic, Office of Continuing Education',
      note:'Live, in-person instruction only. Sixty minutes of instruction counts as one CE hour; sign in and out of every session, with photo ID, to receive credit. No partial credit within a block.',
      approved:[['New York','AOI112026'],['Kansas','AOI112026'],['Missouri','AOI112026'],['Georgia','20-1408759'],['North Carolina','20-1408759'],['Minnesota','MBCE ID #91129'],['Puerto Rico','Approved territory']],
      auto:['Colorado','Connecticut','Delaware','District of Columbia','Idaho','Indiana','Maryland','Massachusetts','Michigan','New Jersey','Ohio','Rhode Island','South Carolina','Utah','Vermont','Virginia','Washington','Wyoming','Newfoundland','Ontario'],
      self:['Illinois','Iowa','Montana','Nebraska','Oregon','British Columbia','Quebec'],
      pending:['Florida','New Hampshire'],
      notApplied:['Alabama','Alaska','Arizona','Arkansas','California','Hawaii','Kentucky','Louisiana','Maine','Nevada','New Mexico','North Dakota','Oklahoma','Pennsylvania','South Dakota','Texas','West Virginia','Wisconsin','Nova Scotia','Saskatchewan'],
      special:[['Mississippi','Sherman does not apply to Mississippi; attendees may apply to the Mississippi Board directly as a licensed DC.'],['Tennessee','Sherman does not apply to Tennessee; the hosting organization applies to the TN board directly.'],['Alberta','Attendees are responsible for confirming the activity meets provincial requirements.'],['New Brunswick','The NBCA no longer pre-approves courses; eligibility rests with the member.']],
      disclaimer:'Sherman College is a CCE-accredited college, so applications are not made to states listed as Auto Approval or DC Self; check with your board that the content falls within its scope requirements. Missouri: approval of this course is not a ruling by the Board that the methods taught are the appropriate practice of chiropractic as defined in Section 331.010, RSMo. The opinions and statements of the speakers do not necessarily reflect those of Sherman College.'
    },
    ctaH:'Be in the room in St. Petersburg.', ctaP:'November 6–7, 2026 · Pierce Clinic of Chiropractic · $797 for doctors, $347 for students · free with AOI membership · 14 CE hours.', ctaBtn:'Reserve Your Seat',
    spk:['silver','billiris','hulsey','wooden','beadle','colavita','miranda','bollen','jobarah','pavlovic','corsello','fowler','cs'], keynote:null,
    exhibitors:['UpperCervicalCare.com','Televere Systems','NeckCare','Cervipedic'],
    agenda:[
      {day:'Day 1',date:'FRI NOV 6',items:[
        {t:'7:00',ap:'AM · DOORS',title:'Registration, Breakfast & Vendor Hall',desc:'Check-in with photo ID, coffee, and the vendor floor opens. Breakfast from 8:00.',who:[]},
        {t:'8:50',ap:'AM · WELCOME',title:'Welcome and CE Housekeeping',desc:'Opening remarks, the weekend overview, and sign-in and sign-out instructions.',who:['cs']},
        {t:'9:00',ap:'AM · NEURO · CE 1.0',title:'Cervical-Vestibular-Ocular Rehabilitation',desc:'How the upper cervical spine, vestibular system, and oculomotor control interact — and how rehabilitating that triad supports and extends the correction in post-concussion, dizziness, and chronic cases.',who:['silver']},
        {t:'10:20',ap:'AM · CLINICAL · CE 1.0',title:'Clarifying the Dizzy Factor — Part 1',desc:'A hands-on approach to getting to the right diagnosis, fast: the short chain of questions that narrows the field, then the bedside tests that separate BPPV, vestibular, cardiovascular, central, and cervicogenic causes.',who:['billiris']},
        {t:'11:20',ap:'AM · CLINICAL · CE 1.0',title:'Upper Cervical Misalignments in Operator Syndrome',desc:'Clinical insights and case-based approaches for treating combat veterans, including a detailed case of Multiple System Atrophy with dysautonomia and a nonprofit care pathway for veterans.',who:['hulsey']},
        {t:'12:20',ap:'PM · LUNCH',title:'Vendor-Sponsored Lunch',desc:'Lunch in the vendor hall.',who:[]},
        {t:'1:30',ap:'PM · CLINICAL · CE 1.0',title:'Why the Correction Doesn’t Hold',desc:'Upper cervical muscle analysis and soft-tissue reactivation: a structured analysis of suboccipital muscle, ligament, and capsule, and a reactivation technique aimed at restoring normal tone and mechanoreceptor input.',who:['wooden']},
        {t:'2:30',ap:'PM · HANDS-ON · CE 1.0',title:'Clarifying the Dizzy Factor — Part 2',desc:'Supervised hands-on laboratory. Participants work in pairs to practice each bedside test from Part 1 until the sequence is reliable.',who:['billiris']},
        {t:'3:30',ap:'PM · BREAK',title:'Vendor Break',desc:'Thirty minutes on the vendor floor.',who:[]},
        {t:'4:00',ap:'PM · PROTOCOL · CE 1.0',title:'Updated Terminology, Corrective Positioning & Sonus Worksheets — Part 1',desc:'The updated Advanced Orthogonal terminology and each step of the corrective setup, with worksheets completed and reviewed in session.',who:['beadle']},
        {t:'5:00',ap:'PM · HANDS-ON · CE 1.0',title:'Updated Terminology, Corrective Positioning & Sonus Worksheets — Part 2',desc:'Supervised laboratory: the corrective setup sequence performed on partners under instructor observation, with correction on each step.',who:['beadle']}]},
      {day:'Day 2',date:'SAT NOV 7',items:[
        {t:'8:00',ap:'AM · DOORS',title:'Breakfast & Vendor Hall',desc:'Coffee, breakfast, and a second pass through the vendor floor.',who:[]},
        {t:'8:50',ap:'AM · WELCOME',title:'Day Two Welcome and CE Housekeeping',desc:'Sign-in reminders and the day’s overview.',who:['cs']},
        {t:'9:00',ap:'AM · IMAGING · CE 1.0',title:'Cone-Beam CT in Upper Cervical Practice',desc:'Three-dimensional analysis and case selection: what CBCT shows that plain film cannot, patient safety and dose, and what adopting CBCT involves in a working clinic.',who:['colavita']},
        {t:'10:00',ap:'AM · IMAGING · CE 1.0',title:'CBCT and Three-Dimensional Reference Frames',desc:'The evolution of vector analysis: reference frames, coordinate systems, and the relationships between patient positioning, instrument orientation, and vector application in true three-dimensional space.',who:['miranda']},
        {t:'11:15',ap:'AM · CLINICAL · CE 1.0',title:'Scar Tissue and the Atlas',desc:'Finding and clearing fibrous adhesion in the cervical spine by hand — where it accumulates, how it feels, which patterns point to a tether on the atlas — and the Joint Clearing Technique for releasing it.',who:['bollen']},
        {t:'12:15',ap:'PM · LUNCH',title:'Lunch & Vendor Hall',desc:'Last pass through the vendor floor.',who:[]},
        {t:'1:30',ap:'PM · CASES · CE 1.0',title:'Upper Cervical Case Studies',desc:'Three twenty-minute case presentations: complex neurological presentations resolved through upper cervical care; From BJ to Blueprint, the evolution of orthogonal work; and managing the complex patient.',who:['jobarah','pavlovic','corsello']},
        {t:'2:30',ap:'PM · TEACHING · CE 1.0',title:'Teaching Is a Clinical Skill',desc:'Maintaining procedural fidelity through mentoring: how psychomotor skill is transferred, how to spot the specific procedural error, and the competencies a doctor must show to teach the procedure.',who:['fowler']},
        {t:'3:45',ap:'PM · RESEARCH · CE 1.0',title:'Practice-Based Research — Part 1',desc:'Study design and outcome measurement: the clinical question, the design, how outcomes are defined and measured, and what data collection looks like inside a working practice.',who:['cs']},
        {t:'4:45',ap:'PM · RESEARCH · CE 1.0',title:'Practice-Based Research — Part 2',desc:'Case selection and data collection: screening sample presentations against the criteria, completing the instruments correctly, and the record-keeping and consent obligations of participation.',who:['cs']},
        {t:'5:45',ap:'PM · CLOSE',title:'Closing Announcements',desc:'Closing remarks, the 2027 seminar announcement, and the presale opening.',who:['cs']}]}]
  },
  internship:{
    cat:'internship', title:'Internships', kicker:'Clinical Immersion · By Application', img:'ph-b',
    sub:'Train inside an active Advanced Orthogonal practice — real cases, real reps, real mentorship.',
    dates:'Ongoing', loc:'Host Clinics Nationwide', level:'Students & New Doctors', format:'In-Clinic Immersion', price:'By Application',
    fullPrice:-1, memPrice:-1, mbText:'AOI membership connects you with host doctors and accelerates placement.',
    sessions:[], noSess:{kick:'Applications',h2:'Open year-round',title:'Internships run continuously at host clinics nationwide.',msg:'There are no fixed start dates \u2014 placements are matched by the Institute based on your stage of training and preferred region.',btn:'Apply Now',primary:true},
    member:'AOI membership connects you with host doctors and accelerates placement.',
    h2:'Learn where the work actually happens.',
    overview:'<p>AOI internships place students and new doctors inside active Advanced Orthogonal practices, where the protocol is lived daily — not simulated.</p><p>Under the mentorship of certified doctors, interns participate in real analysis, observe real corrections, and build the clinical instincts that seminars alone can\'t teach.</p>',
    learn:['Daily clinic workflow in a precision practice','Live x-ray analysis alongside certified doctors','Patient communication and case management','Correction observation and supervised participation','Practice operations and growth','A direct path toward certification'],
    sched:[['STRUCTURE','Internship length and structure are set with the host clinic — from focused week-long immersions to semester placements.'],['APPLICATION','Submit your interest through the contact form; the Institute matches interns with host doctors.']],
    ctaH:'Apply for placement.', ctaP:'Tell us your stage of training and preferred region — we\'ll match you with a host clinic.', ctaBtn:'Apply Now',
    spk:[], keynote:null, agenda:null
  }
} as unknown as Record<string, Seminar>

/** Category label shown on catalog cards. */
export const CATEGORY_LABEL: Record<string, string> = {free:'FREE',fundamentals:'FOUNDATION',intensive:'ADVANCED',bootcamp:'ALL LEVELS',conference:'ALL LEVELS',internship:'BY APPLICATION'}

/** Site key -> `public.events.slug` in the backend. Also the public URL slug. */
export const DB_SLUG: Record<string, string | null> = {intro:'intro-to-advo',fund1:'fundamental-1',fund2:'fundamental-2',fund3:'fundamental-3',
  intensive:'advo-intensive-west',bootcamp:'advo-bootcamp-2027',conference:'annual-conference-2026',
  internship:null}

/** Fallback event ids used only when the live sync request fails. */
export const DB_ID: Record<string, number | null> = {intro:7,fund1:null,fund2:9,fund3:10,intensive:null,bootcamp:null,conference:13,internship:null}

/** Seminar key -> public route slug. `internship` has no DB row, so it gets a
 *  hand-written slug; every other route slug IS the database slug, which keeps
 *  the URL, the sitemap and the event record in agreement. */
export const SEMINAR_SLUG: Record<string, string> = Object.fromEntries(
  Object.keys(SEMINARS).map((key) => [key, DB_SLUG[key] ?? 'internships']),
)

export const SLUG_TO_SEMINAR: Record<string, string> = Object.fromEntries(
  Object.entries(SEMINAR_SLUG).map(([key, slug]) => [slug, key]),
)
