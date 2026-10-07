import { useEffect } from 'react'
import styles from './DailyPostPage.module.css'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function DailyPostPage({ post, onBack }) {
  useEffect(() => { window.scrollTo(0, 0) }, [post])

  if (!post) return null

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={onBack}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to Home
      </button>

      <div className={styles.meta}>
        <span className={styles.category}>{post.category}</span>
        <span className={styles.dot}>•</span>
        <span>{formatDate(post.date)}</span>
        {post.readTime && (
          <>
            <span className={styles.dot}>•</span>
            <span>{post.readTime}</span>
          </>
        )}
      </div>

      <h1 className={styles.title}>{post.title}</h1>

      {post.author && <p className={styles.author}>By <strong>{post.author}</strong></p>}

      {post.coverImage && (
        <div className={styles.coverWrap}>
          <img src={post.coverImage} alt={post.title} className={styles.cover} />
        </div>
      )}

      <article className={styles.article}>
        {post.content.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </article>

      <div className={styles.footerNav}>
        <button className={styles.backBtnGhost} onClick={onBack}>← Back to Home</button>
      </div>
    </div>
  )
}
