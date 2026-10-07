import { useState, useEffect, useRef } from 'react'
import { useContent } from '../context/ContentContext'
import styles from './SearchOverlay.module.css'

const PAGES = [
  { label: 'Home', path: '/', desc: 'Landing page & hero', icon: '🏠' },
  { label: 'eBooks', path: '/ebooks', desc: 'Browse all books', icon: '📚' },
  { label: 'About', path: '/#about', desc: 'About Ritesh Sharma', icon: '👤' },
  { label: 'Contact', path: '/contact', desc: 'Get in touch', icon: '✉' },
]

const RECENT_KEY = 'tpc-recent-searches'
function loadRecent() { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').slice(0, 5) } catch { return [] } }

const QUICK = ['History', 'Nature', 'Bihar', 'Echoes', 'Freedom', 'eBook', 'available']

function highlight(text, query) {
  if (!query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className={styles.hl}>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

export default function SearchOverlay({ onNavigate, onSelectBook }) {
  const { products } = useContent()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const [recent, setRecent] = useState(loadRecent)
  const remember = (term) => {
    const t = (term || '').trim()
    if (t.length < 2) return
    const next = [t, ...recent.filter(r => r.toLowerCase() !== t.toLowerCase())].slice(0, 5)
    setRecent(next)
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  }
  const clearRecent = () => { setRecent([]); try { localStorage.removeItem(RECENT_KEY) } catch { /* ignore */ } }
  const inputRef = useRef(null)
  const listRef = useRef(null)

  const q = query.trim().toLowerCase()

  const bookResults = q.length > 0
    ? products.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.badge || '').toLowerCase().includes(q) ||
        p.status.toLowerCase().includes(q)
      )
    : []

  const pageResults = q.length > 0
    ? PAGES.filter(p =>
        p.label.toLowerCase().includes(q) ||
        p.desc.toLowerCase().includes(q)
      )
    : []

  const allResults = [...bookResults.map(b => ({ type: 'book', data: b })), ...pageResults.map(p => ({ type: 'page', data: p }))]

  useEffect(() => { setSelected(0) }, [query])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150)
    else setQuery('')
  }, [open])

  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen(true) }
      if (e.key === 'Escape') setOpen(false)
      if (!open) return
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, allResults.length - 1)) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
      if (e.key === 'Enter' && allResults[selected]) {
        const r = allResults[selected]
        remember(query)
        if (r.type === 'book') { onSelectBook?.(r.data); setOpen(false) }
        else { onNavigate(r.data.path); setOpen(false) }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, allResults, selected])

  const handleBookClick = (book) => { remember(query); onSelectBook?.(book); setOpen(false) }
  const handlePageClick = (p) => { onNavigate(p.path); setOpen(false) }

  return (
    <>
      <button
        className={`${styles.fab} ${open ? styles.fabOpen : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Search"
      >
        <span className={styles.fabRing} />
        {open
          ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        }
        <span className={styles.fabPulse} />
      </button>

      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)}>
          <div className={styles.panel} onClick={e => e.stopPropagation()}>

            {/* Input */}
            <div className={styles.searchRow}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={styles.searchIcon}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                ref={inputRef}
                className={styles.input}
                placeholder="Search books, authors, topics, pages…"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              {query && (
                <button className={styles.clearBtn} onClick={() => setQuery('')}>✕</button>
              )}
              <kbd className={styles.esc} onClick={() => setOpen(false)}>ESC</kbd>
            </div>

            {/* Quick chips */}
            {query.trim() === '' && (
              <div className={styles.quickSection}>
                {recent.length > 0 && (
                  <>
                    <p className={styles.quickLabel}>Recent <button className={styles.clearRecent} onClick={clearRecent}>Clear</button></p>
                    <div className={styles.quickChips}>
                      {recent.map(t => (
                        <button key={t} className={styles.chip} onClick={() => setQuery(t)}>🕘 {t}</button>
                      ))}
                    </div>
                  </>
                )}
                <p className={styles.quickLabel}>Quick search</p>
                <div className={styles.quickChips}>
                  {QUICK.map(t => (
                    <button key={t} className={styles.chip} onClick={() => setQuery(t)}>{t}</button>
                  ))}
                </div>
                <div className={styles.allPages}>
                  <p className={styles.quickLabel}>Pages</p>
                  {PAGES.map(p => (
                    <button key={p.path} className={styles.pageRow} onClick={() => handlePageClick(p)}>
                      <span className={styles.pageIcon}>{p.icon}</span>
                      <span className={styles.pageLabel}>{p.label}</span>
                      <span className={styles.pageDesc}>{p.desc}</span>
                      <span className={styles.pageArrow}>↗</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Results */}
            {q.length > 0 && (
              <div className={styles.results} ref={listRef}>

                {bookResults.length > 0 && (
                  <div className={styles.resultGroup}>
                    <p className={styles.groupLabel}>Books</p>
                    {bookResults.map((book, i) => (
                      <button
                        key={book.id}
                        className={`${styles.bookResult} ${selected === i ? styles.resultSelected : ''}`}
                        onClick={() => handleBookClick(book)}
                        onMouseEnter={() => setSelected(i)}
                      >
                        <div className={styles.bookResultImg}>
                          <img src={book.image} alt={book.title} />
                        </div>
                        <div className={styles.bookResultInfo}>
                          <span className={styles.bookResultCat}>{book.category}</span>
                          <span className={styles.bookResultTitle}>{highlight(book.title, query.trim())}</span>
                          <span className={styles.bookResultSub}>{highlight(book.subtitle, query.trim())}</span>
                        </div>
                        <div className={styles.bookResultPrice}>
                          <span className={styles.bookPrice}>₹{book.price}</span>
                          {book.status === 'coming_soon' && <span className={styles.soonTag}>Soon</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {pageResults.length > 0 && (
                  <div className={styles.resultGroup}>
                    <p className={styles.groupLabel}>Pages</p>
                    {pageResults.map((p, i) => (
                      <button
                        key={p.path}
                        className={`${styles.pageRow} ${styles.pageRowResult} ${selected === bookResults.length + i ? styles.resultSelected : ''}`}
                        onClick={() => handlePageClick(p)}
                        onMouseEnter={() => setSelected(bookResults.length + i)}
                      >
                        <span className={styles.pageIcon}>{p.icon}</span>
                        <span className={styles.pageLabel}>{highlight(p.label, query.trim())}</span>
                        <span className={styles.pageDesc}>{p.desc}</span>
                        <span className={styles.pageArrow}>↗</span>
                      </button>
                    ))}
                  </div>
                )}

                {allResults.length === 0 && (
                  <div className={styles.empty}>
                    <p>No results for "<strong>{query}</strong>"</p>
                    <p className={styles.emptyHint}>Try: book name, author, category, or page name</p>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className={styles.footer}>
              <span><kbd>↑↓</kbd> navigate</span>
              <span><kbd>↵</kbd> select</span>
              <span><kbd>ESC</kbd> close</span>
              <span><kbd>⌘K</kbd> open</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
