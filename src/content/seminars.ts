/* ----------------------------------------------------------------------------
 * Seminar and event catalog
 * Lifted verbatim from the v4.8 single-file build. Content lives here, outside
 * components, so the same object feeds the page, its metadata and its
 * structured data — what a human reads and what a machine reads cannot drift.
 * -------------------------------------------------------------------------- */

import {
  INTENSIVE_RULES, BOOTCAMP_RULE, nextOccurrence, longRange, eventSlug, zoomSeason, zoomDates, HUDDLE_SLUG, listDates,
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
/** An agenda line's date ("OCT 13" over "TUE · 9 PM ET · ZOOM"), from this year's Huddle dates. */
function huddleDay(part: string, i: number) {
  const d = zoomDates(part, ZOOM_SEASON)[i]
  return { t: d ? `${MON[d.getMonth()]} ${d.getDate()}` : `PART ${i + 1}`, ap: 'TUE · 9 PM ET · ZOOM' }
}

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

/** The marketing flow a seminar page follows when it has one: problem,
 *  solution, benefits, three steps, doctors' own words, fit and questions.
 *  Every part is optional; a page shows only what it has text for. Quotes are
 *  verbatim from the doctor, never paraphrased. */
export type SeminarStory = {
  /** Three goals the doctor wants, shown in the hero. Goals, not guarantees. */
  goals: string[]
  problem?: { h: string; lede: string; qs: string[]; close: string }
  solution?: { kick?: string; h: string; p: string[]; img?: string }
  benefits?: { h: string; items: { h: string; p: string }[] }
  steps?: { h: string; items: { h: string; p: string }[] }
  voices?: { h: string; lede?: string; quotes: { q: string; who: string; cred?: string }[] }
  fit?: { h: string; yes: string[]; no: string[] }
  faq?: { q: string; a: string }[]
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
  /** The Board's standing-date rule for this event, shown under the dates. */
  ruleNote?: string
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
  story?: SeminarStory
}

export const SEMINARS = {
  intro:{
    photo:'intro',
    mux:'Ze5RbuV8YMhnPyv8th6N5FH3ERALc9GKvHSCg00FoEqQ', muxName:'Dr. Kevin Lyter',
    cat:'free', title:'Intro to AdvO', kicker:'Free Introductory Online Course', img:'ph-c',
    sub:'Discover the principles and power behind Advanced Orthogonal care.',
    dates:'Online · Anytime', loc:'Self-Paced', level:'No Prerequisites', format:'2-Hour Online Course', price:'FREE',
    fullPrice:0, memPrice:0, mbSub:'Ready for more? Membership includes the Monthly Huddle, where Fundamentals 1–3 are taught live on Zoom.', mbText:'This course is free for everyone — no membership required.',
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
    dates:'Oct–Jan · 2nd Tuesdays · 9 PM ET', loc:'Live on Zoom', ruleNote:'Standard schedule: the second Tuesday of every month, 9:00 pm Eastern. Fundamental 1 runs October–January, Fundamental 2 February–May, Fundamental 3 June–September. Subject to change.', level:'Foundation · Members Only', format:'Monthly Huddle on Zoom', price:'Members Only',
    member:'Fundamentals is for AOI members — the Monthly Huddle on Zoom is part of membership.', mbSub:'Membership is $799 a year and includes every Monthly Huddle session, all twelve months.', mbText:'Members only — the Monthly Huddle, where Fundamentals is taught on Zoom, is part of AOI membership.',
    fullPrice:0, memPrice:0,
    video:'https://player.vimeo.com/video/519671965',
    sessions:[{mo:'OCT–JAN',dy:'2nd Tue',yr:'9 PM ET',city:'Live on Zoom',venue:'Monthly Huddle · members only',seats:'RSVP',reg:'fund1',members:true}], noSess:{kick:'Schedule',h2:'October through January, live on Zoom',title:`Fundamental 1 meets ${listDates(zoomDates('fund1', ZOOM_SEASON))}, for AOI members.`,msg:'This year the Fundamentals Series is taught live on Zoom rather than as an in-person lecture weekend. Fundamental 1 meets on the second Tuesday of each month from October through January at 9:00 pm Eastern (8:00 pm Central, 7:00 pm Mountain, 6:00 pm Pacific). It is open to AOI members. Tell us you are interested and we will send you the details.',btn:'Tell Me About the Zoom Sessions'},
    h2:'Where the foundation is poured.',
    overview:'<p>Fundamental 1 is the entry point to Advanced Orthogonal training. This year it is taught live on Zoom in the <b>Monthly Huddle</b> instead of as an in-person lecture weekend: AOI members meet with experienced instructors on the second Tuesday of each month from October through January, at 9:00 pm Eastern, to build the observational and analytical foundation that everything else in the technique rests on, with time in every session for your own cases and questions.</p><p>This year\'s sessions: ' + listDates(zoomDates('fund1', ZOOM_SEASON)) + ', each at 9:00 pm Eastern.</p><p><b>The Zoom sessions do not include hands-on training.</b> Be sure to attend an <a href="/seminars/advo-intensive">AdvO Intensive</a> — its hands-on training covers all three Fundamentals.</p><p>Each part builds on the last, but members can join the Monthly Huddle in any month. Completing all three Fundamentals is a requirement on the Level 1 Certification track.</p>',
    learn:['Patient evaluation and nerve interference assessment','Upper cervical biomechanics and the atlas subluxation complex','Introduction to the specific three-dimensional x-ray series','Postural analysis and supine leg check protocol','Case history and patient management fundamentals','Instrument overview and safety'],
    sched:[['OCT–JAN',`${listDates(zoomDates('fund1', ZOOM_SEASON))}, 9:00 pm Eastern, live on Zoom: why AdvO, the history and exam, and setting up the x-ray series, then open time for your cases and questions.`],['HANDS-ON','Not part of the Zoom sessions: attend an AdvO Intensive, whose hands-on training covers all three Fundamentals.']],
    ctaH:'Begin the Fundamentals Series.', ctaP:'Members only · live on Zoom, October through January · completing the series is a Level 1 requirement.', ctaBtn:'RSVP for the Monthly Huddle',
    spk:['cs','jk'], keynote:null,
    agenda:[{day:null,items:[
      {...huddleDay('fund1', 0),title:'Introduction — Why AdvO',desc:'What the technique is built on, the outcomes it measures, and the atlas subluxation.',who:['cs']},
      {...huddleDay('fund1', 1),title:'History & Exam',desc:'The patient history and the exam: supine leg check, muscle balance, arm strength, head rotation and palpation.',who:['cs']},
      {...huddleDay('fund1', 2),title:'X-Ray Setup — Sagittal & Axial',desc:'Positioning basics, then the sagittal and axial views: why each is taken and how to get a clean film.',who:['jk']},
      {...huddleDay('fund1', 3),title:'X-Ray Setup — Frontal, Horizontal & CBCT',desc:'The frontal and horizontal views, controlling tilt and rotation, and CBCT setup.',who:['cs','jk']}]}],
    story:{
      goals:['Build the foundation every correction rests on','Take a history and run an exam you can trust','Set up a clean, specific x-ray series'],
      problem:{
        h:'Every correction is only as good as what comes before it',
        lede:'If the exam is rushed or the films aren’t clean, everything after it is a guess. Many of us learned the basics once and filled in the gaps on our own.',
        qs:['Are you confident your exam is telling you what you think it is?','Do your films come out clean enough to measure, every time?','Have you picked up the technique in pieces, without a clear place to start?'],
        close:'You’re not behind. You just need a solid starting point.'},
      solution:{
        h:'The Monthly Huddle starts at the beginning',
        p:['Fundamental 1 is taught live on Zoom in the Monthly Huddle, on the second Tuesday of each month from October through January at 9:00 pm Eastern.','Our instructors walk through why AdvO works the way it does, the patient history and exam, and how to set up the sagittal, axial, frontal and horizontal views and CBCT. Every session leaves time for your own cases and questions.'],
        img:'intro'},
      benefits:{h:'Why start with Fundamental 1',items:[
        {h:'Learn It From Home',p:'Live on Zoom, one evening a month. No travel and no time away from your practice.'},
        {h:'Bring Your Own Cases',p:'Every session leaves time for your questions and the cases you’re working on now.'},
        {h:'Your First Step to Certification',p:'Completing all three Fundamentals is a requirement on the Level 1 Certification track.'}]},
      steps:{h:'Three steps to get going',items:[
        {h:'Become a Member',p:'The Monthly Huddle is part of AOI membership, $799 a year.'},
        {h:'RSVP and Join on Zoom',p:'Second Tuesdays, October through January, at 9:00 pm Eastern.'},
        {h:'Get Hands-On',p:'Attend an AdvO Intensive to practice what you’ve learned with instructors at your side.'}]},
      fit:{h:'Is Fundamental 1 right for you?',
        yes:['New to Advanced Orthogonal and want to learn it properly from the start','An upper cervical doctor who wants to refresh the foundations','Planning to work toward Level 1 Certification'],
        no:['You want hands-on training; the Zoom sessions don’t include it, but the AdvO Intensive does','You’re not ready to join yet; start with the free Intro to AdvO course']},
      faq:[
        {q:'Is this in person?',a:'No. This year Fundamental 1 is taught live on Zoom in the Monthly Huddle. The Zoom sessions don’t include hands-on training; the AdvO Intensive covers that.'},
        {q:'Who can attend?',a:'AOI members. The Monthly Huddle is part of membership, which is $799 a year.'},
        {q:'What time are the sessions?',a:'9:00 pm Eastern (8:00 pm Central, 7:00 pm Mountain, 6:00 pm Pacific) on the second Tuesday of each month, October through January.'},
        {q:'What if I can’t start at the beginning?',a:'Each part builds on the last, but members can join the Monthly Huddle in any month.'},
        {q:'Does it count toward certification?',a:'Yes. Completing all three Fundamentals is a requirement on the Level 1 Certification track.'}]}
  },
  fund2:{
    photo:'analyze',
    mux:'Cv8vCuTsBB02Mm9NRVBId5I45rNwogllO9af7GwSY5oA', muxName:'Dr. Zach Perry',
    cat:'fundamentals', title:'Fundamental 2', kicker:'Fundamentals Series · Part 2 of 3', img:'ph-a',
    sub:'X-ray analysis and line drawing — the measurement skill at the center of the technique.',
    dates:'Feb–May · 2nd Tuesdays · 9 PM ET', loc:'Live on Zoom', ruleNote:'Standard schedule: the second Tuesday of every month, 9:00 pm Eastern. Fundamental 1 runs October–January, Fundamental 2 February–May, Fundamental 3 June–September. Subject to change.', level:'Foundation · Members Only', format:'Monthly Huddle on Zoom', price:'Members Only',
    fullPrice:0, memPrice:0,
    sessions:[{mo:'FEB–MAY',dy:'2nd Tue',yr:'9 PM ET',city:'Live on Zoom',venue:'Monthly Huddle · members only',seats:'RSVP',reg:'fund2',members:true}], noSess:{kick:'Schedule',h2:'February through May, live on Zoom',title:`Fundamental 2 meets ${listDates(zoomDates('fund2', ZOOM_SEASON))}, for AOI members.`,msg:'This year the Fundamentals Series is taught live on Zoom rather than as an in-person lecture weekend. Fundamental 2 meets on the second Tuesday of each month from February through May at 9:00 pm Eastern (8:00 pm Central, 7:00 pm Mountain, 6:00 pm Pacific). It is open to AOI members. Tell us you are interested and we will send you the details.',btn:'Tell Me About the Zoom Sessions'},
    member:'Fundamentals is for AOI members — the Monthly Huddle on Zoom is part of membership.', mbSub:'Membership is $799 a year and includes every Monthly Huddle session, all twelve months.', mbText:'Members only — the Monthly Huddle, where Fundamentals is taught on Zoom, is part of AOI membership.',
    h2:'The analysis becomes precise.',
    overview:'<p>Fundamental 2 goes deep on the signature skill of the Advanced Orthogonal doctor: measuring the upper cervical misalignment on specific three-dimensional x-rays using digital software.</p><p>You\'ll learn to determine each patient\'s gravitational and neurological normal — taking genetic abnormalities into account — and translate that analysis into a patient-specific correction vector.</p><p>This year Fundamental 2 is taught live on Zoom in the <b>Monthly Huddle</b> instead of as an in-person lecture weekend, for AOI members, on the second Tuesday of each month from February through May, at 9:00 pm Eastern.</p><p>This year\'s sessions: ' + listDates(zoomDates('fund2', ZOOM_SEASON)) + ', each at 9:00 pm Eastern.</p><p><b>The Zoom sessions do not include hands-on training.</b> Be sure to attend an <a href="/seminars/advo-intensive">AdvO Intensive</a> — its hands-on training covers all three Fundamentals.</p>',
    learn:['Digital x-ray line drawing and analysis software','Measuring displacement against the patient\'s own normal','Accounting for genetic anomalies in the analysis','Deriving the correction vector from the misalignment variables','Inter- and intra-examiner reliability protocols','Analysis case reviews with real film sets'],
    sched:[['FEB–MAY',`${listDates(zoomDates('fund2', ZOOM_SEASON))}, 9:00 pm Eastern, live on Zoom: analyzing the sagittal, axial, frontal and horizontal films, the correction vector, and misalignment patterns, worked through on real film sets.`],['HANDS-ON','Not part of the Zoom sessions: attend an AdvO Intensive, whose hands-on training covers all three Fundamentals.']],
    ctaH:'Continue the series.', ctaP:'Members only · live on Zoom, February through May · join in any month.', ctaBtn:'RSVP for the Monthly Huddle',
    spk:['jk','cs'], keynote:null,
    agenda:[{day:null,items:[
      {...huddleDay('fund2', 0),title:'X-Ray Analysis — Sagittal & Axial',desc:'Templates and the analysis software, then the sagittal and axial measurements.',who:['jk']},
      {...huddleDay('fund2', 1),title:'X-Ray Analysis — Frontal',desc:'Marking the frontal film and measuring the cranium, atlas and axis lines.',who:['jk']},
      {...huddleDay('fund2', 2),title:'X-Ray Analysis — Horizontal & Vectors',desc:'The horizontal film, then turning the measurements into the correction vector.',who:['cs']},
      {...huddleDay('fund2', 3),title:'Misalignment Patterns',desc:'Contralateral and ipsilateral patterns and their biomechanics, with time for case review.',who:['jk','cs']}]}],
    story:{
      goals:['Measure the misalignment on your films with precision','Account for each patient’s own anatomy, including genetic anomalies','Turn your measurements into a patient-specific correction vector'],
      problem:{
        h:'The films only help if you can read them precisely',
        lede:'X-ray analysis is the skill at the center of the technique, and it’s the hardest one to learn on your own.',
        qs:['Do two of your own line drawings on the same film come out differently?','Are you unsure how to account for a genetic anomaly in the analysis?','Is it hard to get from the measurements to a correction vector you trust?'],
        close:'Precision can be learned. It takes a clear method and practice with people who’ve done it.'},
      solution:{
        h:'Analysis, worked through on real films',
        p:['Fundamental 2 is taught live on Zoom in the Monthly Huddle, on the second Tuesday of each month from February through May at 9:00 pm Eastern.','We work through the sagittal, axial, frontal and horizontal films with the analysis software, turn the measurements into the correction vector, and look at contralateral and ipsilateral misalignment patterns, using real film sets with time for your own cases.'],
        img:'xray'},
      benefits:{h:'Why doctors take Fundamental 2',items:[
        {h:'Measure, Don’t Guess',p:'Learn a defined way to measure each film against the patient’s own normal.'},
        {h:'Real Film Sets',p:'Work through actual cases, not idealized textbook examples.'},
        {h:'From Numbers to a Vector',p:'See how the measurements become a patient-specific correction vector.'}]},
      steps:{h:'Three steps to get going',items:[
        {h:'Become a Member',p:'The Monthly Huddle is part of AOI membership, $799 a year.'},
        {h:'RSVP and Join on Zoom',p:'Second Tuesdays, February through May, at 9:00 pm Eastern.'},
        {h:'Get Hands-On',p:'Attend an AdvO Intensive to practice what you’ve learned with instructors at your side.'}]},
      fit:{h:'Is Fundamental 2 right for you?',
        yes:['Coming from Fundamental 1, or already comfortable with the exam and x-ray setup','An upper cervical doctor who wants more precise, repeatable analysis','Planning to work toward Level 1 Certification'],
        no:['You want hands-on training; the Zoom sessions don’t include it, but the AdvO Intensive does','You’re not ready to join yet; start with the free Intro to AdvO course']},
      faq:[
        {q:'Is this in person?',a:'No. This year Fundamental 2 is taught live on Zoom in the Monthly Huddle. The Zoom sessions don’t include hands-on training; the AdvO Intensive covers that.'},
        {q:'Who can attend?',a:'AOI members. The Monthly Huddle is part of membership, which is $799 a year.'},
        {q:'What time are the sessions?',a:'9:00 pm Eastern (8:00 pm Central, 7:00 pm Mountain, 6:00 pm Pacific) on the second Tuesday of each month, February through May.'},
        {q:'What if I can’t start at the beginning?',a:'Each part builds on the last, but members can join the Monthly Huddle in any month.'},
        {q:'Does it count toward certification?',a:'Yes. Completing all three Fundamentals is a requirement on the Level 1 Certification track.'}]}
  },
  fund3:{
    photo:'adjust',
    mux:'j4sZdYYoA3c2i7x1w8TocHVIFPYjI00xKL5XL602MD1Tk', muxName:'Dr. Josh Silver',
    cat:'fundamentals', title:'Fundamental 3', kicker:'Fundamentals Series · Part 3 of 3', img:'ph-a',
    sub:'The instrument, the correction, and the complete patient protocol.',
    dates:'Jun–Sep · 2nd Tuesdays · 9 PM ET', loc:'Live on Zoom', ruleNote:'Standard schedule: the second Tuesday of every month, 9:00 pm Eastern. Fundamental 1 runs October–January, Fundamental 2 February–May, Fundamental 3 June–September. Subject to change.', level:'Foundation · Members Only', format:'Monthly Huddle on Zoom', price:'Members Only',
    fullPrice:0, memPrice:0,
    sessions:[{mo:'JUN–SEP',dy:'2nd Tue',yr:'9 PM ET',city:'Live on Zoom',venue:'Monthly Huddle · members only',seats:'RSVP',reg:'fund3',members:true}], noSess:{kick:'Schedule',h2:'June through September, live on Zoom',title:`Fundamental 3 meets ${listDates(zoomDates('fund3', ZOOM_SEASON))}, for AOI members.`,msg:'This year the Fundamentals Series is taught live on Zoom rather than as an in-person lecture weekend. Fundamental 3 meets on the second Tuesday of each month from June through September at 9:00 pm Eastern (8:00 pm Central, 7:00 pm Mountain, 6:00 pm Pacific). It is open to AOI members. Tell us you are interested and we will send you the details.',btn:'Tell Me About the Zoom Sessions'},
    member:'Fundamentals is for AOI members — the Monthly Huddle on Zoom is part of membership.', mbSub:'Membership is $799 a year and includes every Monthly Huddle session, all twelve months.', mbText:'Members only — the Monthly Huddle, where Fundamentals is taught on Zoom, is part of AOI membership.',
    h2:'Everything comes together.',
    overview:'<p>Fundamental 3 completes the foundation: delivering the correction with the table-mounted percussive sound-wave instrument, positioning the patient with digital and laser alignment, and running the full protocol from evaluation through post-correction monitoring.</p><p>This year Fundamental 3 is taught live on Zoom in the <b>Monthly Huddle</b> instead of as an in-person lecture weekend, for AOI members, on the second Tuesday of each month from June through September, at 9:00 pm Eastern.</p><p>This year\'s sessions: ' + listDates(zoomDates('fund3', ZOOM_SEASON)) + ', each at 9:00 pm Eastern.</p><p><b>The Zoom sessions do not include hands-on training.</b> Be sure to attend an <a href="/seminars/advo-intensive">AdvO Intensive</a> — its hands-on training covers all three Fundamentals.</p><p>Graduates of the full Fundamentals Series are equipped to begin supervised practice of the technique and to enter the Level 1 Certification process.</p>',
    learn:['Percussive sound-wave instrument operation and settings','Patient positioning with digital and laser alignment','Delivering the patient-specific correction vector','Post-correction assessment and monitoring protocol','Care planning and the sustainable-corrections model','Preparing for Level 1 Certification'],
    sched:[['JUN–SEP',`${listDates(zoomDates('fund3', ZOOM_SEASON))}, 9:00 pm Eastern, live on Zoom: corrective setup, the adjustment, leading the stylus, and upper cervical biomechanics.`],['HANDS-ON','Not part of the Zoom sessions: attend an AdvO Intensive, whose hands-on training covers all three Fundamentals.']],
    ctaH:'Complete your foundation.', ctaP:'Members only · live on Zoom, June through September · finishing the series opens the Level 1 Certification track.', ctaBtn:'RSVP for the Monthly Huddle',
    spk:['cs','jk'], keynote:null,
    agenda:[{day:null,items:[
      {...huddleDay('fund3', 0),title:'Corrective Setup — Presetting & Patient Setup',desc:'Presetting the table and placing the patient: head placement, mastoid support and a neutral spine.',who:['cs']},
      {...huddleDay('fund3', 1),title:'Corrective Setup — Table Setup & Verification',desc:'Headpiece and shoulder settings, then verifying the patient before the adjustment.',who:['cs']},
      {...huddleDay('fund3', 2),title:'The Adjustment — Instrument & Finding the TP',desc:'The percussion instrument, aligning the vectors, and finding the transverse process.',who:['cs','jk']},
      {...huddleDay('fund3', 3),title:'Leading the Stylus, Biomechanics & Wrap-Up',desc:'Leading the stylus through real cases, upper cervical biomechanics, and bringing the year together.',who:['jk']}]}],
    story:{
      goals:['Set up the patient and the table the same way every visit','Deliver the correction with the percussive instrument','Bring the whole procedure together, from exam to adjustment'],
      problem:{
        h:'Knowing the vector is only half the job',
        lede:'You can have a careful analysis and still lose it in the setup. The correction depends on how the patient, the table and the instrument are placed.',
        qs:['Does your table setup change from one visit to the next?','Are you unsure the instrument is aimed where your analysis says it should be?','Do the pieces still feel separate, instead of one procedure?'],
        close:'This is the last stretch, and it’s where the Fundamentals come together.'},
      solution:{
        h:'The setup and the adjustment, step by step',
        p:['Fundamental 3 is taught live on Zoom in the Monthly Huddle, on the second Tuesday of each month from June through September at 9:00 pm Eastern.','We cover presetting the table, placing the patient, headpiece and shoulder settings and verification, then the percussion instrument, aligning the vectors, finding the transverse process and leading the stylus, with upper cervical biomechanics to tie it all together.'],
        img:'instrument'},
      benefits:{h:'Why doctors take Fundamental 3',items:[
        {h:'A Setup You Can Repeat',p:'Follow a defined sequence for the table and the patient, so every visit starts from the same place.'},
        {h:'The Instrument, Explained',p:'Understand how to aim and deliver the correction with the table-mounted instrument.'},
        {h:'Ready for Level 1',p:'Finishing the series opens the Level 1 Certification track.'}]},
      steps:{h:'Three steps to get going',items:[
        {h:'Become a Member',p:'The Monthly Huddle is part of AOI membership, $799 a year.'},
        {h:'RSVP and Join on Zoom',p:'Second Tuesdays, June through September, at 9:00 pm Eastern.'},
        {h:'Get Hands-On',p:'Attend an AdvO Intensive to practice what you’ve learned with instructors at your side.'}]},
      fit:{h:'Is Fundamental 3 right for you?',
        yes:['Coming from Fundamentals 1 and 2, or comfortable with the exam and the analysis','An upper cervical doctor who wants a more consistent setup','Getting ready for Level 1 Certification'],
        no:['You want hands-on training; the Zoom sessions don’t include it, but the AdvO Intensive does','You’re not ready to join yet; start with the free Intro to AdvO course']},
      faq:[
        {q:'Is this in person?',a:'No. This year Fundamental 3 is taught live on Zoom in the Monthly Huddle. The Zoom sessions don’t include hands-on training; the AdvO Intensive covers that.'},
        {q:'Who can attend?',a:'AOI members. The Monthly Huddle is part of membership, which is $799 a year.'},
        {q:'What time are the sessions?',a:'9:00 pm Eastern (8:00 pm Central, 7:00 pm Mountain, 6:00 pm Pacific) on the second Tuesday of each month, June through September.'},
        {q:'What if I can’t start at the beginning?',a:'Each part builds on the last, but members can join the Monthly Huddle in any month.'},
        {q:'What comes after Fundamental 3?',a:'Graduates of the full Fundamentals Series are equipped to begin supervised practice of the technique and to enter the Level 1 Certification process.'}]}
  },
  intensive:{
    photo:'instrument',
    mux:'A21LSsljbccxw2O9500U9IuqeLq00g34T02hdZHFlFgUlw', muxName:'Dr. Jeff Kahrs',
    cat:'intensive', title:'AdvO Intensive', kicker:'Hands-On Training · Two Days', img:'ph-b',
    sub:'Two days of hands-on training: the exam, x-ray and CBCT, corrective setup and the adjustment — demonstrated, then practiced.',
    dates:monthsLine(INTENSIVES), ruleNote:'Standard dates, every year: the third Friday–Saturday of February (St. Petersburg) and April (Orem), and the fourth Friday–Saturday of August (St. Petersburg). Subject to change.', loc:'St. Petersburg, FL & Orem, UT', level:'Advanced', format:'2-Day Hands-On', price:'$1,295',
    mbSub:'Membership is $799 a year. Members save $200 on every Intensive weekend.', fullPrice:1295, memPrice:1095,
    sessions:INTENSIVES.map(({ r, o }) => ({ mo:MON[o.start.getMonth()], dy:`${o.start.getDate()}–${o.end.getDate()}`, yr:String(o.year), city:r.where, venue:r.venue, seats:'Registration', reg:regKey(r.id) })),
    member:'AOI members save $200 — $1,095 for members.',
    h2:'Watch each step done, then do it yourself.',
    overview:'<p>The AdvO Intensive is where the technique becomes hands-on. Day one walks through the whole procedure — history and exam, x-ray and CBCT setup and analysis, pattern understanding, corrective setup and the adjustment — with instructors demonstrating each step. Day two is supervised practice of every step, from the exam through simple and advanced corrective setups, finishing with case studies and your questions.</p><p>Its hands-on training covers all three Fundamentals, so it is the in-person companion to the monthly Fundamentals Zoom sessions. It runs three weekends a year, in St. Petersburg, Florida, and Orem, Utah.</p>',
    learn:['The history and exam, demonstrated and practiced','X-ray and CBCT setup','X-ray and CBCT analysis','Pattern understanding and corrective setup, simple and advanced','The adjustment','Review and case studies with instructors'],
    sched:[['DAY 1','Instruction and demonstration: the exam, x-ray and CBCT, corrective setup and the adjustment.'],['DAY 2','Supervised practice of every step, then case studies and Q&A.']],
    ctaH:'Two days. Measurably sharper.', ctaP:'Three weekends a year · St. Petersburg, FL and Orem, UT · members save $200.', ctaBtn:'Choose Your Intensive Weekend',
    spk:['cs','jk'], keynote:null,
    agenda:[
      {day:'Day 1',date:'FRIDAY',items:[
        {t:'9:00',ap:'AM',title:'Introduction, History & Exam',desc:'',who:[]},
        {t:'10:00',ap:'AM · 2 HRS',title:'X-Ray & CBCT: Setup and Analysis',desc:'10:00 setup · 11:00 analysis',who:[]},
        {t:'12:00',ap:'PM',title:'Lunch',desc:'',who:[]},
        {t:'1:00',ap:'PM · 2 HRS',title:'Demonstration: Exam, X-Ray Setup & Analysis',desc:'1:00 exam and x-ray setup · 2:00 x-ray setup and analysis',who:[]},
        {t:'3:00',ap:'PM · 2 HRS',title:'Pattern Understanding & Corrective Setup',desc:'3:00 pattern understanding and corrective setup · 4:00 corrective setup, demonstrated',who:[]},
        {t:'5:00',ap:'PM',title:'The Adjustment & Close',desc:'The adjustment, demonstrated.',who:[]}]},
      {day:'Day 2',date:'SATURDAY',items:[
        {t:'9:00',ap:'AM',title:'Review',desc:'',who:[]},
        {t:'10:00',ap:'AM · 3 HRS',title:'Practice: Exam, X-Ray Setup & Analysis',desc:'10:00 exam · 11:00 x-ray setup · 12:00 x-ray analysis',who:[]},
        {t:'1:00',ap:'PM',title:'Lunch',desc:'',who:[]},
        {t:'2:00',ap:'PM · 2 HRS',title:'Practice: Corrective Setup',desc:'2:00 simple setups · 3:00 advanced setups',who:[]},
        {t:'4:00',ap:'PM · 2 HRS',title:'Review, Case Studies & Q&A',desc:'4:00 review and case studies · 5:00 Q&A and close',who:[]}]}],
    story:{
      goals:['Run the exam, x-ray setup and analysis yourself, step by step','Set up the correction the same way, visit after visit','Go home with real practice, not just notes'],
      problem:{
        h:'You’ve seen it explained. Now you need it in your hands.',
        lede:'Lectures and Zoom sessions can show you the procedure. But the exam, the films and the setup are physical skills, and without enough hands-on time it’s easy to spend years with a habit no one has corrected.',
        qs:['Do you follow the analysis on paper but hesitate once the patient is on the table?','Are you unsure whether your setup matches what the films are telling you?','Have you been practicing on your own, with no one to tell you what to change?'],
        close:'That’s a common place to be, and you don’t have to work through it alone.'},
      solution:{
        h:'Two days with instructors at your side',
        p:['The AdvO Intensive is built for exactly this. On day one, our instructors demonstrate every step of the procedure: the history and exam, x-ray and CBCT setup and analysis, pattern understanding, the corrective setup and the adjustment.','On day two, it’s your turn. You practice each step under supervision, from the exam through simple and advanced setups, and finish with case studies and your own questions.','It’s a different way of thinking about the craniocervical junction. Take what’s useful: if you leave with a clearer framework, even without changing a thing, the weekend has done its job.'],
        img:'setup'},
      benefits:{h:'Why doctors come to the Intensive',items:[
        {h:'Practice, Not Just Theory',p:'Most of day two is supervised practice, so you leave having done each step yourself.'},
        {h:'Feedback While It Counts',p:'Instructors watch your setup and correct it on the spot, before a habit forms.'},
        {h:'All Three Fundamentals, Hands-On',p:'Its hands-on training covers Fundamentals 1–3, making it the in-person companion to the Monthly Huddle on Zoom.'}]},
      steps:{h:'Getting started is simple',items:[
        {h:'Choose Your Weekend',p:'Pick St. Petersburg, Florida, or Orem, Utah. AOI members save $200.'},
        {h:'Train for Two Days',p:'Watch each step demonstrated on Friday, then do it yourself on Saturday.'},
        {h:'Take It Into Practice',p:'Use the procedure in your clinic, then keep building with the Monthly Huddle, Bootcamp and Level 1 Certification.'}]},
      fit:{h:'Is the Intensive right for you?',
        yes:['A Bootcamp graduate who wants to sharpen your execution','An experienced upper cervical doctor who wants to understand what makes AdvO different','An Atlas Orthogonal doctor making the transition to AdvO','A student deciding whether this is the path for you','Following the Fundamentals on Zoom and ready for hands-on practice'],
        no:['You expect full mastery in two days; this is a clear, practical overview, and mastery takes continued practice','You want a lecture-only weekend; day two is hands-on','You’d rather look before you commit; the free Intro to AdvO course is the place to start']},
      faq:[
        {q:'Do I need to finish the Fundamentals first?',a:'No. You can attend an Intensive at any point. Its hands-on training covers all three Fundamentals, and it pairs well with the Monthly Huddle on Zoom, where Fundamentals 1–3 are taught live.'},
        {q:'What does it cost?',a:'$1,295, or $1,095 for AOI members.'},
        {q:'When and where is it held?',a:'Three weekends a year: the third Friday and Saturday of February in St. Petersburg, Florida; the third Friday and Saturday of April in Orem, Utah; and the fourth Friday and Saturday of August in St. Petersburg. Dates are subject to change.'},
        {q:'Do I need to bring my own equipment?',a:'No. Hands-on seminars provide the instruments and imaging you train on.'},
        {q:'What will I receive?',a:'A binder at sign-in, notes for each module, and a glossary of the updated AdvO terminology.'},
        {q:'Can students attend?',a:'Yes. Chiropractic students are welcome at Institute training. Bring proof of current enrollment.'},
        {q:'What comes after the Intensive?',a:'Keep building: the Monthly Huddle every month, the AdvO Bootcamp each June, and the Level 1 Certification track.'}]}
  },
  bootcamp:{
    photo:'setup',
    mux:'A9cxLKvjJcX5u02Qzh8agXEOPLMkmNzXTKHPrx02wnG2s', muxName:'Dr. Drew',
    cat:'bootcamp', title:`AdvO Bootcamp ${BOOTCAMP.year}`, kicker:'The Immersive Week · Zero to Fully Equipped', img:'ph-a',
    sub:'Five days of hands-on training, guest experts, research updates — and the Friday night awards dinner.',
    dates:longRange(BOOTCAMP), ruleNote:'Standard dates, every year: the week of the third Monday of June, Monday to Friday. Subject to change.', loc:'Tampa Bay, FL', level:'All Levels', format:'5-Day Immersive', price:'$2,495',
    fullPrice:2495, memPrice:1895, mbSub:'Membership is $799 a year. Members save $600 on Bootcamp.', mbText:'AOI members save $600 on AdvO Bootcamp — $1,895 for members.',
    sessions:[{ mo:MON[BOOTCAMP.start.getMonth()], dy:`${BOOTCAMP.start.getDate()}–${BOOTCAMP.end.getDate()}`, yr:String(BOOTCAMP.year), city:'Tampa Bay, FL', venue:'Five-day immersive', seats:'Registration', reg:'bootcamp:week' }],
    member:'AOI members save $600 on AdvO Bootcamp — join before you register.',
    h2:'The fastest route from zero to equipped.',
    overview:'<p>Featuring hands-on training, expert guest speakers, clinical research updates, and a celebratory Friday night awards dinner, this event will bring together the entire Advanced Orthogonal community to honor our legacy and look to the future.</p><p>Bootcamp is our immersive, fast-paced program designed to take doctors from zero to fully equipped in a highly effective format.</p>',
    learn:['The complete protocol, compressed into one immersive week','Daily supervised instrument labs','Analysis intensives with real case sets','Guest expert sessions and research updates','Practice-building and patient communication','Community — the entire AdvO family in one room'],
    sched:[['MON–TUE','Foundation compression: evaluation, biomechanics, and x-ray analysis intensives.'],['WED–THU','Instrument labs: positioning, correction delivery, and consistency drills.'],['FRIDAY','Capstone case day — and the awards dinner celebrating the community.']],
    ctaH:'Members save $600.', ctaP:`Tampa Bay, FL · ${longRange(BOOTCAMP)} · $1,895 for AOI members, $2,495 standard.`, ctaBtn:'Register for Bootcamp',
    spk:['cs','jk'], keynote:null,
    agenda:[
      {day:'Day 1–2',date:'MON–TUE',items:[
        {t:'9:00',ap:'AM · LECTURE',title:'Evaluation & Biomechanics Intensive',desc:'The complete evaluation workflow, compressed.',who:['cs']},
        {t:'1:30',ap:'PM · LAB',title:'X-Ray Analysis Intensive',desc:'Digital line-drawing on real film sets.',who:['jk']}]},
      {day:'Day 3–4',date:'WED–THU',items:[
        {t:'9:00',ap:'AM · LAB',title:'Instrument Labs',desc:'Positioning, correction delivery, and consistency drills.',who:['cs']},
        {t:'3:00',ap:'PM · LECTURE',title:'The Certification Pathway: Level 1 to Level 2',desc:'What each level requires and how to prepare for your case reviews.',who:['jk']}]},
      {day:'Day 5',date:'FRIDAY',items:[
        {t:'9:00',ap:'AM · CAPSTONE',title:'Capstone Case Day',desc:'Full-protocol run-throughs judged by the faculty.',who:['cs','jk']},
        {t:'7:00',ap:'PM · SOCIAL',title:'Awards Dinner',desc:'Celebrating the community — legacy awards and the year ahead.',who:[]}]}],
    story:{
      goals:['Learn the complete procedure in one focused week','Practice every day with instructors watching','Meet the Advanced Orthogonal community in one room'],
      problem:{
        h:'Learning a technique in pieces can take years',
        lede:'A seminar here, a webinar there, and it can be a long time before the whole procedure comes together in your hands.',
        qs:['Do you want to learn the technique properly, but can’t spread it over a year?','Have you learned parts of it but never put the whole procedure together?','Do you miss being around doctors who do this work every day?'],
        close:'There’s a faster way, and you don’t have to do it alone.'},
      solution:{
        h:'One immersive week',
        p:['Bootcamp is our immersive, fast-paced program, designed to take doctors from zero to fully equipped in one week in Tampa Bay, Florida.','It revisits everything in Fundamentals 1–3, adds in-depth training in post x-ray analysis and interpretation, and gives you extensive hands-on time to apply it in a clinical setting. Along the way: craniocervical neurology, biomechanics and table placement, and clinical topics such as concussion and headaches. The week ends with the Friday night awards dinner with the whole community.'],
        img:'adjust'},
      benefits:{h:'Why doctors come to Bootcamp',items:[
        {h:'Everything in One Week',p:'All of Fundamentals 1–3 plus post x-ray interpretation, in five focused days.'},
        {h:'Extensive Hands-On Time',p:'Apply each step in a clinical setting, with instructors guiding you.'},
        {h:'Your People',p:'Guest experts, research updates, and the whole Advanced Orthogonal community at the awards dinner.'}]},
      steps:{h:'Three steps to get going',items:[
        {h:'Register',p:'AOI members save $600: $1,895 instead of $2,495.'},
        {h:'Spend the Week in Tampa Bay',p:'Monday to Friday, the week of the third Monday of June.'},
        {h:'Keep Going',p:'Use it in your practice, then continue with the Monthly Huddle and the Level 1 Certification track.'}]},
      fit:{h:'Is Bootcamp right for you?',
        yes:['Working toward certification, ideally after Fundamentals 1–3','An upper cervical doctor who wants an intensive refresh','Cross-training from Atlas Orthogonal or another upper cervical system','Ready to commit a full week to your training'],
        no:['You can’t take a full week away from practice; the Monthly Huddle and a two-day Intensive may suit you better','You’d rather look before you commit; start with the free Intro to AdvO course']},
      faq:[
        {q:'What does it cost?',a:'$2,495, or $1,895 for AOI members.'},
        {q:'Is Bootcamp included with membership?',a:'No. Bootcamp isn’t included in membership, but members save $600.'},
        {q:'When and where is it held?',a:'Tampa Bay, Florida, Monday to Friday in the week of the third Monday of June. Dates are subject to change.'},
        {q:'Do I need experience?',a:'There are no prerequisites. We recommend Bootcamp after Fundamentals 1–3, especially if you’re seeking certification.'},
        {q:'Do I need to bring my own equipment?',a:'No. Hands-on seminars provide the instruments and imaging you train on.'},
        {q:'Can students attend?',a:'Yes. Chiropractic students are welcome at Institute training. Bring proof of current enrollment.'}]}
  },
  conference:{
    photo:'conference',
    cat:'conference', title:'2026 Annual Conference', kicker:'Inflection Point · The Homecoming of the AOI Community', img:'ph-c',
    sub:'Two days of advanced clinical training, imaging, research, and case studies with the doctors moving this work forward — November 6–7 at the Pierce Clinic of Chiropractic, St. Petersburg.',
    dates:'November 6–7, 2026', ruleNote:'From 2027, the Annual Conference is held the third Friday–Saturday of October every year. Subject to change.', loc:'St. Petersburg, FL', level:'All Levels', format:'2 Days · 8 AM–6 PM', price:'$797',
    fullPrice:797, memPrice:0, studentPrice:347, facultyFree:true,
    mbSub:'Membership is $799 a year and includes the Annual Conference, a $797 value.', mbText:'Conference registration is INCLUDED with AOI membership — a $797 value. Sign in when you register and the fee is waived.',
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
        {t:'5:45',ap:'PM · CLOSE',title:'Closing Announcements',desc:'Closing remarks, the 2027 seminar announcement, and the presale opening.',who:['cs']}]}],
    story:{
      goals:['Catch up on what’s new in imaging, research and the protocol','Earn 14 CE hours through Sherman College of Chiropractic','Spend two days with the doctors moving this work forward'],
      problem:{
        h:'Upper cervical practice can be a lonely place',
        lede:'Most of us work in clinics where no one else does what we do. It’s hard to keep up with new imaging, new research and the cases that don’t fit the textbook.',
        qs:['When did you last talk a hard case through with a colleague who does this work?','Are you keeping up with CBCT and the changes to the protocol?','Do you need CE hours that actually apply to your practice?'],
        close:'That’s what this weekend is for.'},
      solution:{
        h:'Two days at the home of Advanced Orthogonal',
        p:['On November 6–7, the Institute gathers at the Pierce Clinic of Chiropractic in St. Petersburg, Florida, around this year’s theme: Inflection Point.','Thirteen presenters cover vestibular-ocular rehab, the dizzy patient, cone-beam CT and 3D reference frames, the updated protocol with supervised labs, case studies and the practice-based research project.'],
        img:'analyze'},
      benefits:{h:'Why doctors come to the Conference',items:[
        {h:'Practical Clinical Topics',p:'The dizzy patient, why a correction doesn’t hold, scar tissue and the atlas, and more, with two supervised labs.'},
        {h:'14 CE Hours',p:'Live, in-person instruction through Sherman College of Chiropractic. Check your state’s status below.'},
        {h:'Shape the Year Ahead',p:'The research project, the instructor pathway and the 2027 announcements happen here, with members in the room.'}]},
      steps:{h:'Three steps to get there',items:[
        {h:'Reserve Your Seat',p:'Free for AOI members, $797 for doctors, $347 for students.'},
        {h:'Come to St. Petersburg',p:'November 6–7, 8:00 am to 6:00 pm both days.'},
        {h:'Bring It Home',p:'Take what you learn back to your practice, and join the research project if you’d like to take part.'}]},
      fit:{h:'Is the Conference right for you?',
        yes:['An Advanced Orthogonal doctor keeping your skills current','An upper cervical doctor curious about CBCT and 3D analysis','A chiropractic student or college faculty member','Looking for CE hours from a CCE-accredited sponsor'],
        no:['CE credit is your main reason to come and your state isn’t covered; check the list above first','You’re brand new to upper cervical care; the free Intro to AdvO course is a better first step']},
      faq:[
        {q:'Is the Conference free for members?',a:'Yes. Registration is included with AOI membership. Sign in when you register and the fee is waived.'},
        {q:'How many CE hours can I earn?',a:'14 hours through Sherman College of Chiropractic, for live, in-person attendance. Sign in and out of every session with photo ID to receive credit.'},
        {q:'Where is it held?',a:'At the Pierce Clinic of Chiropractic in St. Petersburg, Florida.'},
        {q:'What are the hours?',a:'8:00 am to 6:00 pm both days. Doors open at 7:00 am on Friday for registration and breakfast.'},
        {q:'Can students and faculty attend?',a:'Yes. Students register at $347. Chiropractic college faculty attend free; register as faculty and the Institute confirms your seat.'}]}
  },
  internship:{
    cat:'internship', title:'Internships', kicker:'Clinical Immersion · By Application', img:'ph-b',
    sub:'Train inside an active Advanced Orthogonal practice — real cases, real reps, real mentorship.',
    dates:'Ongoing', loc:'Host Clinics Nationwide', level:'Students & New Doctors', format:'In-Clinic Immersion', price:'By Application',
    fullPrice:-1, memPrice:-1, mbSub:'Membership is $799 a year. Members get priority placement with host clinics.', mbText:'AOI membership connects you with host doctors and accelerates placement.',
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
 *  slug. The three Fundamentals pages share the permanent Monthly Huddle event,
 *  and each Intensive weekend is its own event, keyed `page:session` and named
 *  by a session's `reg`. A key goes live the moment its event is published.
 *  The slugs follow the calendar rules, so they roll forward on their own. */
export const REG_SLUG: Record<string, string> = {
  fund1: HUDDLE_SLUG, fund2: HUDDLE_SLUG, fund3: HUDDLE_SLUG,
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
