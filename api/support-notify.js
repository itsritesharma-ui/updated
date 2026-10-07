const DEFAULT_SUPABASE_URL = 'https://plzlvgdlscwhbfrpcjtp.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_aI6w8Ve5aFrYxfG9b9Gi4w_Ste7yc5K'
const rateWindow = new Map()

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]))
}

async function getUser(url, anonKey, authorization) {
  const response = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anonKey, Authorization: authorization } })
  return response.ok ? response.json() : null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const { event, ticketId } = req.body || {}
    const allowedEvents = new Set(['ticket_created', 'customer_reply', 'admin_reply', 'status_changed'])
    const authorization = req.headers.authorization || ''
    if (!authorization.startsWith('Bearer ') || !ticketId) return res.status(401).json({ error: 'Authenticated ticket request required' })
    if (!allowedEvents.has(event)) return res.status(400).json({ error: 'Invalid notification event' })
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) return res.status(503).json({ error: 'Support notifications are not configured' })
    const user = await getUser(supabaseUrl, anonKey, authorization)
    if (!user?.id) return res.status(401).json({ error: 'Session expired' })
    const now = Date.now(), recent = (rateWindow.get(user.id) || []).filter(time => now - time < 60_000)
    if (recent.length >= 12) return res.status(429).json({ error: 'Too many notification requests. Please wait a minute.' })
    rateWindow.set(user.id, [...recent, now])
    const ticketResponse = await fetch(`${supabaseUrl}/rest/v1/support_tickets?id=eq.${encodeURIComponent(ticketId)}&select=*`, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } })
    const ticketData = await ticketResponse.json().catch(() => [])
    if (!ticketResponse.ok) throw new Error('Could not verify the support ticket')
    const ticket = Array.isArray(ticketData) ? ticketData[0] : null
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' })
    const adminResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/is_admin`, { method: 'POST', headers: { apikey: anonKey, Authorization: authorization, 'Content-Type': 'application/json' }, body: '{}' })
    const isAdmin = adminResponse.ok && await adminResponse.json() === true
    if (ticket.user_id !== user.id && !isAdmin) return res.status(403).json({ error: 'Not allowed' })
    const toCustomer = ['admin_reply', 'status_changed'].includes(event)
    if (toCustomer && !isAdmin) return res.status(403).json({ error: 'Only an admin can send customer updates' })
    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) return res.status(200).json({ sent: false, configured: false })
    const recipient = toCustomer ? ticket.customer_email : (process.env.SUPPORT_EMAIL || 'itsritesharma261@gmail.com')
    const subject = toCustomer ? `Update on ThePageCraft support ticket #${ticket.ticket_number}` : `Support ticket #${ticket.ticket_number}: ${ticket.subject}`
    const html = `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto"><h2>ThePageCraft Support</h2><p>${toCustomer ? 'Your support ticket has a new reply or status update.' : 'A customer support ticket needs attention.'}</p><p><b>Ticket:</b> #${escapeHtml(ticket.ticket_number)}<br><b>Subject:</b> ${escapeHtml(ticket.subject)}<br><b>Status:</b> ${escapeHtml(ticket.status)}</p><p>Sign in to ThePageCraft to view the secure conversation.</p></div>`
    const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: process.env.SUPPORT_FROM_EMAIL || 'ThePageCraft Support <support@thepagecraft.in>', to: [recipient], subject, html }) })
    if (!response.ok) throw new Error('Email provider rejected the support notification')
    return res.status(200).json({ sent: true })
  } catch (error) {
    console.error('Support notification error:', error)
    return res.status(500).json({ error: error.message || 'Notification failed' })
  }
}
