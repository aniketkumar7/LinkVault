import { useReducedMotion } from 'framer-motion'

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
        className="scan-stage relative flex h-56 w-full items-center justify-center overflow-hidden rounded-2xl border sm:h-64"
        style={{ backgroundColor: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)' }}
      >
        <div className={`scan-document${done ? ' is-done' : ''}${reduceMotion ? ' reduce-motion' : ''}`} aria-hidden="true">
          <div className="scan-document-header">
            <span className="scan-document-icon">
              <svg viewBox="0 0 20 20" fill="none">
                <path d="M6 2.75h5.2L15.5 7v9.25A1.75 1.75 0 0 1 13.75 18h-7.5A1.75 1.75 0 0 1 4.5 16.25v-11A2.5 2.5 0 0 1 7 2.75Z" stroke="currentColor" strokeWidth="1.35" />
                <path d="M11 3v4h4M7.5 10h5M7.5 13h5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
              </svg>
            </span>
            <span className="scan-document-heading">
              <i />
              <i />
            </span>
            <span className="scan-document-check">
              <svg viewBox="0 0 16 16" fill="none">
                <path d="m3.5 8 3 3 6-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>

          <div className="scan-document-copy">
            <i className="w-[88%]" />
            <i className="w-[70%]" />
            <i className="w-[80%]" />
            <i className="w-[52%]" />
          </div>

          <div className="scan-document-link">
            <svg viewBox="0 0 18 18" fill="none">
              <path d="M7.2 10.8 10.8 7.2m-5.1 5.1-1.1 1.1a3 3 0 0 1-4.2-4.2l3-3a3 3 0 0 1 4.2 0m1.2 1.8 1.1-1.1a3 3 0 0 1 4.2 4.2l-3 3a3 3 0 0 1-4.2 0" transform="translate(2 -1)" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <i />
            <i />
          </div>

          {!done && <span className="scan-document-beam" />}
        </div>

        {imageCount > 1 && (
          <span
            className="absolute bottom-4 right-4 rounded-full border px-2.5 py-1 text-xs font-medium"
            style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
          >
            {imageCount} screenshots
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
          {done ? 'Preparing your links for review' : 'Your upload stays hidden while we scan it'}
        </p>
      </div>
    </div>
  )
}
