import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, X } from '@phosphor-icons/react'

interface DrawerProps {
  open: boolean
  onClose: () => void
  eyebrow?: string
  title: string
  /** Shows a back arrow instead of the eyebrow (sub-views inside the drawer) */
  onBack?: () => void
  children: React.ReactNode
}

/** Right-side panel. Children mount only while open, so their state resets on every open. */
export function Drawer({ open, onClose, eyebrow, title, onBack, children }: DrawerProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="drawer-overlay"
            className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            key="drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="fixed inset-y-0 right-0 z-[61] flex w-full max-w-md flex-col border-l shadow-2xl"
            style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
          >
            <header className="flex items-center justify-between gap-3 border-b px-5 py-4" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex min-w-0 items-center gap-3">
                {onBack && (
                  <button type="button" onClick={onBack} aria-label="Back" className="rounded-lg p-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                    <ArrowLeft size={18} />
                  </button>
                )}
                <div className="min-w-0">
                  {eyebrow && !onBack && <p className="text-[11px] uppercase tracking-[.18em]" style={{ color: 'var(--color-text-muted)' }}>{eyebrow}</p>}
                  <h2 className="truncate text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>{title}</h2>
                </div>
              </div>
              <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5" style={{ color: 'var(--color-text-muted)' }}>
                <X size={20} />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
