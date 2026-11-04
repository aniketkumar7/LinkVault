export function normalizeUrl(value: string): string {
  const input = value.trim()
  if (!input) return ''
  const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`)
  url.protocol = url.protocol.toLowerCase()
  url.hostname = url.hostname.toLowerCase()
  if ((url.protocol === 'https:' && url.port === '443') || (url.protocol === 'http:' && url.port === '80')) url.port = ''
  url.hash = ''
  url.pathname = url.pathname.replace(/\/$/, '') || '/'
  return url.toString()
}

/** Only http(s) URLs are ever rendered as links; anything else (javascript:, data:) becomes inert. */
export function safeHref(value: string): string {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '#'
  } catch {
    return '#'
  }
}
