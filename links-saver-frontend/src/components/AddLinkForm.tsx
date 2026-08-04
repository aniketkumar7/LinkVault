import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, CaretDown, Check } from '@phosphor-icons/react'
import { api } from '@/lib/api'
import type { Collection } from '@/lib/api'
import { toast } from '@/lib/toast'

interface Props {
  onLinkAdded: () => void
  existingTags: string[]
  collections: Collection[]
  onCollectionCreated?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const MORPH = { type: 'spring' as const, stiffness: 320, damping: 30, mass: 1 }
type ButtonRect = { x: number; y: number; w: number; h: number } | null

export function AddLinkForm({ onLinkAdded, existingTags, collections, onCollectionCreated, open, onOpenChange }: Props) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = open ?? internalOpen
  const setOpenState = (next: boolean) => {
    if (open === undefined) {
      setInternalOpen(next)
    } else {
      onOpenChange?.(next)
    }
  }
  const [origin, setOrigin] = useState<ButtonRect>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const urlRef = useRef<HTMLInputElement>(null)

  const [url, setUrl] = useState('')
  const [tags, setTags] = useState('')
  const [collectionId, setCollectionId] = useState('')
  const [loading, setLoading] = useState(false)
  const [duplicate, setDuplicate] = useState<{ id: string; title: string } | null>(null)
  const [allowDuplicate, setAllowDuplicate] = useState(false)
  const [urlError, setUrlError] = useState(false)
  const [collectionError, setCollectionError] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Collection dropdown state
  const [collectionOpen, setCollectionOpen] = useState(false)
  const [addingCollection, setAddingCollection] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [creatingCollection, setCreatingCollection] = useState(false)
  const collectionRef = useRef<HTMLDivElement>(null)

  const selectedCollection = collections.find(c => c.id === collectionId)

  function normalizeUrl(raw: string) {
    const trimmed = raw.trim()
    if (!trimmed) return ''
    if (/^https?:\/\//i.test(trimmed)) return trimmed
    return 'https://' + trimmed
  }

  function handleOpen() {
    if (buttonRef.current) {
      const r = buttonRef.current.getBoundingClientRect()
      setOrigin({ x: r.left, y: r.top, w: r.width, h: r.height })
    } else {
      // opened externally — animate from center
      const vw = window.innerWidth
      const vh = window.innerHeight
      setOrigin({ x: vw / 2 - 60, y: vh / 2, w: 120, h: 44 })
    }
    setOpenState(true)
  }

  function handleClose() {
    setOpenState(false)
    setUrl('')
    setTags('')
    setCollectionId('')
    setDuplicate(null)
    setAllowDuplicate(false)
    setUrlError(false)
    setCollectionError(false)
    setCollectionOpen(false)
    setAddingCollection(false)
    setNewCollectionName('')
  }

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => urlRef.current?.focus(), 320)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen])
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (collectionRef.current && !collectionRef.current.contains(e.target as Node)) {
        setCollectionOpen(false)
        setAddingCollection(false)
        setNewCollectionName('')
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  // Duplicate check
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const normalized = normalizeUrl(url)
      if (!normalized) { setDuplicate(null); return }
      try { new URL(normalized) } catch { setDuplicate(null); return }
      try {
        const result = await api.checkDuplicate(normalized)
        setDuplicate(result.existing || null)
      } catch { /* ignore */ }
    }, 500)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [url])

  async function handleCreateCollection() {
    if (!newCollectionName.trim()) return
    setCreatingCollection(true)
    try {
      const col = await api.createCollection({ name: newCollectionName.trim(), color: '#3b82f6' })
      setCollectionId(col.id)
      setCollectionError(false)
      setAddingCollection(false)
      setNewCollectionName('')
      setCollectionOpen(false)
      onCollectionCreated?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create collection')
    } finally {
      setCreatingCollection(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const finalUrl = normalizeUrl(url)
    let hasError = false
    if (!finalUrl) { setUrlError(true); hasError = true }
    else { try { new URL(finalUrl) } catch { setUrlError(true); hasError = true } }
    if (!collectionId) { setCollectionError(true); hasError = true }
    if (hasError) return
    if (duplicate && !allowDuplicate) { toast.error('Already saved. Click "Save anyway" to allow.'); return }

    setLoading(true)
    try {
      await api.createLink({
        url: finalUrl,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        collection_id: collectionId,
        allow_duplicate: allowDuplicate,
      })
      toast.success('Link saved!')
      onLinkAdded()
      handleClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save link')
    } finally {
      setLoading(false)
    }
  }

  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024
  const vh = typeof window !== 'undefined' ? window.innerHeight : 768
  const targetW = Math.min(480, vw - 32)
  const initialOffsetX = origin ? origin.x + origin.w / 2 - vw / 2 : 0
  const initialOffsetY = origin ? origin.y + origin.h / 2 - vh / 2 : 0
  const initialScaleX = origin ? origin.w / targetW : 1

  const inputStyle = {
    background: 'var(--color-bg-tertiary)',
    color: 'var(--color-text-primary)',
  }

  return (
    <>
      {/* Floating button — mobile only, icon only */}
      <motion.button
        ref={buttonRef}
        onClick={handleOpen}
        animate={{ opacity: isOpen ? 0 : 1, scale: isOpen ? 0.85 : 1, y: isOpen ? 8 : 0 }}
        transition={isOpen ? { duration: 0.18 } : { type: 'spring', stiffness: 400, damping: 28 }}
        whileHover={isOpen ? {} : { scale: 1.06, y: -2 }}
        whileTap={isOpen ? {} : { scale: 0.96 }}
        style={{
          position: 'fixed', bottom: 28, right: 24,
          borderRadius: 9999, pointerEvents: isOpen ? 'none' : 'auto', zIndex: 40,
          boxShadow: '0 8px 32px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.18)',
        }}
        className="sm:hidden flex items-center justify-center w-14 h-14"
      >
        <div style={{ position: 'absolute', inset: 0, borderRadius: 9999, background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-muted) 100%)' }} />
        <Plus size={22} weight="bold" className="relative text-white" />
      </motion.button>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={handleClose}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }}
          />
        )}
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && origin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={handleClose}>
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
                variants={{
                  hidden: { opacity: 0 },
                  show: { opacity: 1, transition: { delay: 0.18, staggerChildren: 0.06 } },
                  exit: { opacity: 0, transition: { duration: 0.08 } },
                }}
                initial="hidden" animate="show" exit="exit"
              >
                {/* Header */}
                <motion.div
                  variants={{ hidden: { opacity: 0, y: -6 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } }}
                  className="relative mb-5 flex items-center justify-left"
                >
                  <span className="text-[18px] font-bold" style={{ color: 'var(--color-text-primary)' }}>Save Link</span>
                  <motion.button
                    onClick={handleClose}
                    whileTap={{ scale: 0.88 }} whileHover={{ scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                    className="absolute right-0 flex size-9 items-center justify-center rounded-full"
                    style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-muted)' }}
                  >
                    <X size={16} weight="bold" />
                  </motion.button>
                </motion.div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  {/* URL */}
                  <motion.div
                    variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } }}
                    className="flex flex-col gap-1"
                  >
                    <input
                      ref={urlRef}
                      value={url}
                      onChange={(e) => { setUrl(e.target.value); setUrlError(false); setAllowDuplicate(false) }}
                      placeholder="Enter URL"
                      className={`h-[52px] w-full rounded-full border-2 px-5 text-[15px] font-medium outline-none transition-[border-color] ${urlError ? 'border-red-400' : 'border-transparent'}`}
                      style={inputStyle}
                      onFocus={(e) => { if (!urlError) e.target.style.borderColor = 'var(--color-accent)' }}
                      onBlur={(e) => { if (!urlError) e.target.style.borderColor = 'transparent' }}
                    />
                    <AnimatePresence>
                      {urlError && (
                        <motion.span
                          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="pl-5 text-[12px] font-medium text-red-400"
                        >
                          Please enter a valid URL
                        </motion.span>
                      )}
                    </AnimatePresence>
                    <AnimatePresence>
                      {duplicate && !allowDuplicate && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="flex items-center justify-between pl-5 pr-2"
                        >
                          <span className="text-[12px] font-medium text-amber-400">
                            ⚠ Already saved: "{duplicate.title?.slice(0, 28) || 'Untitled'}"
                          </span>
                          <button
                            type="button" onClick={() => setAllowDuplicate(true)}
                            className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}
                          >
                            Save anyway
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Collection custom dropdown */}
                  <motion.div
                    variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } }}
                    className="flex flex-col gap-1"
                    ref={collectionRef}
                  >
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => { setCollectionOpen(!collectionOpen); setAddingCollection(false); setNewCollectionName('') }}
                        className={`h-[52px] w-full rounded-full border-2 px-5 text-[15px] font-medium outline-none transition-[border-color] flex items-center justify-between ${collectionError ? 'border-red-400' : collectionOpen ? 'border-[var(--color-accent)]' : 'border-transparent'}`}
                        style={{ ...inputStyle, color: selectedCollection ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}
                      >
                        <span className="flex items-center gap-2">
                          {selectedCollection && (
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: selectedCollection.color }} />
                          )}
                          {selectedCollection ? selectedCollection.name : 'Collection'}
                        </span>
                        <CaretDown size={14} weight="bold" style={{ color: 'var(--color-text-muted)', transform: collectionOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                      </button>

                      <AnimatePresence>
                        {collectionOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.97 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            className="absolute top-[56px] left-0 right-0 z-10 rounded-2xl py-1"
                            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: '0 8px 24px rgba(0,0,0,0.18)' }}
                          >
                            <div style={{ maxHeight: 224, overflowY: 'auto' }}>
                              {collections.map(col => (
                                <button
                                  key={col.id}
                                  type="button"
                                  onClick={() => { setCollectionId(col.id); setCollectionError(false); setCollectionOpen(false) }}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-medium text-left transition-colors hover:bg-[var(--color-bg-tertiary)]"
                                  style={{ color: 'var(--color-text-primary)' }}
                                >
                                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: col.color }} />
                                  <span className="flex-1">{col.name}</span>
                                  {collectionId === col.id && <Check size={14} weight="bold" style={{ color: 'var(--color-accent)' }} />}
                                </button>
                              ))}
                            </div>

                            <div className="mx-3 my-1 h-px" style={{ background: 'var(--color-border)' }} />

                            {addingCollection ? (
                              <div className="flex items-center gap-2 px-3 py-2">
                                <input
                                  autoFocus
                                  value={newCollectionName}
                                  onChange={(e) => setNewCollectionName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') { e.preventDefault(); handleCreateCollection() }
                                    if (e.key === 'Escape') { setAddingCollection(false); setNewCollectionName('') }
                                  }}
                                  placeholder="Collection name"
                                  className="flex-1 h-9 rounded-full px-3 text-[13px] font-medium outline-none border border-[var(--color-accent)]"
                                  style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}
                                />
                                <button
                                  type="button"
                                  onClick={handleCreateCollection}
                                  disabled={creatingCollection || !newCollectionName.trim()}
                                  className="h-9 px-3 rounded-full text-[13px] font-semibold text-white disabled:opacity-50"
                                  style={{ background: 'var(--color-accent)' }}
                                >
                                  {creatingCollection ? '...' : 'Add'}
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setAddingCollection(true)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-medium text-left transition-colors hover:bg-[var(--color-bg-tertiary)]"
                                style={{ color: 'var(--color-accent)' }}
                              >
                                <Plus size={14} weight="bold" />
                                New Collection
                              </button>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <AnimatePresence>
                      {collectionError && (
                        <motion.span
                          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="pl-5 text-[12px] font-medium text-red-400"
                        >
                          Please select a collection
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Tags */}
                  <motion.div
                    variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } }}
                  >
                    <input
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="Tags (optional, comma separated)"
                      list="tag-suggestions"
                      className="h-[52px] w-full rounded-full border-2 border-transparent px-5 text-[15px] font-medium outline-none transition-[border-color]"
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = 'var(--color-accent)')}
                      onBlur={(e) => (e.target.style.borderColor = 'transparent')}
                    />
                    <datalist id="tag-suggestions">
                      {existingTags.map(t => <option key={t} value={t} />)}
                    </datalist>
                  </motion.div>

                  {/* Submit */}
                  <motion.div
                    variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } }}
                    className="flex justify-end pt-1"
                  >
                    <motion.button
                      type="submit"
                      disabled={loading}
                      animate={{ scale: loading ? 0.96 : 1 }}
                      whileHover={loading ? {} : { scale: 1.04 }}
                      whileTap={loading ? {} : { scale: 0.96 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                      className="rounded-full px-8 py-3 text-[15px] font-bold text-white disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-muted) 100%)' }}
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </motion.button>
                  </motion.div>
                </form>
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
