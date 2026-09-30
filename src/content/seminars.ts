/* ----------------------------------------------------------------------------
 * Seminar and event catalog
 * Lifted verbatim from the v4.8 single-file build. Content lives here, outside
 * components, so the same object feeds the page, its metadata and its
 * structured data — what a human reads and what a machine reads cannot drift.
 * -------------------------------------------------------------------------- */

import {
  INTENSIVE_RULES, BOOTCAMP_RULE, nextOccurrence, longRange, eventSlug, zoomSeason, zoomDates, zoomSlug, listDates,
} from './calendar'

/* Dates that follow the Board's calendar rules are computed, not typed: the
 * next three Intensive weekends, the next Bootcamp, and this year's member
 * Zoom calls. See `./calendar.ts`. */
const TODAY = new Date()
const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const INTENSIVES = INTENSIVE_RULES.map((r) => ({ r, o: nextOccurrence(r, TODAY) }))
  .sort((a, b) => a.o.start.getTime() - b.o.start.getTime())
const BOOTCAMP = nextOccurrence(BOOTCAMP_RULE, TODAY)
const ZOOM_SEASON = zoomSeason(TODAY)
const regKey = (id: string) => id.replace('-', ':')

/** "Feb, Apr & Aug 2027", or "Apr & Aug 2027 · Feb 2028" across a new year. */
function monthsLine(list: typeof INTENSIVES): string {
  const byYear = new Map<number, string[]>()
  for (const { o } of list) byYear.set(o.year, [...(byYear.get(o.year) ?? []), MON[o.start.getMonth()]!.charAt(0) + MON[o.start.getMonth()]!.slice(1).toLowerCase()])
  return [...byYear.entries()]
    .map(([y, ms]) => `${ms.length > 1 ? `${ms.slice(0, -1).join(', ')} & ${ms[ms.length - 1]}` : ms[0]} ${y}`)
    .join(' · ')
}

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
    dates:'Oct–Jan · 2nd Tuesdays · 9 PM ET', loc:'Live on Zoom', level:'Foundation · Members Only', format:'Monthly Live Session', price:'Members Only',
    member:'Fundamentals is for AOI members — the monthly Zoom sessions are part of membership.', mbText:'Members only — the monthly Fundamentals Zoom sessions are part of AOI membership.',
    fullPrice:0, memPrice:0,
    video:'https://player.vimeo.com/video/519671965',
    sessions:[{mo:'OCT–JAN',dy:'2nd Tue',yr:'9 PM ET',city:'Live on Zoom',venue:'Monthly · members only',seats:'RSVP',reg:'fund1',members:true}], noSess:{kick:'Schedule',h2:'October through January, live on Zoom',title:`Fundamental 1 meets ${listDates(zoomDates('fund1', ZOOM_SEASON))}, for AOI members.`,msg:'This year the Fundamentals Series is taught live on Zoom rather than as an in-person lecture weekend. Fundamental 1 meets on the second Tuesday of each month from October through January at 9:00 pm Eastern (8:00 pm Central, 7:00 pm Mountain, 6:00 pm Pacific). It is open to AOI members. Tell us you are interested and we will send you the details.',btn:'Tell Me About the Zoom Sessions'},
    h2:'Where the foundation is poured.',
    overview:'<p>Fundamental 1 is the entry point to Advanced Orthogonal training. This year it is taught live on Zoom instead of as an in-person lecture weekend: AOI members meet with experienced instructors on the second Tuesday of each month from October through January, at 9:00 pm Eastern, to build the observational and analytical foundation that everything else in the technique rests on, with time in every session for your own cases and questions.</p><p>This year\'s sessions: ' + listDates(zoomDates('fund1', ZOOM_SEASON)) + ', each at 9:00 pm Eastern.</p><p><b>The Zoom sessions do not include hands-on training.</b> Be sure to attend an <a href="/seminars/advo-intensive">AdvO Intensive</a> — its hands-on training covers all three Fundamentals.</p><p>The Fundamentals Series is sequential — each part builds directly on the last, and completing all three is a requirement on the Level 1 Certification track.</p>',
    learn:['Patient evaluation and nerve interference assessment','Upper cervical biomechanics and the atlas subluxation complex','Introduction to the specific three-dimensional x-ray series','Postural analysis and supine leg check protocol','Case history and patient management fundamentals','Instrument overview and safety'],
    sched:[['OCT–JAN',`${listDates(zoomDates('fund1', ZOOM_SEASON))}, 9:00 pm Eastern, live on Zoom: instruction on the evaluation protocol, biomechanics, and x-ray positioning, then open time for your cases and questions.`],['HANDS-ON','Not part of the Zoom sessions: attend an AdvO Intensive, whose hands-on training covers all three Fundamentals.']],
    ctaH:'Begin the Fundamentals Series.', ctaP:'Members only · live on Zoom, October through January · completing the series is a Level 1 requirement.', ctaBtn:'RSVP for the Monthly Zoom',
    spk:['cs','jk'], keynote:null,
    agenda:[{day:null,items:[
      {t:'PART 1',ap:'LIVE ON ZOOM',title:'Evaluation Protocol — Foundations',desc:'Nerve interference assessment and UC biomechanics.',who:['cs']},
      {t:'PART 2',ap:'LIVE ON ZOOM',title:'Postural Analysis',desc:'Leg check, posture, and case history workflow, demonstrated and discussed.',who:['cs']},
      {t:'PART 3',ap:'LIVE ON ZOOM',title:'The 3-D X-Ray Series',desc:'Positioning and introduction to the specific x-ray series.',who:['jk']},
      {t:'PART 4',ap:'LIVE ON ZOOM',title:'Case Review',desc:'Your cases and questions, and next steps on the certification track.',who:['cs','jk']}]}]
  },
  fund2:{
    photo:'analyze',
    mux:'Cv8vCuTsBB02Mm9NRVBId5I45rNwogllO9af7GwSY5oA', muxName:'Dr. Zach Perry',
    cat:'fundamentals', title:'Fundamental 2', kicker:'Fundamentals Series · Part 2 of 3', img:'ph-a',
    sub:'X-ray analysis and line drawing — the measurement skill at the center of the technique.',
    dates:'Feb–May · 2nd Tuesdays · 9 PM ET', loc:'Live on Zoom', level:'Foundation · Requires F1', format:'Monthly Live Session', price:'Members Only',
    fullPrice:0, memPrice:0,
    sessions:[{mo:'FEB–MAY',dy:'2nd Tue',yr:'9 PM ET',city:'Live on Zoom',venue:'Monthly · members only',seats:'RSVP',reg:'fund2',members:true}], noSess:{kick:'Schedule',h2:'February through May, live on Zoom',title:`Fundamental 2 meets ${listDates(zoomDates('fund2', ZOOM_SEASON))}, for AOI members.`,msg:'This year the Fundamentals Series is taught live on Zoom rather than as an in-person lecture weekend. Fundamental 2 meets on the second Tuesday of each month from February through May at 9:00 pm Eastern (8:00 pm Central, 7:00 pm Mountain, 6:00 pm Pacific). It is open to AOI members. Tell us you are interested and we will send you the details.',btn:'Tell Me About the Zoom Sessions'},
    member:'Fundamentals is for AOI members — the monthly Zoom sessions are part of membership.', mbText:'Members only — the monthly Fundamentals Zoom sessions are part of AOI membership.',
    h2:'The analysis becomes precise.',
    overview:'<p>Fundamental 2 goes deep on the signature skill of the Advanced Orthogonal doctor: measuring the upper cervical misalignment on specific three-dimensional x-rays using digital software.</p><p>You\'ll learn to determine each patient\'s gravitational and neurological normal — taking genetic abnormalities into account — and translate that analysis into a patient-specific correction vector.</p><p>This year Fundamental 2 is taught live on Zoom instead of as an in-person lecture weekend, for AOI members, on the second Tuesday of each month from February through May, at 9:00 pm Eastern.</p><p>This year\'s sessions: ' + listDates(zoomDates('fund2', ZOOM_SEASON)) + ', each at 9:00 pm Eastern.</p><p><b>The Zoom sessions do not include hands-on training.</b> Be sure to attend an <a href="/seminars/advo-intensive">AdvO Intensive</a> — its hands-on training covers all three Fundamentals.</p>',
    learn:['Digital x-ray line drawing and analysis software','Measuring displacement against the patient\'s own normal','Accounting for genetic anomalies in the analysis','Deriving the correction vector from the misalignment variables','Inter- and intra-examiner reliability protocols','Analysis case reviews with real film sets'],
    sched:[['FEB–MAY',`${listDates(zoomDates('fund2', ZOOM_SEASON))}, 9:00 pm Eastern, live on Zoom: digital analysis and line drawing, correction vector derivation, and reliability testing, worked through on real film sets.`],['HANDS-ON','Not part of the Zoom sessions: attend an AdvO Intensive, whose hands-on training covers all three Fundamentals.']],
    ctaH:'Continue the series.', ctaP:'Fundamental 1 is the prerequisite · members only · live on Zoom, February through May.', ctaBtn:'RSVP for the Monthly Zoom',
    spk:['jk','cs'], keynote:null,
    agenda:[{day:null,items:[
      {t:'PART 1',ap:'LIVE ON ZOOM',title:'Digital Analysis Instruction',desc:'Line-drawing methodology and the analysis software.',who:['jk']},
      {t:'PART 2',ap:'LIVE ON ZOOM',title:'Guided Line Drawing',desc:'Real film sets, measured and drawn on screen under instruction.',who:['jk']},
      {t:'PART 3',ap:'LIVE ON ZOOM',title:'Correction Vector Derivation',desc:'From misalignment variables to a patient-specific vector.',who:['cs']},
      {t:'PART 4',ap:'LIVE ON ZOOM',title:'Reliability Testing',desc:'Inter- and intra-examiner reliability protocols and case analysis.',who:['jk','cs']}]}]
  },
  fund3:{
    photo:'adjust',
    mux:'j4sZdYYoA3c2i7x1w8TocHVIFPYjI00xKL5XL602MD1Tk', muxName:'Dr. Josh Silver',
    cat:'fundamentals', title:'Fundamental 3', kicker:'Fundamentals Series · Part 3 of 3', img:'ph-a',
    sub:'The instrument, the correction, and the complete patient protocol.',
    dates:'Jun–Sep · 2nd Tuesdays · 9 PM ET', loc:'Live on Zoom', level:'Foundation · Requires F1 & F2', format:'Monthly Live Session', price:'Members Only',
    fullPrice:0, memPrice:0,
    sessions:[{mo:'JUN–SEP',dy:'2nd Tue',yr:'9 PM ET',city:'Live on Zoom',venue:'Monthly · members only',seats:'RSVP',reg:'fund3',members:true}], noSess:{kick:'Schedule',h2:'June through September, live on Zoom',title:`Fundamental 3 meets ${listDates(zoomDates('fund3', ZOOM_SEASON))}, for AOI members.`,msg:'This year the Fundamentals Series is taught live on Zoom rather than as an in-person lecture weekend. Fundamental 3 meets on the second Tuesday of each month from June through September at 9:00 pm Eastern (8:00 pm Central, 7:00 pm Mountain, 6:00 pm Pacific). It is open to AOI members. Tell us you are interested and we will send you the details.',btn:'Tell Me About the Zoom Sessions'},
    member:'Fundamentals is for AOI members — the monthly Zoom sessions are part of membership.', mbText:'Members only — the monthly Fundamentals Zoom sessions are part of AOI membership.',
    h2:'Everything comes together.',
    overview:'<p>Fundamental 3 completes the foundation: delivering the correction with the table-mounted percussive sound-wave instrument, positioning the patient with digital and laser alignment, and running the full protocol from evaluation through post-correction monitoring.</p><p>This year Fundamental 3 is taught live on Zoom instead of as an in-person lecture weekend, for AOI members, on the second Tuesday of each month from June through September, at 9:00 pm Eastern.</p><p><b>The Zoom sessions do not include hands-on training.</b> Be sure to attend an <a href="/seminars/advo-intensive">AdvO Intensive</a> — its hands-on training covers all three Fundamentals.</p><p>This year\'s sessions: ' + listDates(zoomDates('fund3', ZOOM_SEASON)) + ', each at 9:00 pm Eastern.</p><p>Graduates of the full Fundamentals Series are equipped to begin supervised practice of the technique and to enter the Level 1 Certification process.</p>',
    learn:['Percussive sound-wave instrument operation and settings','Patient positioning with digital and laser alignment','Delivering the patient-specific correction vector','Post-correction assessment and monitoring protocol','Care planning and the sustainable-corrections model','Preparing for Level 1 Certification'],
    sched:[['JUN–SEP',`${listDates(zoomDates('fund3', ZOOM_SEASON))}, 9:00 pm Eastern, live on Zoom: the instrument, patient positioning, the full protocol, and certification prep.`],['HANDS-ON','Not part of the Zoom sessions: attend an AdvO Intensive, whose hands-on training covers all three Fundamentals.']],
    ctaH:'Complete your foundation.', ctaP:'Members only · live on Zoom, June through September · finishing the series opens the Level 1 Certification track.', ctaBtn:'RSVP for the Monthly Zoom',
    spk:['cs','jk'], keynote:null,
    agenda:[{day:null,items:[
      {t:'PART 1',ap:'LIVE ON ZOOM',title:'Instrument Instruction',desc:'Percussive sound-wave instrument operation and settings.',who:['cs']},
      {t:'PART 2',ap:'LIVE ON ZOOM',title:'Patient Positioning',desc:'Positioning with digital and laser alignment, demonstrated and discussed.',who:['cs']},
      {t:'PART 3',ap:'LIVE ON ZOOM',title:'The Full Protocol',desc:'Evaluation through post-correction monitoring.',who:['cs','jk']},
      {t:'PART 4',ap:'LIVE ON ZOOM',title:'Certification Prep',desc:'The Level 1 process, requirements, and your application.',who:['jk']}]}]
  },
  intensive:{
    photo:'instrument',
    mux:'A21LSsljbccxw2O9500U9IuqeLq00g34T02hdZHFlFgUlw', muxName:'Dr. Jeff Kahrs',
    cat:'intensive', title:'AdvO Intensive', kicker:'Advanced Training · Bridging the Gap from A.O. to AdvO', img:'ph-b',
    sub:'Refine precision and consistency — with an accelerated transition day for Atlas Orthogonal doctors.',
    dates:monthsLine(INTENSIVES), loc:'St. Petersburg, FL & Orem, UT', level:'Advanced', format:'2-Day Hands-On', price:'$1,295',
    fullPrice:1295, memPrice:1095,
    sessions:INTENSIVES.map(({ r, o }) => ({ mo:MON[o.start.getMonth()], dy:`${o.start.getDate()}–${o.end.getDate()}`, yr:String(o.year), city:r.where, venue:r.venue, seats:'Registration', reg:regKey(r.id) })),
    member:'AOI members save $200 — $1,095 for members.',
    h2:'For doctors ready to sharpen the edge.',
    overview:'<p>A focused, hands-on training event designed for experienced doctors ready to refine their precision and consistency with the Advanced Orthogonal technique.</p><p>The optional first day offers an accelerated transition course for Atlas Orthogonal certified doctors — bridging the gap between A.O. and AdvO in a single concentrated day of instruction and supervised reps.</p>',
    learn:['Advanced correction vector refinement','Troubleshooting difficult and atypical cases','Consistency drills with instructor feedback','A.O.-to-AdvO transition protocol (optional Day 1)','Post-correction monitoring at a mastery level','Case review with senior instructors'],
    sched:[['DAY 1 (OPTIONAL)','Bridging the Gap: accelerated transition course for Atlas Orthogonal certified doctors.'],['DAY 2','The Intensive: advanced hands-on refinement, consistency work, and complex case labs.']],
    ctaH:'Two days. Measurably sharper.', ctaP:'Three weekends a year · St. Petersburg, FL and Orem, UT · members save $200.', ctaBtn:'Choose Your Intensive Weekend',
    spk:['cs','jk'], keynote:null,
    agenda:[
      {day:'Day 1',date:'FRIDAY',items:[
        {t:'9:00',ap:'AM',title:'Introduction & History/Exam',desc:'',who:[]},
        {t:'10:00',ap:'AM',title:'X-Ray & CBCT Setup',desc:'',who:[]},
        {t:'11:00',ap:'AM',title:'X-Ray & CBCT Analysis',desc:'',who:[]},
        {t:'12:00',ap:'PM',title:'Lunch',desc:'',who:[]},
        {t:'1:00',ap:'PM',title:'Show Exam/X-Ray Setup',desc:'',who:[]},
        {t:'2:00',ap:'PM',title:'Show X-Ray Setup/Analysis',desc:'',who:[]},
        {t:'3:00',ap:'PM',title:'Pattern Understanding & Corrective Setup',desc:'',who:[]},
        {t:'4:00',ap:'PM',title:'Corrective Setup & Show Corrective Setup',desc:'',who:[]},
        {t:'5:00',ap:'PM',title:'The Adjustment, Show The Adjustment, & Close',desc:'',who:[]}]},
      {day:'Day 2',date:'SATURDAY',items:[
        {t:'9:00',ap:'AM',title:'Review',desc:'',who:[]},
        {t:'10:00',ap:'AM',title:'Exam Practice',desc:'',who:[]},
        {t:'11:00',ap:'AM',title:'X-Ray Setup Practice',desc:'',who:[]},
        {t:'12:00',ap:'PM',title:'X-Ray Analysis Practice',desc:'',who:[]},
        {t:'1:00',ap:'PM',title:'Lunch',desc:'',who:[]},
        {t:'2:00',ap:'PM',title:'Simple Corrective Setup Practice',desc:'',who:[]},
        {t:'3:00',ap:'PM',title:'Advanced Corrective Setup Practice',desc:'',who:[]},
        {t:'4:00',ap:'PM',title:'Review & Case Studies',desc:'',who:[]},
        {t:'5:00',ap:'PM',title:'Q&A, Close',desc:'',who:[]}]}]
  },
  bootcamp:{
    photo:'setup',
    mux:'A9cxLKvjJcX5u02Qzh8agXEOPLMkmNzXTKHPrx02wnG2s', muxName:'Dr. Drew',
    cat:'bootcamp', title:`AdvO Bootcamp ${BOOTCAMP.year}`, kicker:'The Immersive Week · Zero to Fully Equipped', img:'ph-a',
    sub:'Five days of hands-on training, guest experts, research updates — and the Friday night awards dinner.',
    dates:longRange(BOOTCAMP), loc:'Tampa Bay, FL', level:'All Levels', format:'5-Day Immersive', price:'$2,495',
    fullPrice:2495, memPrice:1895, mbText:'AOI members save $600 on AdvO Bootcamp — $1,895 for members.',
    sessions:[{ mo:MON[BOOTCAMP.start.getMonth()], dy:`${BOOTCAMP.start.getDate()}–${BOOTCAMP.end.getDate()}`, yr:String(BOOTCAMP.year), city:'Tampa Bay, FL', venue:'Five-day immersive', seats:'Registration', reg:'bootcamp:week' }],
    member:'AOI members save $600 on AdvO Bootcamp — join before you register.',
    h2:'The fastest route from zero to equipped.',
    overview:'<p>Featuring hands-on training, expert guest speakers, clinical research updates, and a celebratory Friday night awards dinner, this event will bring together the entire Advanced Orthogonal community to honor our legacy and look to the future.</p><p>Bootcamp is our immersive, fast-paced program designed to take doctors from zero to fully equipped in a highly effective format — and it is free with AOI membership.</p>',
    learn:['The complete protocol, compressed into one immersive week','Daily supervised instrument labs','Analysis intensives with real case sets','Guest expert sessions and research updates','Practice-building and patient communication','Community — the entire AdvO family in one room'],
    sched:[['MON–TUE','Foundation compression: evaluation, biomechanics, and x-ray analysis intensives.'],['WED–THU','Instrument labs: positioning, correction delivery, and consistency drills.'],['FRIDAY','Capstone case day — and the awards dinner celebrating the community.']],
    ctaH:'Free with membership.', ctaP:`Tampa Bay, FL · ${longRange(BOOTCAMP)} · included with AOI membership.`, ctaBtn:'Register for Bootcamp',
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
  intensive:'advo-intensive',bootcamp:'advo-bootcamp-2027',conference:'annual-conference-2026',
  internship:null}

/** Catalog key -> the event it registers for, where that is not the page's own
 *  slug. The three Fundamentals pages share one year-long member Zoom event,
 *  and each Intensive weekend is its own event, keyed `page:session` and named
 *  by a session's `reg`. A key goes live the moment its event is published.
 *  The slugs follow the calendar rules, so they roll forward on their own. */
export const REG_SLUG: Record<string, string> = {
  fund1: zoomSlug(ZOOM_SEASON), fund2: zoomSlug(ZOOM_SEASON), fund3: zoomSlug(ZOOM_SEASON),
  ...Object.fromEntries(INTENSIVES.map(({ r, o }) => [regKey(r.id), eventSlug(r, o, true)])),
  'bootcamp:week': eventSlug(BOOTCAMP_RULE, BOOTCAMP, false),
}

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
