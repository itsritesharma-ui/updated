import { useEffect, useRef, useState } from 'react'
import styles from './ProductCard.module.css'
import { openNotify } from './NotifyModal'
import PayLinkButton from './PayLinkButton'

export default function ProductCard({ product, inCart, onAdd, user, onAuthOpen }) {
  const ref = useRef(null)
  const cardRef = useRef(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add(styles.visible); observer.disconnect() } },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const isComingSoon = product.status === 'coming_soon'
  const discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0

  const handleAdd = () => {
    if (!user) { onAuthOpen?.(); return }
    if (!inCart) onAdd(product)
  }

  const handleModalAdd = () => {
    if (!user) { onAuthOpen?.(); setShowModal(false); return }
    if (!inCart) onAdd(product)
    setShowModal(false)
  }

  return (
    <>
      <div className={styles.outer} ref={ref}>
        <div
          className={styles.card}
          ref={cardRef}
        >
          {/* Discount tag */}
          {discount > 0 && (
            <div className={styles.discountTag}>{discount}% OFF</div>
          )}

          <div className={styles.imgWrap} onClick={() => setShowModal(true)}>
            <img src={product.image} alt={product.title} className={styles.img} />
            {product.badge && (
              <span className={`${styles.badge} ${isComingSoon ? styles.badgeSoon : styles.badgeAvail}`}>
                {product.badge}
              </span>
            )}
            {isComingSoon && (
              <div className={styles.overlay}>
                <span className={styles.overlayText}>Coming Soon</span>
              </div>
            )}
            <div className={styles.hoverOverlay}>
              <span className={styles.viewText}>View Details</span>
            </div>
          </div>

          <div className={styles.body}>
            <span className={styles.cat}>{product.category}</span>
            <h3 className={styles.title}>{product.title}</h3>
            <p className={styles.author}>by {product.author}</p>
            <p className={styles.desc}>{product.description}</p>

            <div className={styles.footer}>
              <div className={styles.priceBlock}>
                <span className={styles.price}>₹{product.price}</span>
                {product.mrp && (
                  <span className={styles.mrp}>₹{product.mrp}</span>
                )}
                {isComingSoon && <span className={styles.preOrder}>Pre-order</span>}
              </div>
              <div className={styles.actions}>
                <PayLinkButton product={product} />
                {product.amazonLink && (
                  <a href={product.amazonLink} target="_blank" rel="noopener noreferrer" className={styles.amazonBtn} aria-label="Buy on Amazon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    Amazon
                  </a>
                )}
                {!isComingSoon && (
                  <button
                    className={`${styles.addBtn} ${inCart ? styles.added : ''} ${!user ? styles.locked : ''}`}
                    onClick={handleAdd}
                    title={!user ? 'Login to add to cart' : ''}
                  >
                    {inCart ? '✓' : !user ? '🔒' : '+'}
                  </button>
                )}
                {isComingSoon && (
                  <button className={styles.notifyBtn} onClick={() => openNotify(product)}>
                    Notify Me
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className={styles.modal} onClick={() => setShowModal(false)}>
          <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setShowModal(false)}>✕</button>
            <div className={styles.modalInner}>
              <div className={styles.modalLeft}>
                <img src={product.image} alt={product.title} className={styles.modalImg} />
                {isComingSoon && <div className={styles.modalSoon}>Coming Soon</div>}
                {discount > 0 && <div className={styles.modalDiscount}>{discount}% OFF</div>}
              </div>
              <div className={styles.modalRight}>
                <span className={styles.cat}>{product.category}</span>
                <h2 className={styles.modalTitle}>{product.title}</h2>
                {product.subtitle && <p className={styles.modalSubtitle}>{product.subtitle}</p>}
                <p className={styles.modalAuthor}>by {product.author}</p>
                <div className={styles.modalDesc}>
                  {product.fullDescription?.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}
                </div>

                {!user && (
                  <div className={styles.authNotice}>
                    <span>🔒</span>
                    <span>
                      <button className={styles.authLink} onClick={() => { setShowModal(false); onAuthOpen?.() }}>
                        Login or create account
                      </button>
                      {' '}to purchase
                    </span>
                  </div>
                )}

                <div className={styles.modalFooter}>
                  <div className={styles.modalPriceBlock}>
                    <span className={styles.modalPrice}>₹{product.price}</span>
                    {product.mrp && <span className={styles.modalMrp}>MRP ₹{product.mrp}</span>}
                    {discount > 0 && <span className={styles.modalSavings}>You save ₹{product.mrp - product.price}</span>}
                  </div>
                  <div className={styles.modalActions}>
                    <PayLinkButton product={product} large />
                    {product.amazonLink && (
                      <a href={product.amazonLink} target="_blank" rel="noopener noreferrer" className={styles.amazonBtnLg}>
                        Buy on Amazon ↗
                      </a>
                    )}
                    {!isComingSoon && (
                      <button
                        className={`${styles.addBtnLg} ${inCart ? styles.addedLg : ''} ${!user ? styles.lockedLg : ''}`}
                        onClick={handleModalAdd}
                      >
                        {inCart ? '✓ Added to Cart' : !user ? '🔒 Login to Buy' : 'Add to Cart'}
                      </button>
                    )}
                    {isComingSoon && (
                      <button className={styles.notifyBtnLg} onClick={() => { setShowModal(false); openNotify(product) }}>
                        Notify Me on Launch
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
