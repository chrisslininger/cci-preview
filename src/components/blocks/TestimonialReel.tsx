import { useState } from 'react'
import { TESTIMONIALS } from '@/content/testimonials'

export default function TestimonialReel() {
  const [active, setActive] = useState(0)
  const current = TESTIMONIALS[active] ?? TESTIMONIALS[0]
  if (!current) return null

  return (
    <>
      <div className="embed embed-deep">
        <iframe
          key={active}
          src={`https://player.mux.com/${current.id}?accent-color=%23C29A4B${active > 0 ? '&autoplay=true' : ''}`}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen
          title={`Doctor testimonial — ${current.name}`}
        />
      </div>
      <div className="testi-pills">
        {TESTIMONIALS.map((t, i) => (
          <button
            type="button"
            className={`vpill${i === active ? ' on' : ''}`}
            key={t.id}
            aria-pressed={i === active}
            onClick={() => setActive(i)}
          >
            {t.name.toUpperCase()} · {t.dur}
          </button>
        ))}
      </div>
    </>
  )
}
