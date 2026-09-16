import { useState } from 'react'
import { Link, useParams } from '@/lib/router'
import { SEMINARS, SLUG_TO_SEMINAR } from '@/content/seminars'
import type { Seminar } from '@/content/seminars'
import { PEOPLE, HEADSHOTS } from '@/content/people'
import { Avatar, SpeakerPill, useBio } from '@/components/blocks/BioDialog'
import SeminarCard from '@/components/blocks/SeminarCard'
import { useRegistration } from '@/components/blocks/RegistrationDialog'
import { useToast } from '@/components/ui/Toast'
import NotFoundPage from './NotFoundPage'

type Session = {
  mo: string
  dy: string
  yr?: string
  city: string
  venue: string
  seats: string
  flag?: string
  soon?: boolean
  free?: boolean
  apply?: boolean
}
type AgendaItem = { t: string; ap: string; title: string; desc: string; who?: string[] }
type AgendaDay = { day: string; date?: string; items: AgendaItem[] }
type NoSess = {
  kick?: string
  h2?: string
  title?: string
  msg?: string
  btn?: string
  primary?: boolean
}

const money = (n: number) => n.toLocaleString()

function Face({ id }: { id: string }) {
  const person = PEOPLE[id]
  if (!person) return null
  const fill = { position: 'absolute', inset: 0 } as const
  return HEADSHOTS.has(id) ? (
    <img
      src={`/images/${id}.webp`}
      alt={person.name}
      width={400}
      height={400}
      loading="lazy"
      decoding="async"
      style={{ ...fill, width: '100%', height: '100%', objectFit: 'cover' }}
    />
  ) : (
    <>
      <span className={person.img} style={fill} />
      <span className="duo" style={fill} />
      <span className="ini">{person.ini}</span>
    </>
  )
}

export default function SeminarPage({ param }: { param?: string }) {
  const { slug } = useParams()
  const key = param ?? (slug ? SLUG_TO_SEMINAR[slug] : undefined)
  const seminar = key ? SEMINARS[key] : undefined

  const openBio = useBio()
  const register = useRegistration()
  const toast = useToast()
  const [agendaDay, setAgendaDay] = useState(0)

  if (!seminar || !key) return <NotFoundPage />

  const s = seminar as Seminar & {
    noSess?: NoSess
    keynote?: string
    keynoteBlurb?: string
    muxName?: string
    ctaP?: string
    ctaBtn?: string
  }

  const save =
    Number.isFinite(s.fullPrice) && Number.isFinite(s.memPrice) && s.fullPrice > 0
      ? s.fullPrice - (s.memPrice ?? 0)
      : 0

  const priceNote =
    s.cat === 'free'
      ? 'NO COST'
      : s.cat === 'internship'
        ? 'MEMBER PRIORITY'
        : s.memPrice === 0 && s.fullPrice > 0
          ? 'FREE FOR MEMBERS'
          : save > 0
            ? `MEMBERS: $${money(s.memPrice ?? 0)}`
            : ''

  const memberBanner =
    s.mbText ??
    (s.memPrice === 0 && s.fullPrice > 0
      ? `This program is included with AOI membership — a $${money(s.fullPrice)} value.`
      : save > 0
        ? `AOI Members save $${money(save)} on this seminar — $${money(s.memPrice ?? 0)} instead of $${money(s.fullPrice)}.`
        : 'AOI membership connects you with the full Institute community.')

  const sessions = (s.sessions ?? []) as unknown as Session[]
  const agenda = (s.agenda ?? []) as unknown as AgendaDay[]
  const speakers = s.spk ?? []
  const keynote = s.keynote
  const rest = speakers.filter((id) => id !== keynote)

  const scrollToRegistration = () => {
    const target =
      document.getElementById('sd-reg-sec') ?? document.getElementById('sd-sessions-sec')
    if (target) target.scrollIntoView({ behavior: 'smooth' })
  }

  const related = Object.keys(SEMINARS)
    .filter((k) => k !== key)
    .slice(0, 3)

  return (
    <>
      <div className="hero-img short">
        <div
          className={`bg ${s.img ?? ''}`}
          id="sd-img"
          style={
            s.photo
              ? {
                  backgroundImage: `url(/images/${s.photo}.webp)`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : undefined
          }
        />
        <div className="duo" />
        <div className="duo2" />
        <div className="scrim" />
        <div className="wrap inner">
          <div className="crumbs">
            <Link to="/">HOME</Link> <b>/</b> <Link to="/seminars">SEMINARS</Link> <b>/</b>{' '}
            <span>{s.title.toUpperCase()}</span>
          </div>
          <div className="kick">{s.kicker}</div>
          <h1>{s.title}</h1>
          <p className="sub">{s.sub}</p>
        </div>
      </div>

      <div className="wrap">
        <div className="facts">
          <div className="fact">
            <span>DATES</span>
            <b>{s.dates}</b>
          </div>
          <div className="fact">
            <span>LOCATION</span>
            <b>{s.loc}</b>
          </div>
          <div className="fact">
            <span>LEVEL</span>
            <b>{s.level}</b>
          </div>
          <div className="fact">
            <span>FORMAT</span>
            <b>{s.format}</b>
          </div>
          <div className="fact">
            <span>TUITION</span>
            <b>
              {s.price}
              {priceNote && <em>{priceNote}</em>}
            </b>
          </div>
        </div>

        <div className="memberbar">
          <div>
            <div className="mb-t">{memberBanner}</div>
            <div className="mb-s">
              Every seminar, every time — conference registration alone covers most of a year of
              membership.
            </div>
          </div>
          <Link className="b sm" to="/membership">
            Become a Member &amp; Save
          </Link>
        </div>
      </div>

      {!s.hideSess && (
        <section className="tight" id="sd-sessions-sec">
          <div className="wrap">
            <div className="kick">{sessions.length ? 'Dates & Locations' : (s.noSess?.kick ?? 'Dates & Locations')}</div>
            <h2 className="t" style={{ fontSize: '26px' }}>
              {sessions.length
                ? 'Choose your session'
                : (s.noSess?.h2 ?? 'No sessions currently scheduled')}
            </h2>
            <div className="goldrule" />
            <div className="sessions">
              {sessions.length === 0 ? (
                <div className="nosess">
                  <div className="ns-ic">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--color-brand-primary)"
                      strokeWidth="1.9"
                    >
                      <rect x="3" y="4.5" width="18" height="16" rx="2" />
                      <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
                    </svg>
                  </div>
                  <div className="ns-bd">
                    <h4>{s.noSess?.title ?? 'Dates for the next offering are being finalized.'}</h4>
                    <p>
                      {s.noSess?.msg ??
                        'There are no sessions on the calendar for this seminar right now. New dates are posted here as soon as they are confirmed — tell us you are interested and we will let you know first.'}
                    </p>
                  </div>
                  <div className="ns-cta">
                    <Link
                      className={`b sm ${s.noSess?.primary ? 'p-btn' : 's-btn on-light'}`}
                      to="/contact"
                    >
                      {s.noSess?.btn ?? 'Notify Me When Dates Are Set'}
                    </Link>
                  </div>
                </div>
              ) : (
                sessions.map((x, i) => (
                  <div className={`sess${x.soon ? ' soon' : ''}`} key={`${x.city}-${i}`}>
                    {x.flag && <span className="flag">{x.flag}</span>}
                    <div className="top">
                      <div className="cal">
                        <div className="mo">{x.mo}</div>
                        <div className="dy">{x.dy}</div>
                        {x.yr && (
                          <div className="mo" style={{ color: 'var(--color-content-on-inverse-muted)' }}>
                            {x.yr}
                          </div>
                        )}
                      </div>
                      <div className="where">
                        <h4>{x.city}</h4>
                        <span>{x.venue.toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="mid">
                      <div className="prices">
                        {x.free ? (
                          <>
                            <span className="mem">FREE</span>
                            <span className="lbl">FOR EVERYONE</span>
                          </>
                        ) : x.apply ? (
                          <>
                            <span className="mem" style={{ fontSize: '15px' }}>
                              By Application
                            </span>
                            <span className="lbl">MATCHED PLACEMENT</span>
                          </>
                        ) : s.memPrice === 0 ? (
                          <>
                            <span className="full">${money(s.fullPrice)}</span>{' '}
                            <span className="mem">FREE</span>
                            <span className="lbl">WITH AOI MEMBERSHIP</span>
                          </>
                        ) : (
                          <>
                            <span className="full">${money(s.fullPrice)}</span>{' '}
                            <span className="mem">${money(s.memPrice ?? 0)}</span>
                            <span className="lbl">
                              AOI MEMBER PRICE
                              {Math.max(0, s.fullPrice - (s.memPrice ?? 0)) > 0 &&
                                ` · SAVE $${money(s.fullPrice - (s.memPrice ?? 0))}`}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="seats">
                        <b>{x.seats}</b>
                        <span>{x.soon ? 'OPENING SOON' : 'UPDATED WEEKLY'}</span>
                      </div>
                    </div>
                    <div className="bot">
                      {x.soon ? (
                        <button
                          type="button"
                          className="b sm s-btn on-light"
                          onClick={() =>
                            toast(
                              "We'll open registration for this session soon — contact us to be notified.",
                            )
                          }
                        >
                          Notify Me
                        </button>
                      ) : x.apply ? (
                        <Link className="b sm p-btn" to="/contact">
                          Apply Now
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className="b sm p-btn"
                          onClick={() => register(key)}
                        >
                          Register — {x.city.split(',')[0]}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      <section className="tight" style={{ paddingTop: '20px' }}>
        <div className="wrap grid2" style={{ gap: '56px', alignItems: 'start' }}>
          <div>
            <div className="kick">About This Event</div>
            <h2 className="t" style={{ fontSize: '26px' }}>
              {s.h2}
            </h2>
            <div className="goldrule" />
            <div className="prose" dangerouslySetInnerHTML={{ __html: s.overview }} />
          </div>
          <div>
            <div>
              {s.mux ? (
                <>
                  <div className="embed">
                    <iframe
                      src={`https://player.mux.com/${s.mux}?accent-color=%23C29A4B`}
                      allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                      allowFullScreen
                      title={s.muxName ?? s.title}
                    />
                  </div>
                  {s.muxName && (
                    <div className="embed-cap">DOCTOR TESTIMONIAL — {s.muxName.toUpperCase()}</div>
                  )}
                </>
              ) : s.video ? (
                <div className="embed">
                  <iframe
                    src={s.video}
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    title={`${s.title} — preview video`}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  className="video"
                  onClick={() => toast('A preview film for this event is coming soon.')}
                >
                  <div className="play">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="var(--color-surface-inverse)">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <span className="lbl">VIDEO — {s.title.toUpperCase()} PREVIEW</span>
                  <span className="dur">1:45</span>
                </button>
              )}
            </div>
            <div className="memberprice">
              <div className="mp-h">Member pricing</div>
              <p>{s.member}</p>
              <Link className="t-link" to="/membership">
                About Membership<span className="a">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {speakers.length > 0 && (
        <section className="tight" style={{ paddingTop: '8px' }}>
          <div className="wrap">
            <div className="kick">Faculty</div>
            <h2 className="t" style={{ fontSize: '26px' }}>
              Your instructors
            </h2>
            <div className="goldrule" />
            {keynote && PEOPLE[keynote] && (
              <button type="button" className="keynote" onClick={() => openBio(keynote)}>
                <div className="bd">
                  <span className="flag">KEYNOTE SPEAKER</span>
                  <h4>{PEOPLE[keynote]!.name}</h4>
                  <div className="cred">{PEOPLE[keynote]!.cred}</div>
                  <p>{s.keynoteBlurb ?? PEOPLE[keynote]!.bio}</p>
                  <span className="t-link" style={{ color: 'var(--color-brand-accent-bright)' }}>
                    Full Bio →
                  </span>
                </div>
                <div className="pho">
                  <Face id={keynote} />
                </div>
              </button>
            )}
            <div className="spk-grid">
              {rest.map((id) => {
                const person = PEOPLE[id]
                if (!person) return null
                return (
                  <button type="button" className="spk-card" key={id} onClick={() => openBio(id)}>
                    <div className="pho">
                      <Face id={id} />
                    </div>
                    <span className="rtag">{person.role}</span>
                    <div className="bd">
                      <h4>{person.name}</h4>
                      <div className="cred">{person.cred}</div>
                      <p>Tap for bio</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {s.exhibitors && s.exhibitors.length > 0 && (
        <section className="tight" style={{ paddingTop: '8px' }}>
          <div className="wrap">
            <div className="kick">Exhibitors &amp; Partners</div>
            <h2 className="t" style={{ fontSize: '26px' }}>
              The companies serving upper cervical
            </h2>
            <div className="goldrule" />
            <p className="exhib-note">
              Exhibitors from last year&apos;s conference — the 2026 floor is filling now. Interested
              in exhibiting?{' '}
              <Link className="t-link" style={{ fontSize: '11px' }} to="/contact">
                Contact the Institute
              </Link>
              .
            </p>
            <div className="exhib-grid">
              {s.exhibitors.map((name) => (
                <div className="exhib" key={name}>
                  {name}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mist">
        <div className="wrap">
          <div className="kick">Curriculum</div>
          <h2 className="t" style={{ fontSize: '26px' }}>
            What you&apos;ll learn
          </h2>
          <div className="goldrule" />
          <div className="learn">
            {s.learn.map((item) => (
              <div className="li" key={item}>
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-brand-accent)"
                  strokeWidth="2.6"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {item}
              </div>
            ))}
          </div>

          {agenda.length > 0 && (
            <div style={{ marginTop: '44px' }}>
              <div className="kick">Agenda</div>
              <h2 className="t" style={{ fontSize: '26px' }}>
                How the time is spent
              </h2>
              <div className="goldrule" />
              <div>
                {agenda.length > 1 && (
                  <div className="agtabs" role="tablist">
                    {agenda.map((day, i) => (
                      <button
                        type="button"
                        role="tab"
                        aria-selected={i === agendaDay}
                        className={`agtab${i === agendaDay ? ' on' : ''}`}
                        key={day.day}
                        onClick={() => setAgendaDay(i)}
                      >
                        {day.day}
                        <small>{day.date ?? ''}</small>
                      </button>
                    ))}
                  </div>
                )}
                {agenda.map((day, i) => (
                  <div
                    className={`agday${i === agendaDay || agenda.length === 1 ? ' on' : ''}`}
                    key={day.day}
                  >
                    {day.items.map((item) => (
                      <div className="agrow" key={`${item.t}-${item.title}`}>
                        <div className="rail">
                          <div className="tm">{item.t}</div>
                          <div className="ap">{item.ap}</div>
                        </div>
                        <div className="acard">
                          <h4>{item.title}</h4>
                          <p>{item.desc}</p>
                          {item.who && item.who.length > 0 && (
                            <div>
                              {item.who.map((id) => (
                                <SpeakerPill id={id} key={id} />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <p className="agenda-hint">TAP ANY INSTRUCTOR PILL FOR THEIR BIO</p>
            </div>
          )}
        </div>
      </section>

      {s.regBand && (
        <section className="tight" id="sd-reg-sec" style={{ paddingTop: '8px' }}>
          <div className="wrap">
            <div className="regband">
              <div className="rb-top">
                <div className="rb-kick">Registration</div>
                <h2>{s.regBand.h ?? `Register for ${s.title}`}</h2>
                <div className="rb-rule" />
                <p className="rb-sub">{s.regBand.sub ?? `${s.dates} · ${s.loc}`}</p>
              </div>
              <div className="rb-tiers">
                {s.regBand.tiers.map((tier) => (
                  <div className={`rt${tier.hi ? ' hi' : ''}`} key={tier.k}>
                    {tier.flag && <span className="rt-flag">{tier.flag}</span>}
                    <div className="rt-k">{tier.k}</div>
                    <div className="rt-p">{tier.p}</div>
                    <div className="rt-n">{tier.n}</div>
                  </div>
                ))}
              </div>
              <div className="rb-go">
                <button type="button" className="b lg p-btn" onClick={() => register(key)}>
                  {s.regBand.btn ?? 'Register Now'}
                </button>
                {s.regBand.note && <p className="rb-note">{s.regBand.note}</p>}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="ctaband tight">
        <div className="wrap">
          <div>
            <h3>{s.ctaH}</h3>
            <p>{s.ctaP}</p>
          </div>
          <button type="button" className="b lg p-btn" onClick={scrollToRegistration}>
            {s.ctaBtn ?? 'Register Now'}
          </button>
        </div>
      </section>

      <section className="tight">
        <div className="wrap">
          <div className="kick">Keep Exploring</div>
          <h2 className="t" style={{ fontSize: '24px' }}>
            Related training
          </h2>
          <div className="goldrule" />
          <div className="grid3">
            {related.map((id) => (
              <SeminarCard id={id} key={id} />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
