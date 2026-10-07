import { useEffect, useRef, useState } from 'react'
import styles from './ImpactStats.module.css'
import { useContent } from '../context/ContentContext'

export default function ImpactStats() {
  const { products, homepage } = useContent()
  const s = homepage.stats
  const STATS = [
    { value: s.readers, label: 'Readers Reached', suffix: '' },
    { value: s.titles || String(products.length), label: 'Titles Published', suffix: '' },
    { value: String(s.rating || '').replace('★', ''), label: 'Average Rating', suffix: '★' },
    { value: s.copies, label: 'Copies Sold On Amazon', suffix: '' },
  ].filter(item => String(item.value).trim())
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(false)
  const sectionRef = useRef(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return
    const timer = setInterval(() => {
      setIdx(i => (i + 1) % STATS.length)
    }, 2800)
    return () => clearInterval(timer)
  }, [visible])

  const current = STATS[idx % STATS.length]

  return (
    <section className={styles.section} ref={sectionRef} data-visible={visible}>
      <div className={styles.glow} />
      <span className={styles.tag}>Our Impact</span>
      <h2 className={styles.heading}>
        Together, We're Turning<br />Pages Into <em>Impact</em>
      </h2>

      <div className={styles.counterWrap}>
        <div className={styles.counterTrack} key={idx}>
          <span className={styles.counterValue}>
            {current.value}
            {current.suffix && <span className={styles.counterSuffix}>{current.suffix}</span>}
          </span>
        </div>
      </div>
      <p className={styles.counterLabel} key={`label-${idx}`}>{current.label}</p>

      <div className={styles.dots}>
        {STATS.map((_, i) => (
          <button
            key={i}
            className={`${styles.dot} ${i === idx ? styles.dotActive : ''}`}
            onClick={() => setIdx(i)}
            aria-label={`Show stat ${i + 1}`}
          />
        ))}
      </div>
    </section>
  )
}
