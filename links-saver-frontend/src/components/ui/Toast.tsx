import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { subscribeToasts, type ToastKind, type ToastPayload } from '@/lib/toast'
import { useSensoryUI } from '@/lib/provider'

const colors: Record<ToastKind, string> = {
  default: '#c4b5fd',
  success: '#4ade80',
  error: '#fb7185',
  warning: '#fbbf24',
  info: '#60a5fa',
}

const labels: Record<ToastKind, string> = {
  default: 'Notice',
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
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
  const reduceMotion = useReducedMotion()
  const { playSound } = useSensoryUI()
  const active = items[0]

  useEffect(() => subscribeToasts(payload => {
    const id = Date.now() + Math.random()
    setItems(current => [...current, { ...payload, id }])
  }), [])

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
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -36, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -24, scale: 0.98 }}
            transition={{ duration: reduceMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="toast-notch pointer-events-auto relative w-[min(440px,calc(100vw-20px))] overflow-hidden rounded-b-[22px] border-x border-b px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)]"
            style={{
              background: '#111214',
              borderColor: 'rgba(255,255,255,0.1)',
              boxShadow: '0 4px 8px rgba(0,0,0,0.24)',
            }}
          >
            <div className="flex items-center gap-3">
              <span
                className="grid size-9 shrink-0 place-items-center rounded-full"
                style={{ background: `${colors[active.kind]}20`, color: colors[active.kind] }}
                aria-hidden="true"
              >
                <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={iconPaths[active.kind]} />
                </svg>
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold leading-4" style={{ color: colors[active.kind] }}>
                  {labels[active.kind]}
                </p>
                <p className="mt-0.5 text-sm leading-5 text-white [overflow-wrap:anywhere]">
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
                  className="shrink-0 rounded-lg px-2.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  {active.action.label}
                </button>
              )}

              <button
                type="button"
                onClick={() => dismiss(active.id)}
                aria-label="Dismiss notification"
                className="grid size-8 shrink-0 place-items-center rounded-full text-white/55 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            {!reduceMotion && (
              <div className="toast-progress absolute inset-x-0 bottom-0 h-[2px]" style={{ background: colors[active.kind] }} />
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}
