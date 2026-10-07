import { useEffect } from 'react'
import { useContent } from '../context/ContentContext'
import { applyThemeVariables, mergeTheme } from '../lib/siteConfig'

export default function SiteThemeManager() {
  const { settings } = useContent()

  useEffect(() => {
    const root = document.documentElement
    const apply = () => {
      const mode = root.dataset.theme === 'light' ? 'light' : 'dark'
      const saved = settings[mode === 'light' ? 'site_theme_light' : 'site_theme_dark']
      applyThemeVariables(mergeTheme(saved, mode))
    }
    apply()
    const observer = new MutationObserver(apply)
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [settings])

  return null
}
