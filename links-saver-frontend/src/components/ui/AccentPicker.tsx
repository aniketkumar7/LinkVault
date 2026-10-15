import { useState } from 'react'

// Keys match [data-accent] blocks in index.css
const ACCENTS = [
  { key: 'sun', label: 'Sun', swatch: '#f5cb5c' },
  { key: 'sage', label: 'Sage', swatch: '#84a98c' },
  { key: 'teal', label: 'Teal', swatch: '#62929e' },
  { key: 'navy', label: 'Navy', swatch: '#003459' },
  { key: 'rose', label: 'Rose', swatch: '#e0afa0' },
]

export function AccentPicker() {
  const [accent, setAccent] = useState(() => document.documentElement.getAttribute('data-accent') || 'sun')

  const choose = (key: string) => {
    setAccent(key)
    document.documentElement.setAttribute('data-accent', key)
    localStorage.setItem('accent', key)
  }

  return (
    <div className="px-3 py-2">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Theme</p>
      <div className="flex items-center gap-2" role="radiogroup" aria-label="Accent color">
        {ACCENTS.map(a => (
          <button
            key={a.key}
            type="button"
            role="radio"
            aria-checked={accent === a.key}
            aria-label={a.label}
            title={a.label}
            onClick={() => choose(a.key)}
            className="h-7 w-7 rounded-full transition-transform hover:scale-110"
            style={{
              background: a.swatch,
              boxShadow: accent === a.key
                ? '0 0 0 2px var(--color-bg-card), 0 0 0 4px var(--color-text-primary)'
                : 'inset 0 0 0 1px rgba(255,255,255,0.15)',
            }}
          />
        ))}
      </div>
    </div>
  )
}
