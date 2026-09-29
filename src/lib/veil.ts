/* ----------------------------------------------------------------------------
 * Pop-ups close only on a real click on the dimmed background.
 *
 * Every members-area pop-up closes when its veil is clicked
 * (`e.target === e.currentTarget`). But a drag that starts inside the pop-up —
 * selecting text in a field — and ends on the veil is reported by the browser
 * as a click on the veil, so the form closed and unsaved edits were lost.
 *
 * One listener here, rather than an edit in every panel: a click on a veil
 * counts only if the press also began on that veil. Capture-phase listeners on
 * window run before React's own, so stopping the stray click keeps it from
 * ever reaching the veil's onClick.
 * -------------------------------------------------------------------------- */

const VEILS = ['cert-veil', 'cr-veil']

const isVeil = (t: EventTarget | null): boolean =>
  t instanceof Element && VEILS.some((c) => t.classList.contains(c))

let pressedOn: EventTarget | null = null

export function guardVeils(): void {
  if (typeof window === 'undefined') return
  window.addEventListener('pointerdown', (e) => { pressedOn = e.target }, true)
  window.addEventListener('click', (e) => {
    if (isVeil(e.target) && pressedOn !== e.target) e.stopPropagation()
  }, true)
}
