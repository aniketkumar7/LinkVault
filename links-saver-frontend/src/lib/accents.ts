// Keys match [data-accent] blocks in index.css
export const ACCENTS = [
  { key: 'sun', label: 'Sun', swatch: '#f5cb5c' },
  { key: 'sage', label: 'Sage', swatch: '#84a98c' },
  { key: 'teal', label: 'Teal', swatch: '#62929e' },
  { key: 'navy', label: 'Navy', swatch: '#003459' },
  { key: 'rose', label: 'Rose', swatch: '#e0afa0' },
  { key: 'lavender', label: 'Lavender', swatch: '#9983d7' },
  { key: 'coral', label: 'Coral', swatch: '#e9937d' },
  { key: 'mint', label: 'Mint', swatch: '#7fbf98' },
  { key: 'plum', label: 'Plum', swatch: '#b57ac7' },
  { key: 'sky', label: 'Sky', swatch: '#72afd0' },
  { key: 'amber', label: 'Amber', swatch: '#e5a94d' },
]

export type AccentKey = (typeof ACCENTS)[number]['key']

/** Apply an accent app-wide and remember it (read again on boot in main.tsx). */
export function setAccent(key: string) {
  document.documentElement.setAttribute('data-accent', key)
  try { localStorage.setItem('accent', key) } catch { /* storage unavailable */ }
}
