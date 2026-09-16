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
    cat:'conference', title:'2026 Annual Conference', kicker:'The Homecoming of the AOI Community', img:'ph-c',
    sub:'Two days of advanced training, imaging, research, and case studies \u2014 with the doctors who are moving this work forward.',
    dates:'November 6\u20137, 2026', loc:'Tampa Bay, FL', level:'All Levels', format:'2-Day Conference', price:'$797',
    fullPrice:797, memPrice:0, studentPrice:347, facultyFree:true,
    mbText:'Conference registration is INCLUDED with AOI membership \u2014 a $797 value. Sign in when you register and the fee is waived.',
    sessions:[], hideSess:true,
    regBand:{
      h:'Register for the 2026 Annual Conference',
      sub:'November 6\u20137, 2026 \u00b7 Pierce Clinic of Chiropractic, St. Petersburg, FL \u00b7 Two full days of clinical training, imaging, research and case studies.',
      btn:'Register for the Conference',
      tiers:[
        {k:'Doctor',p:'$797',n:'Practicing chiropractors and everyone outside the tiers below.'},
        {k:'Student',p:'$347',n:'Currently enrolled chiropractic students.'},
        {k:'AOI Member',p:'FREE',n:'Included with your membership \u2014 sign in when you register and the fee is waived.',hi:true,flag:'INCLUDED'},
        {k:'College Faculty',p:'FREE',n:'Faculty of chiropractic colleges. Register as faculty and the Institute confirms your seat.',hi:true}
      ],
      note:'Members and chiropractic college faculty still register \u2014 the fee comes off at checkout. Members: sign in first so we can see your membership.'
    },
    member:'INCLUDED with AOI membership \u2014 plus optional CE credits.',
    h2:'The homecoming of the upper cervical year.',
    overview:'<p>The 2026 Annual Conference brings the whole Advanced Orthogonal community to Tampa Bay for two days of advanced clinical training \u2014 CBCT and CT imaging, vertigo assessment, upper cervical muscle analysis, neurology, scar tissue management, and the case studies that only this community can share.</p><p>It\u2019s also the Institute\u2019s working weekend: the research initiative, updated protocol terminology, the instructor pathway, and committee updates on certification and marketing \u2014 where the membership\u2019s voice directly shapes the year ahead.</p>',
    learn:['Recognizing Operator Syndrome in combat veterans','CBCT and 3D imaging \u2014 from the Akridge Equation to the Miranda Equation','A practical vertigo assessment framework','Upper cervical muscle analysis','Updated terminology, corrective positioning, and Sonus worksheets','Scar tissue management in patient outcomes','The Institute research initiative \u2014 and how to participate','The pathway to becoming an AdvO instructor'],
    sched:[['FRIDAY','Research initiative kickoff, Operator Syndrome, CBCT 3D imaging, and vertigo assessment \u2014 evening social to close the day.'],['SATURDAY','Protocol updates, muscle analysis, neurology, CT, scar tissue management, the instructor pathway, case studies, and committee updates.']],
    ctaH:'Be in the room in Tampa Bay.', ctaP:'November 6\u20137, 2026 \u00b7 Tampa Bay, FL \u00b7 $797 for doctors, $347 for students \u00b7 free with AOI membership.', ctaBtn:'Reserve Your Seat',
    spk:['cs','miranda','beadle','billiris','hulsey','wooden','colavita','silver','bollen','fowler','damico','jorbora','corsello'], keynote:null,
    exhibitors:['UpperCervicalCare.com','Televere Systems','NeckCare','Cervipedic'],
    agenda:[
      {day:'Day 1',date:'FRI NOV 6',items:[
        {t:'8:00',ap:'AM \u00b7 WELCOME',title:'Registration & Welcome',desc:'Check-in, coffee, and the exhibitor floor opens.',who:[]},
        {t:'9:00',ap:'AM \u00b7 RESEARCH',title:'Conference Opening \u2014 The Research Project',desc:'Opening the 2026 conference with the Institute\u2019s research initiative: where it stands and how to participate.',who:['cs']},
        {t:'11:15',ap:'AM \u00b7 CLINICAL',title:'Operator Syndrome in Combat Veterans',desc:'Clinical recognition of Operator Syndrome \u2014 and what precision upper cervical care offers.',who:['hulsey']},
        {t:'12:00',ap:'PM \u00b7 LUNCH',title:'Lunch & Exhibitors',desc:'Visit the companies serving the upper cervical space.',who:[]},
        {t:'1:15',ap:'PM \u00b7 IMAGING',title:'CBCT \u2014 Wrapping Your Mind Around 3D Space',desc:'From the Akridge Equation to the Miranda Equation.',who:['miranda']},
        {t:'3:30',ap:'PM \u00b7 CLINICAL',title:'Vertigo Assessment',desc:'A practical framework for assessing vertigo in upper cervical practice.',who:['billiris']},
        {t:'5:30',ap:'PM \u00b7 SOCIAL',title:'Evening Social',desc:'Reconnect with the AOI community.',who:[]}]},
      {day:'Day 2',date:'SAT NOV 7',items:[
        {t:'9:00',ap:'AM \u00b7 PROTOCOL',title:'Updated Terminology, Corrective Positioning & Sonus Worksheets',desc:'Keeping the protocol\u2019s language, positioning, and documentation sharp across the community.',who:['beadle']},
        {t:'11:15',ap:'AM \u00b7 CLINICAL',title:'UC Muscle Analysis',desc:'What the musculature reveals about the correction.',who:['wooden']},
        {t:'12:15',ap:'PM \u00b7 LUNCH',title:'Lunch & Exhibitors',desc:'Last pass through the exhibitor floor.',who:[]},
        {t:'1:15',ap:'PM \u00b7 NEURO',title:'The Neuro Session',desc:'A deep dive for the neurology junkies of the upper cervical world.',who:['silver']},
        {t:'2:15',ap:'PM \u00b7 IMAGING',title:'CT in Upper Cervical Practice',desc:'Where CT fits in the imaging toolbox.',who:['colavita']},
        {t:'3:30',ap:'PM \u00b7 CLINICAL',title:'Scar Tissue Management',desc:'Managing scar tissue and its role in patient outcomes.',who:['bollen']},
        {t:'4:30',ap:'PM \u00b7 INSTITUTE',title:'Stepping Up to Be Instructors of AdvO',desc:'The pathway from certified doctor to Institute faculty.',who:['fowler']},
        {t:'5:10',ap:'PM \u00b7 CASES',title:'Case Studies',desc:'\u201cHoning Back to UC\u201d and a second case study from the field.',who:['corsello','jorbora']},
        {t:'5:50',ap:'PM \u00b7 INSTITUTE',title:'Committee Update \u2014 Certification & Marketing',desc:'Where the committees are taking the Institute next.',who:['damico']},
        {t:'6:10',ap:'PM \u00b7 CLOSE',title:'Closing Remarks',desc:'The year ahead. Additional sessions with Dr. Debra Pavlovic, Joe & Carol Ball, and more are being confirmed.',who:['cs']}]}]
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
