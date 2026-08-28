import { useState } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { X, CaretDown, Check, Plus } from '@phosphor-icons/react'
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
  viewMode?: 'grid' | 'list'
}

const MORPH = { type: 'spring' as const, stiffness: 320, damping: 30, mass: 1 }
const STAR = 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z'
const TRASH = 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
const COPY = 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'
const OPEN = 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
const EDIT = 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
const CHECK = 'M5 13l4 4L19 7'

function formatDate(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getDomain(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, '') }
  catch { return 'link' }
}

export function LinkCard({
  link, onUpdated, onDeleted, collections = [],
  selectable = false, selected = false, onSelect, onToggleFavorite,
  viewMode = 'grid',
}: Props) {
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editTags, setEditTags] = useState(link.tags.join(', '))
  const [editCollectionId, setEditCollectionId] = useState(link.collection_id || '')
  const [saving, setSaving] = useState(false)
  const [collectionDropOpen, setCollectionDropOpen] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const selectedCollection = collections.find(c => c.id === editCollectionId)

  // 3D tilt — spring-smoothed mouse tracking (grid / desktop only)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sX = useSpring(mx, { stiffness: 160, damping: 20 })
  const sY = useSpring(my, { stiffness: 160, damping: 20 })
  const rotX = useTransform(sY, [-0.5, 0.5], [4, -4])
  const rotY = useTransform(sX, [-0.5, 0.5], [-4, 4])
  // Moving specular glare
  const glare = useTransform([sX, sY], ([x, y]) => {
    const gx = ((x as number) + 0.5) * 100
    const gy = ((y as number) + 0.5) * 100
    return `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.055) 0%, transparent 58%)`
  })

  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024
  const targetW = Math.min(480, vw - 32)

  function openEdit() {
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

  const createCollectionAndSelect = async () => {
    if (!newCollectionName.trim()) return
    try {
      const col = await api.createCollection({ name: newCollectionName.trim() })
      setEditCollectionId(col.id)
      setNewCollectionName('')
      setCollectionDropOpen(false)
      onUpdated()
      toast.success('Collection created')
    } catch { toast.error('Failed to create collection') }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(link.url)
    setCopied(true)
    toast.success('Copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFav = () => {
    if (onToggleFavorite) onToggleFavorite()
    else api.toggleFavorite(link.id).then(onUpdated)
  }

  const collectionObj = collections.find(c => c.id === link.collection_id)
  const tags = link.tags.filter(Boolean).slice(0, 3)
  const domain = getDomain(link.url)
  const title = link.title?.trim() || 'Untitled link'
  const desc = link.description?.trim() || ''
  const date = formatDate(link.updated_at || link.created_at)
  const inputStyle = { background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }

  // ── List row ────────────────────────────────────────────────────────────────
  const listRow = (
    <motion.div
      className={`flex items-center gap-3 rounded-2xl px-3 py-2 ${selected ? 'ring-1 ring-[rgba(42,187,247,0.35)]' : ''}`}
      whileTap={{ scale: 0.992 }}
      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      style={{
        background: selected ? 'rgba(42,187,247,0.06)' : 'var(--color-bg-card)',
        boxShadow: 'inset 0 1px rgba(255,255,255,0.04)',
      }}
    >
      {selectable && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onSelect?.() }}
          className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full border transition-all"
          style={{
            borderColor: selected ? 'var(--color-accent)' : 'var(--color-border)',
            background: selected ? 'rgba(42,187,247,0.18)' : 'transparent',
            color: selected ? 'var(--color-accent)' : 'var(--color-text-muted)',
          }}
        >
          {selected && <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d={CHECK} /></svg>}
        </button>
      )}

      {/* Thumbnail */}
      <div className="shrink-0 h-10 w-14 sm:h-11 sm:w-17 rounded-xl overflow-hidden" style={{ background: 'var(--color-bg-tertiary)' }}>
        {link.image_url ? (
          <img src={link.image_url} alt="" className="h-full w-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            {link.favicon_url
              ? <img src={link.favicon_url} alt="" className="h-5 w-5 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              : <span className="text-lg font-black opacity-20" style={{ color: 'var(--color-text-primary)' }}>{domain.charAt(0).toUpperCase()}</span>
            }
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="truncate text-[13px] font-semibold leading-5" style={{ color: 'var(--color-text-primary)' }}>{title}</p>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {link.favicon_url && <img src={link.favicon_url} alt="" className="h-3 w-3 shrink-0 rounded-sm object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />}
          <span className="text-[11px] shrink-0" style={{ color: 'var(--color-text-muted)' }}>{domain}</span>
          {collectionObj && (
            <>
              <span className="text-[10px] shrink-0" style={{ color: 'var(--color-border)' }}>·</span>
              <span className="flex items-center gap-1 text-[11px] shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: collectionObj.color }} />
                {collectionObj.name}
              </span>
            </>
          )}
          {tags.map(tag => (
            <span key={tag} className="text-[10px] shrink-0 px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(42,187,247,0.08)', color: 'var(--color-accent)' }}>#{tag}</span>
          ))}
        </div>
      </div>

      {date && <span className="hidden sm:block shrink-0 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{date}</span>}

      {/* Actions — always visible */}
      <div className="flex items-center gap-1 shrink-0">
        <motion.button type="button" onClick={e => { e.stopPropagation(); handleFav() }} whileTap={{ scale: 0.78 }} transition={{ type: 'spring', stiffness: 500, damping: 28 }}
          className="flex h-7 w-7 items-center justify-center rounded-xl"
          style={{ background: link.is_favorite ? 'rgba(251,191,36,0.14)' : 'var(--color-bg-tertiary)', color: link.is_favorite ? '#fbbf24' : 'var(--color-text-muted)' }}
        >
          <svg className="h-3.5 w-3.5" fill={link.is_favorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={STAR} /></svg>
        </motion.button>
        <motion.a href={link.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} whileTap={{ scale: 0.82 }}
          className="flex h-7 w-7 items-center justify-center rounded-xl"
          style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-muted)' }}
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={OPEN} /></svg>
        </motion.a>
        <motion.button type="button" onClick={e => { e.stopPropagation(); openEdit() }} whileTap={{ scale: 0.82 }}
          className="flex h-7 w-7 items-center justify-center rounded-xl"
          style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-muted)' }}
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={EDIT} /></svg>
        </motion.button>
        <motion.button type="button" onClick={e => { e.stopPropagation(); setShowDeleteDialog(true) }} whileTap={{ scale: 0.82 }}
          className="flex h-7 w-7 items-center justify-center rounded-xl"
          style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--color-error)' }}
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={TRASH} /></svg>
        </motion.button>
      </div>
    </motion.div>
  )

  // ── Grid card ────────────────────────────────────────────────────────────────
  const gridCard = (
    <motion.article
      className="relative w-full overflow-hidden rounded-[20px]"
      // 3D perspective via transformTemplate
      transformTemplate={(_vals, t) => `perspective(900px) ${t}`}
      style={{
        rotateX: rotX,
        rotateY: rotY,
        background: 'var(--color-bg-card)',
        border: selected
          ? '1px solid rgba(42,187,247,0.4)'
          : '1px solid var(--color-border)',
        boxShadow: selected
          ? 'inset 0 1px rgba(255,255,255,0.06), 0 0 0 1px rgba(42,187,247,0.15)'
          : 'inset 0 1px rgba(255,255,255,0.06)',
      }}
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 260, damping: 25 }}
      onMouseMove={e => {
        const r = e.currentTarget.getBoundingClientRect()
        mx.set((e.clientX - r.left) / r.width - 0.5)
        my.set((e.clientY - r.top) / r.height - 0.5)
      }}
      onMouseLeave={() => { mx.set(0); my.set(0) }}
    >
      {/* Moving specular glare */}
      <motion.div className="pointer-events-none absolute inset-0 z-10 rounded-[20px]" style={{ background: glare }} />

      {/* Image */}
      <div className="relative overflow-hidden">
        {link.image_url ? (
          <LazyImage src={link.image_url} alt={title} className="aspect-[16/10] w-full" />
        ) : (
          <div
            className="aspect-[16/10] w-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--color-bg-tertiary) 0%, var(--color-bg-hover) 100%)' }}
          >
            {link.favicon_url
              ? <img src={link.favicon_url} alt="" className="h-10 w-10 opacity-40 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              : <span className="text-5xl font-black" style={{ color: 'var(--color-text-primary)', opacity: 0.12 }}>{domain.charAt(0).toUpperCase()}</span>
            }
          </div>
        )}

        {/* Always-visible glass pill: favicon + domain + date + fav */}
        <div
          className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
          style={{
            background: 'rgba(0,0,0,0.58)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)',
            maxWidth: 'calc(100% - 20px)',
          }}
        >
          {link.favicon_url && (
            <img src={link.favicon_url} alt="" className="h-3 w-3 shrink-0 rounded-sm object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          )}
          <span className="truncate" style={{ color: 'rgba(255,255,255,0.82)' }}>{domain}</span>
          {date && (
            <>
              <span style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>·</span>
              <span className="shrink-0" style={{ color: 'rgba(255,255,255,0.55)' }}>{date}</span>
            </>
          )}
        </div>

        {/* Select button */}
        {selectable && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onSelect?.() }}
            className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full border transition-all"
            style={{
              background: selected ? 'rgba(42,187,247,0.28)' : 'rgba(0,0,0,0.45)',
              borderColor: selected ? 'var(--color-accent)' : 'rgba(255,255,255,0.2)',
              color: selected ? 'var(--color-accent)' : 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(6px)',
            }}
          >
            {selected
              ? <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={CHECK} /></svg>
              : <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth={2} /></svg>
            }
          </button>
        )}
      </div>

      {/* Card body */}
      <div className="px-2.5 pt-2 pb-1.5 sm:px-3.5 sm:pt-3 sm:pb-2 space-y-1">
        <h3
          className="text-[12px] sm:text-[13.5px] font-semibold leading-[1.4]"
          style={{ color: 'var(--color-text-primary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {title}
        </h3>

        {desc && (
          <p
            className="hidden sm:block text-[12px] leading-[1.6]"
            style={{ color: 'var(--color-text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
          >
            {desc}
          </p>
        )}

        {(tags.length > 0 || collectionObj) && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {collectionObj && (
              <span className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] sm:text-[10px] font-medium" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-muted)' }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: collectionObj.color }} />
                {collectionObj.name}
              </span>
            )}
            {tags.map(tag => (
              <span key={tag} className="rounded-full px-1.5 py-0.5 text-[9px] sm:text-[10px] font-medium" style={{ background: 'rgba(42,187,247,0.08)', color: 'var(--color-accent)' }}>#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Action strip — always visible */}
      <div className="flex items-center justify-between px-2 pb-2 pt-0.5 sm:px-3 sm:pb-3 sm:pt-1">
        <div className="flex items-center gap-0.5 sm:gap-1">
          <motion.button type="button" onClick={e => { e.stopPropagation(); handleFav() }}
            whileTap={{ scale: 0.76 }} transition={{ type: 'spring', stiffness: 500, damping: 26 }}
            className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl"
            style={{ background: link.is_favorite ? 'rgba(251,191,36,0.14)' : 'var(--color-bg-tertiary)', color: link.is_favorite ? '#fbbf24' : 'var(--color-text-muted)' }}
            title={link.is_favorite ? 'Unfavorite' : 'Favorite'}
          >
            <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill={link.is_favorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={STAR} /></svg>
          </motion.button>

          <motion.button type="button" onClick={e => { e.stopPropagation(); handleCopy() }}
            whileTap={{ scale: 0.76 }} transition={{ type: 'spring', stiffness: 500, damping: 26 }}
            className="hidden sm:flex h-8 w-8 items-center justify-center rounded-xl"
            style={{ background: copied ? 'rgba(34,197,94,0.14)' : 'var(--color-bg-tertiary)', color: copied ? 'var(--color-success)' : 'var(--color-text-muted)' }}
            title="Copy URL"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={copied ? CHECK : COPY} />
            </svg>
          </motion.button>

          <motion.a href={link.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
            whileTap={{ scale: 0.76 }} transition={{ type: 'spring', stiffness: 500, damping: 26 }}
            className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl"
            style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-muted)' }}
            title="Open link"
          >
            <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={OPEN} /></svg>
          </motion.a>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1">
          <motion.button type="button" onClick={e => { e.stopPropagation(); openEdit() }}
            whileTap={{ scale: 0.76 }} transition={{ type: 'spring', stiffness: 500, damping: 26 }}
            className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl"
            style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-muted)' }}
            title="Edit"
          >
            <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={EDIT} /></svg>
          </motion.button>

          <motion.button type="button" onClick={e => { e.stopPropagation(); setShowDeleteDialog(true) }}
            whileTap={{ scale: 0.76 }} transition={{ type: 'spring', stiffness: 500, damping: 26 }}
            className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl"
            style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--color-error)' }}
            title="Delete"
          >
            <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={TRASH} /></svg>
          </motion.button>
        </div>
      </div>
    </motion.article>
  )

  // ── Edit modal (shared) ───────────────────────────────────────────────────
  const initialScaleX = targetW / targetW

  return (
    <>
      {viewMode === 'list' ? listRow : gridCard}

      <AnimatePresence>
        {editOpen && (
          <>
            <motion.div
              key="eb"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={() => setEditOpen(false)}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setEditOpen(false)}>
              <motion.div
                initial={{ y: 24, scaleX: initialScaleX, scaleY: 0.16, borderRadius: 9999, opacity: 0.8 }}
                animate={{ y: 0, scaleX: 1, scaleY: 1, borderRadius: 24, opacity: 1 }}
                exit={{ y: 24, scaleX: initialScaleX, scaleY: 0.16, borderRadius: 9999, opacity: 0 }}
                transition={{ default: MORPH, borderRadius: { duration: 0.3, ease: [0.32, 0.72, 0.34, 1] }, opacity: { duration: 0.18 } }}
                style={{ willChange: 'transform, border-radius', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
                onClick={e => e.stopPropagation()}
                role="dialog" aria-modal="true"
                className="w-full max-w-[480px] px-6 pb-6 pt-6"
              >
                <motion.div
                  variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { delay: 0.16, staggerChildren: 0.055 } }, exit: { opacity: 0, transition: { duration: 0.08 } } }}
                  initial="hidden" animate="show" exit="exit"
                >
                  <motion.div
                    variants={{ hidden: { opacity: 0, y: -6 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } }}
                    className="relative mb-5 flex items-center justify-center"
                  >
                    <span className="text-[18px] font-bold" style={{ color: 'var(--color-text-primary)' }}>Edit Link</span>
                    <motion.button onClick={() => setEditOpen(false)}
                      whileTap={{ scale: 0.88 }} whileHover={{ scale: 1.08 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                      className="absolute right-0 flex size-9 items-center justify-center rounded-full"
                      style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-muted)' }}
                    >
                      <X size={16} weight="bold" />
                    </motion.button>
                  </motion.div>

                  <form onSubmit={handleSaveEdit} className="flex flex-col gap-3">
                    <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } }}>
                      <input value={link.url} readOnly className="h-[52px] w-full rounded-full border-2 border-transparent px-5 text-[15px] font-medium outline-none opacity-55" style={inputStyle} />
                    </motion.div>

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
                            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}
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
                            <div className="mx-3 my-1 h-px" style={{ background: 'var(--color-border)' }} />
                            <div className="flex gap-2 px-3 py-2">
                              <input value={newCollectionName} onChange={e => setNewCollectionName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createCollectionAndSelect()} placeholder="Create collection" className="min-w-0 flex-1 rounded-lg px-2 py-1.5 text-xs" style={{ background: 'var(--color-bg-tertiary)' }} />
                              <button type="button" onClick={createCollectionAndSelect} className="rounded-lg px-2" style={{ color: 'var(--color-accent)' }}><Plus size={14} /></button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } }}>
                      <input
                        value={editTags} onChange={e => setEditTags(e.target.value)}
                        placeholder="Tags (comma separated)"
                        className="h-[52px] w-full rounded-full border-2 border-transparent px-5 text-[15px] font-medium outline-none transition-[border-color]"
                        style={inputStyle}
                        onFocus={e => (e.target.style.borderColor = 'var(--color-accent)')}
                        onBlur={e => (e.target.style.borderColor = 'transparent')}
                      />
                    </motion.div>

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
                        {saving ? 'Saving…' : 'Save'}
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
