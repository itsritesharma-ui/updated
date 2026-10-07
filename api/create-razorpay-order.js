import crypto from 'crypto'
import Razorpay from 'razorpay'

const DEFAULT_SUPABASE_URL = 'https://plzlvgdlscwhbfrpcjtp.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_aI6w8Ve5aFrYxfG9b9Gi4w_Ste7yc5K'

async function getAuthenticatedUser(url, anonKey, authorization) {
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: authorization }
  })
  if (!response.ok) return null
  return response.json()
}

async function getSecureQuote(url, anonKey, authorization, productIds, couponCode) {
  const response = await fetch(`${url}/rest/v1/rpc/quote_order`, {
    method: 'POST',
    headers: { apikey: anonKey, Authorization: authorization, 'Content-Type': 'application/json' },
    body: JSON.stringify({ item_ids: productIds, coupon_code: couponCode || null })
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Could not validate order')
  return data
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { productIds, couponCode = '' } = req.body || {}
    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY
    const authorization = req.headers.authorization || ''

    if (!keyId || !keySecret) return res.status(500).json({ error: 'Razorpay credentials are not configured' })
    if (!authorization.startsWith('Bearer ')) return res.status(401).json({ error: 'Please login before payment' })
    if (!Array.isArray(productIds) || !productIds.length) return res.status(400).json({ error: 'Required payment details are missing' })

    const cleanIds = [...new Set(productIds.map(Number).filter(Number.isInteger))]
    if (!cleanIds.length || cleanIds.length !== productIds.length) return res.status(400).json({ error: 'Invalid cart items' })

    const user = await getAuthenticatedUser(supabaseUrl, anonKey, authorization)
    if (!user?.id) return res.status(401).json({ error: 'Your login session expired. Please login again.' })

    // Price is ALWAYS read from the database (products.price) via quote_order,
    // so changing a book price in Admin is picked up automatically.
    const quote = await getSecureQuote(supabaseUrl, anonKey, authorization, cleanIds, String(couponCode).trim().toUpperCase())
    if (!quote?.valid) return res.status(400).json({ error: quote?.error || 'Coupon or order is invalid' })

    const amountPaise = Math.round(Number(quote.total) * 100)
    if (!Number.isFinite(amountPaise) || amountPaise < 100) {
      return res.status(400).json({ error: 'Minimum payable amount is ₹1' })
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret })
    const receipt = `TPC${Date.now()}${crypto.randomBytes(2).toString('hex')}`.slice(0, 40)
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      // notes let the verify step know who paid for what (re-checked server side)
      notes: { user_id: user.id, product_ids: cleanIds.join(','), coupon_code: quote.coupon_code || '' }
    })

    return res.status(200).json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: keyId,
      quote
    })
  } catch (error) {
    console.error('Razorpay create order error:', error)
    const status = error?.statusCode === 401 ? 401 : 500
    const message = status === 401
      ? 'Razorpay authentication failed. Check RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET.'
      : (error?.error?.description || error.message || 'Unable to start payment')
    return res.status(status).json({ error: message })
  }
}
