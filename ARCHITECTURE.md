# Advanced Orthogonal Institute — architecture

This replaces the v4.8 single-file build (`index.html`, 1.65 MB). That file was
one page: every section was a `<div class="page">` shown and hidden by a
JavaScript `go(page, id)` call, so the whole site shared a single URL. Nothing
could be linked to, Google indexed one page, and AI crawlers had one document
to cite.

This build produces **30 real URLs**, each a complete static HTML file.

---

## The rendering contract

Every public route is rendered to a full HTML file at build time. Cloudflare
Pages serves those files directly; React hydrates afterwards for the
interactive parts. Roughly two thirds of AI crawlers cannot execute JavaScript
— GPTBot, ClaudeBot and PerplexityBot fetch pages but never run scripts — so a
page whose content only exists after hydration does not exist to them.

`scripts/verify-prerender.mjs` runs as part of `npm run build` and fails the
build if any page lacks a title, meta description, canonical, JSON-LD, an
`<h1>`, or 300 characters of real text in the raw HTML. Without that gate,
breaking prerendering is silent: the site still looks perfect in a browser.

**When checking by hand: View Source, not Inspect Element.** Inspect Element
shows the DOM after JavaScript ran, which is not what a crawler receives.

`/account` and `/registration-confirmed` are deliberately client-only and
`noindex`. They are per-visitor and should never be crawled.

## The route manifest

`src/routes.tsx` exports one array. Four things read it: client routing, the
prerenderer, the sitemap generator and the build-time renderer. Because they
share a source, a page cannot exist in the app but be missing from the sitemap,
or be prerendered without metadata. **Never duplicate a route list elsewhere.**

Each entry carries `path`, `Component`, a required `meta: PageMeta` and
`prerender: boolean`. `PageMeta` is required and typed, so a page cannot ship
without a title, description or canonical.

## Content

Content lives in `src/content/` as typed modules, outside components. The same
object feeds the page, its metadata and its structured data, so what a human
reads and what a machine reads cannot drift apart.

Every string was lifted verbatim from the v4.8 build. The rebuild was verified
phrase by phrase against it: 303 content phrases, zero dropped.

- `seminars.ts` — the catalog. `DB_SLUG` maps each site key to its
  `public.events.slug`, and that same slug is the public URL, so the page, the
  sitemap and the event record always agree.
- `people.ts` — speakers, instructors and the seated Board.
- `articles.ts`, `problems.ts`, `faq.ts`, `testimonials.ts`, `access.ts`.

## Tokens

`src/styles/tokens.css` is the single source for every design decision. Colours
are authored in OKLCH, converted from the palette the Board approved on v4.8,
and named by role — `content-secondary`, never `gray-400`. Roles survive a
rebrand; appearances do not. **No raw hex, `rgb()` or `rgba()` appears anywhere
else in the codebase**, including inline styles in components.

When the Institute becomes the CranioCervical Institute, the rebrand is a
change to these values, not to any component.

`src/styles/components.css` is the v4.8 visual design, ported so the rebuild is
pixel-identical to what the Board signed off on, with every colour resolved to
a token.

## Navigation

Navigation is a real `<a href>`, never a click handler. `Link` renders a genuine
anchor, so middle-click, copy-link, "open in new tab" and every crawler get a
real URL. The click handler is only an enhancement: with JavaScript off the
anchor still works, because every route is a real file on disk.

## Data and security

The browser only ever holds the Supabase publishable key. Anything needing
`service_role` runs in an Edge Function.

`create-checkout` is unchanged. That function has already taken and refunded
real money, so the request body sent to it is byte-for-byte what v4.8 sent —
same fields, same `reg_type`, same headers. The only change is the return URL,
which now lands on `/registration-confirmed`; the function allowlists by
**origin**, not path, so this needed no server change.

`src/lib/queries/` holds the data layer. Components never call Supabase
directly. The prerendered HTML carries the content-module values so a crawler
sees real dates and prices; in the browser, `CatalogProvider` overlays whatever
`v_public_events` currently says, because the database — not this repo — is the
source of truth for what is charged and whether registration is open.

## Access control

One call, `get_my_access()`, returns the person, their tier, every role they
hold with its committee, and a flat capability list. `AccessProvider` makes it
available as `can('manage_seminars')`. **No component reads a role.**

The rail in `src/lib/nav.ts` is generated from that capability list. This is the
one structural change from CCI OS, which keyed tabs to a role name: a committee
chair who was not also a board member fell through to the member list of tabs
and saw two. Here the capability reveals the tab, so seating someone on a
committee gives them the committee's surface and nothing else.

**The UI is not the security boundary.** Hiding a tab is a courtesy; the
row-level policies are what refuse the data. Both derive from the same
`person_roles` rows, so they cannot disagree. A capability decides whether to
ask; RLS decides whether to answer.

`tools/role-matrix.mjs` prints the menu each role resolves to, from the real nav
logic and capability strings measured against the live database. Run it after
any change to `nav.ts`.

### What was repaired in the database

Three role systems had grown up alongside each other. `members` was never
populated, yet `current_role_key()`, `current_committee_id()` and
`current_member_id()` all read it — so they returned NULL, and the six committee
manager checks built on them evaluated to false. 33 policies across 15 tables
had been failing closed, silently.

All of them now read `person_roles`, which is where roles are actually
administered. Alongside that:

- `is_staff()` and `is_oversight()` accept a role from the roster as well as
  from `profiles.role`, so assigning a role is sufficient on its own. That is
  what makes role assignment the only administrative act.
- Committee policies moved from `committee_id = current_committee_id()` to
  `chairs_committee(committee_id)`. A single id can only name one committee;
  anyone leading two silently lost access to one of them.
- `events.created_by` and `messages.member_id` were repointed from `members` to
  `people`.
- Four board members had roles on file that never resolved, because
  `people.auth_user_id` was empty for them. Linked.

There is no membership committee in this database — the nine are instructor,
curriculum, seminar, college_outreach, internship, certification, research,
marketing and nominations. `is_membership_manager()` still checks for the key,
so creating the committee is all it would take to delegate membership; until
then it rests on oversight.

---

## Deviations from the house standard

The standard asks for Vite 7, Tailwind v4 and React Router v7. **None of them
could be installed**: the build environment has no access to the npm registry
(`403 connect_rejected` by organization policy, from both the cloud container
and the local device VM). Rather than ship a project that had never been built
or verified, the three were replaced with equivalents that are in the repo and
that the build actually exercises:

| Standard | Here | Why |
|---|---|---|
| Vite 7 | `scripts/build.mjs` on esbuild | esbuild was available; it bundles, prerenders and generates the SEO files in one pass. |
| Tailwind v4 `@theme` | plain CSS custom properties on `:root` | No utility classes are used — the design is the ported v4.8 stylesheet — so the `@theme` block bought nothing without Tailwind installed. The "one token file, no raw hex elsewhere" rule is unchanged and holds. |
| React Router v7 | `src/lib/router.tsx` (~200 lines) | Provides the slice of the API this site uses, against the History API. Consistent with the standard's principle of copying components into the repo. |

What this costs: no HMR dev server, and the router has no data loaders or
nested layouts. What it preserves: every one of the five non-negotiables.
TypeScript is strict and `npm run typecheck` is wired up; it could not be run
here because `@types/react` is also on the registry.

Swapping any of these back is a contained change — the components, content and
routes are untouched by it.

## Known follow-ups

- **Route-level code splitting.** The client bundle is 116 kB gzipped, inside
  the 150 kB budget, but every page's component ships on every page. Splitting
  needs `React.lazy` plus care around hydrating prerendered markup.
- **`text-wrap: balance`** on headings was removed so line breaks match the
  approved design exactly. It is a real improvement and can be turned on as a
  deliberate change.
- **AVIF.** Images ship as WebP (811 kB total, down from 1.32 MB of base64 in
  v4.8, and now loaded per page instead of all at once). AVIF encodes a further
  19% smaller; adding it means `image-set()` for the CSS backgrounds and
  `<picture>` for the headshots.
- **Rebuild on content change.** Events edited in CCI OS appear immediately via
  the live overlay, but the prerendered HTML only updates on the next deploy. A
  Supabase webhook hitting a Cloudflare deploy hook would close that gap.
