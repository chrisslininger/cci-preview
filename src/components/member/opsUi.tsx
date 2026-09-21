/* Small shared pieces for the operations tabs (Tasks, Reports, Calendar, Stats, Records). */
import { useEffect } from 'react'

export function Pill({ kind = '', children }: { kind?: string; children: React.ReactNode }) { return <span className={`cpill ${kind}`}>{children}</span> }
export function F({ l, children, full = false, hint }: { l: string; children: React.ReactNode; full?: boolean; hint?: string }) { return <div className={full ? 'full' : ''}><label className="flabel">{l}</label>{children}{hint && <div className="evt-hint">{hint}</div>}</div> }
export function useEsc(onClose: () => void) { useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k) }, [onClose]) }
export function friendly(err: string, who = 'the Executive Director or the Board'): string {
  if (/locked/.test(err)) return 'This report is locked — the Board meeting it was filed for has passed. The Executive Director can unlock it.'
  if (/row-level security|42501|not authorized/.test(err)) return `The database did not allow that — only ${who} can make this change.`
  return 'The database refused the change: ' + err.slice(0, 160)
}
export function Modal({ children, wide = false, onClose, cls = '' }: { children: React.ReactNode; wide?: boolean; onClose: () => void; cls?: string }) {
  useEsc(onClose)
  return <div className="cert-veil" onClick={(e) => e.target === e.currentTarget && onClose()}><div className={`cert-modal ${wide ? 'wide' : ''} ${cls}`} role="dialog" aria-modal="true">{children}</div></div>
}
export function Head({ title, lede, right }: { title: string; lede: React.ReactNode; right?: React.ReactNode }) {
  return <div className="cert-head"><div><h1>{title}</h1><div className="ma-sub" style={{ marginBottom: 0, maxWidth: '80ch' }}>{lede}</div></div>{right && <div className="cert-actions">{right}</div>}</div>
}
export function Sec({ children, r }: { children: React.ReactNode; r?: React.ReactNode }) { return <div className="ogrp">{children}{r && <span className="r">{r}</span>}</div> }
export const todayLocal = () => new Date().toISOString().slice(0, 10)
