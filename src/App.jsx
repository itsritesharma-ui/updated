import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import AnnouncementBar from './components/AnnouncementBar'
import Ticker from './components/Ticker'
import Navbar from './components/Navbar'
import CartPanel from './components/CartPanel'
import AuthPage from './pages/AuthPage'
import AccountPage from './pages/AccountPage'
import HomePage from './pages/HomePage'
import EbooksPage from './pages/EbooksPage'
import BookDetailPage from './pages/BookDetailPage'
import BookReaderPage from './pages/BookReaderPage'
import DailyPostPage from './pages/DailyPostPage'
import { useContent } from './context/ContentContext'
import AnimatedBackground from './components/AnimatedBackground'
import PageTransition from './components/PageTransition'
import MyBooksPage from './pages/MyBooksPage'
import ContactPage from './pages/ContactPage'
import ThemeToggle from './components/ThemeToggle'
import SearchOverlay from './components/SearchOverlay'
import SiteEnhancements from './components/SiteEnhancements'
import CampaignPopup from './components/CampaignPopup'
import NotifyHost from './components/NotifyModal'
import styles from './App.module.css'

function getPage() {
  if (typeof window !== 'undefined') {
    const path = window.location.pathname
    if (path.startsWith('/ebooks')) return 'ebooks'
    if (path.startsWith('/contact')) return 'contact'
    if (path.startsWith('/read/')) return 'reader'
    if (path.startsWith('/post/')) return 'daily-post'
    if (path.startsWith('/payment-success')) return 'payment-success'
    if (path.startsWith('/payment-failed')) return 'payment-failed'
  }
  return 'home'
}

function getInitialPostSlug() {
  if (typeof window !== 'undefined') {
    const match = window.location.pathname.match(/^\/post\/([^/]+)/)
    if (match) return match[1]
  }
  return null
}

export default function App() {
  const { posts, homepage } = useContent()
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [myBooksOpen, setMyBooksOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [page, setPage] = useState(getPage())
  const [readerBookId, setReaderBookId] = useState(null)
  const [selectedBook, setSelectedBook] = useState(null)
  const [selectedPost, setSelectedPost] = useState(null)
  const [selectedPostSlug, setSelectedPostSlug] = useState(getInitialPostSlug)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (event === 'SIGNED_IN' && currentUser) setAuthOpen(false)
      if (event === 'SIGNED_OUT') { setAccountOpen(false); setCart([]) }
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const handlePopState = () => {
      setPage(getPage())
      setSelectedBook(null)
      setSelectedPostSlug(getInitialPostSlug())
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (!selectedPostSlug) {
      setSelectedPost(null)
      return
    }
    setSelectedPost(posts.find(post => post.slug === selectedPostSlug) || null)
  }, [posts, selectedPostSlug])

  const navigate = (to) => {
    window.history.pushState({}, '', to)
    if (to.startsWith('/ebooks')) setPage('ebooks')
    else if (to.startsWith('/contact')) setPage('contact')
    else setPage('home')
    setSelectedBook(null)
    setSelectedPost(null)
    setSelectedPostSlug(null)
    const hashIdx = to.indexOf('#')
    if (hashIdx !== -1) {
      const id = to.slice(hashIdx + 1)
      requestAnimationFrame(() => {
        setTimeout(() => {
          document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
        }, 50)
      })
    } else {
      window.scrollTo(0, 0)
    }
  }

  const openReader = (bookId) => {
    setReaderBookId(bookId)
    setPage('reader')
    window.history.pushState({}, '', `/read/${bookId}`)
    window.scrollTo(0, 0)
  }
  const closeReader = () => navigate('/ebooks')

  const openBookDetail = (book) => {
    setSelectedPost(null)
    setSelectedPostSlug(null)
    setSelectedBook(book)
    window.history.pushState({}, '', `/ebooks/${book.id}`)
    window.scrollTo(0, 0)
  }
  const closeBookDetail = () => {
    setSelectedBook(null)
    window.history.pushState({}, '', '/ebooks')
    window.scrollTo(0, 0)
  }

  const openPost = (post) => {
    setSelectedBook(null)
    setSelectedPostSlug(post.slug)
    setSelectedPost(post)
    window.history.pushState({}, '', `/post/${post.slug}`)
    window.scrollTo(0, 0)
  }
  const closePost = () => {
    setSelectedPost(null)
    setSelectedPostSlug(null)
    window.history.pushState({}, '', '/')
    setPage('home')
    window.scrollTo(0, 0)
  }

  const addToCart = (product) => setCart(prev => prev.find(i => i.id === product.id) ? prev : [...prev, product])
  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id))

  const isReader = page === 'reader'

  if (isReader) {
    return (
      <div className={styles.app}>
        <PageTransition pageKey="reader">
          <BookReaderPage productId={readerBookId} onBack={closeReader} />
        </PageTransition>
        <ThemeToggle />
      </div>
    )
  }

  const pageKey = selectedBook ? `book-${selectedBook.id}` : selectedPost ? `post-${selectedPost.slug}` : page

  return (
    <div className={styles.app}>
      <SiteEnhancements />
      <AnimatedBackground />
      <div className={styles.content}>
        <AnnouncementBar onNavigate={navigate} />
        <Ticker />
        <Navbar
          cartCount={cart.length}
          onCartOpen={() => setCartOpen(true)}
          user={user}
          onAuthOpen={() => setAuthOpen(true)}
          onAccountOpen={() => setAccountOpen(true)}
          onMyBooksOpen={() => setMyBooksOpen(true)}
          onNavigate={navigate}
          currentPage={page}
        />

        <main>
          <PageTransition pageKey={pageKey}>
            {page === 'home' && !selectedBook && !selectedPost && <HomePage onAuthOpen={() => setAuthOpen(true)} user={user} onNavigate={navigate} onOpenPost={openPost} />}
            {page === 'ebooks' && !selectedBook && !selectedPost && (
              <EbooksPage
                cart={cart}
                onAdd={addToCart}
                user={user}
                onAuthOpen={() => setAuthOpen(true)}
                onSelectBook={openBookDetail}
              />
            )}
            {page === 'contact' && !selectedBook && !selectedPost && <ContactPage user={user} onAuthOpen={() => setAuthOpen(true)} />}
            {page === 'payment-success' && (
              <section className={styles.statusPage}>
                <div className={`${styles.statusCard} ${styles.successCard}`}>
                  <span className={styles.statusIcon}>✓</span>
                  <p className={styles.statusEyebrow}>ORDER CONFIRMED</p>
                  <h1>Payment successful</h1>
                  <p>Your payment has been received. Your purchased book will appear in My Library after verification.</p>
                  <div className={styles.statusActions}>
                    <button onClick={() => user ? setMyBooksOpen(true) : setAuthOpen(true)}>Open My Library</button>
                    <button className={styles.statusGhost} onClick={() => navigate('/ebooks')}>Continue browsing</button>
                  </div>
                </div>
              </section>
)}

{page === 'payment-failed' && (
              <section className={styles.statusPage}>
                <div className={`${styles.statusCard} ${styles.failedCard}`}>
                  <span className={styles.statusIcon}>!</span>
                  <p className={styles.statusEyebrow}>PAYMENT NOT COMPLETED</p>
                  <h1>Please try again</h1>
                  <p>No order was confirmed and you have not been given book access. You can safely return to the store and retry.</p>
                  <div className={styles.statusActions}>
                    <button onClick={() => navigate('/ebooks')}>Return to eBooks</button>
                    <button className={styles.statusGhost} onClick={() => navigate('/contact')}>Contact support</button>
                  </div>
                </div>
              </section>
)}
            {selectedBook && (
              <BookDetailPage
                product={selectedBook}
                onBack={closeBookDetail}
                cart={cart}
                onAdd={addToCart}
                user={user}
                onAuthOpen={() => setAuthOpen(true)}
              />
            )}
            {selectedPost && (
              <DailyPostPage post={selectedPost} onBack={closePost} />
            )}
          </PageTransition>
        </main>

        <footer className={styles.footer}>
          <div className={styles.footerTop}>
            <div className={styles.footerBrand}>
              <p className={styles.footerLogo}>{homepage.footer.brand}</p>
              <p className={styles.footerTagline}>{homepage.footer.tagline}</p>
              <p className={styles.footerCopy}>{homepage.footer.text}</p>
            </div>
            <div className={styles.footerColumns}>
              <div className={styles.footerColumn}>
                <strong>Explore</strong>
                <button onClick={() => navigate('/')}>Home</button>
                <button onClick={() => navigate('/ebooks')}>eBooks</button>
                <button onClick={() => navigate('/#thoughts')}>Journal</button>
              </div>
              <div className={styles.footerColumn}>
                <strong>Account</strong>
                <button onClick={() => user ? setMyBooksOpen(true) : setAuthOpen(true)}>My Library</button>
                <button onClick={() => user ? setAccountOpen(true) : setAuthOpen(true)}>{user ? 'My Account' : 'Login'}</button>
                <button onClick={() => navigate('/contact')}>Support</button>
              </div>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p>© {new Date().getFullYear()} The Pagecraft — thepagecraft.in. All rights reserved.</p>
          </div>
        </footer>
      </div>

      <SearchOverlay onNavigate={navigate} onSelectBook={openBookDetail} />
      <ThemeToggle />
      {cartOpen && <CartPanel cart={cart} onClose={() => setCartOpen(false)} onRemove={removeFromCart} user={user} />}
      {authOpen && <AuthPage onClose={() => setAuthOpen(false)} onAuth={setUser} />}
      {myBooksOpen && <MyBooksPage user={user} onClose={() => setMyBooksOpen(false)} />}
      {accountOpen && user && (
        <AccountPage
          user={user}
          onClose={() => setAccountOpen(false)}
          onLogout={() => setUser(null)}
          onNavigate={navigate}
        />
      )}
      <CampaignPopup user={user} onNavigate={navigate} />
      <NotifyHost />
    </div>
  )
}
