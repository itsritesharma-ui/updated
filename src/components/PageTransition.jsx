import { useEffect, useRef, useState } from 'react'
import styles from './PageTransition.module.css'

/**
 * PageTransition — shows a glitch logo spinner overlay between page changes,
 * then fades away. The actual children are always rendered (no stale closure issues).
 */
export default function PageTransition({ pageKey, children }) {
  const [prevKey, setPrevKey] = useState(pageKey)
  const [showOverlay, setShowOverlay] = useState(false)
  const [overlayLeaving, setOverlayLeaving] = useState(false)
  const timerRef = useRef(null)
  const leaveTimerRef = useRef(null)

  useEffect(() => {
    if (pageKey === prevKey) return

    // Show the logo spinner overlay
    setShowOverlay(true)
    setOverlayLeaving(false)
    clearTimeout(timerRef.current)
    clearTimeout(leaveTimerRef.current)

    timerRef.current = setTimeout(() => {
      setPrevKey(pageKey)
      setOverlayLeaving(true)
      leaveTimerRef.current = setTimeout(() => {
        setShowOverlay(false)
        setOverlayLeaving(false)
      }, 320)
    }, 750) // spinner visible before content swap

    return () => {
      clearTimeout(timerRef.current)
      clearTimeout(leaveTimerRef.current)
    }
  }, [pageKey]) // eslint-disable-line

  return (
    <div className={styles.wrap}>
      {/* Content — always live, never stale */}
      <div className={`${styles.content} ${showOverlay && !overlayLeaving ? styles.contentDim : ''}`}>
        {children}
      </div>

      {/* Logo spinner overlay */}
      {showOverlay && (
        <div className={`${styles.overlay} ${overlayLeaving ? styles.overlayOut : ''}`}>
          <div className={styles.spinnerWrap}>
            <div className={styles.ring} />
            <div className={styles.ring2} />
            <img src="/logo.jpg" alt="The Craft Page" className={styles.logoImg} />
            <div className={styles.glitch1} aria-hidden="true">
              <img src="/logo.jpg" alt="" className={styles.logoImg} />
            </div>
            <div className={styles.glitch2} aria-hidden="true">
              <img src="/logo.jpg" alt="" className={styles.logoImg} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
