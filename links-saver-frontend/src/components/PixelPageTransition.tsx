import { useEffect, useState, useRef } from 'react'
import { motion, type Transition } from 'framer-motion'

function getShuffledIndices(count: number) {
  const arr = Array.from({ length: count }, (_, i) => i)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

interface Props {
  trigger: number
  onViewSwap?: () => void
  pixelSize?: number
  duration?: number
  staggerDuration?: number
  ease?: Transition['ease']
}

export default function PixelPageTransition({
  trigger,
  onViewSwap,
  pixelSize = 40,
  duration = 0.2,
  staggerDuration = 0.4,
  ease = 'easeInOut',
}: Props) {
  const [state, setState] = useState<'idle' | 'entering' | 'covered' | 'exiting'>('idle')
  const [grid, setGrid] = useState({ cols: 0, rows: 0, size: 0, total: 0 })
  const [order, setOrder] = useState<number[]>([])
  const swapRef = useRef(onViewSwap)

  useEffect(() => { swapRef.current = onViewSwap }, [onViewSwap])

  useEffect(() => {
    const calc = () => {
      const cols = Math.ceil(window.innerWidth / pixelSize)
      const size = window.innerWidth / cols
      const rows = Math.ceil(window.innerHeight / size)
      const total = cols * rows
      setGrid({ cols, rows, size, total })
      setOrder(getShuffledIndices(total))
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [pixelSize])

  useEffect(() => {
    if (trigger <= 0) return
    setState('entering')
    const coverMs = (duration + staggerDuration) * 1000
    const t1 = setTimeout(() => {
      setState('covered')
      swapRef.current?.()
      setState('exiting')
    }, coverMs)
    const t2 = setTimeout(() => setState('idle'), coverMs * 2)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [trigger, duration, staggerDuration])

  if (state === 'idle' || grid.total === 0 || order.length === 0) return null

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100] grid h-screen w-screen overflow-hidden"
      style={{
        gridTemplateColumns: `repeat(${grid.cols}, ${grid.size}px)`,
        gridTemplateRows:    `repeat(${grid.rows}, ${grid.size}px)`,
      }}
    >
      {Array.from({ length: grid.total }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={state === 'entering' || state === 'covered' ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration, ease, delay: (order[i] / grid.total) * staggerDuration }}
          style={{ background: 'var(--color-accent)' }}
          className="pointer-events-none h-full w-full"
        />
      ))}
    </div>
  )
}
