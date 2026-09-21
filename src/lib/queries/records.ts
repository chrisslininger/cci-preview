/* ----------------------------------------------------------------------------
 * Records — the Institute's living archive, scoped by role through RLS:
 *   Financials          treasurer reports + QuickBooks PDFs   (Board, ED, Treasurer)
 *   Board meetings      agenda + minutes per meeting date    (Board, ED)
 *   Committee reports   locked reports by committee + month  (Board, ED, that committee)
 * Files live in the private `records` bucket under <folder>/<committee or period>/.
 * -------------------------------------------------------------------------- */
import { select, insert, remove, headers, SB_URL, ensureSession } from '@/lib/supabase'

export type Folder = 'financials' | 'board_meetings' | 'committee_reports'
export type Record_ = {
  id: number; folder: Folder; committee_id: number | null; report_id: number | null; event_id: number | null; meeting_date: string | null; period_ym: string | null
  kind: string; title: string; file_name: string | null; storage_path: string | null; size_bytes: number | null; notes: string | null; uploaded_by_name: string | null; created_at: string
}
export const KIND_LABEL: Record<string, string> = { agenda: 'Agenda', minutes: 'Minutes', profit_loss: 'Profit & loss', balance_sheet: 'Balance sheet', report_pdf: 'Report (PDF)', other: 'Document' }
export type Who = { name: string; id: string | null }

export async function records(): Promise<{ rows: Record_[]; error?: string }> {
  const q = await select<Record_>('records', 'select=*&order=created_at.desc&limit=2000')
  if (q.data) return { rows: q.data }
  return { rows: [], error: q.error ?? 'unknown' }
}
export async function upload(folder: Folder, sub: string, file: File, meta: { kind: string; title: string; committee_id?: number | null; report_id?: number | null; event_id?: number | null; meeting_date?: string | null; period_ym?: string | null; notes?: string | null }, who: Who): Promise<{ ok?: true; error?: string }> {
  await ensureSession()
  const safe = file.name.replace(/[^A-Za-z0-9._-]+/g, '_')
  const path = `${folder}/${sub}/${Date.now()}-${safe}`
  const up = await fetch(`${SB_URL}/storage/v1/object/records/${path}`, { method: 'POST', headers: { ...headers(), 'Content-Type': file.type || 'application/octet-stream' }, body: file })
  if (!up.ok) return { error: await up.text() }
  return insert('records', [{ folder, ...meta, file_name: file.name, storage_path: path, size_bytes: file.size, uploaded_by_id: who.id, uploaded_by_name: who.name }])
}
export async function fileUrl(path: string): Promise<string | null> {
  await ensureSession()
  const r = await fetch(`${SB_URL}/storage/v1/object/sign/records/${path}`, { method: 'POST', headers: headers(true), body: JSON.stringify({ expiresIn: 600 }) })
  if (!r.ok) return null
  const j = (await r.json()) as { signedURL?: string }
  return j.signedURL ? `${SB_URL}/storage/v1${j.signedURL}` : null
}
export async function removeRecord(r: Record_): Promise<{ ok?: true; error?: string }> {
  await ensureSession()
  if (r.storage_path) await fetch(`${SB_URL}/storage/v1/object/records`, { method: 'DELETE', headers: headers(true), body: JSON.stringify({ prefixes: [r.storage_path] }) })
  return remove('records', `id=eq.${r.id}`)
}
export const fmtSize = (n: number | null) => n == null ? '' : n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`
