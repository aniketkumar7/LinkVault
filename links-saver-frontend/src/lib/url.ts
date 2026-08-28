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
