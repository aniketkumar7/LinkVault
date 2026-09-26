import { useState } from 'react'
import { api } from '@/lib/api'
import { toast } from '@/lib/toast'
import { Folder } from './Folder'
import { ColorPicker } from './ui/ColorPicker'

export function AddCollectionModal({
  open,
  onClose,
  onCreated,
  collection,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
  collection?: { id: string; name: string; color: string }
}) {
  const [name, setName] = useState(collection?.name ?? '')
  const [color, setColor] = useState(collection?.color ?? '#f68330')
  const [saving, setSaving] = useState(false)
  if (!open) return null
  const create = async () => {
    if (!name.trim() || saving) return
    setSaving(true)
    try {
      if (collection) await api.updateCollection(collection.id, { name: name.trim(), color })
      else await api.createCollection({ name: name.trim(), color })
      setName('')
      onCreated()
      onClose()
      toast.success(collection ? 'Collection updated' : 'Collection created')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not create collection')
    } finally {
      setSaving(false)
    }
  }
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-black/65 backdrop-blur-sm"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Add collection"
        className="relative w-full max-w-sm animate-scale-in rounded-[28px] border p-5"
        style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p
              className="text-[11px] uppercase tracking-[.18em]"
              style={{ color: 'var(--color-text-muted)' }}>
              Organize
            </p>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {collection ? 'Edit collection' : 'New collection'}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-2xl"
            style={{ color: 'var(--color-text-muted)' }}>
            ×
          </button>
        </div>
        <div className="flex justify-center py-2">
          <Folder color={color} width={150} desktopWidth={150} />
        </div>
        <label
          className="mt-1 block text-xs font-semibold"
          style={{ color: 'var(--color-text-secondary)' }}>
          Collection name
        </label>
        <input
          autoFocus
          value={name}
          onChange={event => setName(event.target.value)}
          onKeyDown={event => event.key === 'Enter' && create()}
          placeholder="e.g. Design inspiration"
          className="mt-2 w-full rounded-xl border px-3 py-2.5 text-sm"
          style={{
            background: 'var(--color-bg-tertiary)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />
        <div className="flex justify-center">
          <ColorPicker value={color} onChange={setColor} />
        </div>
        <button
          onClick={create}
          disabled={!name.trim() || saving}
          className="mt-4 w-full rounded-xl py-3 text-sm font-semibold disabled:opacity-40"
          style={{ background: color, color: '#fff' }}>
          {saving ? 'Saving…' : collection ? 'Save changes' : 'Create collection'}
        </button>
      </section>
    </div>
  )
}
