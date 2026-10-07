import { useState } from 'react'
import { useContent } from '../context/ContentContext'
import styles from './AnnouncementBar.module.css'

const DISMISS_KEY = 'tpc-announcement-dismissed'

export default function AnnouncementBar({ onNavigate }) {
  const { homepage } = useContent()
  const a = homepage.announcement
  const signature = `${a.text}|${a.code}|${a.linkUrl}`
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem(DISMISS_KEY) } catch { return null }
  })
  const [copied, setCopied] = useState(false)

  if (!a.enabled || !String(a.text || '').trim() || dismissed === signature) return null

  const close = () => {
    setDismissed(signature)
    try { sessionStorage.setItem(DISMISS_KEY, signature) } catch { /* ignore */ }
  }

  const copyCode = async () => {
    try { await navigator.clipboard.writeText(a.code); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { /* ignore */ }
  }

  const go = () => {
    const url = String(a.linkUrl || '/ebooks')
    if (/^https?:\/\//i.test(url)) window.open(url, '_blank', 'noopener,noreferrer')
    else onNavigate(url.startsWith('#') ? `/${url}` : url)
  }

  return (
    <div className={styles.bar} role="region" aria-label="Announcement">
      <span>{a.text}</span>
      {a.code && (
        <button className={styles.code} onClick={copyCode} title="Copy code">
          {copied ? 'Copied' : a.code}
        </button>
      )}
      {a.linkText && <button className={styles.link} onClick={go}>{a.linkText}</button>}
      <button className={styles.close} onClick={close} aria-label="Dismiss announcement">×</button>
    </div>
  )
}
