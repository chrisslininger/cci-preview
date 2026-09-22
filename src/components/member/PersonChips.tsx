/** The chips on a person: highest certification in gold, other certifications in blue, roles neutral. Shared by Contacts, Members and Board so the three can never disagree. */
import { certChips, roleChips, type Chip } from '@/lib/chips'

type CertLike = { id?: number; technique: string | null; level: string | null }
type RoleLike = { id?: number; role_key: string; instructor_level?: string | null; committees?: { name: string } | null }
type PersonLike = {
  person_roles?: RoleLike[] | null
  person_certifications?: CertLike[] | null
  board_service?: { status: string | null }[] | null
  instructor_records?: { level: string | null; status: string | null }[] | null
}

export function chipsFor(p: PersonLike, advo: string, others: CertLike[]): Chip[] {
  const roles = p.person_roles ?? []
  const svc = p.board_service ?? []
  const instr = (p.instructor_records ?? []).find((i) => i.status === 'current')
  return [
    ...certChips(advo, others),
    ...roleChips(roles, {
      director: svc.some((b) => b.status === 'active'),
      nominee: svc.some((b) => b.status === 'nominee'),
      pastDirector: svc.some((b) => b.status === 'past') && !svc.some((b) => b.status === 'active'),
      instructorLevel: instr?.level ?? null,
    }),
  ]
}

export function Chips({ list, className = 'cpill' }: { list: Chip[]; className?: string }) {
  return <>{list.map((c) => <span key={c.key} className={`${className} ${c.kind}`} title={c.title}>{c.label}</span>)}</>
}
