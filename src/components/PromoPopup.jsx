import { useState, useEffect } from 'react'
import styles from './PromoPopup.module.css'

export default function PromoPopup({ onNavigate }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissed = sessionStorage.getItem('pagecraft_promo_dismissed')
    if (dismissed) return
    const t = setTimeout(() => setVisible(true), 800)
    return () => clearTimeout(t)
  }, [])

  const close = () => {
    setVisible(false)
    sessionStorage.setItem('pagecraft_promo_dismissed', '1')
  }

  const handleExplore = () => {
    close()
    onNavigate?.('/ebooks')
  }

  if (!visible) return null

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && close()}>
      <div className={styles.card}>
        <button className={styles.closeBtn} onClick={close} aria-label="Close">✕</button>
        <div className={styles.flagStrip}>
          <span className={styles.saffron} /><span className={styles.white} /><span className={styles.green} />
        </div>
        <img src="/echoes-of-freedom.jpg" alt="Echoes of Freedom" className={styles.cover} />
        <div className={styles.body}>
          <p className={styles.badge}>🇮🇳 Independence Day Sale</p>
          <h2 className={styles.title}>Flat 45% OFF</h2>
          <p className={styles.sub}>Celebrate Azadi with 45% off every book — including Echoes of Freedom, Ritesh Sharma's tribute to India's fight for independence.</p>
          <div className={styles.btns}>
            <button className={styles.btnPrimary} onClick={handleExplore}>Claim 45% OFF →</button>
            <button className={styles.btnGhost} onClick={close}>Maybe Later</button>
          </div>
        </div>
      </div>
    </div>
  )
}
