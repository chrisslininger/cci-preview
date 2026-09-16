/* ----------------------------------------------------------------------------
 * Event registration dialog.
 *
 * Ported from `regOpen` / `regSubmit` in the v4.8 build. The request body sent
 * to the `create-checkout` Edge Function is unchanged — same fields, same
 * reg_type, same headers — because that path has already taken and refunded
 * real money and must keep behaving identically.
 *
 * The one change is the return URL: success now lands on the real
 * /registration-confirmed route. The function allowlists by ORIGIN, not path,
 * so this needs no server change.
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
import type { ReactNode } from 'react'
import { useNavigate } from '@/lib/router'
import { SEMINARS } from '@/content/seminars'
import { session, select, invoke } from '@/lib/supabase'
import { useCatalog } from '@/lib/queries/CatalogProvider'
import { formatPrice } from '@/lib/queries/events'

const RegistrationContext = createContext<(key: string) => void>(() => {})

export function useRegistration() {
  return useContext(RegistrationContext)
}

type Person = {
  first_name?: string
  last_name?: string
  email?: string
  mobile_phone?: string
  office_phone?: string
  credentials?: string
}

type CheckoutResponse = {
  url?: string
  free?: boolean
  event_title?: string
  reg_type?: string
  needs_verification?: boolean
  requires_login_for_discount?: boolean
  free_with_membership?: boolean
  error?: string
  detail?: string
}

type Tier = { v: string; k: string; p: string; n: string }

const ERRORS: Record<string, { message: string; fields: string[] }> = {
  payments_not_configured: {
    message: 'Payments are almost ready — Stripe is being connected. Please try again soon.',
    fields: [],
  },
  already_registered: {
    message:
      'That email is already registered for this event. Check your inbox for the confirmation, or contact the Institute.',
    fields: ['email'],
  },
  event_full: {
    message: 'This event has reached capacity. Contact the Institute to be added to the waiting list.',
    fields: [],
  },
  registration_closed: {
    message: 'Registration for this event has closed. Contact the Institute to ask about late enrollment.',
    fields: [],
  },
  registration_not_open: {
    message:
      'Registration for this event has not opened yet. Contact the Institute and we will let you know when it does.',
    fields: [],
  },
  event_not_open: {
    message: 'This event is not open for registration yet. Contact the Institute for the next available date.',
    fields: [],
  },
  event_pricing_not_set: {
    message: 'Pricing for this event is still being finalized — please contact the Institute.',
    fields: [],
  },
  event_not_found: {
    message: 'We could not find that event. Please refresh the page and try again.',
    fields: [],
  },
  event_over: {
    message: 'This session has already taken place. Contact the Institute for the next available date.',
    fields: [],
  },
  bad_return_url: {
    message: 'This copy of the site is not authorized for checkout. Please register from advancedorthogonal.com.',
    fields: [],
  },
  invalid_email: { message: 'Please enter a valid email address.', fields: ['email'] },
  invalid_reg_type: { message: 'Please choose how you are registering.', fields: [] },
}

export function RegistrationProvider({ children }: { children: ReactNode }) {
  const [key, setKey] = useState<string | null>(null)
  const [tier, setTier] = useState('doctor')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<{ message: string; fields: string[] } | null>(null)
  const [busy, setBusy] = useState(false)
  const [interstitial, setInterstitial] = useState<string | null>(null)
  const [signedInName, setSignedInName] = useState('')
  const ref = useRef<HTMLDialogElement>(null)
  const navigate = useNavigate()
  const catalog = useCatalog()

  const open = useCallback(
    (eventKey: string) => {
      setKey(eventKey)
      setTier('doctor')
      setError(null)
      setInterstitial(null)
      setBusy(false)
    },
    [],
  )
  const value = useMemo(() => open, [open])

  const close = useCallback(() => setKey(null), [])

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (key && !dialog.open) dialog.showModal()
    if (!key && dialog.open) dialog.close()
  }, [key])

  // Prefill from the signed-in member's record, as the old dialog did.
  useEffect(() => {
    if (!key || !session.token) {
      setSignedInName('')
      return
    }
    let cancelled = false
    void (async () => {
      const userId = session.user?.id ?? ''
      const query = await select<Person>(
        'people',
        `select=first_name,last_name,email,mobile_phone,office_phone,credentials&auth_user_id=eq.${userId}&limit=1`,
      )
      if (cancelled) return
      const me = query.data?.[0]
      let display = ''
      if (me) {
        display = `${me.first_name ?? ''} ${me.last_name ?? ''}`.trim()
        if (me.credentials) display += `, ${me.credentials}`
        if (display) setName(display)
        if (me.email) setEmail(me.email)
        const p = me.mobile_phone || me.office_phone
        if (p) setPhone(p)
      }
      setSignedInName(display || session.user?.email || '')
    })()
    return () => {
      cancelled = true
    }
  }, [key])

  const seminar = key ? SEMINARS[key] : undefined
  const overlay = key ? catalog.byKey[key] : undefined

  /** Tiers offered for this event, preferring live database configuration. */
  const tiers: Tier[] = useMemo(() => {
    if (!seminar) return []
    const ev = overlay?.event
    const full = ev?.price ?? seminar.fullPrice
    const out: Tier[] = [
      {
        v: 'doctor',
        k: 'Doctor',
        p: formatPrice(full) ?? '',
        n: 'Practicing chiropractors and general registration.',
      },
    ]
    const studentPrice =
      ev?.student_price !== undefined && ev?.student_price !== null && ev?.student_price !== ''
        ? ev.student_price
        : catalog.synced
          ? null
          : seminar.studentPrice
    if (studentPrice !== undefined && studentPrice !== null) {
      out.push({
        v: 'student',
        k: 'Student',
        p: formatPrice(studentPrice) ?? '',
        n: 'Currently enrolled chiropractic students.',
      })
    }
    const facultyFree = catalog.synced
      ? ev?.faculty_free === true
      : ev?.faculty_free === true || seminar.facultyFree === true
    if (facultyFree) {
      out.push({ v: 'faculty', k: 'College Faculty', p: 'FREE', n: 'Faculty of a chiropractic college.' })
    }
    return out
  }, [seminar, overlay, catalog.synced])

  async function submit(forceGuest: boolean) {
    if (!key || !seminar) return
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    const bad: string[] = []
    if (!trimmedName) bad.push('name')
    if (!trimmedEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmedEmail)) bad.push('email')
    if (bad.length) {
      setInterstitial(null)
      setError({
        message:
          bad.length === 2
            ? 'Please enter your name and a valid email address.'
            : bad[0] === 'name'
              ? 'Please enter your full name.'
              : 'Please enter a valid email address.',
        fields: bad,
      })
      return
    }

    const eventId = overlay?.id ?? null
    if (!eventId || overlay?.open === false) {
      setError({
        message: seminar.cat === 'internship'
          ? 'This program is by application — please use the contact form and we will be in touch.'
          : 'Registration for this event is not open yet. Contact the Institute and we will let you know the moment it is.',
        fields: [],
      })
      return
    }

    setBusy(true)
    setError(null)
    try {
      const origin = window.location.origin
      const data = await invoke<CheckoutResponse>('create-checkout', {
        event_id: eventId,
        full_name: trimmedName,
        email: trimmedEmail,
        phone: phone.trim() || null,
        force_guest: forceGuest,
        reg_type: tier,
        success_url: `${origin}/registration-confirmed?registered=1${tier !== 'doctor' ? `&verify=${tier}` : ''}`,
        cancel_url: `${origin}/seminars`,
      })

      if (data.requires_login_for_discount) {
        setInterstitial(
          data.free_with_membership
            ? 'This event is FREE with your membership. Sign in to claim it — or continue as a guest at full price.'
            : 'Sign in to apply your $200 member discount — or continue as a guest at full price.',
        )
      } else if (data.free) {
        close()
        const detail = data.needs_verification
          ? ` — we will confirm your ${data.reg_type === 'student' ? 'student' : 'college faculty'} status by email before the event.`
          : ' — see you there!'
        navigate('/registration-confirmed', {
          state: { message: `Your free registration for ${data.event_title ?? 'this event'} is confirmed${detail}` },
        })
      } else if (data.url) {
        window.location.href = data.url
      } else if (data.error && ERRORS[data.error]) {
        setError(ERRORS[data.error]!)
      } else if (data.error === 'tier_not_available') {
        setError({
          message: data.detail ?? 'That registration type is not offered for this event — please choose another.',
          fields: [],
        })
      } else {
        setError({ message: data.detail ?? data.error ?? 'Something went wrong — please try again.', fields: [] })
      }
    } catch {
      setError({ message: 'Connection problem — please check your internet and try again.', fields: [] })
    }
    setBusy(false)
  }

  const signedIn = Boolean(session.token)
  const badField = (f: string) => (error?.fields.includes(f) ? ' err' : '')

  return (
    <RegistrationContext.Provider value={value}>
      {children}
      <dialog
        className="bio-bg"
        ref={ref}
        onClose={close}
        onClick={(e) => {
          if (e.target === ref.current) close()
        }}
        aria-labelledby="reg-title"
      >
        {seminar && key && (
          <div className="bio-m">
            <button type="button" className="x" onClick={close} aria-label="Close">
              ✕
            </button>
            <div className="top" style={{ display: 'block' }}>
              <div className="kick" style={{ marginBottom: '4px' }}>
                Register
              </div>
              <h3 id="reg-title">{seminar.title}</h3>
              <div className="cred">
                {`${overlay?.dates ?? seminar.dates} · ${overlay?.loc ?? seminar.loc}`.toUpperCase()}
              </div>
            </div>
            <div className="body">
              {interstitial ? (
                <div className="reg-int">
                  <div className="reg-int-ic">
                    <svg
                      width="26"
                      height="26"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--color-brand-accent-strong)"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
                    </svg>
                  </div>
                  <h3>This email belongs to an AOI member</h3>
                  <p>{interstitial}</p>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <button
                      type="button"
                      className="b p-btn"
                      style={{ justifyContent: 'center' }}
                      onClick={() => {
                        close()
                        navigate('/account')
                      }}
                    >
                      Sign In &amp; Save
                    </button>
                    <button
                      type="button"
                      className="b s-btn on-light"
                      style={{ justifyContent: 'center' }}
                      onClick={() => void submit(true)}
                    >
                      Continue as Guest — Full Price
                    </button>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    void submit(false)
                  }}
                >
                  {signedIn ? (
                    <div className="reg-auth">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      <span>
                        Signed in as <b>{signedInName}</b> — member pricing applies automatically.
                      </span>
                    </div>
                  ) : (
                    <div className="reg-strip">
                      <span>Members save $200 on seminars</span>
                      <button
                        type="button"
                        className="b sm s-btn on-light"
                        style={{ padding: '8px 14px', fontSize: '10.5px' }}
                        onClick={() => {
                          close()
                          navigate('/account')
                        }}
                      >
                        Sign In
                      </button>
                    </div>
                  )}

                  {tiers.length > 1 && (
                    <fieldset className="reg-fieldset">
                      <legend className="flabel">I AM REGISTERING AS</legend>
                      <div className="rtiers">
                        {tiers.map((option) => (
                          <label
                            className={`rt-opt${tier === option.v ? ' on' : ''}`}
                            key={option.v}
                          >
                            <input
                              type="radio"
                              name="reg-tier"
                              value={option.v}
                              checked={tier === option.v}
                              onChange={() => {
                                setTier(option.v)
                                setError(null)
                              }}
                            />
                            <span className="rt-dot" />
                            <span className="rt-l">
                              <b>{option.k}</b>
                              <i>{option.n}</i>
                            </span>
                            <span className="rt-pr">{option.p}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  )}

                  <label className={`flabel${badField('name')}`} htmlFor="reg-name">
                    FULL NAME
                  </label>
                  <input
                    className={`fi${badField('name')}`}
                    id="reg-name"
                    name="name"
                    autoComplete="name"
                    placeholder="Dr. Jane Smith, D.C."
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      setError(null)
                    }}
                  />

                  <label className={`flabel${badField('email')}`} htmlFor="reg-email">
                    EMAIL
                  </label>
                  <input
                    className={`fi${badField('email')}`}
                    id="reg-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@practice.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setError(null)
                    }}
                  />

                  <label className="flabel" htmlFor="reg-phone">
                    PHONE (OPTIONAL)
                  </label>
                  <input
                    className="fi"
                    id="reg-phone"
                    name="phone"
                    autoComplete="tel"
                    placeholder="(555) 555-5555"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />

                  {error && (
                    <div id="reg-err" role="alert" style={{ display: 'block' }}>
                      {error.message}
                    </div>
                  )}

                  <div className="reg-summary">
                    Pricing is confirmed securely at checkout — <b>members are automatically
                    discounted</b> when signed in.
                  </div>
                  <div style={{ marginTop: '20px', display: 'grid', gap: '10px' }}>
                    <button
                      type="submit"
                      className="b p-btn"
                      style={{ justifyContent: 'center' }}
                      disabled={busy}
                    >
                      {busy ? 'One moment…' : 'Continue to Secure Checkout'}
                    </button>
                  </div>
                  <p className="reg-fineprint">
                    Payments are processed by Stripe. Card details never touch this site.
                  </p>
                </form>
              )}
            </div>
          </div>
        )}
      </dialog>
    </RegistrationContext.Provider>
  )
}
