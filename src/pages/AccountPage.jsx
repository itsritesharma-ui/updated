import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import styles from './AccountPage.module.css'

function StatPill({ icon, label, value }) {
  return (
    <div className={styles.statPill}>
      <span className={styles.statIcon}>{icon}</span>
      <div>
        <p className={styles.statVal}>{value}</p>
        <p className={styles.statLabel}>{label}</p>
      </div>
    </div>
  )
}

// Book metadata — same as dashboard
const ALL_BOOKS = {
  1: { title: 'Echoes of Freedom', price: 109 },
  2: { title: 'The Real Bihar', price: 137 },
  3: { title: 'Nature Never Lies!', price: 164 },
}

export default function AccountPage({ user, onClose, onLogout, onNavigate }) {
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('orders')

  useEffect(() => { fetchPurchases() }, [])

  const fetchPurchases = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setPurchases(data || [])
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    onLogout()
    onClose()
  }

  // Derive display info — works for both Google and email users
  const meta = user.user_metadata || {}
  const name = meta.full_name || meta.name || user.email?.split('@')[0] || 'Reader'
  const avatarUrl = meta.avatar_url || meta.picture || null
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
  const isGoogleUser = user.app_metadata?.provider === 'google'
  const joinDate = new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  const totalSpent = purchases.reduce((s, p) => s + (p.amount || ALL_BOOKS[p.product_id]?.price || 0), 0)

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
        </button>

        {/* Hero header */}
        <div className={styles.heroHeader}>
          <div className={styles.heroBg} />
          <div className={styles.avatarWrap}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className={styles.avatarImg} referrerPolicy="no-referrer" />
            ) : (
              <div className={styles.avatar}>{initials}</div>
            )}
            <div className={styles.avatarRing} />
          </div>
          <div className={styles.heroInfo}>
            <h2 className={styles.heroName}>{name}</h2>
            <p className={styles.heroEmail}>{user.email}</p>
            <div className={styles.heroBadge}>
              <span className={styles.heroDot} />
              Member since {joinDate}
              {isGoogleUser && <span className={styles.googleBadge}>via Google</span>}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className={styles.statsRow}>
          <StatPill icon="📚" label="Books Purchased" value={purchases.length} />
          <div className={styles.statDivider} />
          <StatPill icon="₹" label="Total Spent" value={`₹${totalSpent}`} />
          <div className={styles.statDivider} />
          <StatPill icon="⭐" label="Reader Status" value={purchases.length > 0 ? 'Premium' : 'Explorer'} />
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {['orders', 'settings'].map(t => (
            <button key={t} className={`${styles.tab} ${activeTab === t ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(t)}>
              {t === 'orders' ? '📦 My Orders' : '⚙️ Settings'}
            </button>
          ))}
        </div>

        {/* Orders tab */}
        {activeTab === 'orders' && (
          <div className={styles.tabContent}>
            {loading ? (
              <div className={styles.loadingState}>
                <div className={styles.loadingDot} /><div className={styles.loadingDot} /><div className={styles.loadingDot} />
              </div>
            ) : purchases.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>🛒</span>
                <p className={styles.emptyTitle}>No orders yet</p>
                <p className={styles.emptySub}>Discover books that will change how you see India.</p>
                <button className={styles.browseBtn} onClick={() => { onClose(); onNavigate?.('/ebooks') }}>
                  Browse Books →
                </button>
              </div>
            ) : (
              <div className={styles.orderList}>
                {purchases.map(purchase => {
                  const bookInfo = ALL_BOOKS[purchase.product_id] || {}
                  return (
                    <div key={purchase.id} className={styles.orderCard}>
                      <div className={styles.orderIconWrap}>
                        <span>📖</span>
                      </div>
                      <div className={styles.orderInfo}>
                        <p className={styles.orderTitle}>{purchase.book_title || bookInfo.title || `Book #${purchase.product_id}`}</p>
                        <p className={styles.orderDate}>{new Date(purchase.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <div className={styles.orderRight}>
                        <span className={styles.orderPrice}>₹{purchase.amount || bookInfo.price || '—'}</span>
                        <span className={`${styles.orderStatus} ${purchase.status === 'paid' ? styles.statusPaid : styles.statusPending}`}>
                          {purchase.status === 'paid' ? '✓ Delivered' : purchase.status || 'Processing'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Settings tab */}
        {activeTab === 'settings' && (
          <div className={styles.tabContent}>
            <div className={styles.settingsSection}>
              <p className={styles.settingsSectionTitle}>Account Details</p>
              <div className={styles.settingRow}>
                <span className={styles.settingLabel}>Display Name</span>
                <span className={styles.settingValue}>{name}</span>
              </div>
              <div className={styles.settingRow}>
                <span className={styles.settingLabel}>Email</span>
                <span className={styles.settingValue}>{user.email}</span>
              </div>
              <div className={styles.settingRow}>
                <span className={styles.settingLabel}>Login Method</span>
                <span className={styles.settingValue}>{isGoogleUser ? '🔵 Google Account' : '📧 Email & Password'}</span>
              </div>
              <div className={styles.settingRow}>
                <span className={styles.settingLabel}>Member Since</span>
                <span className={styles.settingValue}>{joinDate}</span>
              </div>
            </div>
            <div className={styles.settingsSection}>
              <p className={styles.settingsSectionTitle}>Preferences</p>
              <div className={styles.settingRow}>
                <span className={styles.settingLabel}>Reading Format</span>
                <span className={styles.settingValue}>Digital PDF</span>
              </div>
              <div className={styles.settingRow}>
                <span className={styles.settingLabel}>Language</span>
                <span className={styles.settingValue}>English</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
