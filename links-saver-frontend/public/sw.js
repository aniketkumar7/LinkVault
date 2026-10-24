const DB_NAME = 'linkvault-share-target'
const STORE_NAME = 'incoming-shares'
const DB_VERSION = 1

function openShareDb() {
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

async function saveIncomingShare(share) {
  const db = await openShareDb()
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).put({ ...share, id: 'latest', createdAt: Date.now() })
    transaction.oncomplete = resolve
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
  db.close()
}

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url)
  if (event.request.method !== 'POST' || requestUrl.pathname !== '/share-target') return

  event.respondWith((async () => {
    try {
      const form = await event.request.formData()
      const files = form.getAll('sharedFiles')
        .filter(value => value instanceof File && value.size > 0)
        .slice(0, 10)
        .map(file => ({
          name: file.name,
          type: file.type,
          lastModified: file.lastModified,
          blob: file,
        }))

      await saveIncomingShare({
        title: typeof form.get('title') === 'string' ? form.get('title') : '',
        text: typeof form.get('text') === 'string' ? form.get('text') : '',
        url: typeof form.get('url') === 'string' ? form.get('url') : '',
        files,
      })
    } catch (error) {
      console.error('Could not receive shared content', error)
    }

    return Response.redirect(new URL('/?share-target=1', requestUrl), 303)
  })())
})
