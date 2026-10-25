import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { X } from '@phosphor-icons/react'
import { subscribeToasts, type ToastKind, type ToastPayload } from '@/lib/toast'
import { useSensoryUI } from '@/lib/provider'
import { supabase } from '@/lib/supabase'
import { profileAvatarConfig } from '@/lib/profile'
import { FluidOrbAvatar } from './FluidOrbAvatar'

const colors: Record<ToastKind, string> = {
  default: '#c4b5fd',
  success: '#4ade80',
  error: '#fb7185',
  warning: '#fbbf24',
  info: '#60a5fa',
}

const labels: Record<ToastKind, string> = {
  default: 'Bookmarky',
  success: 'All set',
  error: 'Needs attention',
  warning: 'Heads up',
  info: 'Quick note',
}

const iconPaths: Record<ToastKind, string> = {
  default: 'M12 16h.01M12 12V8m10 4a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  success: 'm5 12 4 4L19 6',
  error: 'm6 6 12 12M18 6 6 18',
  warning: 'M12 9v4m0 4h.01M10.3 3.9 1.8 18.2A2 2 0 0 0 3.5 21h17a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0Z',
  info: 'M12 16h.01M12 12V8m10 4a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
}

type ToastItem = ToastPayload & { id: number }

export function ToastProvider() {
  const [items, setItems] = useState<ToastItem[]>([])
  const [avatar, setAvatar] = useState(() => profileAvatarConfig(null))
  const reduceMotion = useReducedMotion()
  const { playSound } = useSensoryUI()
  const active = items[0]

  useEffect(() => subscribeToasts(payload => {
    const id = Date.now() + Math.random()
    setItems(current => [...current, { ...payload, id }])
  }), [])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAvatar(profileAvatarConfig(session?.user ?? null))
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!active) return
    const bulkSaved = /(?:saved|imported)\s+\d+\s+links/i.test(active.message)
    const oneLinkSaved = /link saved/i.test(active.message)
    const role = active.kind === 'success' && bulkSaved
      ? 'hero.milestone'
      : active.kind === 'success' && oneLinkSaved
        ? 'hero.complete'
        : active.kind === 'default' ? 'notification.info' : `notification.${active.kind}` as const
    void playSound(role, { volume: 0.7 })
    const timer = window.setTimeout(() => {
      setItems(current => current.filter(item => item.id !== active.id))
    }, 4000)
    return () => window.clearTimeout(timer)
  }, [active, playSound])

  const dismiss = (id: number) => setItems(current => current.filter(item => item.id !== id))

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center">
      <AnimatePresence initial={false} mode="wait">
        {active && (
          <motion.section
            key={active.id}
            role="status"
            aria-live="polite"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -52, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -28, scale: 0.98 }}
            transition={reduceMotion
              ? { duration: 0.12 }
              : { type: 'spring', stiffness: 420, damping: 34, mass: 0.85 }}
            className="toast-notch pointer-events-auto relative w-[min(420px,calc(100vw-16px))] rounded-b-[18px] border-x border-b px-4 pb-3.5 pt-[calc(env(safe-area-inset-top)+8px)]"
            style={{
              background: 'var(--color-bg-card)',
              borderColor: 'var(--color-border)',
              boxShadow: '0 6px 12px -8px rgba(0,0,0,0.55)',
            }}
          >
            <span
              aria-hidden="true"
              className="absolute left-1/2 h-[3px] w-8 -translate-x-1/2 rounded-full"
              style={{ top: 'env(safe-area-inset-top)', background: 'var(--color-border-hover)' }}
            />
            <div className="flex items-center gap-3">
              <span className="relative block size-9 shrink-0">
                <FluidOrbAvatar avatar={avatar} />
                <span
                  className="absolute -bottom-0.5 -right-0.5 grid size-[17px] place-items-center rounded-full"
                  style={{ background: 'var(--color-bg-card)', color: colors[active.kind], boxShadow: '0 0 0 2px var(--color-bg-card)' }}
                  aria-hidden="true"
                >
                  <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d={iconPaths[active.kind]} />
                  </svg>
                </span>
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold leading-4" style={{ color: 'var(--color-text-secondary)' }}>
                  {labels[active.kind]}
                </p>
                <p className="mt-0.5 text-sm font-medium leading-5 [overflow-wrap:anywhere]" style={{ color: 'var(--color-text-primary)' }}>
                  {active.message}
                </p>
              </div>

              {active.action && (
                <button
                  type="button"
                  onClick={() => {
                    active.action?.onClick()
                    dismiss(active.id)
                  }}
                  className="shrink-0 rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2"
                  style={{ color: 'var(--color-accent)' }}
                >
                  {active.action.label}
                </button>
              )}

              <button
                type="button"
                onClick={() => dismiss(active.id)}
                aria-label="Dismiss notification"
                className="grid size-8 shrink-0 place-items-center rounded-full transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <X size={16} weight="bold" aria-hidden="true" />
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}
