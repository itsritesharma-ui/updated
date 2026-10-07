const KEY = 'tpc-reading-progress-v1'

function readAll() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {} } catch { return {} }
}

export function getProgress(userId, bookId) {
  return readAll()[`${userId || 'guest'}:${bookId}`] || null
}

export function saveProgress(userId, bookId, page, total) {
  if (!bookId || !page) return
  try {
    const all = readAll()
    all[`${userId || 'guest'}:${bookId}`] = { page, total: total || 0, at: Date.now() }
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch { /* storage full or blocked */ }
}

export function readingPrefs() {
  try { return JSON.parse(localStorage.getItem('tpc-reader-prefs') || '{}') || {} } catch { return {} }
}

export function saveReadingPrefs(patch) {
  try { localStorage.setItem('tpc-reader-prefs', JSON.stringify({ ...readingPrefs(), ...patch })) } catch { /* ignore */ }
}
