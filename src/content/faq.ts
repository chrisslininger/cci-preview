/* ----------------------------------------------------------------------------
 * Home page FAQ.
 *
 * Was an inline JSON-LD <script> in the v4.8 markup. It lives here now so the
 * same object feeds both the structured data and anything rendered on the page
 * — what a human reads and what a machine reads cannot drift apart.
 * -------------------------------------------------------------------------- */

export type Faq = { q: string; a: string }

export const FAQ: Faq[] = [
  {
    q: "Who is Advanced Orthogonal training for?",
    a: "Training is designed for chiropractors and chiropractic students who want to learn a precise, instrument-based upper cervical approach. It may also be useful for doctors trained in Atlas Orthogonal, EPIC, Orthospinology, or other upper cervical systems who want to cross-train.",
  },
  {
    q: "Do I need experience in upper cervical care?",
    a: "No. The free Intro to AdvO course has no prerequisites and is a good starting point for doctors and students who are new to the technique.",
  },
  {
    q: "What happens after the free course?",
    a: "After the introduction, you can continue into the Fundamentals Series, attend a hands-on Intensive or Bootcamp, and begin working toward certification.",
  },
  {
    q: "How long is the free course?",
    a: "The Intro to AdvO course is self-paced and takes about two hours.",
  },
  {
    q: "Does the technique use manual adjusting?",
    a: "Advanced Orthogonal uses a percussive sound-wave instrument to deliver a patient-specific correction.",
  },
  {
    q: "What equipment is needed?",
    a: "You do not need to own equipment to begin. The free Intro course requires nothing but your time, and hands-on seminars provide the instruments and imaging you train on. Clinical use of Advanced Orthogonal requires a percussive sound-wave instrument and access to the imaging the analysis depends on. Contact the Institute for current equipment details before you invest.",
  },
  {
    q: "How is Advanced Orthogonal different from other upper cervical methods?",
    a: "Advanced Orthogonal combines detailed digital measurements, patient-specific correction vectors, instrument-based adjusting, and a reproducible clinical process.",
  },
  {
    q: "Can students attend seminars?",
    a: "Yes. Chiropractic students are welcome at Institute training, and students are part of who this work is built for. Where a student rate is offered it is published on the event page \u2014 the 2026 Annual Conference student rate is $347. Bring proof of current enrollment.",
  },
  {
    q: "How long does certification take?",
    a: "The time needed depends on your previous training, seminar attendance, clinical experience, and completion of the Institute's requirements.",
  },
  {
    q: "Do I need to become a member?",
    a: "Membership is not required to begin with the free course.",
  },
]

/** schema.org FAQPage node, generated from the same list. */
export const faqGraph = {
  '@type': 'FAQPage',
  mainEntity: FAQ.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
}
