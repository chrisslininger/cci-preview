/* ----------------------------------------------------------------------------
 * "Where cases get hard" landing pages
 * Lifted verbatim from the v4.8 single-file build. Content lives here, outside
 * components, so the same object feeds the page, its metadata and its
 * structured data — what a human reads and what a machine reads cannot drift.
 * -------------------------------------------------------------------------- */

export type Problem = {
  n: string
  card: string
  blurb: string
  kick: string
  h1: string
  sub: string
  h2: string
  img: string
  prose: string[]
  ah: string
  ap: string
  bul: string[]
  step2: { h: string; p: string; btn: string; go: [string, string?] }
}

export const PROBLEMS = {
  repeat:{n:'01', img:'setup', kick:'Consistency',
    card:'Corrections that are hard to repeat',
    blurb:'The same findings should lead to the same correction, on any day, in any hands.',
    h1:'When the correction is hard to repeat',
    sub:'Consistency is not a talent. It is a process — and a process can be measured, taught, and checked.',
    h2:'Good corrections are common. Repeatable ones are not.',
    prose:['Most upper cervical doctors can produce a good correction. The harder question is whether the same correction happens again at the next visit, on a different day, with a different patient, or in the hands of a different doctor. When the answer depends on feel, results drift.',
           'Repeatability comes from removing the variables you do not need. Advanced Orthogonal defines what gets measured, how the correction vector is derived from those measurements, how the patient is positioned, and how the correction is delivered — so the same findings lead to the same correction each time.'],
    ah:'Improve Repeatability',
    ap:'Reduce variables that can make results depend too heavily on the individual doctor.',
    bul:['Correction vectors derived from patient-specific measurements rather than from feel',
         'A defined positioning and setup procedure that produces the same starting point every visit',
         'Instrument delivery that applies the correction the same way each time',
         'Post-correction evaluation, so you can tell whether the process held'],
    step2:{h:'Build the Fundamentals', p:'The Fundamentals Series is where the analysis, the setup, and the delivery become one repeatable procedure in your hands.', btn:'Explore the Fundamentals Series', go:['sem','fund1']}},

  respond:{n:'02', img:'analyze', kick:'Difficult Cases',
    card:'Cases that do not respond as expected',
    blurb:'A stalled case should tell you what to look at next, not leave you guessing.',
    h1:'When a case does not respond the way you expect',
    sub:'A difficult case is not a dead end. It is a signal that something in the analysis, the correction, or the follow-up needs to change.',
    h2:'The stalled case is the real test of a clinical system.',
    prose:['Every practice has them: the patient whose findings looked clear, whose correction went well, and whose progress still stalls. Without a defined way to evaluate what happened, the next visit becomes a guess — change something, hope it helps, wait and see.',
           'Advanced Orthogonal treats the difficult case as the point of the system rather than the exception to it. Analysis, correction, and re-evaluation are structured so you can tell which part of the process to examine first, and what the findings say to change.'],
    ah:'Approach Difficult Cases with Confidence',
    ap:'Follow a system designed to help you evaluate results and make informed changes.',
    bul:['A defined re-evaluation process, so you can see what actually changed',
         'Measurements you can compare visit to visit instead of impressions',
         'A structured order of operations for what to check when progress stalls',
         'Instructors and colleagues who work through hard cases alongside you'],
    step2:{h:'Bring Your Hardest Cases', p:'The AdvO Intensive is built around complex case labs and case review with senior instructors — the cases that are not going the way they should.', btn:'View the AdvO Intensive', go:['sem','intensive']}},

  uncertain:{n:'03', img:'xray', kick:'Clear Decisions',
    card:'Uncertainty about what needs to change',
    blurb:'Clear decisions come from clear information, not from a longer deliberation.',
    h1:'When you are not sure what to change next',
    sub:'The analysis is what turns a complicated case into a specific next step.',
    h2:'Doubt at the decision point is expensive.',
    prose:['Hesitation at the decision point costs the visit, it costs the patient’s confidence, and over time it costs yours. Usually the problem is not your judgment — it is that the information in front of you does not point anywhere in particular.',
           'Advanced Orthogonal begins with a detailed digital analysis of specific three-dimensional imaging. Those measurements produce a patient-specific correction vector, and that vector defines what the correction should be. When something needs to change, the measurements are where you look.'],
    ah:'Make Clearer Decisions',
    ap:'Use patient-specific measurements and a defined clinical process to guide each correction.',
    bul:['Digital measurement of the upper cervical misalignment on specific imaging',
         'A correction vector derived directly from that patient’s own measurements',
         'A defined clinical process that tells you what to evaluate, and when',
         'Objective post-correction findings, so “better” is something you can show'],
    step2:{h:'Learn the Analysis', p:'Fundamental 2 goes deep on the signature skill of the Advanced Orthogonal doctor: measuring the misalignment on three-dimensional imaging and drawing the lines that produce the vector.', btn:'View Fundamental 2', go:['sem','fund2']}},

  doctordep:{n:'04', img:'instrument', kick:'Transferable',
    card:'A technique that depends too heavily on the doctor',
    blurb:'A clinical system should outlive any one pair of hands — including yours.',
    h1:'When the technique depends too much on the doctor',
    sub:'If the results rest on your particular touch and timing, the work is hard to teach, hard to hand off, and hard to grow.',
    h2:'What cannot be described cannot be handed on.',
    prose:['When results in your practice rest on your own touch, timing, and accumulated experience, several things follow. The work is hard to teach. It is hard to cover when you are away. It is hard to build an associate or a second location around. And it is hard to explain to anyone outside your own treatment room.',
           'Advanced Orthogonal is built to be transferable. The measurement is digital, the vector is calculated, the setup is defined, and the correction is delivered by a percussive sound-wave instrument — a chain of steps another trained doctor can follow and reproduce.'],
    ah:'Improve Repeatability',
    ap:'Reduce variables that can make results depend too heavily on the individual doctor.',
    bul:['Instrument delivery in place of doctor-dependent manual force',
         'A written, teachable protocol rather than accumulated personal technique',
         'Certification standards that define what competence actually means',
         'A process an associate or a covering doctor can be trained into'],
    step2:{h:'Learn the Protocol', p:'The Fundamentals Series teaches the procedure as a procedure — the same one every certified Advanced Orthogonal doctor is trained to follow.', btn:'Explore the Fundamentals Series', go:['sem','fund1']}},

  strain:{n:'05', img:'adjust', kick:'Longevity',
    card:'Physical wear from years of manual adjusting',
    blurb:'The length of your career should not be decided by your shoulders and wrists.',
    h1:'When years of manual adjusting start to add up',
    sub:'The correction is delivered by a table-mounted instrument, not by your body.',
    h2:'The physical cost of this work compounds quietly.',
    prose:['Manual upper cervical work is physically demanding, and the cost accumulates without announcing itself. Many experienced doctors reduce their patient load, narrow what they are willing to take on, or start planning an exit earlier than they intended — not because their clinical judgment declined, but because their body did.',
           'Advanced Orthogonal delivers the correction through a table-mounted percussive sound-wave instrument. The force is produced by the instrument rather than by you, which changes what a full day of patient care asks of your body.'],
    ah:'Reduce Physical Strain',
    ap:'Deliver the correction through a table-mounted instrument instead of relying on forceful manual adjusting.',
    bul:['The correction is delivered by a table-mounted instrument',
         'No forceful manual contact is required to produce the correction',
         'A repeatable setup that does not depend on your leverage or positioning',
         'A realistic path to practising at full capacity for longer'],
    step2:{h:'See It for a Full Week', p:'AdvO Bootcamp is five days of hands-on training with the instrument and the full protocol, alongside the doctors who already practice this way.', btn:'View AdvO Bootcamp', go:['sem','bootcamp']}}
} as unknown as Record<string, Problem>

export const PROBLEM_ORDER = ['repeat','respond','uncertain','doctordep','strain'] as const

/** Hand-written URL slugs — readable, and stable if the internal keys change. */
export const PROBLEM_SLUG: Record<string, string> = {
  repeat: 'corrections-that-do-not-hold',
  respond: 'patients-who-do-not-respond',
  uncertain: 'uncertainty-in-the-listing',
  doctordep: 'doctor-dependence',
  strain: 'physical-strain-on-the-doctor',
}

export const SLUG_TO_PROBLEM: Record<string, string> = Object.fromEntries(
  Object.entries(PROBLEM_SLUG).map(([key, slug]) => [slug, key]),
)
