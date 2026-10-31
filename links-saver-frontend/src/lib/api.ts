import { supabase } from './supabase'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
export const NOTIFICATIONS_UPDATED = 'bookmarky:notifications-updated'

function announceNotificationUpdate() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED))
}

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  }
}

async function getApiError(response: Response, fallback: string): Promise<Error> {
  if (response.status === 401) return new Error('Your session expired. Please sign in again.')
  if (response.status === 413) return new Error('The uploaded file is too large.')
  if (response.status === 429) return new Error('Too many requests or AI quota reached. Please wait and try again.')
  try {
    const body = await response.json() as { error?: unknown }
    if (typeof body.error === 'string' && body.error.trim()) return new Error(body.error)
  } catch { /* non-JSON response */ }
  return new Error(fallback)
}

// Types
export interface Link {
  id: string
  created_at: string
  updated_at: string
  url: string
  note: string
  title: string | null
  description: string | null
  image_url: string | null
  favicon_url: string | null
  tags: string[]
  is_favorite: boolean
  collection_id: string | null
}

export interface Collection {
  id: string
  created_at: string
  name: string
  description: string | null
  color: string
  is_public: boolean
  is_pinned?: boolean
  share_slug: string | null
  link_count?: number
  last_link_at?: string | null
}

export interface CreateLinkInput {
  url: string
  note?: string
  tags?: string[]
  is_favorite?: boolean
  collection_id?: string
  allow_duplicate?: boolean
}

export interface LinkFilters {
  favorite?: boolean
  /** 'none' = links without a collection */
  collection_id?: string
  tag?: string
  search?: string
  sort?: 'created_at' | 'updated_at' | 'title'
  order?: 'asc' | 'desc'
  limit?: number
}

export interface Stats {
  total: number
  favorites: number
  unsorted: number
  savedLast7Days: number
  tags: string[]
}

export interface ExtractedLink {
  url: string
  collectionId: string | null
  suggestedCollection: { name: string; color: string } | null
  recommendation?: { confidence: number; reason: string } | null
}

export interface BulkImportResult {
  success: Link[]
  failed: { url: string; error: string }[]
  duplicates: { url: string; id: string }[]
}

export interface AppNotification {
  id: string
  type: 'import' | 'link_added' | 'link_edited' | 'link_deleted'
    | 'link_favorited' | 'link_unfavorited'
    | 'collection_created' | 'collection_edited' | 'collection_deleted'
    | 'collection_shared' | 'collection_unshared' | 'collection_pinned' | 'collection_unpinned'
    | 'profile_updated' | 'password_updated'
  title: string
  message: string
  created_at: string
  read_at: string | null
}

// API Client
export const api = {
  // Links
  async getLinks(filters?: LinkFilters): Promise<Link[]> {
    const headers = await getAuthHeaders()
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.set(key, String(value))
      })
    }
    const res = await fetch(`${API_URL}/api/links?${params}`, { headers })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch links')
    return (await res.json()).links
  },

  async createLink(input: CreateLinkInput): Promise<Link> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/api/links`, {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to create link')
    const link = (await res.json()).link
    announceNotificationUpdate()
    return link
  },

  async updateLink(id: string, updates: Partial<Omit<Link, 'id' | 'created_at' | 'url'>>): Promise<Link> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/api/links/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updates),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to update link')
    const link = (await res.json()).link
    announceNotificationUpdate()
    return link
  },

  async deleteLink(id: string): Promise<void> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/api/links/${id}`, { method: 'DELETE', headers })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete link')
    announceNotificationUpdate()
  },

  async toggleFavorite(id: string): Promise<Link> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/api/links/${id}/favorite`, { method: 'PATCH', headers })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to toggle favorite')
    return (await res.json()).link
  },

  async checkDuplicate(url: string): Promise<{ exists: boolean; existing?: { id: string; title: string; created_at: string } }> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/api/links/check-duplicate?url=${encodeURIComponent(url)}`, { headers })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to check duplicate')
    return await res.json()
  },

  async bulkImport(urls: string[], options?: { tags?: string[]; collection_id?: string }): Promise<BulkImportResult> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/api/links/bulk`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ urls, ...options }),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to bulk import')
    return await res.json()
  },

  async bulkUpdateLinks(ids: string[], updates: { tags?: string[]; collection_id?: string | null }): Promise<Link[]> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/api/links/bulk`, { method: 'PATCH', headers, body: JSON.stringify({ ids, ...updates }) })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to update links')
    return (await res.json()).links
  },

  async refreshMetadata(id: string): Promise<Link> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/api/links/${id}/refresh-metadata`, { method: 'POST', headers })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to refresh metadata')
    const link = (await res.json()).link
    announceNotificationUpdate()
    return link
  },

  async getStats(): Promise<Stats> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/api/links/stats`, { headers })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch stats')
    return await res.json()
  },

  async exportLinks(format: 'json' | 'csv' = 'json'): Promise<Blob | { links: Link[] }> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/api/links/export?format=${format}`, { headers })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to export')
    if (format === 'csv') return await res.blob()
    return await res.json()
  },

  // Collections
  async getCollections(search = ''): Promise<Collection[]> {
    const headers = await getAuthHeaders()
    const query = search ? `?search=${encodeURIComponent(search)}` : ''
    const res = await fetch(`${API_URL}/api/collections${query}`, { headers })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch collections')
    return (await res.json()).collections
  },

  async createCollection(input: { name: string; description?: string; color?: string }): Promise<Collection> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/api/collections`, {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to create collection')
    const collection = (await res.json()).collection
    announceNotificationUpdate()
    return collection
  },

  async updateCollection(id: string, updates: { name?: string; description?: string; color?: string }): Promise<Collection> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/api/collections/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updates),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to update collection')
    const collection = (await res.json()).collection
    announceNotificationUpdate()
    return collection
  },

  async deleteCollection(id: string): Promise<void> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/api/collections/${id}`, { method: 'DELETE', headers })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete collection')
    announceNotificationUpdate()
  },

  async shareCollection(id: string): Promise<{ shareUrl: string }> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/api/collections/${id}/share`, { method: 'POST', headers })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to share collection')
    const result = await res.json()
    announceNotificationUpdate()
    return result
  },

  async unshareCollection(id: string): Promise<void> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/api/collections/${id}/share`, { method: 'DELETE', headers })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to unshare collection')
    announceNotificationUpdate()
  },

  async toggleCollectionPin(id: string): Promise<Collection> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/api/collections/${id}/pin`, { method: 'PATCH', headers })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to update pin')
    const collection = (await res.json()).collection
    announceNotificationUpdate()
    return collection
  },

  async extractFromScreenshots(images: File[], collections: Collection[]): Promise<ExtractedLink[]> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Not authenticated')
    const form = new FormData()
    images.forEach(img => form.append('screenshots', img))
    form.append('collections', JSON.stringify(collections.map(c => ({ id: c.id, name: c.name, description: c.description, link_count: c.link_count }))))
    const res = await fetch(`${API_URL}/api/screenshots/extract`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: form,
    })
    if (!res.ok) throw await getApiError(res, 'Could not extract links from these images. Please try again.')
    return (await res.json()).links
  },

  async recommendUrls(urls: string[], collections: Collection[]): Promise<ExtractedLink[]> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/api/screenshots/recommend`, {
      method: 'POST', headers,
      body: JSON.stringify({ urls, collections: collections.map(c => ({ id: c.id, name: c.name, description: c.description, link_count: c.link_count })) }),
    })
    if (!res.ok) throw await getApiError(res, 'Could not recommend collections. Please try again.')
    return (await res.json()).links
  },

  async getNotifications(): Promise<AppNotification[]> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/api/notifications`, { headers })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch notifications')
    return (await res.json()).notifications
  },

  async createImportNotification(counts: { saved: number; failed: number; duplicates: number }): Promise<AppNotification | null> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/api/notifications/import`, {
      method: 'POST', headers, body: JSON.stringify(counts),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to create notification')
    const notification = (await res.json()).notification
    if (notification) announceNotificationUpdate()
    return notification
  },

  async recordProfileUpdate(): Promise<void> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/api/notifications/profile-update`, { method: 'POST', headers })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to record profile update')
    announceNotificationUpdate()
  },

  async recordPasswordUpdate(): Promise<void> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/api/notifications/password-update`, { method: 'POST', headers })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to record password update')
    announceNotificationUpdate()
  },

  async markNotificationRead(id: string): Promise<void> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/api/notifications/${id}/read`, { method: 'PATCH', headers })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to mark notification as read')
  },

  async markAllNotificationsRead(): Promise<void> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/api/notifications/read-all`, { method: 'PATCH', headers })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to mark notifications as read')
  },

  async dismissNotification(id: string): Promise<void> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/api/notifications/${id}`, { method: 'DELETE', headers })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to dismiss notification')
  },

  async dismissAllNotifications(): Promise<string[]> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/api/notifications/all`, { method: 'DELETE', headers })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to clear notifications')
    return (await res.json()).dismissed
  },

  async restoreNotifications(ids: string[]): Promise<void> {
    if (!ids.length) return
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/api/notifications/restore`, {
      method: 'PATCH', headers, body: JSON.stringify({ ids }),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to restore notifications')
  },
}
