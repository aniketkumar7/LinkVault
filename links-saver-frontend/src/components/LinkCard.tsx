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
  onLongPress?: (id: string) => void
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'link'
  }
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
  onLongPress,
}: Props) {
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [pressTimer, setPressTimer] = useState<number | null>(null)
  const [suppressClick, setSuppressClick] = useState(false)

  const [editNote, setEditNote] = useState(link.note ?? '')
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
        tags: editTags.split(',').map((t) => t.trim()).filter(Boolean),
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
    setEditNote(link.note ?? '')
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

  const handlePressStart = () => {
    if (!onLongPress) return
    const timer = window.setTimeout(() => {
      onLongPress(link.id)
      setSuppressClick(true)
    }, 450)
    setPressTimer(timer)
  }

  const handlePressEnd = () => {
    if (pressTimer) {
      window.clearTimeout(pressTimer)
      setPressTimer(null)
    }
  }

  const handleCardClick = () => {
    if (selectable && suppressClick) {
      setSuppressClick(false)
      return
    }
    onSelect?.()
  }

  const collectionName = collections.find((c) => c.id === link.collection_id)?.name
  const tags = link.tags.filter(Boolean).slice(0, 3)
  const domain = getDomain(link.url)
  const previewTitle = link.title?.trim() || 'Untitled link'
  const previewDescription = link.description?.trim() || 'No description yet.'
  const savedDate = formatDate(link.updated_at || link.created_at)

  return (
    <>
      <article
        className={`group relative w-full min-w-0 overflow-hidden rounded-[24px] border transition-all duration-200 hover:-translate-y-1 ${selected ? 'ring-1 ring-sky-400/30' : ''}`}
        style={{
          background: 'var(--color-bg-card)',
          borderColor: selected ? 'rgba(42, 187, 247, 0.32)' : 'var(--color-border)',
          boxShadow: selected
            ? '0 20px 55px -24px rgba(42, 187, 247, 0.24)'
            : '0 18px 46px -24px rgba(15, 23, 42, 0.28)',
        }}
        onClick={selectable ? handleCardClick : undefined}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onTouchCancel={handlePressEnd}
      >
        {selectable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onSelect?.()
            }}
            aria-pressed={selected}
            className="absolute left-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border text-sm transition-all"
            style={{
              background: selected ? 'rgba(42, 187, 247, 0.14)' : 'rgba(2, 6, 23, 0.44)',
              borderColor: selected ? 'rgba(42, 187, 247, 0.28)' : 'rgba(255,255,255,0.16)',
              color: selected ? 'var(--color-accent)' : 'white',
            }}
            title={selected ? 'Deselect' : 'Select'}
          >
            {selected ? '✓' : '○'}
          </button>
        )}

        {link.is_favorite && (
          <div className="absolute right-3 top-3 z-10 rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-[11px] font-medium text-amber-400">
            ★ Favorite
          </div>
        )}

        <div className="p-3">
          <div className="overflow-hidden rounded-[18px] border" style={{ borderColor: 'var(--color-border)' }}>
            <LazyImage
              src={link.image_url}
              alt={previewTitle}
              className="aspect-16/10 w-full"
            />
          </div>
        </div>

        <div className="space-y-3 p-4 pt-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: 'var(--color-accent)' }}>
                {domain}
              </p>
              <h3 className="mt-1 truncate text-[15px] font-semibold leading-5" style={{ color: 'var(--color-text-primary)' }}>
                {previewTitle}
              </h3>
            </div>
            {savedDate && (
              <span className="shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium" style={{ background: 'rgba(42, 187, 247, 0.06)', borderColor: 'rgba(42, 187, 247, 0.12)', color: 'var(--color-text-muted)' }}>
                {savedDate}
              </span>
            )}
          </div>

          <p
            className="text-sm leading-6"
            style={{
              color: 'var(--color-text-secondary)',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {previewDescription}
          </p>

          {(tags.length > 0 || collectionName) && (
            <div className="flex flex-wrap gap-2">
              {collectionName && (
                <span className="rounded-full border px-2.5 py-1 text-[11px] font-medium" style={{ background: 'rgba(15, 23, 42, 0.04)', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                  {collectionName}
                </span>
              )}
              {tags.map((tag) => (
                <span key={tag} className="rounded-full border px-2.5 py-1 text-[11px] font-medium" style={{ background: 'rgba(42, 187, 247, 0.06)', borderColor: 'rgba(42, 187, 247, 0.12)', color: 'var(--color-accent)' }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {link.note && (
            <div className="rounded-2xl border px-3 py-2" style={{ background: 'rgba(15, 23, 42, 0.03)', borderColor: 'var(--color-border)' }}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: 'var(--color-text-muted)' }}>
                Note
              </p>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {link.note}
              </p>
            </div>
          )}

          {editing ? (
            <div className="space-y-2 border-t pt-3" style={{ borderColor: 'var(--color-border)' }}>
              <input
                type="text"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="Note..."
                className="w-full rounded-xl px-3 py-2 text-sm"
                style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              />
              <input
                type="text"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="Tags (comma separated)"
                className="w-full rounded-xl px-3 py-2 text-sm"
                style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              />
              {collections.length > 0 && (
                <select
                  value={editCollectionId}
                  onChange={(e) => setEditCollectionId(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-sm"
                  style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                >
                  <option value="">No collection</option>
                  {collections.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.name}
                    </option>
                  ))}
                </select>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                  style={{ background: 'var(--color-accent)' }}
                >
                  {saving && (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="flex-1 rounded-xl px-3 py-2 text-sm font-medium disabled:opacity-50"
                  style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 border-t pt-3" style={{ borderColor: 'var(--color-border)' }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleFavoriteClick()
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full"
                style={{ background: 'var(--color-bg-tertiary)', color: link.is_favorite ? '#fbbf24' : 'var(--color-text-muted)' }}
                title={link.is_favorite ? 'Unfavorite' : 'Favorite'}
              >
                <svg className="h-4 w-4" fill={link.is_favorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleCopyUrl()
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full"
                style={{ background: 'var(--color-bg-tertiary)', color: copied ? 'var(--color-success)' : 'var(--color-text-muted)' }}
                title="Copy"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex h-9 w-9 items-center justify-center rounded-full"
                style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-muted)' }}
                title="Open"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <div className="flex-1 min-w-0" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setEditing(true)
                }}
                className="rounded-full px-3 py-2 text-sm font-medium"
                style={{ background: 'rgba(42, 187, 247, 0.08)', color: 'var(--color-accent)' }}
                title="Edit"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDeleteDialog(true)
                }}
                className="rounded-full px-3 py-2 text-sm font-medium"
                style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--color-error)' }}
                title="Delete"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </article>

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
