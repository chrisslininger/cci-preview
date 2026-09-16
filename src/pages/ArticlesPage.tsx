import { Link } from '@/lib/router'
import { ARTICLES, articleSlug } from '@/content/articles'

export default function ArticlesPage() {
  return (
    <>
      <div className="hero-img short">
        <div className="bg ph-c" />
        <div className="duo" />
        <div className="duo2" />
        <div className="scrim" />
        <div className="wrap inner">
          <div className="crumbs">
            <Link to="/">HOME</Link> <b>/</b> ARTICLES &amp; RESEARCH
          </div>
          <div className="kick">The AOI Journal</div>
          <h1>Articles &amp; Research</h1>
          <p className="sub">
            Clinical insights, research updates, and news from the Advanced Orthogonal Institute
            community.
          </p>
        </div>
      </div>

      <section className="tight">
        <div className="wrap">
          <div className="arts" id="artgrid">
            {ARTICLES.map((article) => (
              <Link className="art" to={`/articles/${articleSlug(article)}`} key={article.id}>
                <div className="imgwrap">
                  <div className={`img ${article.img}`}>
                    <div className="duo" />
                    <div className="duo2" />
                  </div>
                  <span className="cat">{article.cat}</span>
                </div>
                <div className="bd">
                  <div className="date">{article.date}</div>
                  <h3>{article.title}</h3>
                  <p>{article.ex}</p>
                  <div style={{ marginTop: '14px' }}>
                    <span className="t-link">
                      Read Article<span className="a">→</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="ctaband tight">
        <div className="wrap">
          <div>
            <h3>Have research to share?</h3>
            <p>
              The Institute is dedicated to participating in and initiating research that validates
              upper cervical care.
            </p>
          </div>
          <Link className="b lg p-btn" to="/contact">
            Submit to the Journal
          </Link>
        </div>
      </section>
    </>
  )
}
