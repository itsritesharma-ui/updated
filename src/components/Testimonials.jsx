import { useRef } from 'react'
import { useContent } from '../context/ContentContext'
import styles from './Testimonials.module.css'

export default function Testimonials() {
  const { homepage } = useContent()
  const t = homepage.testimonials
  const trackRef = useRef(null)
  const items = (t.items || []).filter(item => String(item?.text || '').trim())
  if (!t.enabled || !items.length) return null

  const scroll = dir => {
    const el = trackRef.current
    if (el) el.scrollBy({ left: dir * Math.max(280, el.clientWidth * 0.8), behavior: 'smooth' })
  }

  return (
    <section className={styles.section} aria-labelledby="testimonials-title">
      <div className={styles.head}>
        <h2 id="testimonials-title">{t.heading || 'Readers say it best'}</h2>
        {items.length > 1 && (
          <div className={styles.arrows}>
            <button onClick={() => scroll(-1)} aria-label="Previous reviews">‹</button>
            <button onClick={() => scroll(1)} aria-label="Next reviews">›</button>
          </div>
        )}
      </div>
      <div className={styles.track} ref={trackRef}>
        {items.map((item, i) => (
          <figure className={styles.card} key={i}>
            <span className={styles.mark} aria-hidden="true">“</span>
            <blockquote>{item.text}</blockquote>
            <figcaption>
              <span className={styles.avatar}>{(item.name || '?')[0].toUpperCase()}</span>
              <span>
                <strong>{item.name || 'Reader'}</strong>
                {item.role && <small>{item.role}</small>}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
