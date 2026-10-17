import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, FileText, Image, UploadSimple, X } from '@phosphor-icons/react'

interface Props {
  files: File[]
  accept: string
  title: string
  subtitle: string
  maxFiles?: number
  processing?: boolean
  onFilesSelected: (files: File[]) => void
  onRemove: (index: number) => void
}

function isImage(file: File) {
  return file.type.startsWith('image/')
}

export function AnimatedFileUpload({ files, accept, title, subtitle, maxFiles = 10, processing = false, onFilesSelected, onRemove }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  function addFiles(incoming: File[]) {
    if (incoming.length) onFilesSelected(incoming.slice(0, maxFiles))
  }

  return (
    <div className="w-full select-none">
      <input ref={inputRef} type="file" accept={accept} multiple className="hidden" onChange={event => { addFiles(Array.from(event.target.files || [])); event.currentTarget.value = '' }} />
      <motion.button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={event => { event.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={event => { event.preventDefault(); setDragOver(false); addFiles(Array.from(event.dataTransfer.files)) }}
        animate={{ scale: dragOver ? 1.01 : 1 }}
        className="flex min-h-44 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-colors"
        style={{ borderColor: dragOver || files.length ? 'var(--color-accent)' : 'var(--color-border)', background: dragOver ? 'color-mix(in srgb, var(--color-accent) 8%, var(--color-bg-tertiary))' : 'var(--color-bg-tertiary)' }}
      >
        <span className="grid size-10 place-items-center rounded-xl border" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-accent)' }}>
          <UploadSimple size={21} weight="duotone" />
        </span>
        <span>
          <span className="block text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{files.length ? `${files.length} file${files.length === 1 ? '' : 's'} selected` : title}</span>
          <span className="mt-1 block text-xs" style={{ color: 'var(--color-text-muted)' }}>{subtitle}</span>
        </span>
      </motion.button>

      <AnimatePresence initial={false} mode="popLayout">
        {files.length > 0 && <div className="mt-3 space-y-2">
          {files.map((file, index) => (
            <motion.div key={`${file.name}-${file.lastModified}-${index}`} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} className="relative flex items-center gap-3 overflow-hidden rounded-xl border px-3 py-2.5" style={{ background: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)' }}>
              <span className="relative grid size-10 shrink-0 place-items-center rounded-lg border" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: isImage(file) ? '#8b5cf6' : 'var(--color-accent)' }}>
                {isImage(file) ? <Image size={19} weight="duotone" /> : <FileText size={19} weight="duotone" />}
                <span className="absolute -bottom-1 -right-1 rounded bg-[var(--color-bg-card)] px-1 text-[8px] font-bold uppercase" style={{ color: 'var(--color-text-muted)' }}>{file.name.split('.').pop()?.slice(0, 4) || 'file'}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>{file.name}</span>
                <span className="mt-0.5 block text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{Math.max(1, Math.round(file.size / 1024))} KB · {processing ? 'Processing…' : 'Ready to extract'}</span>
                {processing && <span className="mt-1 block h-1 overflow-hidden rounded-full" style={{ background: 'var(--color-border)' }}><motion.span className="block h-full rounded-full" style={{ background: 'var(--color-accent-fill)' }} initial={{ width: '12%' }} animate={{ width: ['12%', '70%', '92%'] }} transition={{ duration: 2, repeat: Infinity }} /></span>}
              </span>
              <span className="flex items-center gap-1">
                {!processing && <Check size={17} weight="bold" style={{ color: 'var(--color-success)' }} />}
                <button type="button" onClick={() => onRemove(index)} className="rounded-md p-1.5" style={{ color: 'var(--color-text-muted)' }} aria-label={`Remove ${file.name}`}><X size={15} weight="bold" /></button>
              </span>
            </motion.div>
          ))}
        </div>}
      </AnimatePresence>
    </div>
  )
}
