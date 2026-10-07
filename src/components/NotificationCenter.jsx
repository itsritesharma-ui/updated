import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import styles from './NotificationCenter.module.css'

export default function NotificationCenter({ user, onAuthOpen, onNavigate }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(Boolean(user))
  const [error, setError] = useState('')
  const [readIds, setReadIds] = useState(() => new Set())
  const [copiedCode, setCopiedCode] = useState('')

  const loadNotifications = useCallback(async (quiet = false) => {
    if (!user) {
      setItems([])
      setLoading(false)
      return
    }
    if (!quiet) setLoading(true)
    const { data, error: requestError } = await supabase.rpc('get_my_campaigns')
    if (requestError) {
      setError('Notifications could not be loaded. Please refresh once.')
    } else {
      setError('')
      setItems(data || [])
    }
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    loadNotifications()
    if (!user) return undefined
    const poll = setInterval(() => loadNotifications(true), 8000)
    const onFocus = () => loadNotifications(true)
    const onVisible = () => document.visibilityState === 'visible' && loadNotifications(true)
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(poll)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [user?.id, loadNotifications])

  const markRead = async (item) => {
    setReadIds(current => new Set([...current, item.id]))
    await supabase.rpc('mark_campaign_event', { target_campaign: item.id, event_name: 'seen' })
  }

  const dismiss = async (item) => {
    setItems(current => current.filter(entry => entry.id !== item.id))
    await supabase.rpc('mark_campaign_event', { target_campaign: item.id, event_name: 'dismissed' })
  }

  const takeAction = async (item) => {
    if (item.coupon_code) {
      try {
        await navigator.clipboard.writeText(item.coupon_code)
        setCopiedCode(item.coupon_code)
      } catch {
        setCopiedCode('')
      }
    }
    await supabase.rpc('mark_campaign_event', { target_campaign: item.id, event_name: 'clicked' })
    const link = item.button_url || (item.coupon_code ? '/ebooks' : '')
    if (link.startsWith('/')) onNavigate?.(link)
    else if (link) window.open(link, '_blank', 'noopener,noreferrer')
  }

  const copyCoupon = async (item) => {
    try {
      await navigator.clipboard.writeText(item.coupon_code)
      setCopiedCode(item.coupon_code)
      await markRead(item)
    } catch {
      setCopiedCode('')
    }
  }

  return (
    <section className={styles.section} id="notifications" aria-labelledby="notification-center-title">
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Direct from ThePageCraft</p>
          <h2 id="notification-center-title">My Notifications</h2>
          <p>Private updates, promotional posters and coupons sent to your account.</p>
        </div>
        {user && (
          <button className={styles.refresh} onClick={() => loadNotifications()} disabled={loading}>
            {loading ? 'Checking…' : `Refresh · ${items.length}`}
          </button>
        )}
      </div>

      {!user ? (
        <div className={styles.loginCard}>
          <span className={styles.loginIcon}>✦</span>
          <div>
            <h3>Sign in to receive your updates</h3>
            <p>Notifications sent by the owner appear here only for the selected customer account.</p>
          </div>
          <button onClick={onAuthOpen}>Sign in</button>
        </div>
      ) : loading && !items.length ? (
        <div className={styles.empty}>Checking your private notification inbox…</div>
      ) : error ? (
        <div className={styles.error}>{error}<button onClick={() => loadNotifications()}>Try again</button></div>
      ) : items.length === 0 ? (
        <div className={styles.empty}>
          <span>✓</span>
          <div><h3>You're all caught up</h3><p>New messages sent to {user.email} will automatically appear here.</p></div>
        </div>
      ) : (
        <div className={styles.grid}>
          {items.map(item => (
            <article className={`${styles.card} ${readIds.has(item.id) ? styles.read : ''}`} key={item.id} onMouseEnter={() => markRead(item)}>
              {item.poster_url ? (
                <img src={item.poster_url} alt={item.title} className={styles.poster} />
              ) : (
                <div className={styles.art}><span>{item.campaign_type === 'coupon' ? '%' : item.campaign_type === 'poster' ? '▧' : '✦'}</span></div>
              )}
              <div className={styles.body}>
                <div className={styles.meta}>
                  <span>{item.campaign_type}</span>
                  {!readIds.has(item.id) && <i>New</i>}
                </div>
                <h3>{item.title}</h3>
                <p>{item.message}</p>
                {item.coupon_code && (
                  <button className={styles.coupon} onClick={() => copyCoupon(item)}>
                    <strong>{item.coupon_code}</strong>
                    <span>{copiedCode === item.coupon_code ? 'Copied ✓' : item.coupon_title || 'Copy coupon'}</span>
                  </button>
                )}
                <div className={styles.actions}>
                  {(item.button_url || item.coupon_code) && <button className={styles.primary} onClick={() => takeAction(item)}>{item.button_text || (item.coupon_code ? 'Copy & explore' : 'Open')}</button>}
                  <button className={styles.dismiss} onClick={() => dismiss(item)}>Dismiss</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
