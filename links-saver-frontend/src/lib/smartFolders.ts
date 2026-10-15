// Built-in folders shown before user collections. Routed at /all, /unsorted, /favorites.
export type SmartKey = 'all' | 'unsorted' | 'favorites'

export const SMART_FOLDERS: { key: SmartKey; name: string; color: string }[] = [
  { key: 'all', name: 'All links', color: '#5ab7dc' },
  { key: 'unsorted', name: 'Unsorted', color: '#9a9a9a' },
  { key: 'favorites', name: 'Favorites', color: '#fbbf24' },
]

export const SMART_PREFIX = 'smart:'

export function smartKey(id: string | null): SmartKey | null {
  if (!id?.startsWith(SMART_PREFIX)) return null
  const key = id.slice(SMART_PREFIX.length)
  return SMART_FOLDERS.some(f => f.key === key) ? (key as SmartKey) : null
}

/** Parses the URL into an open-collection id: a collection id/name, or smart:<key>. */
export function routeToCollectionId(pathname: string): string | null {
  const smart = pathname.match(/^\/(all|unsorted|favorites)\/?$/)
  if (smart) return SMART_PREFIX + smart[1]
  const match = pathname.match(/^\/collections\/([^/]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

export function collectionPath(id: string, name?: string) {
  const key = smartKey(id)
  return key ? `/${key}` : `/collections/${encodeURIComponent(name || id)}`
}
