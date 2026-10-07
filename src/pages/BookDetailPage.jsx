import { useEffect, useRef, useState } from 'react'
import styles from './BookDetailPage.module.css'
import { openNotify } from '../components/NotifyModal'
import PayLinkButton from '../components/PayLinkButton'

export default function BookDetailPage({ product, onBack, cart, onAdd, user, onAuthOpen }) {
  const [activeTab, setActiveTab] = useState('about')
  const [imgLoaded, setImgLoaded] = useState(false)
  const heroRef = useRef(null)

  const isComingSoon = product.status === 'coming_soon'
  const discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0
  const inCart = cart.some(c => c.id === product.id)

  useEffect(() => { window.scrollTo(0, 0) }, [])

  const handleAdd = () => {
    if (!user) { onAuthOpen(); return }
    if (!inCart) onAdd(product)
  }

  const SPECS = [
    { label: 'Format', value: 'eBook (PDF + ePub)' },
    { label: 'Language', value: 'English' },
    { label: 'Author', value: product.author },
    { label: 'Publisher', value: 'The Pagecraft' },
    { label: 'Category', value: product.category },
    { label: 'Delivery', value: 'Instant Digital Download' },
  ]

  const REVIEWS = [
    { name: 'Ananya S.', rating: 5, text: 'Absolutely brilliant. Every Indian should read this. Ritesh writes with such honesty and depth.', date: 'May 2026' },
    { name: 'Priya M.', rating: 5, text: 'I could not put it down. The research is incredible and the writing flows beautifully.', date: 'April 2026' },
    { name: 'Rahul K.', rating: 5, text: 'A masterpiece of Indian non-fiction. Highly recommended for anyone who loves their country.', date: 'March 2026' },
  ]

  return (
    <div className={styles.page}>

      {/* Back button */}
      <button className={styles.backBtn} onClick={onBack}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        Back to eBooks
      </button>

      {/* ── Hero Section ── */}
      <div className={styles.hero} ref={heroRef}>

        {/* Left: Image */}
        <div className={styles.imgSection}>
          <div className={styles.imgWrap}>
            {!imgLoaded && <div className={styles.imgSkeleton} />}
            <img
              src={product.image}
              alt={product.title}
              className={`${styles.img} ${imgLoaded ? styles.imgVisible : ''}`}
              onLoad={() => setImgLoaded(true)}
            />
            {isComingSoon && <div className={styles.comingSoonBadge}>Coming Soon</div>}
            {discount > 0 && <div className={styles.discountBadge}>{discount}% OFF</div>}
          </div>

          {/* Thumbnail strip (same image, decorative) */}
          <div className={styles.thumbs}>
            {[product.image, product.image].map((src, i) => (
              <div key={i} className={`${styles.thumb} ${i === 0 ? styles.thumbActive : ''}`}>
                <img src={src} alt="" />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Info */}
        <div className={styles.infoSection}>
          <span className={styles.catTag}>{product.category}</span>
          <h1 className={styles.title}>{product.title}</h1>
          {product.subtitle && <p className={styles.subtitle}>{product.subtitle}</p>}
          <p className={styles.author}>by <strong>{product.author}</strong></p>

          {/* Rating */}
          {!isComingSoon && (
            <div className={styles.ratingRow}>
              <span className={styles.stars}>★★★★★</span>
              <span className={styles.ratingNum}>4.9</span>
              <span className={styles.ratingCount}>128 ratings</span>
              <span className={styles.ratingDivider}>·</span>
              <span className={styles.reviewCount}>64 reviews</span>
            </div>
          )}

          {/* Price block */}
          <div className={styles.priceBlock}>
            {discount > 0 && (
              <span className={styles.discountPct}>{discount}% off</span>
            )}
            <div className={styles.priceRow}>
              <span className={styles.price}>₹{product.price}</span>
              {product.mrp && <span className={styles.mrp}>M.R.P: <s>₹{product.mrp}</s></span>}
            </div>
            {discount > 0 && (
              <p className={styles.savedLine}>You save: <strong>₹{product.mrp - product.price}</strong></p>
            )}
            <p className={styles.taxLine}>Inclusive of all taxes</p>
          </div>

          {/* Delivery info */}
          {!isComingSoon && (
            <div className={styles.deliveryBox}>
              <div className={styles.deliveryRow}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>
                <span>Instant digital delivery after payment</span>
              </div>
              <div className={styles.deliveryRow}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                <span>Secure payment · 100% safe</span>
              </div>
              <div className={styles.deliveryRow}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16,6 12,2 8,6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                <span>PDF + ePub formats included</span>
              </div>
            </div>
          )}

          {/* CTA Buttons */}
          <div className={styles.ctaBlock}>
            {!isComingSoon ? (
              <>
                <button
                  className={`${styles.addCartBtn} ${inCart ? styles.inCart : ''} ${!user ? styles.locked : ''}`}
                  onClick={handleAdd}
                >
                  {inCart ? '✓ Added to Cart' : !user ? '🔒 Login to Buy' : 'Add to Cart'}
                </button>
                <PayLinkButton product={product} />
              {product.amazonLink && (
                  <a href={product.amazonLink} target="_blank" rel="noopener noreferrer" className={styles.amazonBtn}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    Buy on Amazon
                  </a>
                )}
              </>
            ) : (
              <>
                <button className={styles.notifyBtn} onClick={() => openNotify(product)}>
                  🔔 Notify Me on Launch
                </button>
                <p className={styles.comingSoonNote}>This title is not yet released. Sign up to be notified!</p>
              </>
            )}

            {!user && (
              <button className={styles.loginNote} onClick={onAuthOpen}>
                Already have an account? Login →
              </button>
            )}
          </div>

          {/* Specs mini table */}
          <div className={styles.specsGrid}>
            {SPECS.map(s => (
              <div key={s.label} className={styles.specRow}>
                <span className={styles.specLabel}>{s.label}</span>
                <span className={styles.specVal}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs: About / Reviews ── */}
      <div className={styles.tabs}>
        {(isComingSoon ? ['about'] : ['about', 'reviews']).map(t => (
          <button key={t} className={`${styles.tab} ${activeTab === t ? styles.tabActive : ''}`} onClick={() => setActiveTab(t)}>
            {t === 'about' ? 'About the Book' : `Reviews (${REVIEWS.length})`}
          </button>
        ))}
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'about' && (
          <div className={styles.aboutContent}>
            {product.fullDescription?.split('\n\n').map((para, i) => (
              <p key={i} className={styles.descPara}>{para}</p>
            ))}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className={styles.reviewsGrid}>
            {/* Rating summary */}
            <div className={styles.ratingSummary}>
              <div className={styles.bigRating}>
                <span className={styles.bigRatingNum}>4.9</span>
                <span className={styles.bigStars}>★★★★★</span>
                <span className={styles.bigRatingLabel}>out of 5</span>
              </div>
              <div className={styles.ratingBars}>
                {[['5 ★', 92], ['4 ★', 6], ['3 ★', 2], ['2 ★', 0], ['1 ★', 0]].map(([label, pct]) => (
                  <div key={label} className={styles.ratingBarRow}>
                    <span className={styles.ratingBarLabel}>{label}</span>
                    <div className={styles.ratingBarTrack}>
                      <div className={styles.ratingBarFill} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={styles.ratingBarPct}>{pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Review cards */}
            <div className={styles.reviewsList}>
              {REVIEWS.map((r, i) => (
                <div key={i} className={styles.reviewCard}>
                  <div className={styles.reviewTop}>
                    <div className={styles.reviewAvatar}>{r.name[0]}</div>
                    <div>
                      <p className={styles.reviewName}>{r.name}</p>
                      <span className={styles.reviewStars}>{'★'.repeat(r.rating)}</span>
                    </div>
                    <span className={styles.reviewDate}>{r.date}</span>
                  </div>
                  <p className={styles.reviewText}>{r.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
