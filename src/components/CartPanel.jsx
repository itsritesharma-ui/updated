import { useEffect, useState } from 'react'
import styles from './CartPanel.module.css'
import { supabase } from '../lib/supabase'



export default function CartPanel({ cart, onClose, onRemove, user }) {
  const [view, setView] = useState('cart')
  const [form, setForm] = useState({
  name: '',
  email: '',
  phone: ''
})
  const [errors, setErrors] = useState({})
  const [successEmail, setSuccessEmail] = useState('')
  const [processing, setProcessing] = useState(false)
  const [couponInput, setCouponInput] = useState('')
  const [quote, setQuote] = useState(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponMessage, setCouponMessage] = useState('')

  const subtotal = cart.reduce((s, i) => s + Number(i.price || 0), 0)
  const total = quote?.valid ? Number(quote.total) : subtotal

  useEffect(() => {
    const meta = user?.user_metadata || {}
    if (user) setForm(f => ({
      ...f,
      name: f.name || meta.full_name || meta.name || '',
      email: f.email || user.email || ''
    }))
  }, [user])

  useEffect(() => {
    setQuote(null)
    setCouponMessage('')
  }, [cart.map(item => item.id).join(',')])

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase()
    if (!user) {
      setCouponMessage('Please login before applying a coupon.')
      return
    }
    if (!code) {
      setCouponMessage('Enter a coupon code first.')
      return
    }
    setCouponLoading(true)
    setCouponMessage('')
    const { data, error } = await supabase.rpc('quote_order', {
      item_ids: cart.map(item => Number(item.id)),
      coupon_code: code
    })
    setCouponLoading(false)
    if (error || !data?.valid) {
      setQuote(null)
      setCouponMessage(data?.error || error?.message || 'Coupon could not be applied.')
      return
    }
    setCouponInput(data.coupon_code || code)
    setQuote(data)
    setCouponMessage(`${data.title || 'Coupon'} applied — you save ₹${Number(data.discount).toFixed(2)}.`)
  }

  const removeCoupon = () => {
    setCouponInput('')
    setQuote(null)
    setCouponMessage('')
  }

  const validate = () => {
  const e = {}

  if (!form.name.trim()) e.name = 'Full name is required'

  if (!form.email.includes('@'))
    e.email = 'Enter a valid email address'

  if (form.phone.replace(/\D/g, '').length !== 10)
    e.phone = 'Enter a valid 10-digit phone number'

  setErrors(e)
  return Object.keys(e).length === 0
}

  const handlePay = async () => {
    if (!validate()) return

    if (!user) {
      setErrors({ payment: 'Please login before starting payment.' })
      return
    }

    setProcessing(true)
    setErrors({})

    try {
      if (!window.Razorpay) throw new Error('Payment gateway could not load. Check your internet and try again.')

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Your login session expired. Please login again.')
      const authHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }

      // 1) Backend creates the order. Amount comes from the database price, never from the browser.
      const response = await fetch('/api/create-razorpay-order', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          productIds: cart.map(item => Number(item.id)),
          couponCode: quote?.coupon_code || ''
        })
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Unable to start payment')

      // 2) Open Razorpay checkout modal
      const rzp = new window.Razorpay({
        key: data.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        order_id: data.order_id,
        name: 'ThePageCraft',
        description: `${cart.length} eBook${cart.length > 1 ? 's' : ''}`,
        prefill: { name: form.name.trim(), email: form.email.trim(), contact: form.phone.trim() },
        theme: { color: '#FF9933' },
        modal: {
          // user closed the popup without paying
          ondismiss: () => {
            setProcessing(false)
            setErrors({ payment: 'Payment cancelled. You can try again whenever you are ready.' })
          }
        },
        // 3) Payment done in popup -> verify signature on the backend
        handler: async (result) => {
          try {
            const verifyRes = await fetch('/api/verify-razorpay-payment', {
              method: 'POST',
              headers: authHeaders,
              body: JSON.stringify({
                razorpay_payment_id: result.razorpay_payment_id,
                razorpay_order_id: result.razorpay_order_id,
                razorpay_signature: result.razorpay_signature
              })
            })
            const verify = await verifyRes.json().catch(() => ({}))
            if (!verifyRes.ok || !verify.success) throw new Error(verify.error || 'Payment verification failed')
            window.location.href = `/payment-success?txnid=${encodeURIComponent(verify.paymentId || result.razorpay_payment_id)}&sync=${verify.sync || 'pending'}`
          } catch (verifyError) {
            console.error('Razorpay verify error:', verifyError)
            setProcessing(false)
            setErrors({ payment: `${verifyError.message}. If money was deducted, contact support with payment id ${result.razorpay_payment_id}.` })
          }
        }
      })

      rzp.on('payment.failed', (failure) => {
        setProcessing(false)
        setErrors({ payment: failure?.error?.description || 'Payment failed. Please try again.' })
      })

      rzp.open()
    } catch (err) {
      console.error('Razorpay payment error:', err)
      setErrors({ payment: err.message || 'Payment could not be started' })
      setProcessing(false)
    }
  }

  const handleClose = () => {
  setView('cart')
  setForm({
    name: '',
    email: '',
    phone: ''
  })
  setErrors({})
  setCouponInput('')
  setQuote(null)
  setCouponMessage('')
  onClose()
}

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && handleClose()}>
      <div className={styles.panel} role="dialog" aria-modal="true" aria-label="Shopping cart">

        {/* CART */}
        {view === 'cart' && (
          <>
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                <div className={styles.cartIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                </div>
                <div>
                  <span className={styles.panelTitle}>Your Cart</span>
                  <span className={styles.cartCount}>{cart.length} item{cart.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <button className={styles.closeBtn} onClick={handleClose} aria-label="Close cart">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              </button>
            </div>

            <div className={styles.body}>
              {cart.length === 0 ? (
                <div className={styles.empty}>
                  <div className={styles.emptyIllustration}>
                    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                      <circle cx="28" cy="28" r="28" fill="rgba(201,146,42,0.06)"/>
                      <path d="M18 20h3l2 10h12l2-10h3" stroke="rgba(201,146,42,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
                      <circle cx="25" cy="34" r="1.5" fill="rgba(201,146,42,0.4)"/>
                      <circle cx="33" cy="34" r="1.5" fill="rgba(201,146,42,0.4)"/>
                    </svg>
                  </div>
                  <p className={styles.emptyTitle}>Your cart is empty</p>
                  <p className={styles.emptySub}>Discover books that will change the way you think.</p>
                  <button className={styles.ghostBtn} onClick={handleClose}>Browse eBooks</button>
                </div>
              ) : (
                <>
                  <div className={styles.cartItems}>
                    {cart.map(item => (
                      <div key={item.id} className={styles.cartItem}>
                        <div className={styles.itemImgWrap}>
                          {item.image ? (
                            <img src={item.image} alt={item.title} className={styles.itemImg} />
                          ) : (
                            <div className={styles.itemImgPlaceholder}>📖</div>
                          )}
                        </div>
                        <div className={styles.itemInfo}>
                          <p className={styles.itemTitle}>{item.title}</p>
                          <p className={styles.itemCat}>{item.category} · Digital</p>
                        </div>
                        <div className={styles.itemRight}>
                          <span className={styles.itemPrice}>₹{item.price}</span>
                          <button className={styles.rmBtn} onClick={() => onRemove(item.id)} aria-label={`Remove ${item.title}`}>
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={styles.cartFooter}>
                    <div className={styles.totalRow}>
                      <div>
                        <span className={styles.totalLabel}>Order Total</span>
                        <span className={styles.totalNote}>Digital download · Instant delivery</span>
                      </div>
                      <span className={styles.totalVal}>₹{total}</span>
                    </div>
                    <button className={styles.primaryBtn} onClick={() => setView('checkout')}>
                      <span>Proceed to Checkout</span>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <button className={styles.ghostBtn} onClick={handleClose}>Continue Shopping</button>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* CHECKOUT */}
        {view === 'checkout' && (
          <>
            <div className={styles.header}>
              <button className={styles.backBtn} onClick={() => setView('cart')}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M10 7H2M6 3L2 7l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Back
              </button>
              <span className={styles.panelTitle}>Secure Checkout</span>
              <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              </button>
            </div>

            <div className={styles.body}>
              <div className={styles.secureNote}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span>256-bit SSL encrypted · Secure payment</span>
              </div>

              <div className={styles.fieldSection}>
                <p className={styles.fieldSectionTitle}>Delivery Info</p>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Full Name</label>
                  <input className={`${styles.input} ${errors.name ? styles.inputErr : ''}`}
                    placeholder="Ritesh Sharma" value={form.name}
                    onChange={e => { setForm(f=>({...f,name:e.target.value})); setErrors(er=>({...er,name:''})) }} />
                  {errors.name && <p className={styles.errMsg}>{errors.name}</p>}
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Email Address</label>
                  <input className={`${styles.input} ${errors.email ? styles.inputErr : ''}`}
                    placeholder="you@example.com" value={form.email} type="email"
                    onChange={e => { setForm(f=>({...f,email:e.target.value})); setErrors(er=>({...er,email:''})) }} />
                  {errors.email && <p className={styles.errMsg}>{errors.email}</p>}
                </div>
              </div>

              <div className={styles.formGroup}>
  <label className={styles.label}>Phone Number</label>
  <input
    className={`${styles.input} ${errors.phone ? styles.inputErr : ''}`}
    placeholder="9876543210"
    value={form.phone}
    inputMode="numeric"
    maxLength={10}
    onChange={e => {
      setForm(f => ({
        ...f,
        phone: e.target.value.replace(/\D/g, '').slice(0, 10)
      }))
      setErrors(er => ({
        ...er,
        phone: ''
      }))
    }}
  />
  {errors.phone && <p className={styles.errMsg}>{errors.phone}</p>}
</div>

              <div className={styles.couponBox}>
                <div className={styles.couponHeading}>
                  <div>
                    <span className={styles.couponKicker}>SPECIAL OFFER</span>
                    <strong>Have a coupon code?</strong>
                  </div>
                  {quote?.valid && <span className={styles.appliedBadge}>✓ Applied</span>}
                </div>
                <div className={styles.couponRow}>
                  <input
                    className={styles.input}
                    value={couponInput}
                    maxLength={24}
                    placeholder="Enter code"
                    onChange={e => {
                      setCouponInput(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))
                      setCouponMessage('')
                    }}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), applyCoupon())}
                  />
                  {quote?.valid ? (
                    <button className={styles.couponRemove} onClick={removeCoupon}>Remove</button>
                  ) : (
                    <button className={styles.couponApply} onClick={applyCoupon} disabled={couponLoading}>
                      {couponLoading ? 'Checking…' : 'Apply'}
                    </button>
                  )}
                </div>
                {couponMessage && (
                  <p className={`${styles.couponMessage} ${quote?.valid ? styles.couponSuccess : styles.couponError}`}>
                    {couponMessage}
                  </p>
                )}
              </div>

              <div className={styles.orderSummary}>
                <p className={styles.summaryHeading}>Order Summary</p>
                {cart.map(i => (
                  <div key={i.id} className={styles.summaryRow}>
                    <span>{i.title}</span>
                    <span className={styles.summaryPrice}>₹{i.price}</span>
                  </div>
                ))}
                {quote?.valid && (
                  <>
                    <div className={styles.summaryRow}>
                      <span>Subtotal</span>
                      <span className={styles.summaryPrice}>₹{Number(quote.subtotal).toFixed(2)}</span>
                    </div>
                    <div className={`${styles.summaryRow} ${styles.discountRow}`}>
                      <span>Coupon · {quote.coupon_code}</span>
                      <span>− ₹{Number(quote.discount).toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                  <span>Total</span>
                  <span>₹{Number(total).toFixed(2)}</span>
                </div>
              </div>
             
              {errors.payment && (
  <p className={styles.errMsg}>{errors.payment}</p>
)}

              <button className={styles.primaryBtn} onClick={handlePay} disabled={processing}>
                {processing ? (
                  <><span className={styles.spinner} /> Processing...</>
                ) : (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> Pay ₹{Number(total).toFixed(2)} Securely</>
                )}
              </button>
              <button className={styles.ghostBtn} onClick={() => setView('cart')}>Back to Cart</button>
            </div>
          </>
        )}

        {/* SUCCESS */}
        {view === 'success' && (
          <div className={styles.success}>
            <div className={styles.successRing}>
              <div className={styles.successIcon}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M6 14l6 6 10-12" stroke="var(--gold)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
            <h2 className={styles.successTitle}>Order Confirmed!</h2>
            <p className={styles.successMsg}>Your digital downloads have been sent to</p>
            <span className={styles.successEmail}>{successEmail}</span>
            <p className={styles.successNote}>Check your inbox — your books will arrive within a few minutes.</p>
            <button className={styles.primaryBtn} onClick={handleClose} style={{ marginTop: 28 }}>
              Back to eBooks
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
