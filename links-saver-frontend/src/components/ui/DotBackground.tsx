import { useEffect, useRef } from 'react'

// Fixed dot grid behind every page; accent dots light up around the cursor.
export function DotBackground() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !matchMedia('(pointer: fine)').matches) return
    let frame = 0
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        ref.current?.style.setProperty('--mx', `${e.clientX}px`)
        ref.current?.style.setProperty('--my', `${e.clientY}px`)
      })
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => {
      window.removeEventListener('pointermove', move)
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div ref={ref} aria-hidden="true" className="dot-bg">
      <div className="dot-bg-base" />
      <div className="dot-bg-glow" />
    </div>
  )
}
