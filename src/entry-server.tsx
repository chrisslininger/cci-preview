/* ----------------------------------------------------------------------------
 * Build-time renderer.
 *
 * `render(path)` returns the complete HTML and <head> for one route; `manifest`
 * is what the prerenderer, the sitemap generator and the verification gate all
 * read. One source, so they cannot disagree.
 * -------------------------------------------------------------------------- */
import { renderToString } from 'react-dom/server'
import { StaticRouter } from '@/lib/router'
import App from './App'
import { routes } from './routes'
import { renderHead, ORIGIN } from './lib/seo'

export function render(path: string): { html: string; head: string } {
  const entry = routes.find((r) => r.path === path)
  const html = renderToString(
    <StaticRouter location={path}>
      <App />
    </StaticRouter>,
  )
  const head = entry ? renderHead(entry.meta, entry.path) : ''
  return { html, head }
}

export const manifest = {
  origin: ORIGIN,
  paths: routes.filter((r) => r.prerender).map((r) => r.path),
  entries: routes.map((r) => ({ path: r.path, meta: r.meta, prerender: r.prerender })),
}
