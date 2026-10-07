import { useRef, useEffect } from 'react'
import Hero from '../components/Hero'
import Testimonials from '../components/Testimonials'
import ImpactStats from '../components/ImpactStats'
import DailyPost from '../components/DailyPost'
import NotificationCenter from '../components/NotificationCenter'
import { useContent } from '../context/ContentContext'
import { formatRating } from '../lib/siteConfig'
import styles from './HomePage.module.css'

const JOURNEY = [
  {
    id: 1,
    image: '/echoes-of-freedom.jpg',
    eyebrow: 'The Beginning',
    title: 'Every story starts with a single page',
    text: "Writing my first book while preparing for NEET wasn't easy — late nights, early mornings, and a constant battle between two dreams. But I learned that passion finds time, even when there is none.",
  },
  {
    id: 2,
    image: '/real-bihar-1.jpg',
    eyebrow: 'The Process',
    title: 'Discipline is the bridge between dreams and reality',
    text: "Between chapters and study sessions, I discovered that consistency matters more than intensity. A little progress every day — on my books and on my goals — adds up to something extraordinary.",
  },
  {
    id: 3,
    image: '/nature-never-lies-1.jpg',
    eyebrow: 'The Belief',
    title: 'Your struggle today is someone else\'s motivation tomorrow',
    text: "Whether it's chasing a medical seat or finishing a book — the journey is never wasted. Every effort shapes you. Keep going, keep writing, keep believing in the version of yourself you're becoming.",
  },
]


function useReveal(threshold = 0.12) {
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

function JourneyEntry({ item, index }) {
  const ref = useReveal()
  const reversed = index % 2 === 1
  return (
    <div className={`${styles.journeyEntry} ${reversed ? styles.journeyReversed : ''}`} ref={ref} data-visible="false" style={{ transitionDelay: `${index * 0.08}s` }}>
      <div className={styles.journeyImageWrap}>
        <img src={item.image} alt={item.title} className={styles.journeyImage} />
      </div>
      <div className={styles.journeyContent}>
        <span className={styles.journeyEyebrow}>{item.eyebrow}</span>
        <h3 className={styles.journeyTitle}>{item.title}</h3>
        <p className={styles.journeyText}>{item.text}</p>
      </div>
    </div>
  )
}

export default function HomePage({ onAuthOpen, user, onNavigate, onOpenPost }) {
  const { products, homepage } = useContent()
  const featuredProducts = homepage.featured.productIds?.length
    ? homepage.featured.productIds.map(id => products.find(book => Number(book.id) === Number(id))).filter(Boolean).slice(0, 3)
    : products.slice(0, 3)
  const configuredBannerImage = String(homepage.banner.image || '').trim()
  const safeBannerImage = /^(https?:\/\/|\/)/i.test(configuredBannerImage)
    ? configuredBannerImage.replace(/["'\\\r\n]/g, '')
    : ''
  const aboutRef = useRef(null)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) e.target.dataset.visible = 'true' },
      { threshold: 0.1 }
    )
    if (aboutRef.current) obs.observe(aboutRef.current)
    return () => obs.disconnect()
  }, [])

  const followConfiguredLink = target => {
    const url = String(target || '').trim()
    if (/^https?:\/\//i.test(url)) {
      window.open(url, '_blank', 'noopener,noreferrer')
      return
    }
    onNavigate(url.startsWith('#') ? `/${url}` : (url.startsWith('/') ? url : '/ebooks'))
  }

  return (
    <>
      <Hero onNavigate={onNavigate} config={homepage.hero} />

      {homepage.sections.impactStats && <ImpactStats />}

      {homepage.sections.notifications && <NotificationCenter user={user} onAuthOpen={onAuthOpen} onNavigate={onNavigate} />}

      {homepage.banner.enabled && (
        <section className={styles.adminBanner} style={safeBannerImage ? { backgroundImage: `linear-gradient(90deg, rgba(7,7,7,.92), rgba(7,7,7,.55)), url("${safeBannerImage}")` } : undefined}>
          <div>
            <p className={styles.eyebrow}>ThePageCraft Announcement</p>
            <h2>{homepage.banner.title}</h2>
            <p>{homepage.banner.text}</p>
          </div>
          <button onClick={() => followConfiguredLink(homepage.banner.buttonUrl || '/ebooks')}>{homepage.banner.buttonText || 'Explore Books'} →</button>
        </section>
      )}

      {homepage.featured.enabled && <section className={styles.collection} aria-labelledby="featured-collection-title">
        <div className={styles.collectionHead}>
          <div>
            <p className={styles.eyebrow}>{homepage.featured.eyebrow}</p>
            <h2 id="featured-collection-title">{homepage.featured.heading}</h2>
          </div>
          <button onClick={() => onNavigate('/ebooks')} className={styles.collectionLink}>Explore the library <span>↗</span></button>
        </div>
        <div className={styles.collectionGrid}>
          {featuredProducts.map((book, index) => (
            <article className={styles.collectionCard} key={book.id} style={{ '--delay': `${index * 80}ms` }}>
              <div className={styles.collectionVisual}>
                <span className={styles.collectionIndex}>0{index + 1}</span>
                <div className={styles.coverGlow} />
                <img src={book.image} alt={`${book.title} book cover`} loading="lazy" />
              </div>
              <div className={styles.collectionBody}>
                <div className={styles.collectionMeta}>
                  <span>{book.category}</span>
                  <span className={book.status === 'available' ? styles.available : styles.comingSoon}>{book.status === 'available' ? 'Available now' : 'Coming soon'}</span>
                </div>
                <h3>{book.title}</h3>
                <p>{book.subtitle}</p>
                <div className={styles.collectionFoot}>
                  <strong>₹{Number(book.price || 0).toFixed(0)}</strong>
                  <button onClick={() => onNavigate('/ebooks')}>Discover <span>→</span></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>}

      {homepage.manifesto.enabled && <section className={styles.manifesto}>
        <div className={styles.manifestoNumber}>01</div>
        <div className={styles.manifestoCopy}>
          <p className={styles.eyebrow}>{homepage.manifesto.eyebrow}</p>
          <h2>{homepage.manifesto.heading}</h2>
          <p>{homepage.manifesto.text}</p>
          <button onClick={() => onNavigate('/ebooks')}>Enter the collection</button>
        </div>
        <div className={styles.manifestoValues}>
          {[
            ['Research first', 'Ideas are built on context, observation and a willingness to look deeper.'],
            ['Independent voice', 'Each book keeps its own character instead of following a generic publishing formula.'],
            ['Reader focused', 'A direct digital experience—from discovery and purchase to your private reading library.'],
          ].map(([title, copy], i) => (
            <div className={styles.valueRow} key={title}>
              <span>0{i + 1}</span><div><h3>{title}</h3><p>{copy}</p></div>
            </div>
          ))}
        </div>
      </section>}

      {homepage.sections.journal && <DailyPost onOpenPost={onOpenPost} />}

      {/* ── Journey ──────────────────────────── */}
      {homepage.sections.journey && <section className={styles.feed} id="thoughts">
        <div className={styles.feedLabel}>
          <span className={styles.labelLine} />
          <span className={styles.labelText}>The Journey So Far</span>
          <span className={styles.labelLine} />
        </div>
        <div className={styles.feedTitle}>
          <h2>Behind The <em>Pages</em></h2>
          <p>A glimpse into the journey, the discipline, and the motivation behind every story.</p>
        </div>

        <div className={styles.journeyList}>
          {JOURNEY.map((item, i) => (
            <JourneyEntry key={item.id} item={item} index={i} />
          ))}
        </div>
      </section>}

      {homepage.sections.readerPromise && <section className={styles.readerPromise} aria-labelledby="reader-promise-title">
        <div className={styles.promiseIntro}>
          <p className={styles.eyebrow}>ThePageCraft Reader Promise</p>
          <h2 id="reader-promise-title">A calmer, smarter way to discover meaningful books.</h2>
          <p>Built for readers who value thoughtful writing, secure access and an uninterrupted reading experience on every screen.</p>
        </div>
        <div className={styles.promiseGrid}>
          {[
            ['01', 'Curated ideas', 'Every title is selected to offer substance, perspective and a reason to keep thinking.'],
            ['02', 'Your private library', 'Purchased books stay organised in one personal space, ready whenever you return.'],
            ['03', 'Focused reading', 'A responsive protected reader keeps the book—not the interface—at the centre.'],
            ['04', 'Human support', 'Clear purchase status and a direct support route whenever you need assistance.'],
          ].map(([number, title, copy]) => (
            <article className={styles.promiseCard} key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>}

      <Testimonials />

      {homepage.sections.faq && <section className={styles.faqSection}>
        <div className={styles.faqIntro}>
          <p className={styles.eyebrow}>Reader Help</p>
          <h2>Before you turn the first page.</h2>
          <p>Everything you need to know about purchasing and reading your ThePageCraft books.</p>
          <button onClick={() => onNavigate('/contact')}>Ask for support →</button>
        </div>
        <div className={styles.faqList}>
          {[
            ['Where will I find a purchased book?', 'Sign in with the same account used during checkout and open My Library from the navigation bar.'],
            ['Can I read on a phone or tablet?', 'Yes. The private reader adapts to mobile, tablet and desktop screens.'],
            ['What happens after payment?', 'A successful order is connected to your account and the available title appears in your private library.'],
            ['How can I get help with access?', 'Open the Support page and send the email address used for your ThePageCraft account with your order details.'],
          ].map(([question, answer], index) => (
            <details className={styles.faqItem} key={question} open={index === 0}>
              <summary><span>0{index + 1}</span>{question}<i>+</i></summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>}

      {/* ── About ──────────────────────────── */}
      {homepage.sections.about && <section className={styles.about} id="about" ref={aboutRef} data-visible="false">
        <div className={styles.aboutInner}>
          <div className={styles.aboutLeft}>
            <p className={styles.eyebrow}>{homepage.about.eyebrow}</p>
            <h2 className={styles.aboutName}>{homepage.about.heading}</h2>
            <p className={styles.aboutText}>
              {homepage.about.text}
            </p>
            <p className={styles.aboutText} style={{ marginTop: '16px' }}>
              {homepage.about.text2}
            </p>
            <div className={styles.aboutBtns}>
              <a href="/ebooks" className={styles.btnPrimary} onClick={e => { e.preventDefault(); onNavigate('/ebooks') }}>
                View All Books →
              </a>
              {!user && (
                <button className={styles.btnGhost} onClick={onAuthOpen}>
                  Create Account
                </button>
              )}
            </div>
          </div>
          <div className={styles.aboutRight}>
            <div className={styles.statGrid}>
              {[
                { val: homepage.stats.titles || String(products.length), label: 'Titles' },
                { val: homepage.stats.readers, label: 'Readers' },
                { val: formatRating(homepage.stats.rating), label: 'Rating' },
                { val: '🇮🇳', label: 'Made in India' },
              ].map(s => (
                <div className={styles.stat} key={s.label}>
                  <strong>{s.val}</strong>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>}

    </>
  )
}
