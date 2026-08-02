import { useState } from 'react'
import { Plus, PencilSimple, Trash } from '@phosphor-icons/react'
import { api, type Collection } from '@/lib/api'
import { Dialog } from '@/components/ui/Dialog'
import { toast } from '@/lib/toast'

export function CollectionManager({ open, onClose, collections, onChanged }: { open: boolean; onClose: () => void; collections: Collection[]; onChanged: () => void }) {
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const create = async () => {
    if (!draft.trim()) return
    try { await api.createCollection({ name: draft.trim() }); setDraft(''); onChanged(); toast.success('Collection created') }
    catch { toast.error('Could not create collection') }
  }
  const save = async (collection: Collection) => {
    if (!collection.name.trim()) return
    try { await api.updateCollection(collection.id, { name: collection.name }); setEditing(null); onChanged(); toast.success('Collection updated') }
    catch { toast.error('Could not update collection') }
  }
  const remove = async () => {
    if (!deleting) return
    try { await api.deleteCollection(deleting); setDeleting(null); onChanged(); toast.success('Collection deleted') }
    catch { toast.error('Could not delete collection') }
  }
  if (!open) return null
  return <>
    <div className="fixed inset-0 z-40 bg-black/65" onClick={onClose} />
    <section role="dialog" aria-modal="true" aria-label="Manage collections" className="fixed inset-0 z-50 m-auto h-fit max-h-[80vh] w-[calc(100%-2rem)] max-w-lg overflow-auto rounded-2xl border p-5" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
      <div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold">Manage collections</h2><button onClick={onClose} aria-label="Close">×</button></div>
      <div className="mb-4 flex gap-2"><input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && create()} placeholder="New collection name" className="min-w-0 flex-1 rounded-xl border px-3 py-2 text-sm" style={{ background: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)' }} /><button onClick={create} disabled={!draft.trim()} className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ background: 'var(--color-accent)' }}><Plus size={15} /> Add</button></div>
      <div className="space-y-2">
        {collections.map(collection => <div key={collection.id} className="flex items-center gap-3 rounded-xl px-3 py-2" style={{ background: 'var(--color-bg-tertiary)' }}>
          <span className="size-2.5 rounded-full" style={{ background: collection.color }} />
          {editing === collection.id ? <input autoFocus defaultValue={collection.name} onBlur={e => save({ ...collection, name: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') save({ ...collection, name: e.currentTarget.value }); if (e.key === 'Escape') setEditing(null) }} className="min-w-0 flex-1 rounded px-2 py-1 text-sm" style={{ background: 'var(--color-bg-card)' }} /> : <><span className="min-w-0 flex-1 truncate text-sm font-medium">{collection.name}</span><span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{collection.link_count ?? 0} links</span></>}
          <button onClick={() => setEditing(collection.id)} aria-label={`Edit ${collection.name}`} className="p-1.5"><PencilSimple size={16} /></button><button onClick={() => setDeleting(collection.id)} aria-label={`Delete ${collection.name}`} className="p-1.5" style={{ color: 'var(--color-error)' }}><Trash size={16} /></button>
        </div>)}
      </div>
    </section>
    <Dialog open={!!deleting} onClose={() => setDeleting(null)} title="Delete collection?" description="Its links will stay saved but become unassigned." confirmText="Delete" cancelText="Cancel" variant="danger" onConfirm={remove} />
  </>
}
