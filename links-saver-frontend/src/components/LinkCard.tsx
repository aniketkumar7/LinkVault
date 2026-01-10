import { useState } from 'react'
import { api } from '@/lib/api'
import type { Link, Collection } from '@/lib/api'
import { toast } from '@/lib/toast'
import { Dialog } from '@/components/ui/Dialog'
import { LazyImage } from '@/components/ui/LazyImage'

interface Props {
  link: Link
  onUpdated: () => void
  onDeleted: () => void
  collections?: Collection[]
  selectable?: boolean
  selected?: boolean
  onSelect?: () => void
  onToggleFavorite?: () => void
}

function FaviconImg({ src }: { src: string | null }) {
  const [error, setError] = useState(false)
  
  if (!src || error) {
    return (
      <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: 'var(--color-bg-tertiary)' }}>
        <svg className="w-3 h-3" style={{ color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </div>
    )
  }
  
  return (
    <img 
      src={src} 
      alt="" 
      className="w-5 h-5 rounded object-contain"
      onError={() => setError(true)}
    />
  )
}

export function LinkCard({ 
  link, 
  onUpdated, 
  onDeleted, 
  collections = [],
  selectable = false,
  selected = false,
  onSelect,
  onToggleFavorite,
}: Props) {
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  // Edit state
  const [editNote, setEditNote] = useState(link.note)
  const [editTags, setEditTags] = useState(link.tags.join(', '))
  const [editCollectionId, setEditCollectionId] = useState(link.collection_id || '')

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.deleteLink(link.id)
      onDeleted()
      setShowDeleteDialog(false)
    } catch (err) {
      console.error('Delete failed:', err)
      toast.error('Failed to delete link')
    } finally {
      setDeleting(false)
    }
  }

  const handleSaveEdit = async () => {
    setSaving(true)
    try {
      await api.updateLink(link.id, {
        note: editNote,
        tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
        collection_id: editCollectionId || undefined,
      })
      setEditing(false)
      onUpdated()
      toast.success('Link updated')
    } catch (err) {
      console.error('Update failed:', err)
      toast.error('Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditing(false)
    setEditNote(link.note)
    setEditTags(link.tags.join(', '))
    setEditCollectionId(link.collection_id || '')
  }

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(link.url)
    setCopied(true)
    toast.success('Link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFavoriteClick = () => {
    if (onToggleFavorite) {
      onToggleFavorite()
    } else {
      api.toggleFavorite(link.id).then(onUpdated)
    }
  }

  const collectionName = collections.find(c => c.id === link.collection_id)?.name

  return (
    <>
      <div
        className={`relative rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg ${selected ? 'ring-2 ring-accent' : ''}`}
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
        }}
        onClick={selectable ? onSelect : undefined}
      >
        {/* Selection checkbox */}
        {selectable && (
          <div className="absolute top-3 left-3 z-10">
            <div 
              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selected ? 'border-accent bg-accent' : 'border-white/50 bg-black/30 backdrop-blur'}`}
            >
              {selected && (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
        )}

        {/* Favorite badge - top right */}
        {link.is_favorite && (
          <div className="absolute top-3 right-3 z-10">
            <span className="text-amber-400 text-lg drop-shadow">★</span>
          </div>
        )}

        {/* Image */}
        <LazyImage
          src={link.image_url}
          alt={link.title || 'Link preview'}
          className="aspect-video w-full"
        />

        {/* Content */}
        <div className="p-4 space-y-2.5">
          {/* Title row with favicon */}
          <div className="flex items-start gap-2">
            <FaviconImg src={link.favicon_url} />
            <h3 className="font-semibold text-sm line-clamp-2 flex-1" style={{ color: 'var(--color-text-primary)' }}>
              {link.title || 'Untitled'}
            </h3>
          </div>

          {/* Description */}
          {link.description && (
            <p className="text-xs line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
              {link.description}
            </p>
          )}

          {/* Note */}
          {link.note && (
            <p className="text-xs px-2 py-1.5 rounded-lg" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
              💬 {link.note}
            </p>
          )}

          {/* Meta: Tags, Collection */}
          <div className="flex flex-wrap gap-1.5 items-center">
            {link.tags.slice(0, 3).map(tag => (
              <span key={tag} className="px-1.5 py-0.5 rounded text-xs" style={{ color: 'var(--color-accent)' }}>
                #{tag}
              </span>
            ))}
            {link.tags.length > 3 && (
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>+{link.tags.length - 3}</span>
            )}
            {collectionName && (
              <span className="text-xs ml-auto" style={{ color: 'var(--color-text-muted)' }}>📁 {collectionName}</span>
            )}
          </div>

          {/* Edit Mode */}
          {editing ? (
            <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <input
                type="text"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="Note..."
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              />
              <input
                type="text"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="Tags (comma separated)"
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              />
              {collections.length > 0 && (
                <select
                  value={editCollectionId}
                  onChange={(e) => setEditCollectionId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                >
                  <option value="">No collection</option>
                  {collections.map(col => (
                    <option key={col.id} value={col.id}>{col.name}</option>
                  ))}
                </select>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: 'var(--color-accent)' }}
                >
                  {saving && (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                  style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* Single row of actions */
            <div className="flex items-center gap-1 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
              {/* Favorite */}
              <button
                onClick={(e) => { e.stopPropagation(); handleFavoriteClick() }}
                className="p-2 rounded-lg transition-colors"
                style={{ color: link.is_favorite ? '#fbbf24' : 'var(--color-text-muted)' }}
                title={link.is_favorite ? 'Remove favorite' : 'Add favorite'}
              >
                <svg className="w-4 h-4" fill={link.is_favorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>

              {/* Copy */}
              <button
                onClick={(e) => { e.stopPropagation(); handleCopyUrl() }}
                className="p-2 rounded-lg transition-colors"
                style={{ color: copied ? 'var(--color-success)' : 'var(--color-text-muted)' }}
                title="Copy URL"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>

              {/* Open */}
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
                title="Open link"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Date */}
              <span className="text-xs px-2" style={{ color: 'var(--color-text-muted)' }}>
                {new Date(link.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>

              {/* Edit */}
              <button
                onClick={(e) => { e.stopPropagation(); setEditing(true) }}
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
                title="Edit"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>

              {/* Delete */}
              <button
                onClick={(e) => { e.stopPropagation(); setShowDeleteDialog(true) }}
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--color-error)' }}
                title="Delete"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Delete link?"
        description="This action cannot be undone. The link will be permanently deleted."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        variant="danger"
        loading={deleting}
      />
    </>
  )
}
