/* ----------------------------------------------------------------------------
 * Speakers, instructors and the Board of Directors
 * Lifted verbatim from the v4.8 single-file build. Content lives here, outside
 * components, so the same object feeds the page, its metadata and its
 * structured data — what a human reads and what a machine reads cannot drift.
 * -------------------------------------------------------------------------- */

export type Person = {
  name: string
  ini: string
  img: string
  cred: string
  role: string
  bio: string
  photo?: string
}

export const PEOPLE = {
  hulsey:{name:'Dr. Daniel Hulsey', ini:'DH', img:'ph-a', cred:'D.C.', role:'SPEAKER',
      bio:'Presenting clinical recognition of Operator Syndrome in combat veterans — and where precision upper cervical care fits in their recovery.'},
  miranda:{name:'Dr. David Miranda', ini:'DM', img:'ph-b', cred:'D.C., DCCJP', role:'BOARD MEMBER',
      bio:'Dr. David Miranda is a chiropractic physician practicing at Sound Correction Chiropractic in Orem, Utah, dedicated to advancing precision in upper cervical analysis and correction. He is trained in Grostic, Advanced Orthogonal, EPIC, Activator Methods, and Webster Technique. During his final year of chiropractic school he completed his internship at the Pierce Clinic, an experience that sparked his pursuit to understand why these procedures work as consistently as they do. His current research focuses on challenging existing orthogonal models and developing true three-dimensional analytic frameworks to substantiate and evolve upper cervical analysis. He served as a district leader before joining the executive board of the Utah Chiropractic Physicians Association, and remains committed to pursuing truth through measurement and analysis.'},
  damico:{name:'Dr. Dutch D\'Amico', ini:'DD', img:'ph-b', cred:'D.C., BCAO', role:'BOARD MEMBER',
      bio:'Dr. Dutch D\'Amico is a fifth-generation Doctor of Chiropractic and grandson of Dr. G. Stanford Pierce Sr., founder of the Advanced Orthogonal technique. A U.S. Army veteran and Director of Research and Development for SpinalLight, Inc., Dr. D\'Amico is deeply committed to advancing instrument technology and precision in upper cervical care. As both a clinician at the Pierce Clinic of Chiropractic and an instructor for the Advanced Orthogonal Institute, he brings passion, technical mastery, and a legacy of innovation to every aspect of his work.'},
  jorbora:{name:'Dr. Nor Jorbora', ini:'NJ', img:'ph-a', cred:'D.C.', role:'SPEAKER',
      bio:'Presenting a clinical case study — topic to be announced.'},
  beadle:{name:'Dr. James Beadle', ini:'JB', img:'ph-b', cred:'D.C., DCCJP-c', role:'BOARD MEMBER',
      bio:'Dr. James Beadle graduated from Life Chiropractic College West in 2012, where he developed Sonus: Blueprint, a software system designed to enhance precision and confidence in the Advanced Orthogonal procedure. A former Board Member of EPIC and elective instructor of the EPIC technique at Life West, Dr. Beadle is also a Diplomate of Chiropractic Craniocervical Junction Procedures candidate. He leads Sound Corrections Chiropractic in Orem, Utah, and continues to advance upper cervical research and clinical quality through innovation in software and technology.'},
  wooden:{name:'Dr. Braken Wooden', ini:'BW', img:'ph-c', cred:'D.C.', role:'SPEAKER',
      bio:'Teaching upper cervical muscle analysis — what the musculature reveals about the correction.'},
  billiris:{name:'Dr. Chad Billiris', ini:'CB', img:'ph-a', cred:'D.C.', role:'SPEAKER',
      bio:'Leading a practical session on vertigo assessment in upper cervical practice.'},
  fowler:{name:'Dr. Jeff Fowler', ini:'JF', img:'ph-b', cred:'D.C., BCAO', role:'BOARD MEMBER · PRESIDENT',
      bio:'Dr. Jeff Fowler is one of the original instructors of the Advanced Orthogonal technique and has been teaching it for over two decades. He owns and operates Citrus Regional Clinic of Chiropractic in Inverness, Florida, where he maintains an upper cervical-focused practice while continuing to train doctors nationwide through the Institute. He has been involved with the Advanced Orthogonal Institute since its founding and currently serves as President of the Institute and a Senior Instructor. Dr. Fowler is widely respected for the clarity of his instruction and his excellence in hands-on teaching, particularly in helping doctors develop confidence and precision in the practical execution of the technique.'},
  colavita:{name:'Dr. Angelo Colavita', ini:'AC', img:'ph-c', cred:'D.C., BCAO', role:'BOARD MEMBER',
      bio:'Dr. Angelo Colavita graduated Magna Cum Laude from Palmer College of Chiropractic in Davenport, Iowa, in 1998, and became Board Certified in Atlas Orthogonal through Sherman College of Chiropractic the same year, training directly under Dr. Roy W. Sweat, who developed the Atlas Orthogonal technique. He has been in private practice since 1998 and practices in Clifton, New Jersey, where his clinical focus centers on craniocervical misalignment, headaches and migraines, TMJ disorders, and trauma-related injury. Dr. Colavita is a certified instructor of Atlas Orthogonal modular seminars and an FDA-registered inspector of Atlas Orthogonal precision adjusting instruments, and he holds advanced certification in digital motion x-ray functional imaging. He has served as an adjunct professor at Palmer College of Chiropractic, Sherman College of Chiropractic, and Life Chiropractic College West, and has taught at Advanced Atlas Orthogonal conferences across the United States and Canada. He serves on the Board of Directors of the Advanced Orthogonal Institute and teaches on the role of CT imaging in upper cervical practice.'},
  silver:{name:'Dr. Josh Silver', ini:'JS', img:'ph-a', cred:'D.C.', role:'SPEAKER',
      bio:'The neuro session — a deep dive for the neurology junkies of the upper cervical world.'},
  bollen:{name:'Dr. Ric Bollen', ini:'RB', img:'ph-b', cred:'D.C.', role:'SPEAKER',
      bio:'Teaching scar tissue management and its role in patient outcomes.'},
  corsello:{name:'Dr. Eddie Corsello', ini:'EC', img:'ph-c', cred:'D.C.', role:'SPEAKER',
      bio:'Case study: honing back to upper cervical.'},
  cs:{name:'Dr. Chris Slininger', ini:'CS', img:'ph-b', cred:'D.C., DCCJP', role:'EXECUTIVE DIRECTOR · BOARD MEMBER',
      bio:'Dr. Chris Slininger is a U.S. Army veteran who served during Operation Iraqi Freedom and completed his chiropractic training at Life Chiropractic College West with a focused emphasis on upper cervical care. He owns and operates Cerebral Chiropractic Center in St. Petersburg, Florida, and went on to complete his Diplomate in Chiropractic Craniocervical Junction Procedures through the ICA\'s Council on Upper Cervical Care. He has trained in multiple upper cervical techniques, including Advanced Orthogonal, NUCCA, Orthospinology, and Blair. Clinically he specializes in complex neurological cases, brain health, and mental health. He serves as Executive Director of the Advanced Orthogonal Institute and has served on the Board of Directors of the ICA Council on Upper Cervical Care. He also consults with practices and businesses on strategic planning and execution, and is the founder of Synapse Continuing Education, a national platform for advanced, cross-disciplinary healthcare education.'},
  jk:{name:'Dr. Jeff Kahrs', ini:'JK', img:'ph-a', cred:'D.C. · CERTIFIED ADVO LEVEL 2', role:'INSTRUCTOR',
      bio:'Two decades of precision upper cervical practice. Leads the x-ray analysis intensives and certification case reviews at the Institute.'},
  mr:{name:'Dr. Maria Reyes', ini:'MR', img:'ph-c', cred:'D.C., PH.D. · NEUROLOGY RESEARCH', role:'GUEST EXPERT',
      bio:'Research faculty presenting the latest findings on functional and neurological change following specific upper cervical correction.'},
  lyter:{name:'Dr. Kevin Lyter', ini:'KL', img:'ph-b', cred:'D.C., DCCJP', role:'BOARD MEMBER · SECRETARY',
      bio:'Dr. Kevin Lyter is the owner of Simmons Chiropractic Clinic in Tacoma, Washington, a large and well-established upper cervical practice that has served the region since 1946 and is recognized as a longstanding hub for orthogonal-based care and training. He earned his Doctor of Chiropractic degree from Life Chiropractic College West in 2000 and began practicing in Washington shortly thereafter. After being introduced to the Atlas Orthogonal instrument adjustment, Dr. Lyter joined Simmons Chiropractic Clinic in 2005, where he has remained committed to upper cervical-specific chiropractic care. He has served on the Board of Directors of the Advanced Orthogonal Institute for nearly a decade, is a Senior Instructor, and regularly hosts Advanced Orthogonal hands-on seminars at Simmons Chiropractic Clinic, supporting doctors throughout the western United States.'}
} as unknown as Record<string, Person>

/** The seated Board, in the order it is displayed.
 *  Dr. Nick Schar was removed and Dr. Angelo Colavita seated in his place. */
export const BOARD_ROSTER = [
  'cs',
  'fowler',
  'lyter',
  'colavita',
  'beadle',
  'miranda',
  'damico',
] as const

/** People whose headshot was extracted from the v4.8 build to a real image
 *  file. Anyone absent here renders as initials, exactly as before. */
export const HEADSHOTS = new Set([
  'lyter',
  'cs',
  'miranda',
  'billiris',
  'silver',
  'colavita',
  'beadle',
  'fowler',
  'damico',
])
