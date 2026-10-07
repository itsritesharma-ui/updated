import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import styles from './CampaignPopup.module.css'

export default function CampaignPopup({ user, onNavigate }) {
  const [campaigns, setCampaigns] = useState([])
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)
  const current = campaigns[0] || null

  useEffect(() => {
    let active = true
    let timer
    const load = async () => {
      if (!user) {
        if (active) { setCampaigns([]); setVisible(false) }
        return
      }
      const { data, error } = await supabase.rpc('get_my_campaigns')
      if (!active || error) return
      setCampaigns(data || [])
      if (data?.length) {
        clearTimeout(timer)
        timer = setTimeout(() => setVisible(true), 850)
      }
    }
    load()
    const poll = setInterval(load, 8000)
    const onFocus = () => load()
    const onVisible = () => document.visibilityState === 'visible' && load()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      active = false
      clearTimeout(timer)
      clearInterval(poll)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [user?.id])

  useEffect(() => {
    if (!current || !visible) return
    supabase.rpc('mark_campaign_event', { target_campaign: current.id, event_name: 'seen' })
  }, [current?.id, visible])

  const typeLabel = useMemo(() => ({
    notification: 'A message for you',
    poster: 'ThePageCraft Promotion',
    coupon: 'Exclusive reader offer'
  }[current?.campaign_type] || 'ThePageCraft Update'), [current?.campaign_type])

  const showNext = () => {
    setVisible(false)
    setCopied(false)
    setCampaigns(list => {
      const next = list.slice(1)
      if (next.length) setTimeout(() => setVisible(true), 450)
      return next
    })
  }

  const dismiss = async () => {
    if (current) await supabase.rpc('mark_campaign_event', { target_campaign: current.id, event_name: 'dismissed' })
    showNext()
  }

  const takeAction = async () => {
    if (!current) return
    if (current.coupon_code) {
      try {
        await navigator.clipboard.writeText(current.coupon_code)
        setCopied(true)
      } catch {
        setCopied(false)
      }
    }
    await supabase.rpc('mark_campaign_event', { target_campaign: current.id, event_name: 'clicked' })
    await supabase.rpc('mark_campaign_event', { target_campaign: current.id, event_name: 'dismissed' })
    const link = current.button_url || (current.coupon_code ? '/ebooks' : '')
    if (link.startsWith('/')) onNavigate?.(link)
    else if (link) window.open(link, '_blank', 'noopener,noreferrer')
    if (current.coupon_code) setTimeout(showNext, 650)
    else showNext()
  }

  const copyCode = async () => {
    if (!current?.coupon_code) return
    try {
      await navigator.clipboard.writeText(current.coupon_code)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  if (!visible || !current) return null

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && dismiss()}>
      <article className={`${styles.popup} ${current.poster_url ? styles.withPoster : ''}`} role="dialog" aria-modal="true" aria-label={current.title}>
        <button className={styles.close} onClick={dismiss} aria-label="Dismiss notification">✕</button>
        {current.poster_url ? (
          <div className={styles.posterWrap}>
            <img src={current.poster_url} alt={current.title} className={styles.poster} />
            <div className={styles.posterShade} />
          </div>
        ) : (
          <div className={styles.visual}>
            <span>{current.campaign_type === 'coupon' ? '%' : current.campaign_type === 'poster' ? '▧' : '✦'}</span>
          </div>
        )}
        <div className={styles.body}>
          <p className={styles.kicker}>{typeLabel}</p>
          <h2>{current.title}</h2>
          <p className={styles.message}>{current.message}</p>
          {current.coupon_code && (
            <button className={styles.coupon} onClick={copyCode} title="Copy coupon code">
              <span>{current.coupon_code}</span>
              <strong>{copied ? 'COPIED ✓' : current.coupon_title || 'COPY CODE'}</strong>
            </button>
          )}
          <div className={styles.actions}>
            <button className={styles.primary} onClick={takeAction}>
              {copied ? 'Coupon copied — Shop now' : current.button_text || (current.coupon_code ? 'Copy & Shop' : 'View Now')}
            </button>
            <button className={styles.later} onClick={dismiss}>Not now</button>
          </div>
          {campaigns.length > 1 && <p className={styles.queue}>1 of {campaigns.length} new messages</p>}
        </div>
      </article>
    </div>
  )
}
