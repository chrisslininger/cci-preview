import { Link, useParams } from '@/lib/router'
import { ARTICLES, SLUG_TO_ARTICLE } from '@/content/articles'
import NotFoundPage from './NotFoundPage'

export default function ArticlePage({ param }: { param?: string }) {
  const { slug } = useParams()
  const article = param
    ? ARTICLES.find((a) => a.id === param)
    : slug
      ? SLUG_TO_ARTICLE[slug]
      : undefined

  if (!article) return <NotFoundPage />

  return (
    <>
      <div className="hero-img short">
        <div className={`bg ${article.img}`} id="ad-img" />
        <div className="duo" />
        <div className="duo2" />
        <div className="scrim" />
        <div className="wrap inner">
          <div className="crumbs">
            <Link to="/">HOME</Link> <b>/</b> <Link to="/articles">ARTICLES &amp; RESEARCH</Link>{' '}
            <b>/</b> <span id="ad-crumb">{`${article.title.toUpperCase().slice(0, 24)}…`}</span>
          </div>
          <div className="kick">{article.cat}</div>
          <h1 style={{ fontSize: '38px' }}>{article.title}</h1>
          <p
            className="sub"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              letterSpacing: '.1em',
            }}
          >
            {article.date} · THE AOI JOURNAL
          </p>
        </div>
      </div>

      <section className="tight">
        <div className="wrap">
          <article
            className="prose"
            style={{ maxWidth: '760px' }}
            dangerouslySetInnerHTML={{ __html: article.body }}
          />
          <div style={{ marginTop: '36px' }}>
            <Link className="t-link" to="/articles">
              ← Back to Articles &amp; Research
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
