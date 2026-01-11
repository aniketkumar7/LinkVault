import { useState, useRef, useEffect } from 'react'
import { api } from '@/lib/api'
import type { Collection } from '@/lib/api'
import { toast } from '@/lib/toast'
import { Select } from './ui/Select'

interface Props {
  onLinkAdded: () => void
  existingTags: string[]
  collections: Collection[]
  onCollectionCreated?: () => void
}

export function AddLinkForm({ onLinkAdded, existingTags, collections, onCollectionCreated }: Props) {
  const [url, setUrl] = useState('')
  const [note, setNote] = useState('')
  const [tags, setTags] = useState('')
  const [collectionId, setCollectionId] = useState('')
  const [isFavorite, setIsFavorite] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [duplicate, setDuplicate] = useState<{ id: string; title: string; created_at: string } | null>(null)
  const [checkingDuplicate, setCheckingDuplicate] = useState(false)
  const [allowDuplicate, setAllowDuplicate] = useState(false)
  
  // New collection inline creation
  const [showNewCollection, setShowNewCollection] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [creatingCollection, setCreatingCollection] = useState(false)
  
  const urlInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    urlInputRef.current?.focus()
  }, [])

  // Check for duplicates when URL changes
  useEffect(() => {
    // Reset allow duplicate when URL changes
    setAllowDuplicate(false)
    
    if (!url.trim()) {
      setDuplicate(null)
      return
    }

    // Validate URL first
    try {
      new URL(url.trim())
    } catch {
      setDuplicate(null)
      return
    }

    // Debounce the check
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setCheckingDuplicate(true)
      try {
        const result = await api.checkDuplicate(url.trim())
        setDuplicate(result.existing || null)
      } catch {
        // Ignore errors
      } finally {
        setCheckingDuplicate(false)
      }
    }, 500)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [url])

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return
    
    setCreatingCollection(true)
    try {
      const newCollection = await api.createCollection({
        name: newCollectionName.trim(),
        color: '#2ABBF7',
      })
      setCollectionId(newCollection.id)
      setNewCollectionName('')
      setShowNewCollection(false)
      toast.success('Collection created!')
      onCollectionCreated?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create collection')
    } finally {
      setCreatingCollection(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return
    
    // Block if duplicate detected and not explicitly allowed
    if (duplicate && !allowDuplicate) {
      toast.error('This link already exists. Click "Save anyway" to add it again.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await api.createLink({
        url: url.trim(),
        note: note.trim() || undefined,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        is_favorite: isFavorite,
        collection_id: collectionId || undefined,
        allow_duplicate: allowDuplicate,
      })
      
      // Reset form
      setUrl('')
      setNote('')
      setTags('')
      setCollectionId('')
      setIsFavorite(false)
      setDuplicate(null)
      setAllowDuplicate(false)
      urlInputRef.current?.focus()
      
      toast.success('Link saved!')
      onLinkAdded()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save link'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl p-4" style={{
      background: 'var(--color-bg-card)',
      border: '1px solid var(--color-border)',
    }}>
      {/* Row 1: URL + Favorite + Save */}
      <div className="flex gap-2 items-center">
        <div className="flex-1 relative">
          <input
            ref={urlInputRef}
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste URL here..."
            className="w-full px-3 py-2.5 rounded-xl text-sm transition-all pr-8"
            style={{
              background: 'var(--color-bg-tertiary)',
              border: `1px solid ${duplicate && !allowDuplicate ? 'var(--color-error)' : 'var(--color-border)'}`,
              color: 'var(--color-text-primary)',
            }}
            disabled={loading}
            required
          />
          {checkingDuplicate && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <svg className="animate-spin h-4 w-4" style={{ color: 'var(--color-text-muted)' }} viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}
        </div>
        
        <button
          type="button"
          onClick={() => setIsFavorite(!isFavorite)}
          className="p-2.5 rounded-xl transition-all btn-press shrink-0"
          style={{
            background: isFavorite ? 'rgba(251, 191, 36, 0.15)' : 'var(--color-bg-tertiary)',
            border: `1px solid ${isFavorite ? '#fbbf24' : 'var(--color-border)'}`,
            color: isFavorite ? '#fbbf24' : 'var(--color-text-muted)',
          }}
          title={isFavorite ? 'Remove favorite' : 'Add favorite'}
        >
          <svg className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>

        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 btn-press shrink-0"
          style={{
            background: loading ? 'var(--color-border)' : 'var(--color-accent)',
          }}
        >
          {loading ? '...' : 'Save'}
        </button>
      </div>

      {/* Duplicate warning */}
      {duplicate && !allowDuplicate && (
        <div className="mt-2 px-3 py-2 rounded-lg text-xs flex items-center justify-between animate-slide-down" style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--color-error)',
        }}>
          <span style={{ color: 'var(--color-error)' }}>
            ⚠️ Already saved: "{duplicate.title?.slice(0, 30) || 'Untitled'}..."
          </span>
          <button
            type="button"
            onClick={() => setAllowDuplicate(true)}
            className="text-xs px-2 py-0.5 rounded font-medium"
            style={{ background: 'var(--color-error)', color: 'white' }}
          >
            Allow
          </button>
        </div>
      )}

      {/* Row 2: Note (40%) + Tags (30%) + Collection (30%) */}
      <div className="flex gap-2 mt-2">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional)"
          className="px-3 py-2 rounded-xl text-sm"
          style={{
            width: '40%',
            background: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
          disabled={loading}
        />
        
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Tags (comma)"
          list="existing-tags"
          className="px-3 py-2 rounded-xl text-sm"
          style={{
            width: '30%',
            background: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
          disabled={loading}
        />
        <datalist id="existing-tags">
          {existingTags.map((tag) => <option key={tag} value={tag} />)}
        </datalist>
        
        {showNewCollection ? (
          <div className="flex gap-1" style={{ width: '30%' }}>
            <input
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="New collection..."
              className="flex-1 px-3 py-2 rounded-xl text-sm"
              style={{
                background: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-accent)',
                color: 'var(--color-text-primary)',
              }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); handleCreateCollection() }
                if (e.key === 'Escape') { setShowNewCollection(false); setNewCollectionName('') }
              }}
            />
            <button
              type="button"
              onClick={handleCreateCollection}
              disabled={creatingCollection || !newCollectionName.trim()}
              className="px-2 py-2 rounded-xl text-white text-xs disabled:opacity-50"
              style={{ background: 'var(--color-accent)' }}
            >
              ✓
            </button>
            <button
              type="button"
              onClick={() => { setShowNewCollection(false); setNewCollectionName('') }}
              className="px-2 py-2 rounded-xl text-xs"
              style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-muted)' }}
            >
              ✕
            </button>
          </div>
        ) : (
          <Select
            value={collectionId}
            onChange={(val) => {
              if (val === '__new__') setShowNewCollection(true)
              else setCollectionId(val)
            }}
            options={[
              { value: '', label: 'Collection' },
              ...collections.map(col => ({ value: col.id, label: col.name, color: col.color })),
              { value: '__new__', label: '+ New' }
            ]}
            placeholder="Collection"
            size="sm"
            disabled={loading}
            className="w-[30%]"
          />
        )}
      </div>

      {error && (
        <div className="mt-2 px-3 py-2 rounded-xl text-xs" style={{
          background: 'rgba(239, 68, 68, 0.1)',
          color: 'var(--color-error)',
        }}>
          {error}
        </div>
      )}
    </form>
  )
}
