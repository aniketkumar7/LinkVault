/** Dark or white text, whichever reads better on the given hex background. */
export function readableText(hex: string) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return '#ffffff'
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))
  return r * 0.299 + g * 0.587 + b * 0.114 > 160 ? '#151514' : '#ffffff'
}
