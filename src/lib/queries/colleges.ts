/* ----------------------------------------------------------------------------
 * Colleges — the 51 chiropractic colleges and everything that hangs off a
 * school: our liaisons and the school's own contacts (college_contacts),
 * students and leads linked to it (people.school_id / people.school), and
 * the school approvals our preceptors hold with it (preceptor_colleges —
 * written on the Internships tab, read here).
 * -------------------------------------------------------------------------- */
import { select, patch, insert, remove, headers, SB_URL, ensureSession } from '@/lib/supabase'
import type { PersonLite, Approval } from './internships'

export type College = {
  id: number; name: string; short_name: string | null; city: string | null; state: string | null; country: string | null
  address: string | null; phone: string | null; website: string | null; accreditation: string | null; notes: string | null
  active: boolean | null; active_partnership: boolean | null; partnership_type: 'teaching' | 'visiting' | null; sort: number | null
}
export type CollegeContact = {
  id: number; college_id: number; person_id: string | null; name: string | null; role: string | null; email: string | null; phone: string | null
  is_instructor: boolean | null; is_keystone: boolean | null; is_our_contact: boolean | null; notes: string | null
  people: PersonLite | null
}
export type CollegeApproval = Approval & {
  id: number; preceptor_id: number
  preceptors: { id: number; person_id: string | null; person_name: string | null; status: string; certified_date: string | null } | null
  locations: { id: number; name: string; city: string | null; state: string | null } | null
}

const PERSON = 'id,first_name,last_name,credentials,contact_type,school,school_id,grad_year,email,practice_name,practice_city,practice_state,cert_level,target_cert_level,membership_status,person_certifications(technique,level)'

export async function colleges(): Promise<{ rows: College[]; error?: string }> {
  const q = await select<College>('colleges', 'select=*&order=sort,name&limit=500')
  return q.data ? { rows: q.data } : { rows: [], error: q.error ?? 'unknown' }
}
export async function contactsFor(collegeId: number): Promise<CollegeContact[]> {
  const q = await select<CollegeContact>('college_contacts', `select=*,people!college_contacts_person_id_fkey(${PERSON})&college_id=eq.${collegeId}&order=is_our_contact.desc,name`)
  if (q.data) return q.data
  // the embed name differs if the FK was created under another name — fall back to the plain columns
  const q2 = await select<CollegeContact>('college_contacts', `select=*&college_id=eq.${collegeId}&order=is_our_contact.desc,name`)
  return (q2.data ?? []).map((c) => ({ ...c, people: null }))
}
export async function peopleAt(c: College): Promise<PersonLite[]> {
  const nm = encodeURIComponent(c.name.replace(/,/g, ' '))
  const q = await select<PersonLite>('people', `select=${PERSON}&or=(school_id.eq.${c.id},school.eq.${nm})&order=last_name&limit=500`)
  return q.data ?? []
}
export async function approvalsFor(collegeId: number): Promise<CollegeApproval[]> {
  const q = await select<CollegeApproval>('preceptor_colleges', `select=id,preceptor_id,college_id,location_id,approved_on,expires_on,document_path,document_name,notes,preceptors(id,person_id,person_name,status,certified_date),locations(id,name,city,state)&college_id=eq.${collegeId}&order=approved_on.desc.nullslast`)
  return q.data ?? []
}
/** Counts for the list rows: approvals and linked people per college, in two requests. */
export async function collegeCounts(): Promise<{ approvals: Map<number, { active: number; other: number }>; people: Map<number, { students: number; leads: number }> }> {
  const a = await select<{ college_id: number; approved_on: string | null; expires_on: string | null }>('preceptor_colleges', 'select=college_id,approved_on,expires_on&limit=5000')
  const p = await select<{ school_id: number | null; contact_type: string | null; grad_year: number | null }>('people', 'select=school_id,contact_type,grad_year&school_id=not.is.null&limit=5000')
  const today = new Date().toISOString().slice(0, 10); const year = new Date().getFullYear()
  const approvals = new Map<number, { active: number; other: number }>()
  for (const r of a.data ?? []) { const c = approvals.get(r.college_id) ?? { active: 0, other: 0 }; const live = !!r.approved_on && r.approved_on <= today && (!r.expires_on || r.expires_on >= today); if (live) c.active++; else c.other++; approvals.set(r.college_id, c) }
  const people = new Map<number, { students: number; leads: number }>()
  for (const r of p.data ?? []) { if (!r.school_id) continue; const c = people.get(r.school_id) ?? { students: 0, leads: 0 }; if (r.contact_type === 'student' && (!r.grad_year || r.grad_year >= year)) c.students++; else c.leads++; people.set(r.school_id, c) }
  return { approvals, people }
}

export const inTraining = (p: PersonLite) => p.contact_type === 'student' && (!p.grad_year || p.grad_year >= new Date().getFullYear())
export const partnerText = (c: College) => c.active_partnership ? (c.partnership_type === 'teaching' ? 'Active — we teach here (official)' : 'Active — relationship / we visit') : 'None'
export const webHost = (u: string | null | undefined) => u ? u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') : ''
export const fullName = (p: PersonLite | null | undefined, fallback?: string | null) => p ? `${p.first_name} ${p.last_name}${p.credentials ? ', ' + p.credentials : ''}` : (fallback ?? '—')

/* ---- writes ------------------------------------------------------------------ */
export type CollegeInput = { name: string; short_name: string; city: string; state: string; country: string; address: string; phone: string; website: string; accreditation: string; active_partnership: boolean; partnership_type: 'teaching' | 'visiting'; notes: string }
export async function saveCollege(id: number | null, v: CollegeInput): Promise<{ ok?: true; id?: number; error?: string }> {
  await ensureSession()
  const row = { name: v.name, short_name: v.short_name || v.name, city: v.city || null, state: v.state || null, country: v.country || 'USA', address: v.address || null, phone: v.phone || null, website: v.website || null, accreditation: v.accreditation || null, active_partnership: v.active_partnership, partnership_type: v.active_partnership ? v.partnership_type : null, notes: v.notes || null }
  if (id) { const r = await patch('colleges', `id=eq.${id}`, row); return r.error ? r : { ok: true, id } }
  const res = await fetch(`${SB_URL}/rest/v1/colleges`, { method: 'POST', headers: { ...headers(true), Prefer: 'return=representation' }, body: JSON.stringify([{ ...row, active: true }]) })
  if (!res.ok) return { error: await res.text() }
  return { ok: true, id: (((await res.json()) as { id: number }[])[0]?.id ?? 0) }
}
export const addOurContact = (collegeId: number, p: PersonLite, role: string) =>
  insert('college_contacts', [{ college_id: collegeId, person_id: p.id, name: fullName(p), role: role || null, is_our_contact: true, is_instructor: false, is_keystone: false }])
export const addSchoolContact = (collegeId: number, v: { name: string; role: string; email: string; phone: string; is_instructor: boolean; is_keystone: boolean; notes: string }) =>
  insert('college_contacts', [{ college_id: collegeId, person_id: null, name: v.name, role: v.role || null, email: v.email || null, phone: v.phone || null, is_instructor: v.is_instructor, is_keystone: v.is_keystone, is_our_contact: false, notes: v.notes || null }])
export const removeContact = (id: number) => remove('college_contacts', `id=eq.${id}`)
export const setPartnership = (id: number, on: boolean, type: 'teaching' | 'visiting') => patch('colleges', `id=eq.${id}`, { active_partnership: on, partnership_type: on ? type : null })
