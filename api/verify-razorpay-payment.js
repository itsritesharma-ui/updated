import crypto from 'crypto'
import Razorpay from 'razorpay'

const DEFAULT_SUPABASE_URL = 'https://plzlvgdlscwhbfrpcjtp.supabase.co'

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

async function recordPaidOrder({ paymentId, userId, productIds, couponCode, amount }) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing')
  const response = await fetch(`${url}/rest/v1/rpc/complete_paid_order`, {
    method: 'POST',
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      payment_transaction_id: paymentId, // unique per payment -> makes the call idempotent
      target_user: userId,
      item_ids: productIds,
      coupon_code: couponCode || null,
      paid_amount: Number(amount)
    })
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.message || 'Could not record paid order')
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body || {}
    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keyId || !keySecret) return res.status(500).json({ error: 'Razorpay credentials are not configured' })
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment fields' })
    }

    // HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const expected = crypto.createHmac('sha256', keySecret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex')
    if (!safeEqual(expected, razorpay_signature)) {
      return res.status(400).json({ success: false, error: 'Payment signature mismatch' })
    }

    // Signature is valid. Read the order from Razorpay (trusted source) to get who/what/how much.
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret })
    const order = await razorpay.orders.fetch(razorpay_order_id)
    const notes = order.notes || {}
    const productIds = String(notes.product_ids || '').split(',').map(Number).filter(Number.isInteger)
    if (!notes.user_id || !productIds.length) {
      return res.status(200).json({ success: true, paymentId: razorpay_payment_id, sync: 'pending' })
    }

    try {
      await recordPaidOrder({
        paymentId: razorpay_payment_id,
        userId: notes.user_id,
        productIds,
        couponCode: notes.coupon_code,
        amount: Number(order.amount) / 100
      })
      return res.status(200).json({ success: true, paymentId: razorpay_payment_id, sync: 'complete' })
    } catch (recordError) {
      console.error('Verified Razorpay payment could not be recorded:', recordError)
      return res.status(200).json({ success: true, paymentId: razorpay_payment_id, sync: 'pending' })
    }
  } catch (error) {
    console.error('Razorpay verify error:', error)
    return res.status(500).json({ error: 'Payment verification failed' })
  }
}
