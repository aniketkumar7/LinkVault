import { useState, useEffect } from 'react'
import { flushSync } from 'react-dom'

type Theme = 'dark' | 'light'

interface DocumentWithVT {
  startViewTransition?: (cb: () => void) => { ready: Promise<void> }
}

// Inject the view-transition CSS once
function ensureVTStyles() {
  if (document.getElementById('vt-theme-styles')) return
  const s = document.createElement('style')
  s.id = 'vt-theme-styles'
  s.innerHTML = `
    ::view-transition-old(root), ::view-transition-new(root) {
      animation: none !important; mix-blend-mode: normal !important;
    }
    ::view-transition-old(root) { z-index: 1 !important; }
    ::view-transition-new(root) { z-index: 9999 !important; }
  `
  document.head.appendChild(s)
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = (e: React.MouseEvent) => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    const x = e.clientX
    const y = e.clientY

    const apply = () => {
      flushSync(() => setTheme(next))
      document.documentElement.setAttribute('data-theme', next)
      localStorage.setItem('theme', next)
    }

    const doc = document as unknown as DocumentWithVT
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!doc.startViewTransition || reduced) {
      apply()
      return
    }

    ensureVTStyles()

    const transition = doc.startViewTransition(apply)

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        { duration: 480, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)', fill: 'both' }
      )
    })
  }

  return { theme, toggleTheme }
}
