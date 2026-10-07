import { useEffect, useRef } from 'react'
import { useContent } from '../context/ContentContext'
import styles from './DailyPost.module.css'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function DailyPost({ onOpenPost }) {
  const { posts } = useContent()
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.dataset.visible = 'true'; obs.disconnect() } },
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Widget always shows whichever post has the most recent date —
  // add more entries to src/data/dailyPosts.js and this updates itself.
  const latest = posts[0]
  if (!latest) return null

  const handleOpen = (e) => {
    e.preventDefault()
    onOpenPost(latest)
  }

  return (
    <section className={styles.section} ref={ref} data-visible="false" id="daily-post">
      <div className={styles.feedLabel}>
        <span className={styles.labelLine} />
        <span className={styles.labelText}>Daily Post</span>
        <span className={styles.labelLine} />
      </div>
      <div className={styles.sectionTitle}>
        <h2>Fresh Off The <em>Desk</em></h2>
        <p>Notes, reflections, and behind-the-scenes thoughts — published as they happen.</p>
      </div>

      <a href={`/post/${latest.slug}`} className={styles.card} onClick={handleOpen}>
        <div className={styles.imageWrap}>
          <img src={latest.coverImage} alt={latest.title} className={styles.image} loading="lazy" />
          <span className={styles.categoryTag}>{latest.category}</span>
        </div>
        <div className={styles.body}>
          <span className={styles.date}>{formatDate(latest.date)}</span>
          <h3 className={styles.title}>{latest.title}</h3>
          <p className={styles.excerpt}>{latest.excerpt}</p>
          <span className={styles.readMore}>
            Read More
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </div>
      </a>
    </section>
  )
}
