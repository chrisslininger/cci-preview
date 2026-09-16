/* ----------------------------------------------------------------------------
 * Person biography dialog.
 *
 * Replaces the old global `bio(id)` / `bioClose()` pair. Now a real modal:
 * <dialog> traps focus and handles Escape natively, and every trigger is a
 * <button> rather than a div carrying a click handler.
 * -------------------------------------------------------------------------- */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { PEOPLE, HEADSHOTS } from '@/content/people'

const BioContext = createContext<(id: string) => void>(() => {})

export function useBio() {
  return useContext(BioContext)
}

const FILL: CSSProperties = { position: 'absolute', inset: 0 }

/** The circular face used in pills, the board grid and the dialog. */
export function Avatar({ id, showInitials = true }: { id: string; showInitials?: boolean }) {
  const person = PEOPLE[id]
  if (!person) return null
  return (
    <span className="avx">
      {HEADSHOTS.has(id) ? (
        <img
          src={`/images/${id}.webp`}
          alt={person.name}
          width={400}
          height={400}
          loading="lazy"
          decoding="async"
          style={{ ...FILL, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <>
          <span className={person.img} style={FILL} />
          <span className="duo" style={FILL} />
          {showInitials && <span className="ini">{person.ini}</span>}
        </>
      )}
    </span>
  )
}

export function SpeakerPill({ id }: { id: string }) {
  const openBio = useBio()
  const person = PEOPLE[id]
  if (!person) return null
  return (
    <button
      type="button"
      className="spk-pill"
      onClick={(event) => {
        event.stopPropagation()
        openBio(id)
      }}
    >
      <Avatar id={id} />
      <span className="nm">{person.name}</span>
      <span className="plus">BIO +</span>
    </button>
  )
}

export function BioProvider({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const ref = useRef<HTMLDialogElement>(null)

  const open = useCallback((id: string) => setOpenId(id), [])
  const value = useMemo(() => open, [open])

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (openId && !dialog.open) dialog.showModal()
    if (!openId && dialog.open) dialog.close()
  }, [openId])

  const person = openId ? PEOPLE[openId] : null

  return (
    <BioContext.Provider value={value}>
      {children}
      <dialog
        className="bio-bg"
        ref={ref}
        onClose={() => setOpenId(null)}
        onClick={(event) => {
          if (event.target === ref.current) setOpenId(null)
        }}
        aria-labelledby="bio-name"
      >
        {person && openId && (
          <div className="bio-m">
            <button type="button" className="x" onClick={() => setOpenId(null)} aria-label="Close">
              ✕
            </button>
            <div className="top">
              <Avatar id={openId} />
              <div>
                <h3 id="bio-name">{person.name}</h3>
                <div className="cred">{person.cred}</div>
                <span className="rl">{person.role}</span>
              </div>
            </div>
            <div className="body">
              <p>{person.bio}</p>
            </div>
          </div>
        )}
      </dialog>
    </BioContext.Provider>
  )
}
