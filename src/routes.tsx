/* ----------------------------------------------------------------------------
 * The route manifest — the keystone of this build.
 *
 * Four things read this one array: client routing, the prerenderer, the sitemap
 * generator and the build-time renderer. Because they share a source, a page
 * cannot exist in the app but be missing from the sitemap, or be prerendered
 * without metadata. Never duplicate a route list elsewhere.
 *
 * This is what replaces the old `go(page, id)` show/hide: every entry below is
 * a real URL that can be linked, shared, indexed and cited.
 * -------------------------------------------------------------------------- */
import type { ComponentType } from 'react'
import type { PageMeta } from '@/lib/seo'
import { summarize } from '@/lib/seo'

import { SEMINARS, SEMINAR_SLUG } from '@/content/seminars'
import { ARTICLES, articleSlug } from '@/content/articles'
import { PROBLEMS, PROBLEM_ORDER, PROBLEM_SLUG } from '@/content/problems'
import { faqGraph } from '@/content/faq'

import HomePage from '@/pages/HomePage'
import AboutPage from '@/pages/AboutPage'
import DifferencePage from '@/pages/DifferencePage'
import BoardPage from '@/pages/BoardPage'
import ResearchPage from '@/pages/ResearchPage'
import SeminarsPage from '@/pages/SeminarsPage'
import SeminarPage from '@/pages/SeminarPage'
import CertificationPage from '@/pages/CertificationPage'
import CertLevel1Page from '@/pages/CertLevel1Page'
import CertLevel2Page from '@/pages/CertLevel2Page'
import MembershipPage from '@/pages/MembershipPage'
import ArticlesPage from '@/pages/ArticlesPage'
import ArticlePage from '@/pages/ArticlePage'
import ProblemPage from '@/pages/ProblemPage'
import ContactPage from '@/pages/ContactPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import ConfirmPage from '@/pages/ConfirmPage'
import PayPage from '@/pages/PayPage'
import AccountPage from '@/pages/AccountPage'
import NotFoundPage from '@/pages/NotFoundPage'

export type RouteEntry = {
  path: string
  Component: ComponentType
  meta: PageMeta
  /** Rendered to static HTML at build time. Authenticated routes are not. */
  prerender: boolean
  /** Route param handed to the component by the renderer. */
  param?: string
}

const UPDATED = '2026-09-16'

/* ------------------------------------------------------------ static pages */

const staticRoutes: RouteEntry[] = [
  {
    path: '/',
    Component: HomePage,
    prerender: true,
    meta: {
      title: 'Advanced Orthogonal Institute — Precision Upper Cervical Education',
      description:
        'Training and certification in Advanced Orthogonal: a precise, instrument-based upper cervical procedure for chiropractors handling complex cases.',
      image: '/images/adjust.webp',
      priority: 1,
      changefreq: 'weekly',
      updatedAt: UPDATED,
      graph: [faqGraph],
    },
  },
  {
    path: '/about',
    Component: AboutPage,
    prerender: true,
    meta: {
      title: 'About the Institute — Advanced Orthogonal Institute',
      description:
        'The Advanced Orthogonal Institute sets the standard for the Advanced Orthogonal procedure — the training, the certification, and the doctors who teach it.',
      image: '/images/setup.webp',
      priority: 0.8,
      updatedAt: UPDATED,
      breadcrumbs: [{ name: 'About', path: '/about' }],
    },
  },
  {
    path: '/advo-difference',
    Component: DifferencePage,
    prerender: true,
    meta: {
      title: 'The Advanced Orthogonal Difference — What Makes AdvO Specific',
      description:
        'Detailed digital measurement, patient-specific correction vectors, and a percussive sound-wave instrument — how Advanced Orthogonal differs from other upper cervical methods.',
      image: '/images/instrument.webp',
      priority: 0.8,
      updatedAt: UPDATED,
      breadcrumbs: [{ name: 'About', path: '/about' }],
    },
  },
  {
    path: '/board-of-directors',
    Component: BoardPage,
    prerender: true,
    meta: {
      title: 'Board of Directors — Advanced Orthogonal Institute',
      description:
        'The doctors who govern the Advanced Orthogonal Institute, set its certification standards, and direct its research and instruction.',
      image: '/images/cs.webp',
      priority: 0.7,
      updatedAt: UPDATED,
      breadcrumbs: [{ name: 'About', path: '/about' }],
    },
  },
  {
    path: '/research',
    Component: ResearchPage,
    prerender: true,
    meta: {
      title: 'Research at the Institute — Advanced Orthogonal Institute',
      description:
        'The Institute is registered with SAM.gov and EBRAP and certified to compete for federally funded research into precision upper cervical care.',
      image: '/images/xray.webp',
      priority: 0.7,
      updatedAt: UPDATED,
      breadcrumbs: [{ name: 'About', path: '/about' }],
    },
  },
  {
    path: '/seminars',
    Component: SeminarsPage,
    prerender: true,
    meta: {
      title: 'Seminars & Events — Advanced Orthogonal Institute',
      description:
        'Every Advanced Orthogonal training event: the free Intro course, the Fundamentals Series, Intensives, Bootcamp, the Annual Conference and internships.',
      image: '/images/conference.webp',
      priority: 0.9,
      changefreq: 'weekly',
      updatedAt: UPDATED,
      breadcrumbs: [{ name: 'Seminars', path: '/seminars' }],
    },
  },
  {
    path: '/certification',
    Component: CertificationPage,
    prerender: true,
    meta: {
      title: 'Get Certified — Advanced Orthogonal Certification',
      description:
        'Four steps to Advanced Orthogonal certification. Level 1 proves the minimum standard; Level 2 proves proficiency that is reproducible.',
      image: '/images/level.webp',
      priority: 0.9,
      updatedAt: UPDATED,
      breadcrumbs: [{ name: 'Certification', path: '/certification' }],
    },
  },
  {
    path: '/certification/advo-level-1',
    Component: CertLevel1Page,
    prerender: true,
    meta: {
      title: 'AdvO Level 1 Certification — Advanced Orthogonal Institute',
      description:
        'Level 1 certification in Advanced Orthogonal: the requirements, the practical examination, and what the credential certifies about your analysis and correction.',
      image: '/images/analyze.webp',
      priority: 0.8,
      updatedAt: UPDATED,
      breadcrumbs: [{ name: 'Certification', path: '/certification' }],
    },
  },
  {
    path: '/certification/advo-level-2',
    Component: CertLevel2Page,
    prerender: true,
    meta: {
      title: 'AdvO Level 2 Certification — Advanced Orthogonal Institute',
      description:
        'Level 2 certification in Advanced Orthogonal: advanced imaging, reproducible proficiency, and the standard expected of instructors and mentors.',
      image: '/images/level.webp',
      priority: 0.8,
      updatedAt: UPDATED,
      breadcrumbs: [{ name: 'Certification', path: '/certification' }],
    },
  },
  {
    path: '/membership',
    Component: MembershipPage,
    prerender: true,
    meta: {
      title: 'AOI Membership — Advanced Orthogonal Institute',
      description:
        'Institute membership includes Annual Conference registration, a $200 discount on every seminar, the doctor directory listing, and member resources.',
      image: '/images/conference.webp',
      priority: 0.9,
      updatedAt: UPDATED,
      breadcrumbs: [{ name: 'Membership', path: '/membership' }],
    },
  },
  {
    path: '/articles',
    Component: ArticlesPage,
    prerender: true,
    meta: {
      title: 'Articles & Research — Advanced Orthogonal Institute',
      description:
        'Clinical and technical writing from the Institute on upper cervical measurement, correction, imaging reliability, and the physics of the adjustment.',
      image: '/images/xray.webp',
      priority: 0.7,
      changefreq: 'weekly',
      updatedAt: UPDATED,
      breadcrumbs: [{ name: 'Articles', path: '/articles' }],
    },
  },
  {
    path: '/contact',
    Component: ContactPage,
    prerender: true,
    meta: {
      title: 'Contact the Advanced Orthogonal Institute',
      description:
        'Reach the Advanced Orthogonal Institute about training, certification, membership, equipment, or speaking at an Institute event.',
      priority: 0.6,
      updatedAt: UPDATED,
      breadcrumbs: [{ name: 'Contact', path: '/contact' }],
    },
  },
]

/* -------------------------------------------------- content-driven pages */

const seminarRoutes: RouteEntry[] = Object.entries(SEMINARS).map(([key, seminar]) => ({
  path: `/seminars/${SEMINAR_SLUG[key]}`,
  Component: SeminarPage,
  param: key,
  prerender: true,
  meta: {
    title: `${seminar.title} — Advanced Orthogonal Institute`,
    description: summarize(seminar.sub),
    image: seminar.photo ? `/images/${seminar.photo}.webp` : '/images/conference.webp',
    priority: 0.8,
    changefreq: 'weekly',
    updatedAt: UPDATED,
    breadcrumbs: [{ name: 'Seminars', path: '/seminars' }],
    graph: [
      {
        '@type': 'Course',
        name: seminar.title,
        description: summarize(seminar.overview, 300),
        provider: { '@id': 'https://www.advancedorthogonal.com/#organization' },
        ...(seminar.fullPrice > 0
          ? {
              offers: {
                '@type': 'Offer',
                price: String(seminar.fullPrice),
                priceCurrency: 'USD',
                category: 'Paid',
              },
            }
          : {
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
                category: 'Free',
              },
            }),
      },
    ],
  },
}))

const articleRoutes: RouteEntry[] = ARTICLES.map((article) => ({
  path: `/articles/${articleSlug(article)}`,
  Component: ArticlePage,
  param: article.id,
  prerender: true,
  meta: {
    title: `${article.title} — Advanced Orthogonal Institute`,
    description: summarize(article.ex),
    priority: 0.6,
    updatedAt: UPDATED,
    breadcrumbs: [{ name: 'Articles', path: '/articles' }],
    graph: [
      {
        '@type': 'Article',
        headline: article.title,
        description: summarize(article.ex),
        articleSection: article.cat,
        datePublished: article.date,
        dateModified: UPDATED,
        author: { '@id': 'https://www.advancedorthogonal.com/#organization' },
        publisher: { '@id': 'https://www.advancedorthogonal.com/#organization' },
      },
    ],
  },
}))

const problemRoutes: RouteEntry[] = PROBLEM_ORDER.map((key) => {
  const problem = PROBLEMS[key]!
  return {
    path: `/clinical-challenges/${PROBLEM_SLUG[key]}`,
    Component: ProblemPage,
    param: key,
    prerender: true,
    meta: {
      title: `${problem.h1} — Advanced Orthogonal Institute`,
      description: summarize(problem.sub),
      priority: 0.7,
      updatedAt: UPDATED,
      breadcrumbs: [{ name: 'Clinical Challenges', path: '/#clinical-challenges' }],
    },
  }
})

/* ------------------------------------------------- client-only, unindexed */

const privateRoutes: RouteEntry[] = [
  {
    path: '/account',
    Component: AccountPage,
    prerender: false,
    meta: {
      title: 'Member Account — Advanced Orthogonal Institute',
      description:
        'Sign in to your Advanced Orthogonal Institute member account to manage registrations, certification and your directory listing.',
      noindex: true,
    },
  },
  {
    path: '/reset-password',
    Component: ResetPasswordPage,
    prerender: false,
    meta: {
      title: 'Reset Password — Advanced Orthogonal Institute',
      description: 'Reset the password on your Advanced Orthogonal Institute member account.',
      noindex: true,
    },
  },
  {
    path: '/registration-confirmed',
    Component: ConfirmPage,
    prerender: false,
    meta: {
      title: 'Registration Confirmed — Advanced Orthogonal Institute',
      description:
        'Your Advanced Orthogonal Institute registration is confirmed. Your receipt and event details are on their way by email.',
      noindex: true,
    },
  },
  /* Payment links sent from the check-in desk (CE certificate or a door registration). */
  ...Object.entries(SEMINARS).filter(([key]) => SEMINAR_SLUG[key] !== 'internships').map(([key, seminar]): RouteEntry => ({
    path: `/seminars/${SEMINAR_SLUG[key]}/pay`,
    Component: PayPage,
    prerender: false,
    meta: {
      title: `Payment — ${seminar.title} — Advanced Orthogonal Institute`,
      description: `Secure payment for ${seminar.title} at the Advanced Orthogonal Institute.`,
      noindex: true,
    },
  })),
]

export const routes: RouteEntry[] = [
  ...staticRoutes,
  ...seminarRoutes,
  ...articleRoutes,
  ...problemRoutes,
  ...privateRoutes,
]

export const notFoundRoute = {
  Component: NotFoundPage,
  meta: {
    title: 'Page Not Found — Advanced Orthogonal Institute',
    description:
      'That page could not be found. Browse Institute seminars, certification and membership instead.',
    noindex: true,
  } satisfies PageMeta,
}

export const routeByPath = new Map(routes.map((r) => [r.path, r]))
