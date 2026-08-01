import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CaretDown, Check } from '@phosphor-icons/react'
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

const MORPH = { type: 'spring' as const, stiffness: 320, damping: 30, mass: 1 }

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getDomain(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, '') }
  catch { return 'link' }
}

export function LinkCard({
  link, onUpdated, onDeleted, collections = [],
  selectable = false, selected = false, onSelect, onToggleFavorite,
}: Props) {
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false)
  const [editUrl, setEditUrl] = useState(link.url)
  const [editTags, setEditTags] = useState(link.tags.join(', '))
  const [editCollectionId, setEditCollectionId] = useState(link.collection_id || '')
  const [saving, setSaving] = useState(false)
  const [collectionDropOpen, setCollectionDropOpen] = useState(false)
  const selectedCollection = collections.find(c => c.id === editCollectionId)

  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024
  const vh = typeof window !== 'undefined' ? window.innerHeight : 768
  const targetW = Math.min(480, vw - 32)
  // Edit opens from center
  const origin = { x: vw / 2 - targetW / 2, y: vh / 2, w: targetW, h: 44 }
  const initialOffsetX = origin.x + origin.w / 2 - vw / 2
  const initialOffsetY = origin.y + origin.h / 2 - vh / 2
  const initialScaleX = origin.w / targetW

  function openEdit() {
    setEditUrl(link.url)
    setEditTags(link.tags.join(', '))
    setEditCollectionId(link.collection_id || '')
    setEditOpen(true)
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.updateLink(link.id, {
        tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
        collection_id: editCollectionId || undefined,
      })
      setEditOpen(false)
      onUpdated()
      toast.success('Link updated')
    } catch {
      toast.error('Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.deleteLink(link.id)
      onDeleted()
    } catch {
      toast.error('Failed to delete link')
    } finally {
      setDeleting(false)
    }
  }

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(link.url)
    setCopied(true)
    toast.success('Link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFavoriteClick = () => {
    if (onToggleFavorite) onToggleFavorite()
    else api.toggleFavorite(link.id).then(onUpdated)
  }

  const collectionName = collections.find(c => c.id === link.collection_id)?.name
  const tags = link.tags.filter(Boolean).slice(0, 3)
  const domain = getDomain(link.url)
  const previewTitle = link.title?.trim() || 'Untitled link'
  const previewDescription = link.description?.trim() || 'No description yet.'
  const savedDate = formatDate(link.updated_at || link.created_at)

  const inputStyle = { background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }

  return (
    <>
      <article
        className={`group relative w-full min-w-0 overflow-hidden rounded-[24px] border transition-all duration-200 hover:-translate-y-1 ${selected ? 'ring-1 ring-sky-400/30' : ''}`}
        style={{
          background: 'var(--color-bg-card)',
          borderColor: selected ? 'rgba(42,187,247,0.32)' : 'var(--color-border)',
          boxShadow: selected ? '0 20px 55px -24px rgba(42,187,247,0.24)' : '0 18px 46px -24px rgba(15,23,42,0.28)',
        }}
      >
        {link.is_favorite && (
          <div className="absolute right-3 top-3 z-10 rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-[11px] font-medium text-amber-400">
            ★ Favorite
          </div>
        )}

        {/* Select button — top left, only in select mode */}
        {selectable && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onSelect?.() }}
            className="absolute left-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border transition-all"
            style={{
              background: selected ? 'rgba(42,187,247,0.18)' : 'rgba(0,0,0,0.35)',
              borderColor: selected ? 'var(--color-accent)' : 'rgba(255,255,255,0.2)',
              color: selected ? 'var(--color-accent)' : 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(4px)',
            }}
            title={selected ? 'Deselect' : 'Select'}
          >
            {selected
              ? <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              : <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth={2} /></svg>
            }
          </button>
        )}

        <div className="p-3">
          <div className="overflow-hidden rounded-[18px] border" style={{ borderColor: 'var(--color-border)' }}>
            <LazyImage src={link.image_url} alt={previewTitle} className="aspect-16/10 w-full" />
          </div>
        </div>

        <div className="space-y-3 p-4 pt-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: 'var(--color-accent)' }}>{domain}</p>
              <h3 className="mt-1 truncate text-[15px] font-semibold leading-5" style={{ color: 'var(--color-text-primary)' }}>{previewTitle}</h3>
            </div>
            {savedDate && (
              <span className="shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium" style={{ background: 'rgba(42,187,247,0.06)', borderColor: 'rgba(42,187,247,0.12)', color: 'var(--color-text-muted)' }}>
                {savedDate}
              </span>
            )}
          </div>

          <p className="text-sm leading-6" style={{ color: 'var(--color-text-secondary)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {previewDescription}
          </p>

          {(tags.length > 0 || collectionName) && (
            <div className="flex flex-wrap gap-2">
              {collectionName && (
                <span className="rounded-full border px-2.5 py-1 text-[11px] font-medium" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                  {collectionName}
                </span>
              )}
              {tags.map(tag => (
                <span key={tag} className="rounded-full border px-2.5 py-1 text-[11px] font-medium" style={{ background: 'rgba(42,187,247,0.06)', borderColor: 'rgba(42,187,247,0.12)', color: 'var(--color-accent)' }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {link.note && (
            <div className="rounded-2xl border px-3 py-2" style={{ borderColor: 'var(--color-border)' }}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: 'var(--color-text-muted)' }}>Note</p>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{link.note}</p>
            </div>
          )}

          {/* Action row */}
          <div className="flex flex-wrap items-center gap-2 border-t pt-3" style={{ borderColor: 'var(--color-border)' }}>
            {/* Favorite */}
            <button type="button" onClick={(e) => { e.stopPropagation(); handleFavoriteClick() }}
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ background: 'var(--color-bg-tertiary)', color: link.is_favorite ? '#fbbf24' : 'var(--color-text-muted)' }}
              title={link.is_favorite ? 'Unfavorite' : 'Favorite'}
            >
              <svg className="h-4 w-4" fill={link.is_favorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>

            {/* Copy */}
            <button type="button" onClick={(e) => { e.stopPropagation(); handleCopyUrl() }}
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ background: 'var(--color-bg-tertiary)', color: copied ? 'var(--color-success)' : 'var(--color-text-muted)' }}
              title="Copy"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>

            {/* Open */}
            <a href={link.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-muted)' }}
              title="Open"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>

            <div className="flex-1 min-w-0" />

            {/* Edit */}
            <button type="button" onClick={(e) => { e.stopPropagation(); openEdit() }}
              className="rounded-full px-3 py-2 text-sm font-medium"
              style={{ background: 'rgba(42,187,247,0.08)', color: 'var(--color-accent)' }}
            >Edit</button>

            {/* Delete */}
            <button type="button" onClick={(e) => { e.stopPropagation(); setShowDeleteDialog(true) }}
              className="rounded-full px-3 py-2 text-sm font-medium"
              style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--color-error)' }}
            >Delete</button>
          </div>
        </div>
      </article>

      {/* Edit Modal */}
      <AnimatePresence>
        {editOpen && (
          <>
            <motion.div
              key="edit-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={() => setEditOpen(false)}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setEditOpen(false)}>
              <motion.div
                initial={{ x: initialOffsetX, y: initialOffsetY, scaleX: initialScaleX, scaleY: 0.18, borderRadius: 9999, opacity: 0.85 }}
                animate={{ x: 0, y: 0, scaleX: 1, scaleY: 1, borderRadius: 24, opacity: 1 }}
                exit={{ x: initialOffsetX, y: initialOffsetY, scaleX: initialScaleX, scaleY: 0.18, borderRadius: 9999, opacity: 0 }}
                transition={{ default: MORPH, borderRadius: { duration: 0.32, ease: [0.32, 0.72, 0.34, 1] }, opacity: { duration: 0.18 } }}
                style={{ willChange: 'transform, border-radius', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
                onClick={(e) => e.stopPropagation()}
                role="dialog" aria-modal="true"
                className="w-full max-w-[480px] px-6 pb-6 pt-6"
              >
                <motion.div
                  variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { delay: 0.18, staggerChildren: 0.06 } }, exit: { opacity: 0, transition: { duration: 0.08 } } }}
                  initial="hidden" animate="show" exit="exit"
                >
                  {/* Header */}
                  <motion.div
                    variants={{ hidden: { opacity: 0, y: -6 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } }}
                    className="relative mb-5 flex items-center justify-center"
                  >
                    <span className="text-[18px] font-bold" style={{ color: 'var(--color-text-primary)' }}>Edit Link</span>
                    <motion.button onClick={() => setEditOpen(false)}
                      whileTap={{ scale: 0.88 }} whileHover={{ scale: 1.1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                      className="absolute right-0 flex size-9 items-center justify-center rounded-full"
                      style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-muted)' }}
                    >
                      <X size={16} weight="bold" />
                    </motion.button>
                  </motion.div>

                  <form onSubmit={handleSaveEdit} className="flex flex-col gap-3">
                    {/* URL — read only, just display */}
                    <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } }}>
                      <input
                        value={editUrl}
                        readOnly
                        className="h-[52px] w-full rounded-full border-2 border-transparent px-5 text-[15px] font-medium outline-none opacity-60"
                        style={inputStyle}
                      />
                    </motion.div>

                    {/* Collection */}
                    <motion.div
                      variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } }}
                      className="relative"
                    >
                      <button
                        type="button"
                        onClick={() => setCollectionDropOpen(!collectionDropOpen)}
                        className={`h-[52px] w-full rounded-full border-2 px-5 text-[15px] font-medium outline-none flex items-center justify-between transition-[border-color] ${collectionDropOpen ? 'border-[var(--color-accent)]' : 'border-transparent'}`}
                        style={{ ...inputStyle, color: selectedCollection ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}
                      >
                        <span className="flex items-center gap-2">
                          {selectedCollection && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: selectedCollection.color }} />}
                          {selectedCollection ? selectedCollection.name : 'Collection'}
                        </span>
                        <CaretDown size={14} weight="bold" style={{ color: 'var(--color-text-muted)', transform: collectionDropOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                      </button>
                      <AnimatePresence>
                        {collectionDropOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            className="absolute top-[56px] left-0 right-0 z-10 rounded-2xl overflow-hidden py-1"
                            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: '0 8px 24px rgba(0,0,0,0.18)' }}
                          >
                            {[{ id: '', name: 'No collection', color: 'var(--color-border)' }, ...collections].map(col => (
                              <button key={col.id} type="button"
                                onClick={() => { setEditCollectionId(col.id); setCollectionDropOpen(false) }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-medium text-left transition-colors hover:bg-[var(--color-bg-tertiary)]"
                                style={{ color: 'var(--color-text-primary)' }}
                              >
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: col.color }} />
                                <span className="flex-1">{col.name}</span>
                                {editCollectionId === col.id && <Check size={14} weight="bold" style={{ color: 'var(--color-accent)' }} />}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    {/* Tags */}
                    <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } }}>
                      <input
                        value={editTags}
                        onChange={(e) => setEditTags(e.target.value)}
                        placeholder="Tags (optional, comma separated)"
                        className="h-[52px] w-full rounded-full border-2 border-transparent px-5 text-[15px] font-medium outline-none transition-[border-color]"
                        style={inputStyle}
                        onFocus={(e) => (e.target.style.borderColor = 'var(--color-accent)')}
                        onBlur={(e) => (e.target.style.borderColor = 'transparent')}
                      />
                    </motion.div>

                    {/* Submit */}
                    <motion.div
                      variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } }}
                      className="flex justify-end pt-1"
                    >
                      <motion.button
                        type="submit" disabled={saving}
                        whileHover={saving ? {} : { scale: 1.04 }} whileTap={saving ? {} : { scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                        className="rounded-full px-8 py-3 text-[15px] font-bold text-white disabled:opacity-60"
                        style={{ background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-muted) 100%)' }}
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </motion.button>
                    </motion.div>
                  </form>
                </motion.div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Delete link?"
        description="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        variant="danger"
        loading={deleting}
      />
    </>
  )
}
