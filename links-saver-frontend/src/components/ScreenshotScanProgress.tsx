import { motion, useReducedMotion } from 'framer-motion'

interface Props {
  previews: string[]
  done?: boolean
}

export function ScreenshotScanProgress({ previews, done = false }: Props) {
  const imageCount = previews.length
  const reduceMotion = useReducedMotion()

  return (
    <div
      className="w-full"
      role="status"
      aria-live="polite"
      aria-label={done ? 'Screenshot scan complete' : `Scanning ${imageCount} screenshot${imageCount === 1 ? '' : 's'} for links`}
    >
      <div
        className="relative isolate h-56 w-full overflow-hidden rounded-2xl border sm:h-64"
        style={{ background: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)' }}
      >
        {previews[0] && (
          <img
            src={previews[0]}
            alt="Screenshot being analyzed"
            className="absolute inset-0 h-full w-full object-contain p-2 sm:p-3"
          />
        )}

        {!done && !reduceMotion && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-12"
            style={{
              background: 'linear-gradient(180deg, transparent, color-mix(in srgb, var(--color-accent) 17%, transparent), transparent)',
              borderBottom: '1px solid color-mix(in srgb, var(--color-accent) 75%, transparent)',
              filter: 'drop-shadow(0 2px 8px color-mix(in srgb, var(--color-accent) 45%, transparent))',
            }}
            animate={{ top: ['0%', 'calc(100% - 3rem)'] }}
            transition={{ duration: 2.6, ease: 'linear', repeat: Infinity }}
          />
        )}

        {!done && reduceMotion && (
          <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px" style={{ background: 'color-mix(in srgb, var(--color-accent) 75%, transparent)' }} />
        )}

        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <span className="absolute left-3 top-3 h-4 w-4 rounded-tl-md border-l-2 border-t-2" style={{ borderColor: 'var(--color-accent)' }} />
          <span className="absolute right-3 top-3 h-4 w-4 rounded-tr-md border-r-2 border-t-2" style={{ borderColor: 'var(--color-accent)' }} />
          <span className="absolute bottom-3 left-3 h-4 w-4 rounded-bl-md border-b-2 border-l-2" style={{ borderColor: 'var(--color-accent)' }} />
          <span className="absolute bottom-3 right-3 h-4 w-4 rounded-br-md border-b-2 border-r-2" style={{ borderColor: 'var(--color-accent)' }} />
        </div>

        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold shadow-sm backdrop-blur-md" style={{ background: 'color-mix(in srgb, var(--color-bg-card) 90%, transparent)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
          {!done && <span className="size-1.5 rounded-full" style={{ background: 'var(--color-accent)', boxShadow: '0 0 8px var(--color-accent)' }} />}
          {done ? 'Scan complete' : 'Scanning image'}
        </div>

        {imageCount > 1 && (
          <span className="absolute bottom-4 right-4 rounded-full border px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur-md" style={{ background: 'color-mix(in srgb, var(--color-bg-card) 90%, transparent)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
            1 of {imageCount}
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-col items-center gap-2 text-center">
        <div className="flex items-center gap-2.5">
          {done ? (
            <svg className="size-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="10" cy="10" r="8" fill="var(--color-success)" />
              <path d="m6 10 2.5 2.5L14 7" stroke="var(--color-bg-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <span className="size-3.5 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none" style={{ color: 'var(--color-accent)' }} aria-hidden="true" />
          )}
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {done ? 'Links found' : `Finding links in ${imageCount} screenshot${imageCount === 1 ? '' : 's'}…`}
          </span>
        </div>
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {done ? 'Preparing your links for review' : 'Your image stays clear while we look for links'}
        </p>
      </div>
    </div>
  )
}
