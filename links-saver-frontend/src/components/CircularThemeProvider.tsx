import React, { useState, useEffect, createContext, useContext } from 'react'
import { flushSync } from 'react-dom'

interface DocumentWithViewTransition {
  startViewTransition?: (callback: () => void) => {
    ready: Promise<void>
    finished?: Promise<void>
  }
}

export type TransitionOrigin =
  | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  | { x: number; y: number }
  | React.MouseEvent
  | HTMLElement
  | EventTarget

interface CircularThemeContextType {
  theme: 'light' | 'dark'
  triggerTransition: (origin?: TransitionOrigin) => void
  isAnimating: boolean
}

interface CustomWindow extends Window {
  __viewTransitionStyleCount?: number
}

const CircularThemeContext = createContext<CircularThemeContextType | undefined>(undefined)

export function useCircularTheme() {
  const context = useContext(CircularThemeContext)
  if (!context) throw new Error('useCircularTheme must be used within CircularThemeProvider')
  return context
}

export interface CircularThemeProviderProps {
  children?: React.ReactNode
  duration?: number
  easing?: string
  onTransition?: () => void
  theme?: 'light' | 'dark'
  onThemeChange?: (theme: 'light' | 'dark') => void
  defaultCenter?: TransitionOrigin
}

export default function CircularThemeProvider({
  children,
  duration = 500,
  easing = 'ease-in-out',
  onTransition,
  theme: themeProp,
  onThemeChange,
  defaultCenter,
}: CircularThemeProviderProps) {
  const [localTheme, setLocalTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
    }
    return 'dark'
  })
  const [isAnimating, setIsAnimating] = useState(false)

  const isControlled = themeProp !== undefined
  const activeTheme  = isControlled ? themeProp : localTheme

  useEffect(() => {
    const styleId = 'great-ui-view-transition-styles'
    let el = document.getElementById(styleId) as HTMLStyleElement | null
    if (!el) {
      el = document.createElement('style')
      el.id = styleId
      el.innerHTML = `
        ::view-transition-old(root),
        ::view-transition-new(root) {
          animation: none !important;
          mix-blend-mode: normal !important;
          display: block !important;
          height: 100% !important;
          width: 100% !important;
          object-fit: cover !important;
        }
        ::view-transition-image-pair(root) { isolation: auto !important; }
        ::view-transition-old(root) { z-index: 1 !important; }
        ::view-transition-new(root) { z-index: 9999 !important; }
      `
      document.head.appendChild(el)
    }
    const win = window as unknown as CustomWindow
    win.__viewTransitionStyleCount = (win.__viewTransitionStyleCount ?? 0) + 1
    return () => {
      win.__viewTransitionStyleCount = Math.max(0, (win.__viewTransitionStyleCount ?? 0) - 1)
      if (win.__viewTransitionStyleCount === 0) document.getElementById(styleId)?.remove()
    }
  }, [])

  const triggerTransition = (origin?: TransitionOrigin) => {
    if (isAnimating) return

    let x = window.innerWidth / 2
    let y = window.innerHeight / 2

    const src = origin ?? defaultCenter
    if (src) {
      if (typeof src === 'string') {
        switch (src) {
          case 'top-left':    x = 0; y = 0; break
          case 'top-right':   x = window.innerWidth; y = 0; break
          case 'bottom-left': x = 0; y = window.innerHeight; break
          case 'bottom-right':x = window.innerWidth; y = window.innerHeight; break
        }
      } else if ('getBoundingClientRect' in (src as object)) {
        const r = (src as HTMLElement).getBoundingClientRect()
        x = r.left + r.width / 2; y = r.top + r.height / 2
      } else if ('clientX' in (src as object)) {
        x = (src as { clientX: number; clientY: number }).clientX
        y = (src as { clientX: number; clientY: number }).clientY
      } else if ('x' in (src as object) && 'y' in (src as object)) {
        x = (src as { x: number; y: number }).x
        y = (src as { x: number; y: number }).y
      }
    }

    const targetTheme = activeTheme === 'light' ? 'dark' : 'light'

    const apply = () => {
      if (!isControlled) setLocalTheme(targetTheme)
      const root = document.documentElement
      root.setAttribute('data-theme', targetTheme)
      if (targetTheme === 'dark') root.classList.add('dark')
      else root.classList.remove('dark')
      onThemeChange?.(targetTheme)
    }

    const doc = document as unknown as DocumentWithViewTransition
    if (!doc.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      apply(); onTransition?.(); return
    }

    setIsAnimating(true)
    const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
    const animId = 'great-ui-circular-anim-style'
    let styleEl = document.getElementById(animId) as HTMLStyleElement | null
    if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = animId; document.head.appendChild(styleEl) }
    styleEl.textContent = `
      @keyframes great-ui-circular-wipe {
        from { clip-path: circle(0px at ${x}px ${y}px); }
        to   { clip-path: circle(${endRadius}px at ${x}px ${y}px); }
      }
      ::view-transition-new(root) {
        animation: great-ui-circular-wipe ${duration}ms ${easing} both !important;
      }
    `

    const cleanup = () => { document.getElementById(animId)?.remove(); setIsAnimating(false) }

    try {
      const t = doc.startViewTransition!(() => { flushSync(() => { apply(); onTransition?.() }) })
      if (t.finished) t.finished.then(cleanup).catch(cleanup)
      else setTimeout(cleanup, duration)
    } catch {
      cleanup(); apply(); onTransition?.()
    }
  }

  return (
    <CircularThemeContext.Provider value={{ theme: activeTheme, triggerTransition, isAnimating }}>
      {children}
    </CircularThemeContext.Provider>
  )
}
