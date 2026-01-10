import { useState, useRef, useEffect } from 'react'
import { api } from '@/lib/api'
import type { Collection } from '@/lib/api'
import { toast } from '@/lib/toast'

interface Props {
  onLinkAdded: () => void
  existingTags: string[]
  collections: Collection[]
}

export function AddLinkForm({ onLinkAdded, existingTags, collections }: Props) {
  const [url, setUrl] = useState('')
  const [note, setNote] = useState('')
  const [tags, setTags] = useState('')
  const [collectionId, setCollectionId] = useState('')
  const [isFavorite, setIsFavorite] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [duplicate, setDuplicate] = useState<{ id: string; title: string; created_at: string } | null>(null)
  const [checkingDuplicate, setCheckingDuplicate] = useState(false)
  
  const urlInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    urlInputRef.current?.focus()
  }, [])

  // Check for duplicates when URL changes
  useEffect(() => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    setError(null)

    try {
      await api.createLink({
        url: url.trim(),
        note: note.trim() || undefined,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        is_favorite: isFavorite,
        collection_id: collectionId || undefined,
      })
      
      // Reset form
      setUrl('')
      setNote('')
      setTags('')
      setCollectionId('')
      setIsFavorite(false)
      setDuplicate(null)
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

  const [showAdvanced, setShowAdvanced] = useState(false)

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl p-6" style={{
      background: 'var(--color-bg-card)',
      border: '1px solid var(--color-border)',
      boxShadow: 'var(--shadow-card)',
    }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-muted) 100%)' }}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Quick Save
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm px-3 py-1.5 rounded-lg transition-colors"
          style={{ 
            background: showAdvanced ? 'var(--color-accent)' : 'var(--color-bg-tertiary)',
            color: showAdvanced ? 'white' : 'var(--color-text-muted)',
          }}
        >
          {showAdvanced ? 'Simple' : 'Advanced'}
        </button>
      </div>

      <div className="space-y-4">
        {/* URL Input */}
        <div>
          <div className="relative">
            <input
              ref={urlInputRef}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste URL here..."
              className="w-full px-4 py-3 rounded-xl text-base transition-all pr-10"
              style={{
                background: 'var(--color-bg-tertiary)',
                border: `1px solid ${duplicate ? 'var(--color-accent)' : 'var(--color-border)'}`,
                color: 'var(--color-text-primary)',
              }}
              disabled={loading}
              required
            />
            {checkingDuplicate && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="animate-spin h-5 w-5" style={{ color: 'var(--color-text-muted)' }} viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            )}
          </div>
          
          {/* Duplicate warning */}
          {duplicate && (
            <div className="mt-2 p-3 rounded-lg text-sm flex items-center justify-between" style={{
              background: 'rgba(42, 187, 247, 0.1)',
              border: '1px solid var(--color-accent)',
            }}>
              <span style={{ color: 'var(--color-accent)' }}>
                ⚠️ Already saved: "{duplicate.title || 'Untitled'}" ({new Date(duplicate.created_at).toLocaleDateString()})
              </span>
              <button
                type="button"
                onClick={() => setDuplicate(null)}
                className="text-xs underline"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Save anyway
              </button>
            </div>
          )}
        </div>

        {/* Note */}
        <div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Why is this useful? (helps you remember later)"
            rows={2}
            className="w-full px-4 py-3 rounded-xl text-base transition-all resize-none"
            style={{
              background: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
            disabled={loading}
          />
        </div>

        {/* Basic row: Collection + Submit */}
        <div className="flex gap-3 flex-wrap">
          {collections.length > 0 && (
            <select
              value={collectionId}
              onChange={(e) => setCollectionId(e.target.value)}
              className="flex-1 min-w-32 px-4 py-3 rounded-xl text-base"
              style={{
                background: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border)',
                color: collectionId ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              }}
              disabled={loading}
            >
              <option value="">No Collection</option>
              {collections.map((col) => (
                <option key={col.id} value={col.id}>{col.name}</option>
              ))}
            </select>
          )}
          
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="px-6 py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            style={{
              background: loading ? 'var(--color-border)' : 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-muted) 100%)',
              boxShadow: loading ? 'none' : 'var(--shadow-glow)',
            }}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              'Save'
            )}
          </button>
        </div>

        {/* Advanced options */}
        {showAdvanced && (
          <div className="pt-4 border-t space-y-3" style={{ borderColor: 'var(--color-border)' }}>
            {/* Tags */}
            <div>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Tags (comma separated)"
                list="tags"
                className="w-full px-4 py-3 rounded-xl text-base transition-all"
                style={{
                  background: 'var(--color-bg-tertiary)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
                disabled={loading}
              />
              <datalist id="tags">
                {existingTags.map((tag) => (
                  <option key={tag} value={tag} />
                ))}
              </datalist>
            </div>

            {/* Favorite */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsFavorite(!isFavorite)}
                className="px-4 py-3 rounded-xl text-base font-medium transition-all"
                style={{
                  background: isFavorite ? 'rgba(42, 187, 247, 0.1)' : 'var(--color-bg-tertiary)',
                  border: `1px solid ${isFavorite ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  color: isFavorite ? 'var(--color-accent)' : 'var(--color-text-muted)',
                }}
              >
                {isFavorite ? '★ Favorite' : '☆ Favorite'}
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-xl text-sm" style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--color-error)',
          color: 'var(--color-error)',
        }}>
          {error}
        </div>
      )}
    </form>
  )
}
