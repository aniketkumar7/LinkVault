const DB_NAME = 'linkvault-share-target'
const STORE_NAME = 'incoming-shares'
const DB_VERSION = 1

export interface IncomingShare {
  title: string
  text: string
  url: string
  files: File[]
}

function openShareDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function takeIncomingShare(): Promise<IncomingShare | null> {
  const db = await openShareDb()
  const share = await new Promise<{ title?: string; text?: string; url?: string; files?: { name: string; type: string; lastModified: number; blob: Blob }[] } | undefined>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const request = transaction.objectStore(STORE_NAME).get('latest')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).delete('latest')
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
  db.close()

  if (!share) return null
  return {
    title: share.title ?? '',
    text: share.text ?? '',
    url: share.url ?? '',
    files: (share.files ?? []).map(file => new File([file.blob], file.name, {
      type: file.type || file.blob.type,
      lastModified: file.lastModified,
    })),
  }
}

export function extractSharedUrl(share: IncomingShare): string {
  const candidates = [share.url, ...share.text.match(/https?:\/\/[^\s<>()"']+/gi) ?? []]
  for (const candidate of candidates) {
    const cleaned = candidate.trim().replace(/[.,;:!?]+$/, '')
    try {
      const url = new URL(cleaned)
      if (url.protocol === 'http:' || url.protocol === 'https:') return url.href
    } catch {
      // Try the next shared value.
    }
  }
  return ''
}
