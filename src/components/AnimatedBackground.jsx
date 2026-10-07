import { useEffect, useRef } from 'react'
import styles from './AnimatedBackground.module.css'

export default function AnimatedBackground() {
  const containerRef = useRef(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handleMouse = (e) => {
      const x = e.clientX / window.innerWidth
      const y = e.clientY / window.innerHeight
      el.style.setProperty('--mx', x)
      el.style.setProperty('--my', y)
    }
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [])

  return (
    <div className={styles.bg} aria-hidden="true" ref={containerRef}>
      {/* Liquid wave layers — theme-aware (see CSS for dark vs light treatment) */}
      <div className={styles.wave}>
        <span className={styles.wave1} />
        <span className={styles.wave2} />
        <span className={styles.wave3} />
      </div>
      {/* Floating sunlit bokeh — only rendered visually in light mode */}
      <div className={styles.sparkles} aria-hidden="true">
        <span className={`${styles.sparkle} ${styles.sparkle1}`} />
        <span className={`${styles.sparkle} ${styles.sparkle2}`} />
        <span className={`${styles.sparkle} ${styles.sparkle3}`} />
        <span className={`${styles.sparkle} ${styles.sparkle4}`} />
        <span className={`${styles.sparkle} ${styles.sparkle5}`} />
      </div>
      {/* Subtle grid overlay */}
      <div className={styles.grid} />
      {/* Mouse-reactive glow */}
      <div className={styles.mouseGlow} />
    </div>
  )
}
