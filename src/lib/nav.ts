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
 * `group` is what the rail prints as a section heading.
 * -------------------------------------------------------------------------- */
import type { Access, Capability } from './access'

export type NavGroup = 'home' | 'mine' | 'institute' | 'admin'

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
  'committee_tools',
]

const LEADERSHIP: Capability[] = ['board', 'full_admin', ...MANAGES]

export const NAV: NavItem[] = [
  { key: 'overview', label: 'Overview', group: 'home', always: true },

  /* ----------------------------------------------------------------- mine --
   * A member owns this data and there is nowhere else to reach it. CCI OS gave
   * the member role only Events and Calendar, which left certification, CE and
   * the directory listing with no home. */
  { key: 'membership', label: 'Membership', group: 'mine', always: true },
  { key: 'mycert', label: 'My Certification', group: 'mine', always: true },
  { key: 'myce', label: 'My CE', group: 'mine', always: true },
  {
    key: 'mylisting',
    label: 'My Listing',
    group: 'mine',
    always: true,
    // The directory is reserved to certified doctors at Level 1 or above.
    when: (a) => ['level_1', 'level_2'].includes(a.person?.cert_level ?? ''),
  },

  /* ------------------------------------------------------------ institute -- */
  { key: 'events', label: 'Events', group: 'institute', always: true },
  { key: 'calendar', label: 'Calendar', group: 'institute', always: true },
  { key: 'reports', label: 'Reports', group: 'institute', any: LEADERSHIP },
  { key: 'tasks', label: 'Tasks', group: 'institute', any: LEADERSHIP },
  { key: 'stats', label: 'Stats', group: 'institute', any: [...LEADERSHIP, 'instructor_tools'] },
  {
    key: 'directory',
    label: 'Members',
    group: 'institute',
    any: ['board', 'full_admin', 'manage_leads', 'manage_certifications', 'manage_instructors', 'manage_internships'],
  },
  { key: 'leads', label: 'Contacts', group: 'institute', any: ['board', 'full_admin', 'manage_leads'] },
  { key: 'certification', label: 'Certifications', group: 'institute', any: ['manage_certifications'] },
  { key: 'instructors', label: 'Instructors', group: 'institute', any: ['manage_instructors'] },
  { key: 'internships', label: 'Internships', group: 'institute', any: ['manage_internships', 'manage_certifications', 'board', 'full_admin'] },
  { key: 'research', label: 'Research', group: 'institute', any: ['manage_research'] },
  { key: 'colleges', label: 'Colleges', group: 'institute', any: ['manage_colleges', 'manage_internships', 'board', 'full_admin'] },
  { key: 'board', label: 'Board', group: 'institute', any: ['board', 'manage_board'] },
  { key: 'org', label: 'Org Chart', group: 'institute', any: ['board', 'full_admin'] },
  { key: 'email', label: 'Email', group: 'institute', any: ['full_admin', 'instructor_tools', ...MANAGES] },

  /* ---------------------------------------------------------------- admin -- */
  { key: 'roles', label: 'Roles & Access', group: 'admin', when: (a) => a.can_admin_roles },
  { key: 'oversight', label: 'Full CCI OS', group: 'admin', any: ['full_admin'] },
]

export const GROUP_LABEL: Record<NavGroup, string> = {
  home: 'Home',
  mine: 'Mine',
  institute: 'Institute',
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

/** The rail, grouped, with empty groups dropped. */
export function navFor(access: Access): { group: NavGroup; items: NavItem[] }[] {
  const order: NavGroup[] = ['home', 'mine', 'institute', 'admin']
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
