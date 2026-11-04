import { useState } from 'react'

import { ACCENTS } from '@/lib/accents'

export function AccentPicker() {
  const [accent, setAccent] = useState(() => document.documentElement.getAttribute('data-accent') || 'sun')

  const choose = (key: string) => {
    setAccent(key)
    document.documentElement.setAttribute('data-accent', key)
    localStorage.setItem('accent', key)
  }

  return (
    <div className="px-1 py-1">
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Accent color">
        {ACCENTS.map(a => (
          <button
            key={a.key}
            type="button"
            role="radio"
            aria-checked={accent === a.key}
            aria-label={a.label}
            title={a.label}
            onClick={() => choose(a.key)}
            className="group relative flex h-[76px] flex-col justify-between overflow-hidden rounded-2xl border p-2.5 text-left transition-transform hover:-translate-y-0.5"
            style={{
              background: 'var(--color-bg-card)',
              borderColor: accent === a.key ? 'var(--color-text-primary)' : 'var(--color-border)',
              boxShadow: accent === a.key ? '0 0 0 2px var(--color-accent-fill)' : 'none',
            }}
          ><span className="absolute inset-x-0 top-0 h-7" style={{ background: `linear-gradient(110deg, ${a.swatch}, color-mix(in srgb, ${a.swatch} 35%, white))` }} /><span className="relative mt-6 text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>{a.label}</span><span className="relative flex gap-1"><i className="h-1.5 w-8 rounded-full" style={{ background: a.swatch }} /><i className="h-1.5 w-4 rounded-full" style={{ background: `color-mix(in srgb, ${a.swatch} 40%, var(--color-border))` }} /><i className="h-1.5 w-2 rounded-full" style={{ background: 'var(--color-border)' }} /></span></button>
        ))}
      </div>
    </div>
  )
}
