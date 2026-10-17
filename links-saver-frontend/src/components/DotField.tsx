import { memo, useCallback, useEffect, useRef } from 'react'

const TWO_PI = Math.PI * 2

interface Props {
  dotRadius?: number
  dotSpacing?: number
  gradientFrom?: string
  gradientTo?: string
  className?: string
}

export const DotField = memo(function DotField({ dotRadius = 1.5, dotSpacing = 14, gradientFrom = 'rgba(255,255,255,0.18)', gradientTo = 'rgba(255,255,255,0.03)', className = '' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const drawDots = useCallback((width: number, height: number, time = 0) => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context || width <= 0 || height <= 0) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)
    context.setTransform(dpr, 0, 0, dpr, 0, 0)
    context.clearRect(0, 0, width, height)
    const gradient = context.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, gradientFrom)
    gradient.addColorStop(1, gradientTo)
    context.fillStyle = gradient
    const step = dotRadius + dotSpacing
    if (step <= 0) return
    const radius = dotRadius / 2
    const columns = Math.ceil(width / step)
    const rows = Math.ceil(height / step)
    context.beginPath()
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const x = column * step + step / 2
        const y = row * step + step / 2 + Math.sin(column * 0.22 + row * 0.22 + time * 1.4) * 2.2
        context.moveTo(x + radius, y)
        context.arc(x, y, radius, 0, TWO_PI)
      }
    }
    context.fill()
  }, [dotRadius, dotSpacing, gradientFrom, gradientTo])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let frame = 0
    const draw = (now = performance.now()) => {
      const rect = container.getBoundingClientRect()
      drawDots(rect.width, rect.height, now * 0.001)
      frame = requestAnimationFrame(draw)
    }
    draw()
    const observer = new ResizeObserver(() => draw())
    observer.observe(container)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [drawDots])

  return <div ref={containerRef} className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`} aria-hidden="true"><canvas ref={canvasRef} className="absolute inset-0 z-0 h-full w-full" /></div>
})

DotField.displayName = 'DotField'

export default DotField
