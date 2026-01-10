import { supabase } from './supabase'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

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
  share_slug: string | null
  link_count?: number
}

export interface CreateLinkInput {
  url: string
  note?: string
  tags?: string[]
  is_favorite?: boolean
  collection_id?: string
}

export interface LinkFilters {
  favorite?: boolean
  collection_id?: string
  tag?: string
  search?: string
  sort?: 'created_at' | 'updated_at' | 'title'
  order?: 'asc' | 'desc'
}

export interface Stats {
  total: number
  favorites: number
  tags: string[]
}

export interface BulkImportResult {
  success: Link[]
  failed: { url: string; error: string }[]
  duplicates: { url: string; id: string }[]
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
    return (await res.json()).link
  },

  async updateLink(id: string, updates: Partial<Omit<Link, 'id' | 'created_at' | 'url'>>): Promise<Link> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/api/links/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updates),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to update link')
    return (await res.json()).link
  },

  async deleteLink(id: string): Promise<void> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/api/links/${id}`, { method: 'DELETE', headers })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete link')
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
  async getCollections(): Promise<Collection[]> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/api/collections`, { headers })
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
    return (await res.json()).collection
  },

  async updateCollection(id: string, updates: { name?: string; description?: string; color?: string }): Promise<Collection> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/api/collections/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updates),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to update collection')
    return (await res.json()).collection
  },

  async deleteCollection(id: string): Promise<void> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/api/collections/${id}`, { method: 'DELETE', headers })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete collection')
  },

  async shareCollection(id: string): Promise<{ shareUrl: string }> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/api/collections/${id}/share`, { method: 'POST', headers })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to share collection')
    return await res.json()
  },

  async unshareCollection(id: string): Promise<void> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/api/collections/${id}/share`, { method: 'DELETE', headers })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to unshare collection')
  },
}
