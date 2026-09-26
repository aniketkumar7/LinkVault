import { useState } from 'react'

const colors = [
  '#ef5350',
  '#ed3f68',
  '#d9368b',
  '#b83fc2',
  '#ff754d',
  '#ff8f3d',
  '#ffbd4d',
  '#f3df61',
  '#e8e85d',
  '#a9d66f',
  '#7fc95c',
  '#62cfaa',
  '#42bfa0',
  '#5ab7dc',
  '#4b9edb',
  '#6689df',
  '#5369d7',
  '#9274d9',
  '#c363c6',
  '#e8669a',
  '#ed7890',
  '#f08a72',
  '#f5a85f',
  '#c9dc68',
  '#79d3a2',
]

function blendWithWhite(hex: string, opacity: number) {
  const value = hex.replace('#', '')
  if (value.length !== 6) return hex
  const channels = [0, 2, 4].map(index => parseInt(value.slice(index, index + 2), 16))
  return `#${channels
    .map(channel =>
      Math.round(255 - (255 - channel) * opacity)
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`
}

function hslToHex(h: number, s = 78, l = 55) {
  s /= 100
  l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return `#${[f(0), f(8), f(4)]
    .map(v =>
      Math.round(v * 255)
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`
}

export function ColorPicker({
  value = '#3b82f6',
  onChange,
}: {
  value?: string
  onChange?: (color: string) => void
}) {
  const [selected, setSelected] = useState(value)
  const [opacity, setOpacity] = useState(1)
  const size = 252
  const center = size / 2
  const choose = (event: React.PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - box.left - center
    const y = event.clientY - box.top - center
    const distance = Math.hypot(x, y)
    if (distance > 102) return
    if (distance > 38 && distance < 102) {
      const angle = (Math.atan2(y, x) + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2)
      const index = Math.round(angle / ((Math.PI * 2) / colors.length)) % colors.length
      const nextColor = colors[index]
      setSelected(nextColor)
      setOpacity(1)
      onChange?.(nextColor)
      return
    }
    const next = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
    setSelected(hslToHex(next))
    onChange?.(hslToHex(next))
  }
  return (
    <div
      className="relative rounded-[22px] px-1 text-white"
      style={{ width: size + 24 }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        onPointerDown={choose}
        className="block touch-none cursor-crosshair">
        {colors.map((color, index) => {
          const angle = (index / colors.length) * Math.PI * 2 - Math.PI / 2
          const x = center + Math.cos(angle) * 73
          const y = center + Math.sin(angle) * 73
          return (
            <circle
              key={color}
              cx={x}
              cy={y}
              r="22"
              fill={color}
              stroke="rgba(255,255,255,.16)"
              strokeWidth="1"
            />
          )
        })}
        <circle
          cx={center}
          cy={center}
          r="30"
          fill={blendWithWhite(value, opacity)}
          stroke="white"
          strokeWidth="3"
        />
        <path
          d={`M${center - 8} ${center + 5}l14 -14M${center - 4} ${center - 5}l5 5M${center + 2} ${center - 10}l5 5`}
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <input
        type="color"
        value={selected}
        onChange={event => {
          setSelected(event.target.value)
          onChange?.(event.target.value)
        }}
        aria-label="Choose custom folder color"
        className="absolute left-1/2 top-[43%] h-12 w-12 -translate-x-1/2 -translate-y-1/2 cursor-pointer opacity-0"
      />
      <div className="-mt-1">
        <input
          aria-label="Folder color opacity"
          type="range"
          min="0.2"
          max="1"
          step="0.01"
          value={opacity}
          style={{
            background: `linear-gradient(90deg, #f4f4f5 0%, #f4f4f5 ${opacity * 100}%, #27272a ${opacity * 100}%, #27272a 100%)`,
          }}
          onChange={event => {
            const next = Number(event.target.value)
            setOpacity(next)
            onChange?.(blendWithWhite(selected, next))
          }}
          className="color-opacity-slider w-full"
        />
      </div>
    </div>
  )
}
