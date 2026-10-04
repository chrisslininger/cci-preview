/* ----------------------------------------------------------------------------
 * The member-area navigation.
 *
 * Ported from the tab map in CCI OS, with one structural change: CCI OS keyed
 * tabs to a role name, which meant a committee chair who was not also a board
 * member fell through to the member list of tabs. Here each tab declares the
 * capabilities that reveal it, and the capabilities come from the roles a
 * person actually holds. Seat someone on a committee and their tab appears;
 * remove them and it goes. Nothing is hard-coded per person.
 *
 * `group` is what the rail prints as a section heading. An item with `under`
 * is not in the rail at all: it is a tab on its parent's page, which keeps the
 * rail short enough to see whole.
 * -------------------------------------------------------------------------- */
import type { Access, Capability } from './access'

export type NavGroup = 'home' | 'events' | 'work' | 'people' | 'committees' | 'admin'

export type NavItem = {
  key: string
  label: string
  group: NavGroup
  /** Any one of these capabilities reveals the tab. */
  any?: Capability[]
  /** Shown to every signed-in person. */
  always?: boolean
  /** A last gate for things a capability alone cannot express. */
  when?: (access: Access) => boolean
  /** Not in the rail: a tab inside the page of the item with this key. */
  under?: string
  /** The item's name on its own page's tab row, when it differs from the rail. */
  tabLabel?: string
}

/** Every management surface — used where a tab opens to anyone who runs anything. */
const MANAGES: Capability[] = [
  'manage_seminars',
  'manage_certifications',
  'manage_instructors',
  'manage_internships',
  'manage_research',
  'manage_board',
  'manage_leads',
  'manage_marketing',
  'manage_curriculum',
  'manage_colleges',
  'manage_finance',
  'committee_tools',
]

const LEADERSHIP: Capability[] = ['board', 'full_admin', ...MANAGES]

export const NAV: NavItem[] = [
  { key: 'overview', label: 'Overview', group: 'home', always: true },

  /* ----------------------------------------------------------- my account --
   * A member owns this data and there is nowhere else to reach it. CCI OS gave
   * the member role only Events and Calendar, which left certification, CE and
   * the directory listing with no home. One rail item; the four are its tabs. */
  { key: 'membership', label: 'My Account', tabLabel: 'Membership', group: 'home', always: true },
  { key: 'mycert', label: 'My Certification', tabLabel: 'Certification', group: 'home', under: 'membership', always: true },
  { key: 'myce', label: 'My CE', tabLabel: 'CE', group: 'home', under: 'membership', always: true },
  {
    key: 'mylisting',
    label: 'My Listing',
    tabLabel: 'Listing',
    group: 'home',
    under: 'membership',
    always: true,
    // The directory is reserved to certified doctors at Level 1 or above.
    when: (a) => ['level_1', 'level_2'].includes(a.person?.cert_level ?? ''),
  },

  /* --------------------------------------------------------------- events -- */
  { key: 'events', label: 'Events', group: 'events', always: true },
  { key: 'calendar', label: 'Calendar', group: 'events', always: true },

  /* ----------------------------------------------------------------- work -- */
  // Tasks: anyone with a role can be assigned, so anyone with a role sees the tab.
  { key: 'tasks', label: 'Tasks', group: 'work', any: [...LEADERSHIP, 'instructor_tools'], when: (a) => a.roles.length > 0 || a.capabilities.includes('full_admin') },
  // Reports: every committee seat can read their committee's submitted reports; chairs file them.
  { key: 'reports', label: 'Reports', group: 'work', any: LEADERSHIP, when: (a) => a.committees.length > 0 || a.capabilities.includes('board') || a.capabilities.includes('full_admin') },
  { key: 'records', label: 'Records', group: 'work', any: LEADERSHIP, when: (a) => a.committees.length > 0 || a.capabilities.includes('board') || a.capabilities.includes('full_admin') },
  { key: 'stats', label: 'Stats', group: 'work', any: [...LEADERSHIP, 'instructor_tools'] },
  { key: 'email', label: 'Email', group: 'work', any: ['full_admin', 'instructor_tools', ...MANAGES] },

  /* --------------------------------------------------------------- people -- */
  {
    key: 'directory',
    label: 'Members',
    group: 'people',
    any: ['board', 'full_admin', 'manage_leads', 'manage_certifications', 'manage_instructors', 'manage_internships'],
  },
  { key: 'leads', label: 'Contacts', group: 'people', any: ['board', 'full_admin', 'manage_leads'] },
  { key: 'instructors', label: 'Instructors', group: 'people', any: ['manage_instructors', 'manage_seminars', 'board', 'full_admin'] },
  { key: 'board', label: 'Board', group: 'people', any: ['board', 'manage_board'] },
  { key: 'org', label: 'Org Chart', group: 'people', any: ['board', 'full_admin'] },

  /* ----------------------------------------------------------- committees -- */
  { key: 'certification', label: 'Certifications', group: 'committees', any: ['manage_certifications'] },
  { key: 'internships', label: 'Internships', group: 'committees', any: ['manage_internships', 'manage_certifications', 'board', 'full_admin'] },
  { key: 'research', label: 'Research', group: 'committees', any: ['manage_research', 'board', 'full_admin'] },
  { key: 'colleges', label: 'Colleges', group: 'committees', any: ['manage_colleges', 'manage_internships', 'board', 'full_admin'] },

  /* ---------------------------------------------------------------- admin -- */
  // The Executive Director's cockpit — the role, not the capability, so a Board member or administrator never sees it.
  { key: 'control', label: 'Control center', group: 'admin', any: ['full_admin'], when: (a) => a.staff_role === 'executive_director' || a.roles.some((r) => r.role_key === 'executive_director') },
  { key: 'roles', label: 'Roles & Access', group: 'admin', when: (a) => a.can_admin_roles },
  { key: 'oversight', label: 'Full CCI OS', group: 'admin', any: ['full_admin'] },
]

export const GROUP_LABEL: Record<NavGroup, string> = {
  home: 'Home',
  events: 'Events',
  work: 'Work',
  people: 'People',
  committees: 'Committees',
  admin: 'Administration',
}

export function canSee(item: NavItem, access: Access): boolean {
  // `when` is a veto: it can only ever remove a tab.
  if (item.when && !item.when(access)) return false
  if (item.always) return true
  if (item.any) return item.any.some((c) => access.capabilities.includes(c))
  // No capability list means `when` was the whole gate, and it passed.
  return Boolean(item.when)
}

/** Groups that fold shut in the rail until opened, or until you are in one. */
export const FOLDS: NavGroup[] = ['work', 'people', 'committees', 'admin']

/** Every tab this person may open, grouped, with empty groups dropped. The rail skips `under` items. */
export function navFor(access: Access): { group: NavGroup; items: NavItem[] }[] {
  const order: NavGroup[] = ['home', 'events', 'work', 'people', 'committees', 'admin']
  return order
    .map((group) => ({
      group,
      items: NAV.filter((i) => i.group === group && canSee(i, access)),
    }))
    .filter((g) => g.items.length > 0)
}

export function findNav(key: string): NavItem | undefined {
  return NAV.find((i) => i.key === key)
}

/** The rail item a tab lives under — itself, unless it is a tab on another page. */
export function railKey(key: string): string {
  return findNav(key)?.under ?? key
}
