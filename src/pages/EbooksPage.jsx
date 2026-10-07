import { useState, useEffect, useRef } from 'react'
import { useContent } from '../context/ContentContext'
import { formatRating } from '../lib/siteConfig'
import styles from './EbooksPage.module.css'
import { openNotify } from '../components/NotifyModal'
import PayLinkButton from '../components/PayLinkButton'

const THOUGHTS_CONTENT = [
  {
    id: 1,
    type: 'thought',
    text: "History is not a burden on the memory but an illumination of the soul. Every page we write today becomes the echo of tomorrow.",
    date: "June 2026",
  },
  {
    id: 2,
    type: 'quote',
    text: "The freedom we enjoy today was built on the sacrifices of those who dared to dream of a better future.",
    source: "— Echoes of Freedom",
  },
  {
    id: 3,
    type: 'thought',
    text: "Bihar is not what they show you on the news. Bihar is what you feel when you sit with an old farmer at sunset and hear stories that historians forgot to write.",
    date: "May 2026",
  },
  {
    id: 4,
    type: 'quote',
    text: "Nature never deceives us — every time I walked through India's forests and fields, I understood something no classroom ever taught me.",
    source: "— Nature Never Lies!",
  },
]

function useReveal(threshold = 0.1) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.dataset.visible = 'true'; obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

function BookCard({ product, onSelect, inCart, onAdd, user, onAuthOpen }) {
  const ref = useReveal()
  const isComingSoon = product.status === 'coming_soon'
  const discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0

  return (
    <div className={styles.bookCard} ref={ref} data-visible="false" onClick={() => onSelect(product)}>
      {/* Image Section */}
      <div className={styles.bookImgWrap}>
        <img src={product.image} alt={product.title} className={styles.bookImg} />
        {product.badge && (
          <span className={`${styles.bookBadge} ${isComingSoon ? styles.badgeSoon : styles.badgeAvail}`}>
            {product.badge}
          </span>
        )}
        {discount > 0 && (
          <span className={styles.discountTag}>{discount}% off</span>
        )}
        {isComingSoon && (
          <div className={styles.comingSoonOverlay}>
            <span>Coming Soon</span>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className={styles.bookInfo}>
        <span className={styles.bookCat}>{product.category}</span>
        <h3 className={styles.bookTitle}>{product.title}</h3>
        <p className={styles.bookAuthor}>by {product.author}</p>

        {/* Rating row */}
        {!isComingSoon && (
          <div className={styles.ratingRow}>
            <span className={styles.stars}>★★★★★</span>
            <span className={styles.ratingNum}>4.9</span>
            <span className={styles.ratingCount}>(128)</span>
          </div>
        )}

        {/* Price row */}
        <div className={styles.priceRow}>
          <span className={styles.price}>₹{product.price}</span>
          {product.mrp && <span className={styles.mrp}>₹{product.mrp}</span>}
          {discount > 0 && <span className={styles.savedText}>Save ₹{product.mrp - product.price}</span>}
        </div>

        {/* Delivery tag */}
        {!isComingSoon && (
          <p className={styles.deliveryTag}>✓ Instant digital delivery</p>
        )}

        {/* Actions */}
        <div className={styles.cardActions} onClick={e => e.stopPropagation()}>
          {!isComingSoon ? (
            <>
              <PayLinkButton product={product} />
              {product.amazonLink && (
                <a href={product.amazonLink} target="_blank" rel="noopener noreferrer" className={styles.amazonBtn}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  Amazon
                </a>
              )}
              <button
                className={`${styles.addCartBtn} ${inCart ? styles.inCart : ''}`}
                onClick={() => { if (!user) { onAuthOpen(); return } if (!inCart) onAdd(product) }}
              >
                {inCart ? '✓ Added' : !user ? '🔒 Login' : '+ Add to Cart'}
              </button>
            </>
          ) : (
            <button className={styles.notifyBtn} onClick={() => openNotify(product)}>
              🔔 Notify Me
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ThoughtCard({ item, index }) {
  const ref = useReveal()
  if (item.type === 'quote') return (
    <div className={styles.quoteCard} ref={ref} data-visible="false" style={{ transitionDelay: `${index * 0.08}s` }}>
      <div className={styles.quoteLine} />
      <blockquote className={styles.quoteText}>{item.text}</blockquote>
      <cite className={styles.quoteSource}>{item.source}</cite>
    </div>
  )
  return (
    <div className={styles.thoughtCard} ref={ref} data-visible="false" style={{ transitionDelay: `${index * 0.08}s` }}>
      <span className={styles.thoughtDate}>{item.date}</span>
      <p className={styles.thoughtText}>{item.text}</p>
    </div>
  )
}

export default function EbooksPage({ cart, onAdd, user, onAuthOpen, onSelectBook }) {
  const { products, homepage } = useContent()
  const CATEGORIES = ['All', ...new Set(products.map(p => p.category))]
  const [active, setActive] = useState('All')
  const filtered = active === 'All' ? products : products.filter(p => p.category === active)

  return (
    <div className={styles.page}>

      {/* ── Hero Banner ── */}
      <div className={styles.heroBanner}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>✦ The Pagecraft Digital Library</p>
          <h1 className={styles.heroTitle}>eBooks by Ritesh Sharma</h1>
          <p className={styles.heroSub}>India's history, politics and nature — told with truth and passion.</p>
        </div>
        <div className={styles.heroStats}>
          {[{ val: String(products.length), label: 'Titles' }, { val: homepage.stats.readers, label: 'Readers' }, { val: formatRating(homepage.stats.rating), label: 'Avg Rating' }, { val: '🇮🇳', label: 'Made in India' }].map(s => (
            <div className={styles.heroStat} key={s.label}>
              <strong>{s.val}</strong><span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Category Filter ── */}
      <div className={styles.filterBar}>
        {CATEGORIES.map(cat => (
          <button key={cat} className={`${styles.filterBtn} ${active === cat ? styles.filterActive : ''}`} onClick={() => setActive(cat)}>
            {cat}
            <span className={styles.filterCount}>
              {cat === 'All' ? products.length : products.filter(p => p.category === cat).length}
            </span>
          </button>
        ))}
      </div>

      {/* ── Books Grid ── */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>
          <span className={styles.labelLine} />
          <span className={styles.labelText}>{active === 'All' ? 'All Books' : active}</span>
          <span className={styles.labelLine} />
        </div>
        <div className={styles.booksGrid}>
          {filtered.map((product, i) => (
            <div key={product.id} className={styles.bookWrap} style={{ animationDelay: `${i * 0.07}s` }}>
              <BookCard
                product={product}
                onSelect={onSelectBook}
                inCart={cart.some(c => c.id === product.id)}
                onAdd={onAdd}
                user={user}
                onAuthOpen={onAuthOpen}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Author's Corner ── */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>
          <span className={styles.labelLine} />
          <span className={styles.labelText}>From the Author's Desk</span>
          <span className={styles.labelLine} />
        </div>
        <div className={styles.thoughtsGrid}>
          {THOUGHTS_CONTENT.map((item, i) => (
            <ThoughtCard key={item.id} item={item} index={i} />
          ))}
        </div>
      </div>

      {/* ── About Strip ── */}
      <div className={styles.aboutStrip}>
        <div className={styles.aboutLeft}>
          <p className={styles.aboutEyebrow}>About the Author</p>
          <h2 className={styles.aboutName}>Ritesh Sharma</h2>
          <p className={styles.aboutText}>
            Independent author and publisher based in India, passionate about bringing untold stories of India's history, politics, and natural world to life through The Pagecraft. His debut title <em>Echoes of Freedom</em> has been widely praised.
          </p>
        </div>
        <div className={styles.aboutRight}>
          <a href="mailto:itsritesharma261@gmail.com" className={styles.contactBtn}>
            ✉ Get in Touch
          </a>
          <a href="https://www.amazon.in/Echoes-Freedom-Stories-Independence-Uncovered-ebook/dp/B0GSS7P99D"
            target="_blank" rel="noopener noreferrer" className={styles.amazonStripBtn}>
            View on Amazon ↗
          </a>
        </div>
      </div>

    </div>
  )
}
