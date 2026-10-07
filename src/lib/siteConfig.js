export const DEFAULT_LIGHT_THEME = {
  primary: '#ff9933',
  accent: '#8b7cf6',
  background: '#faf9f7',
  surface: '#ffffff',
  text: '#2b2a28',
  muted: '#6b6863',
  button: '#ff9933',
  buttonText: '#1a1308',
  border: '#ead8c0',
  headerFooter: '#ffffff',
}

export const DEFAULT_DARK_THEME = {
  primary: '#ff9933',
  accent: '#8b7cf6',
  background: '#070707',
  surface: '#0d0d18',
  text: '#ccc9c0',
  muted: '#888480',
  button: '#ff9933',
  buttonText: '#1a1308',
  border: '#39291c',
  headerFooter: '#070707',
}

const THEME_KEYS = Object.keys(DEFAULT_LIGHT_THEME)
const HEX_COLOUR = /^#[0-9a-f]{6}$/i

export const DEFAULT_HOMEPAGE = {
  hero: {
    eyebrow: 'New Release Out Now',
    headingTop: 'Stories that',
    headingAccent: 'echo through',
    headingBottom: 'history.',
    subheading: "Powerful books on India's history, politics, and nature — written by Ritesh Sharma to challenge what you think you know.",
    backgroundImage: '',
    ctaText: 'Explore Books',
    ctaUrl: '/ebooks',
    secondaryCtaText: 'Read Thoughts',
    secondaryCtaUrl: '#thoughts',
  },
  banner: {
    enabled: false,
    title: 'A new chapter is coming',
    text: 'Watch this space for the next ThePageCraft announcement.',
    buttonText: 'Explore Books',
    buttonUrl: '/ebooks',
    image: '',
  },
  featured: {
    enabled: true,
    eyebrow: 'The Signature Collection',
    heading: 'Books made to stay with you.',
    productIds: [],
  },
  manifesto: {
    enabled: true,
    eyebrow: 'Our Point of View',
    heading: 'Not more content. More meaning.',
    text: 'ThePageCraft is an independent home for books that look beneath familiar headlines. Every title begins with curiosity, moves through research and ends with a perspective worth carrying forward.',
  },
  stats: {
    readers: '5K+',
    titles: '',
    rating: '4.9',
    copies: '1,200+',
  },
  announcement: {
    enabled: false,
    text: 'Festive sale: 30% off on all eBooks',
    code: '',
    linkText: 'Shop now',
    linkUrl: '/ebooks',
  },
  testimonials: {
    enabled: false,
    heading: 'Readers say it best',
    items: [],
  },
  header: {
    floating: true,
    brandName: 'The Pagecraft',
    brandSub: 'by Ritesh Sharma',
  },
  sections: {
    impactStats: true,
    notifications: true,
    journal: true,
    journey: true,
    readerPromise: true,
    faq: true,
    about: true,
  },
  about: {
    eyebrow: 'About the Author',
    heading: 'Ritesh Sharma',
    text: "Ritesh Sharma is a NEET aspirant by ambition and a storyteller by heart. While preparing relentlessly for one of India's toughest exams, he carved out time to chase another dream — writing.",
    text2: "His debut book Echoes of Freedom is now live, exploring the untold stories of India's fight for independence. Balancing NEET preparation with authorship, Ritesh proves that discipline and passion can walk side by side.",
  },
  footer: {
    brand: 'The Pagecraft',
    tagline: 'Books that matter. Stories that last.',
    text: 'Independent stories on history, identity and the ideas that shape India.',
  },
}

export function formatRating(value) {
  const text = String(value ?? '').trim()
  if (!text) return ''
  return text.includes('★') ? text : `${text}★`
}

export function parseJsonSetting(value, fallback) {
  if (!value) return fallback
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value
    return parsed && typeof parsed === 'object' ? parsed : fallback
  } catch {
    return fallback
  }
}

export function mergeHomepage(value) {
  const next = parseJsonSetting(value, {})
  return {
    ...DEFAULT_HOMEPAGE,
    ...next,
    hero: { ...DEFAULT_HOMEPAGE.hero, ...(next.hero || {}) },
    banner: { ...DEFAULT_HOMEPAGE.banner, ...(next.banner || {}) },
    featured: { ...DEFAULT_HOMEPAGE.featured, ...(next.featured || {}) },
    manifesto: { ...DEFAULT_HOMEPAGE.manifesto, ...(next.manifesto || {}) },
    stats: { ...DEFAULT_HOMEPAGE.stats, ...(next.stats || {}) },
    announcement: { ...DEFAULT_HOMEPAGE.announcement, ...(next.announcement || {}) },
    testimonials: {
      ...DEFAULT_HOMEPAGE.testimonials,
      ...(next.testimonials || {}),
      items: Array.isArray(next.testimonials?.items) ? next.testimonials.items : [],
    },
    header: { ...DEFAULT_HOMEPAGE.header, ...(next.header || {}) },
    sections: { ...DEFAULT_HOMEPAGE.sections, ...(next.sections || {}) },
    about: { ...DEFAULT_HOMEPAGE.about, ...(next.about || {}) },
    footer: { ...DEFAULT_HOMEPAGE.footer, ...(next.footer || {}) },
  }
}

export function mergeTheme(value, mode) {
  const defaults = mode === 'light' ? DEFAULT_LIGHT_THEME : DEFAULT_DARK_THEME
  const saved = parseJsonSetting(value, {})
  return Object.fromEntries(THEME_KEYS.map(key => [
    key,
    HEX_COLOUR.test(String(saved[key] || '')) ? saved[key] : defaults[key],
  ]))
}

export function applyThemeVariables(theme) {
  const root = document.documentElement
  const vars = {
    '--gold': theme.primary,
    '--gold-2': theme.button || theme.primary,
    '--gold-dim': `color-mix(in srgb, ${theme.primary} 12%, transparent)`,
    '--violet': theme.accent,
    '--violet-2': theme.accent,
    '--violet-dim': `color-mix(in srgb, ${theme.accent} 12%, transparent)`,
    '--purple': theme.accent,
    '--bg': theme.background,
    '--bg-2': theme.surface,
    '--bg-3': theme.surface,
    '--bg-4': theme.surface,
    '--surface': theme.surface,
    '--white': theme.text,
    '--text': theme.text,
    '--text-2': theme.muted,
    '--text-3': theme.muted,
    '--border': theme.border,
    '--border-2': theme.border,
    '--button-color': theme.button,
    '--button-text': theme.buttonText,
    '--header-footer': theme.headerFooter,
    '--nav-glass': theme.headerFooter,
    '--footer-bg': theme.headerFooter,
    '--gradient-brand': `linear-gradient(135deg, ${theme.primary} 0%, ${theme.accent} 100%)`,
    '--gradient-brand-soft': `linear-gradient(135deg, color-mix(in srgb, ${theme.primary} 16%, transparent) 0%, color-mix(in srgb, ${theme.accent} 16%, transparent) 100%)`,
  }
  Object.entries(vars).forEach(([key, value]) => value && root.style.setProperty(key, value))
}
