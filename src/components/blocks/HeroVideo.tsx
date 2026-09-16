/* ----------------------------------------------------------------------------
 * Home hero background film.
 *
 * Shows the poster frame immediately, then hands off to motion. If the local
 * file will not play, falls back to the Mux HLS stream — the same ladder the
 * v4.8 build used. Respects `prefers-reduced-motion` and Save-Data.
 * -------------------------------------------------------------------------- */
import { useEffect, useRef, useState } from 'react'

const LOCAL = '/hero.mp4'
const MUX = 'https://stream.mux.com/usEjngaotQUu5wu5Fs2L81yYc5SKGncUPey9LBi5H5Q.m3u8'

export default function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const video = ref.current
    if (!video) return

    const connection = (navigator as { connection?: { saveData?: boolean } }).connection
    const lite =
      connection?.saveData === true ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const reveal = () => {
      setVisible(true)
      video.closest('.hero-img')?.classList.add('vid-on')
    }
    const start = () => {
      void video.play().catch(() => {
        /* autoplay blocked — the poster stays, which is fine */
      })
    }

    video.addEventListener('loadeddata', reveal)
    video.addEventListener('playing', reveal)
    video.addEventListener('canplay', start)

    reveal()
    if (lite) return

    let usedFallback = false
    const fallbackToMux = () => {
      if (usedFallback) return
      usedFallback = true
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = MUX
        start()
        return
      }
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.13/hls.min.js'
      script.onload = () => {
        const Hls = (window as { Hls?: any }).Hls
        if (!Hls?.isSupported()) return
        const hls = new Hls({ capLevelToPlayerSize: true })
        hls.on(Hls.Events.MANIFEST_PARSED, start)
        hls.loadSource(MUX)
        hls.attachMedia(video)
      }
      document.head.appendChild(script)
    }
    video.addEventListener('error', fallbackToMux)

    video.src = LOCAL
    start()

    return () => {
      video.removeEventListener('loadeddata', reveal)
      video.removeEventListener('playing', reveal)
      video.removeEventListener('canplay', start)
      video.removeEventListener('error', fallbackToMux)
    }
  }, [])

  return (
    <video
      id="hero-vid"
      ref={ref}
      muted
      loop
      playsInline
      preload="none"
      poster="/images/hero-poster.webp"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        opacity: visible ? 1 : 0,
        transition: 'opacity 1.2s ease',
      }}
      aria-hidden="true"
      tabIndex={-1}
    />
  )
}
