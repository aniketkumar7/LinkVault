import { useState } from 'react'

// Flower picker: 18 hues x 3 tones = 54 one-tap colors.
// Lightness is kept mid-range on purpose, so no pick is near black/white and every
// folder stays visible in both themes.
const HUES = Array.from({ length: 18 }, (_, i) => i * 20)
const RINGS = [
  { radius: 116, petal: 17, s: 72, l: 74 }, // outer: light
  { radius: 84, petal: 13.5, s: 76, l: 58 }, // middle: vivid
  { radius: 56, petal: 9, s: 64, l: 42 }, // inner: deep
]
const SIZE = 272
const CENTER = SIZE / 2

function hslToHex(h: number, s: number, l: number) {
  const sat = s / 100
  const light = l / 100
  const a = sat * Math.min(light, 1 - light)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    return light - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
  }
  return `#${[f(0), f(8), f(4)].map(c => Math.round(c * 255).toString(16).padStart(2, '0')).join('')}`
}

const PETALS = RINGS.flatMap((ring, ringIndex) =>
  HUES.map(hue => {
    // Offset alternate rings by half a step so petals interlock like a flower
    const angle = ((hue + (ringIndex % 2 ? 10 : 0)) * Math.PI) / 180 - Math.PI / 2
    return {
      color: hslToHex(hue + (ringIndex % 2 ? 10 : 0), ring.s, ring.l),
      x: CENTER + Math.cos(angle) * ring.radius,
      y: CENTER + Math.sin(angle) * ring.radius,
      r: ring.petal,
    }
  }),
)

export function ColorPicker({ value = '#f5cb5c', onChange }: { value?: string; onChange?: (color: string) => void }) {
  const [selected, setSelected] = useState(value.toLowerCase())
  const choose = (color: string) => {
    setSelected(color)
    onChange?.(color)
  }

  return (
    <div className="mt-3 flex justify-center">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="radiogroup" aria-label="Folder color" className="max-w-full">
        {PETALS.map(petal => {
          const isSelected = petal.color === selected
          return (
            <circle
              key={petal.color}
              cx={petal.x}
              cy={petal.y}
              r={petal.r}
              fill={petal.color}
              role="radio"
              aria-checked={isSelected}
              aria-label={petal.color}
              tabIndex={0}
              onClick={() => choose(petal.color)}
              onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(petal.color) } }}
              stroke={isSelected ? 'var(--color-text-primary)' : 'rgba(255,255,255,0.18)'}
              strokeWidth={isSelected ? 3 : 1}
              className="cursor-pointer outline-none transition-transform duration-150 hover:scale-[1.18] focus-visible:scale-[1.18]"
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            />
          )
        })}
        {/* Current color */}
        <circle cx={CENTER} cy={CENTER} r={34} fill={selected} stroke="var(--color-bg-card)" strokeWidth={4} />
      </svg>
    </div>
  )
}
