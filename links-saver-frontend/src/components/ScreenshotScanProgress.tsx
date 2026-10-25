import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'

interface Props {
  previews: string[]
  done?: boolean
}

const CELL = 10

function hash(x: number, y: number) {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return value - Math.floor(value)
}

/** A lightweight canvas overlay: a luminous scan band and clustered pixel detections. */
function PixelScan({ active, reduceMotion }: { active: boolean; reduceMotion: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const frame = canvas?.parentElement
    const ctx = canvas?.getContext('2d')
    if (!canvas || !frame || !ctx) return

    let width = 0
    let height = 0
    let frameId = 0
    let lastPaint = 0
    let startTime = 0
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim() || '#f5cb5c'

    const resize = () => {
      const bounds = frame.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      width = bounds.width
      height = bounds.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const paint = (time: number) => {
      if (!width || !height) return
      ctx.clearRect(0, 0, width, height)

      if (active) {
        const elapsed = startTime ? (time - startTime) / 1000 : 0
        const sweep = reduceMotion ? 0.5 : ((elapsed % 3.2) / 3.2) * 1.24 - 0.12
        const bandY = sweep * height
        const rows = Math.ceil(height / CELL)
        const cols = Math.ceil(width / CELL)

        // Sparse, grouped detections shimmer in the wake of the scan instead of
        // covering the screenshot with a uniform grid.
        for (let row = 0; row < rows; row += 1) {
          const y = (row + 0.5) * CELL
          const distance = (bandY - y) / height
          const trail = distance >= 0 ? Math.exp(-distance * 5) : Math.exp(distance * 24)
          for (let col = 0; col < cols; col += 1) {
            const noise = hash(Math.floor(col / 3), Math.floor(row / 3))
            const sparkle = hash(col, row)
            const strength = trail * (0.18 + noise * 0.82)
            if (sparkle > strength * 0.75) continue

            const alpha = Math.min(0.78, strength * (0.2 + sparkle * 0.68))
            const size = sparkle > 0.78 ? 3.5 : 2
            ctx.fillStyle = accent
            ctx.globalAlpha = alpha
            ctx.fillRect((col + 0.5) * CELL - size / 2, y - size / 2, size, size)
          }
        }

        ctx.globalAlpha = 1
        if (!reduceMotion) {
          const glow = ctx.createLinearGradient(0, bandY - 24, 0, bandY + 24)
          glow.addColorStop(0, 'transparent')
          glow.addColorStop(0.5, accent)
          glow.addColorStop(1, 'transparent')
          ctx.globalAlpha = 0.25
          ctx.fillStyle = glow
          ctx.fillRect(0, bandY - 24, width, 48)
          ctx.globalAlpha = 0.95
          ctx.shadowColor = accent
          ctx.shadowBlur = 12
          ctx.fillRect(0, bandY, width, 1)
          ctx.shadowBlur = 0
        } else {
          ctx.globalAlpha = 0.6
          ctx.fillStyle = accent
          ctx.fillRect(0, bandY, width, 1)
        }
        ctx.globalAlpha = 1
      }
    }

    const tick = (time: number) => {
      if (time - lastPaint >= 1000 / 30) {
        if (!startTime) startTime = time
        paint(time)
        lastPaint = time
      }
      if (active && !reduceMotion) frameId = requestAnimationFrame(tick)
    }

    resize()
    paint(0)
    if (active && !reduceMotion) frameId = requestAnimationFrame(tick)
    const observer = new ResizeObserver(resize)
    observer.observe(frame)

    return () => {
      cancelAnimationFrame(frameId)
      observer.disconnect()
    }
  }, [active, reduceMotion])

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1]" />
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
        <PixelScan active={!done} reduceMotion={Boolean(reduceMotion)} />

        <div className="pointer-events-none absolute inset-0 z-[2]" aria-hidden="true">
          <span className="absolute left-3 top-3 h-4 w-4 rounded-tl-md border-l-2 border-t-2" style={{ borderColor: 'var(--color-accent)' }} />
          <span className="absolute right-3 top-3 h-4 w-4 rounded-tr-md border-r-2 border-t-2" style={{ borderColor: 'var(--color-accent)' }} />
          <span className="absolute bottom-3 left-3 h-4 w-4 rounded-bl-md border-b-2 border-l-2" style={{ borderColor: 'var(--color-accent)' }} />
          <span className="absolute bottom-3 right-3 h-4 w-4 rounded-br-md border-b-2 border-r-2" style={{ borderColor: 'var(--color-accent)' }} />
        </div>

        <div className="absolute left-4 top-4 z-[3] flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold shadow-sm backdrop-blur-md" style={{ background: 'color-mix(in srgb, var(--color-bg-card) 90%, transparent)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
          {!done && <span className="size-1.5 rounded-full" style={{ background: 'var(--color-accent)', boxShadow: '0 0 8px var(--color-accent)' }} />}
          {done ? 'Scan complete' : 'Scanning upload'}
        </div>

        {imageCount > 1 && (
          <span className="absolute bottom-4 right-4 z-[3] rounded-full border px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur-md" style={{ background: 'color-mix(in srgb, var(--color-bg-card) 90%, transparent)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
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
          {done ? 'Preparing your links for review' : 'Looking for URLs in your uploaded file'}
        </p>
      </div>
    </div>
  )
}
