import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CaretDown, Check, UploadSimple, TextT } from '@phosphor-icons/react'
import { api } from '@/lib/api'
import type { Collection, BulkImportResult } from '@/lib/api'
import { toast } from '@/lib/toast'

interface Props {
  onClose: () => void
  onImported: () => void
  collections: Collection[]
}

const MORPH = { type: 'spring' as const, stiffness: 320, damping: 30, mass: 1 }

function extractUrlsFromText(text: string): string[] {
  return text.split('\n').map(l => l.trim()).filter(l => {
    try { new URL(l); return true } catch { return false }
  })
}

function extractUrlsFromCsv(text: string): string[] {
  const urls: string[] = []
  const lines = text.split('\n')
  for (const line of lines) {
    const cells = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
    for (const cell of cells) {
      try { new URL(cell); urls.push(cell) } catch { /* skip */ }
    }
  }
  return [...new Set(urls)]
}

export function BulkImportModal({ onClose, onImported, collections }: Props) {
  const [tab, setTab] = useState<'paste' | 'file'>('paste')
  const [urlsText, setUrlsText] = useState('')
  const [fileUrls, setFileUrls] = useState<string[]>([])
  const [fileName, setFileName] = useState('')
  const [tags, setTags] = useState('')
  const [collectionId, setCollectionId] = useState('')
  const [collectionOpen, setCollectionOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BulkImportResult | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const collectionRef = useRef<HTMLDivElement>(null)

  const selectedCollection = collections.find(c => c.id === collectionId)

  const pastedUrls = extractUrlsFromText(urlsText)
  const urls = tab === 'paste' ? pastedUrls : fileUrls
  const tooMany = urls.length > 20

  // Close collection dropdown on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (collectionRef.current && !collectionRef.current.contains(e.target as Node))
        setCollectionOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const extracted = file.name.endsWith('.csv') || file.name.endsWith('.xlsx')
        ? extractUrlsFromCsv(text)
        : extractUrlsFromText(text)
      setFileUrls(extracted)
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    if (urls.length === 0 || tooMany) return
    setLoading(true)
    try {
      const importResult = await api.bulkImport(urls, {
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        collection_id: collectionId || undefined,
      })
      setResult(importResult)
      if (importResult.success.length > 0) {
        toast.success(`Imported ${importResult.success.length} links`)
        onImported()
      }
      if (importResult.duplicates.length > 0)
        toast(`${importResult.duplicates.length} duplicates skipped`)
    } catch {
      toast.error('Bulk import failed')
    } finally {
      setLoading(false)
    }
  }

  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024
  const vh = typeof window !== 'undefined' ? window.innerHeight : 768
  const targetW = Math.min(520, vw - 32)

  const inputStyle = { background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        onClick={onClose}
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)' }}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={MORPH}
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 24, width: '100%', maxWidth: targetW, maxHeight: '90vh', overflowY: 'auto' }}
          onClick={e => e.stopPropagation()}
          role="dialog" aria-modal="true"
          className="px-6 pb-6 pt-6"
        >
          {/* Header */}
          <div className="relative mb-5 flex items-center justify-center">
            <span className="text-[18px] font-bold" style={{ color: 'var(--color-text-primary)' }}>Bulk Import</span>
            <motion.button
              onClick={onClose}
              whileTap={{ scale: 0.88 }} whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 26 }}
              className="absolute right-0 flex size-9 items-center justify-center rounded-full"
              style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-muted)' }}
            >
              <X size={16} weight="bold" />
            </motion.button>
          </div>

          {result ? (
            /* Results */
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Imported', value: result.success.length, color: 'var(--color-success)', bg: 'rgba(34,197,94,0.08)' },
                  { label: 'Duplicates', value: result.duplicates.length, color: 'var(--color-accent)', bg: 'rgba(42,187,247,0.08)' },
                  { label: 'Failed', value: result.failed.length, color: 'var(--color-error)', bg: 'rgba(239,68,68,0.08)' },
                ].map(s => (
                  <div key={s.label} className="rounded-2xl p-4 text-center" style={{ background: s.bg }}>
                    <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{s.label}</p>
                  </div>
                ))}
              </div>
              {result.failed.length > 0 && (
                <div className="rounded-2xl p-4 space-y-1" style={{ background: 'var(--color-bg-tertiary)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-error)' }}>Failed</p>
                  {result.failed.map((f, i) => (
                    <p key={i} className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{f.url}</p>
                  ))}
                </div>
              )}
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full rounded-full py-3 text-[15px] font-bold text-white"
                style={{ background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-muted) 100%)' }}
              >
                Done
              </motion.button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Tab switcher */}
              <div className="flex gap-1 rounded-full p-1" style={{ background: 'var(--color-bg-tertiary)' }}>
                {([['paste', <TextT size={15} />, 'Paste URLs'], ['file', <UploadSimple size={15} />, 'Upload File']] as const).map(([key, icon, label]) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full py-2 text-sm font-medium transition-all"
                    style={{
                      background: tab === key ? 'var(--color-bg-card)' : 'transparent',
                      color: tab === key ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                      boxShadow: tab === key ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
                    }}
                  >
                    {icon}{label}
                  </button>
                ))}
              </div>

              {/* Paste tab */}
              {tab === 'paste' && (
                <div className="flex flex-col gap-1">
                  <textarea
                    value={urlsText}
                    onChange={e => setUrlsText(e.target.value)}
                    placeholder={'https://example.com\nhttps://another.com\nhttps://more.com'}
                    rows={6}
                    className="w-full rounded-2xl border-2 border-transparent px-5 py-4 text-sm font-mono resize-none outline-none transition-[border-color]"
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'var(--color-accent)')}
                    onBlur={e => (e.target.style.borderColor = 'transparent')}
                  />
                  <p className="pl-2 text-xs" style={{ color: tooMany ? 'var(--color-error)' : 'var(--color-text-muted)' }}>
                    {pastedUrls.length} valid URL{pastedUrls.length !== 1 ? 's' : ''} detected{tooMany ? ' — max 20' : ''}
                  </p>
                </div>
              )}

              {/* File tab */}
              {tab === 'file' && (
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-10 transition-[border-color]"
                    style={{ borderColor: fileName ? 'var(--color-accent)' : 'var(--color-border)', background: 'var(--color-bg-tertiary)' }}
                  >
                    <UploadSimple size={28} style={{ color: fileName ? 'var(--color-accent)' : 'var(--color-text-muted)' }} />
                    <div className="text-center">
                      <p className="text-sm font-medium" style={{ color: fileName ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                        {fileName || 'Click to upload'}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>CSV, Excel (.xlsx), or .txt — one URL per line/cell</p>
                    </div>
                  </button>
                  <input ref={fileRef} type="file" accept=".csv,.xlsx,.txt,.xls" className="hidden" onChange={handleFile} />
                  {fileUrls.length > 0 && (
                    <p className="pl-2 text-xs" style={{ color: tooMany ? 'var(--color-error)' : 'var(--color-text-muted)' }}>
                      {fileUrls.length} URL{fileUrls.length !== 1 ? 's' : ''} found{tooMany ? ' — max 20' : ''}
                    </p>
                  )}
                </div>
              )}

              {/* Collection */}
              <div className="relative" ref={collectionRef}>
                <button
                  type="button"
                  onClick={() => setCollectionOpen(!collectionOpen)}
                  className={`h-[52px] w-full rounded-full border-2 px-5 text-[15px] font-medium outline-none flex items-center justify-between transition-[border-color] ${collectionOpen ? 'border-[var(--color-accent)]' : 'border-transparent'}`}
                  style={{ ...inputStyle, color: selectedCollection ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}
                >
                  <span className="flex items-center gap-2">
                    {selectedCollection && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: selectedCollection.color }} />}
                    {selectedCollection ? selectedCollection.name : 'Collection (optional)'}
                  </span>
                  <CaretDown size={14} weight="bold" style={{ color: 'var(--color-text-muted)', transform: collectionOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
                <AnimatePresence>
                  {collectionOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      className="absolute top-[56px] left-0 right-0 z-10 rounded-2xl overflow-hidden py-1"
                      style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}
                    >
                      {[{ id: '', name: 'No collection', color: 'var(--color-border)' }, ...collections].map(col => (
                        <button key={col.id} type="button"
                          onClick={() => { setCollectionId(col.id); setCollectionOpen(false) }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-medium text-left transition-colors hover:bg-[var(--color-bg-tertiary)]"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: col.color }} />
                          <span className="flex-1">{col.name}</span>
                          {collectionId === col.id && <Check size={14} weight="bold" style={{ color: 'var(--color-accent)' }} />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Tags */}
              <input
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="Tags (optional, comma separated)"
                className="h-[52px] w-full rounded-full border-2 border-transparent px-5 text-[15px] font-medium outline-none transition-[border-color]"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--color-accent)')}
                onBlur={e => (e.target.style.borderColor = 'transparent')}
              />

              {/* Submit */}
              <div className="flex justify-end pt-1">
                <motion.button
                  onClick={handleImport}
                  disabled={loading || urls.length === 0 || tooMany}
                  whileHover={loading ? {} : { scale: 1.04 }}
                  whileTap={loading ? {} : { scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  className="rounded-full px-8 py-3 text-[15px] font-bold text-white disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-muted) 100%)' }}
                >
                  {loading ? 'Importing...' : urls.length > 0 ? `Import ${urls.length} link${urls.length !== 1 ? 's' : ''}` : 'Import'}
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </>
  )
}
