import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { products as fallbackProducts } from '../data/products'
import { dailyPosts as fallbackPosts } from '../data/dailyPosts'
import { mergeHomepage } from '../lib/siteConfig'

const ContentContext = createContext(null)

function mapProduct(row) {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle || '',
    category: row.category || 'General',
    price: Number(row.price || 0),
    mrp: row.mrp == null ? null : Number(row.mrp),
    status: row.status || 'available',
    description: row.description || '',
    fullDescription: row.full_description || '',
    image: row.image || '',
    author: row.author || 'Ritesh Sharma',
    badge: row.badge || null,
    amazonLink: row.amazon_link || null,
    paymentLink: row.payment_link || null,
    sortOrder: row.sort_order || 0,
    active: row.active !== false,
    pdfPath: row.pdf_path || '',
    pdfPages: row.pdf_pages == null ? null : Number(row.pdf_pages),
  }
}

function mapPost(row) {
  return {
    id: row.id,
    slug: row.slug,
    category: row.category || "Author's Journal",
    date: row.published_at,
    publishedAt: row.published_at,
    readTime: row.read_time || '',
    title: row.title,
    excerpt: row.excerpt || '',
    coverImage: row.cover_image || '',
    author: row.author || 'Ritesh Sharma',
    content: Array.isArray(row.content) ? row.content : [],
    published: row.published !== false,
  }
}

export function ContentProvider({ children }) {
  const [products, setProducts] = useState(fallbackProducts)
  const [posts, setPosts] = useState(fallbackPosts)
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [lastSyncedAt, setLastSyncedAt] = useState(null)

  const refresh = useCallback(async () => {
    const now = new Date().toISOString()

    const [productsRes, postsRes, settingsRes] = await Promise.all([
      supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true })
        .order('id', { ascending: true }),
      supabase
        .from('daily_posts')
        .select('*')
        .eq('published', true)
        .lte('published_at', now)
        .order('published_at', { ascending: false }),
      supabase
        .from('site_settings')
        .select('key,value')
        .eq('public', true),
    ])

    let payLinks = {}
    try { payLinks = JSON.parse((settingsRes.data || []).find(r => r.key === 'book_payment_links')?.value || '{}') } catch { payLinks = {} }

    if (!productsRes.error) {
      setProducts((productsRes.data || []).map(mapProduct).map(p => ({ ...p, paymentLink: payLinks[p.id] || p.paymentLink })))
    } else if (productsRes.error) {
      console.warn('Using local product fallback:', productsRes.error.message)
    }

    if (!postsRes.error) {
      setPosts((postsRes.data || []).map(mapPost))
    } else if (postsRes.error) {
      console.warn('Using local post fallback:', postsRes.error.message)
    }

    if (!settingsRes.error) {
      setSettings(Object.fromEntries((settingsRes.data || []).map(row => [row.key, row.value])))
    } else {
      console.warn('Using local site settings fallback:', settingsRes.error.message)
    }

    setLastSyncedAt(new Date())
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()

    const channel = supabase
      .channel('thepagecraft-live-content')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_posts' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, refresh)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [refresh])

  const homepage = useMemo(() => mergeHomepage(settings.homepage_config), [settings.homepage_config])
  const value = useMemo(
    () => ({ products, posts, settings, homepage, loading, lastSyncedAt, refresh }),
    [products, posts, settings, homepage, loading, lastSyncedAt, refresh]
  )

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
}

export function useContent() {
  const value = useContext(ContentContext)
  if (!value) throw new Error('useContent must be used inside ContentProvider')
  return value
}
