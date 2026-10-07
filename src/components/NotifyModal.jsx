import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import styles from './NotifyModal.module.css'

// Any component can call openNotify(product); <NotifyHost/> (mounted once in App) shows the popup.
export const openNotify = product => window.dispatchEvent(new CustomEvent('tpc-notify', { detail: product }))

export default function NotifyHost() {
  const [product, setProduct] = useState(null)
  const [email, setEmail] = useState('')
  const [trap, setTrap] = useState('')
  const [state, setState] = useState('idle') // idle | busy | done | error
  const [msg, setMsg] = useState('')
  const [uid, setUid] = useState(null)

  useEffect(() => {
    const open = async e => {
      setProduct(e.detail || {}); setState('idle'); setMsg('')
      const { data } = await supabase.auth.getSession()
      setEmail(data.session?.user?.email || ''); setUid(data.session?.user?.id || null)
    }
    window.addEventListener('tpc-notify', open)
    return () => window.removeEventListener('tpc-notify', open)
  }, [])

  if (!product) return null
  const close = () => setProduct(null)

  const submit = async e => {
    e.preventDefault()
    if (trap) return close()
    const clean = email.trim().toLowerCase()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) { setState('error'); setMsg('Please enter a valid email address.'); return }
    setState('busy')
    const { error } = await supabase.from('book_launch_subscribers').insert({ product_id: product.id ?? null, product_title: product.title || null, email: clean, user_id: uid })
    if (error && error.code !== '23505') { setState('error'); setMsg('Could not save right now. Please try again in a moment.'); return }
    setState('done'); setMsg(error ? "You're already on the list for this book." : "You're on the list! We'll email you when it launches.")
  }

  return (
    <div className={styles.back} onClick={close}>
      <div className={styles.box} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Get notified on launch">
        <button className={styles.x} onClick={close} aria-label="Close">✕</button>
        <div className={styles.bell}>🔔</div>
        <h3>Notify me on launch</h3>
        <p className={styles.sub}>{product.title ? <>Be the first to know when <b>{product.title}</b> is out.</> : 'Be the first to know when the next book is out.'}</p>
        {state === 'done' ? (
          <><p className={styles.ok}>✓ {msg}</p><button className={styles.btn} onClick={close}>Done</button></>
        ) : (
          <form onSubmit={submit}>
            <input className={styles.input} type="email" required placeholder="you@gmail.com" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
            <input className={styles.trap} tabIndex={-1} autoComplete="off" value={trap} onChange={e => setTrap(e.target.value)} aria-hidden="true" />
            {state === 'error' && <p className={styles.err}>{msg}</p>}
            <button className={styles.btn} disabled={state === 'busy'}>{state === 'busy' ? 'Saving…' : 'Notify Me'}</button>
            <small>No spam. Only launch updates.</small>
          </form>
        )}
      </div>
    </div>
  )
}
