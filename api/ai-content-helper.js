const DEFAULT_SUPABASE_URL = 'https://plzlvgdlscwhbfrpcjtp.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_aI6w8Ve5aFrYxfG9b9Gi4w_Ste7yc5K'
const rateWindow = new Map()

async function authenticatedAdmin(supabaseUrl, anonKey, authorization) {
  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: anonKey, Authorization: authorization } })
  if (!userResponse.ok) return null
  const user = await userResponse.json()
  const roleResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/is_admin`, { method: 'POST', headers: { apikey: anonKey, Authorization: authorization, 'Content-Type': 'application/json' }, body: '{}' })
  if (!roleResponse.ok || await roleResponse.json() !== true) return null
  return user
}

function outputText(response) {
  return (response.output || []).flatMap(item => item.type === 'message' ? (item.content || []) : []).filter(item => item.type === 'output_text').map(item => item.text || '').join('\n').trim()
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return res.status(503).json({ error: 'AI helper is not configured. Add OPENAI_API_KEY in Vercel.' })
    const authorization = req.headers.authorization || ''
    if (!authorization.startsWith('Bearer ')) return res.status(401).json({ error: 'Admin login required' })
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY
    const admin = await authenticatedAdmin(supabaseUrl, anonKey, authorization)
    if (!admin?.id) return res.status(403).json({ error: 'Admin permission required' })

    const now = Date.now(), previous = rateWindow.get(admin.id) || []
    const recent = previous.filter(time => now - time < 60_000)
    if (recent.length >= 8) return res.status(429).json({ error: 'Please wait a minute before generating more content.' })
    rateWindow.set(admin.id, [...recent, now])

    const { type = 'product_description', tone = 'Professional', audience = 'ThePageCraft readers', wordCount = 180, topic = '', keyPoints = '', action = 'generate', currentText = '' } = req.body || {}
    const allowedActions = new Set(['generate', 'improve', 'shorten', 'expand', 'regenerate'])
    if (!allowedActions.has(action)) return res.status(400).json({ error: 'Invalid AI action' })
    if (!String(topic).trim() && !String(currentText).trim()) return res.status(400).json({ error: 'Add a topic or an existing draft.' })
    const safeWords = Math.max(20, Math.min(1800, Number(wordCount) || 180))
    const instructions = 'You are ThePageCraft publishing assistant. Write accurate, original, polished marketing and editorial copy. Do not invent awards, sales, reviews, author credentials, prices, historical facts or guarantees. If facts are missing, keep claims general. Return only the requested draft with no analysis, labels or markdown fences.'
    const input = `Task: ${action}\nContent type: ${String(type).slice(0,60)}\nTone: ${String(tone).slice(0,40)}\nAudience: ${String(audience).slice(0,180)}\nTarget length: about ${safeWords} words\nTopic: ${String(topic).slice(0,1200)}\nKey points: ${String(keyPoints).slice(0,3000)}\nExisting draft (when revising): ${String(currentText).slice(0,8000)}`
    const model = process.env.OPENAI_MODEL || 'gpt-5.6-luna'
    const request = { model, store: false, instructions, input, max_output_tokens: Math.min(6000, Math.max(800, safeWords * 4)) }
    if (/^gpt-5\.(4|6)/i.test(model)) request.reasoning = { effort: 'none' }
    const response = await fetch('https://api.openai.com/v1/responses', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }, body: JSON.stringify(request) })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data?.error?.message || 'OpenAI request failed')
    const text = outputText(data)
    if (!text) throw new Error('The AI response did not contain usable text.')
    return res.status(200).json({ text, model })
  } catch (error) {
    console.error('AI content helper error:', error)
    return res.status(500).json({ error: error.message || 'Could not generate content' })
  }
}
