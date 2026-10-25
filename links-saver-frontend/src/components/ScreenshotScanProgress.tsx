import { useEffect, useRef } from 'react'

interface Props {
  previews: string[]
  done?: boolean
}

const PITCH = 10
const DOT = 5

function hash(x: number, y: number) {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return value - Math.floor(value)
}

function PixelScan({ running }: { running: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const surface = canvas?.parentElement
    const context = canvas?.getContext('2d')
    if (!canvas || !surface || !context) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim() || '#8b5cf6'
    let frame = 0
    let lastPaint = 0
    let width = 0
    let height = 0

    const paint = (now: number) => {
      if (now - lastPaint < 1000 / 24 && running && !reducedMotion.matches) {
        frame = requestAnimationFrame(paint)
        return
      }
      lastPaint = now

      const bounds = surface.getBoundingClientRect()
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      const nextWidth = Math.max(1, Math.round(bounds.width * ratio))
      const nextHeight = Math.max(1, Math.round(bounds.height * ratio))
      if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
        canvas.width = nextWidth
        canvas.height = nextHeight
        width = bounds.width
        height = bounds.height
      }

      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      context.clearRect(0, 0, width, height)
      const sweep = reducedMotion.matches ? 0.58 : ((now / 2800) % 1) * 1.2 - 0.1

      if (!reducedMotion.matches && sweep >= 0 && sweep <= 1) {
        const y = sweep * height
        const glow = context.createLinearGradient(0, y - 30, 0, y + 12)
        glow.addColorStop(0, 'rgba(255,255,255,0)')
        glow.addColorStop(0.78, 'rgba(255,255,255,0.08)')
        glow.addColorStop(1, accent)
        context.globalAlpha = 0.75
        context.fillStyle = glow
        context.fillRect(0, y - 30, width, 42)
      }

      const columns = Math.ceil(width / PITCH)
      const rows = Math.ceil(height / PITCH)
      for (let row = 0; row < rows; row++) {
        const distance = sweep - row / rows
        const band = reducedMotion.matches
          ? 0.42
          : distance >= 0 ? Math.exp(-distance * 2.2) : Math.exp(distance * 18)
        for (let column = 0; column < columns; column++) {
          const noise = hash(column, row)
          const cluster = Math.max(0, Math.min(1, (hash(Math.floor(column / 4), Math.floor(row / 4)) - 0.3) * 1.8))
          const intensity = (0.16 + band * 0.84) * (0.18 + cluster * 0.82)
          if (noise > intensity) continue
          context.globalAlpha = Math.min(0.88, 0.22 + intensity * 0.72)
          context.fillStyle = accent
          context.fillRect(column * PITCH + (PITCH - DOT) / 2, row * PITCH + (PITCH - DOT) / 2, DOT, DOT)
        }
      }
      context.globalAlpha = 1

      if (running && !reducedMotion.matches) frame = requestAnimationFrame(paint)
    }

    const resizeObserver = new ResizeObserver(() => {
      if (!running || reducedMotion.matches) paint(performance.now())
    })
    resizeObserver.observe(surface)
    paint(performance.now())

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
    }
  }, [running])

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />
}

export function ScreenshotScanProgress({ previews, done = false }: Props) {
  const imageCount = previews.length

  return (
    <div className="w-full" role="status" aria-live="polite" aria-label={done ? 'Screenshot scan complete' : `Scanning ${imageCount} screenshot${imageCount === 1 ? '' : 's'} for links`}>
      <div className="relative h-56 w-full overflow-hidden rounded-2xl border sm:h-64" style={{ background: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)' }}>
        {previews[0] && <img src={previews[0]} alt="Screenshot being analyzed" className="absolute inset-0 h-full w-full object-contain" />}
        <div className="absolute inset-0 transition-opacity duration-500" style={{ background: 'color-mix(in srgb, var(--color-accent) 20%, transparent)', opacity: done ? 0 : 1 }} />
        <div className="absolute inset-0 transition-opacity duration-500" style={{ opacity: done ? 0 : 1 }}>
          <PixelScan running={!done} />
        </div>
        {imageCount > 1 && (
          <span className="absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: 'rgba(0,0,0,0.64)', color: '#fff' }}>
            1 of {imageCount} images
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-col items-center gap-2 text-center">
        <div className="flex items-center gap-2 rounded-full border px-4 py-2.5" style={{ background: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)' }}>
          {done ? (
            <svg className="size-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="10" cy="10" r="8" fill="var(--color-success)" />
              <path d="m6 10 2.5 2.5L14 7" stroke="var(--color-bg-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none" style={{ color: 'var(--color-accent)' }} aria-hidden="true" />
          )}
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {done ? 'Links found' : `Finding links in ${imageCount} screenshot${imageCount === 1 ? '' : 's'}…`}
          </span>
        </div>
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {done ? 'Preparing your links for review' : 'Scanning your screenshots for links to save'}
        </p>
      </div>
    </div>
  )
}
