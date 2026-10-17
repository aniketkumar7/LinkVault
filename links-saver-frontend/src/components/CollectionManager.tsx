import { useRef, useState } from 'react'
import { MagnifyingGlass, PushPin } from '@phosphor-icons/react'
import { api, type Collection } from '@/lib/api'
import { Dialog } from '@/components/ui/Dialog'
import { Drawer } from '@/components/ui/Drawer'
import { toast } from '@/lib/toast'
import { AddCollectionModal } from './AddCollectionModal'

export function CollectionManager({ open, onClose, collections, onChanged }: { open: boolean; onClose: () => void; collections: Collection[]; onChanged: () => void }) {
  const [editing, setEditing] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Collection | null>(null)
  const deleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState(collections)
  const displayedCollections = search ? results : collections
  const editingCollection = collections.find(collection => collection.id === editing) ?? results.find(collection => collection.id === editing)
  const remove = () => {
    if (!deleting) return
    const target = collections.find(collection => collection.id === deleting)
    if (!target) return
    setDeleting(null)
    setPendingDelete(target)
    deleteTimer.current = setTimeout(async () => {
      try { await api.deleteCollection(target.id); setPendingDelete(null); onChanged(); toast.success('Collection and links deleted') }
      catch { setPendingDelete(null); toast.error('Could not delete collection') }
    }, 5000)
  }
  const undoDelete = () => { if (deleteTimer.current) clearTimeout(deleteTimer.current); setPendingDelete(null) }
  const handleSearch = async (value: string) => {
    setSearch(value)
    try { setResults(await api.getCollections(value)) }
    catch { toast.error('Could not search collections') }
  }
  const close = () => { setEditing(null); onClose() }

  return <>
    <Drawer
      open={open}
      onClose={close}
      eyebrow="Library"
      title={editingCollection ? 'Edit collection' : 'Manage collections'}
      onBack={editingCollection ? () => setEditing(null) : undefined}
    >
      {editingCollection ? (
        <AddCollectionModal bare key={editingCollection.id} open collection={editingCollection} onClose={() => setEditing(null)} onCreated={onChanged} />
      ) : (
        <>
          <div className="relative mb-4"><MagnifyingGlass size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} /><input value={search} onChange={event => handleSearch(event.target.value)} placeholder="Search collections" className="w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm" style={{ background: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} /></div>
          <div className="space-y-2">
            {displayedCollections.map(collection => <div key={collection.id} className="flex items-center gap-3 rounded-2xl px-3 py-3" style={{ background: 'var(--color-bg-tertiary)' }}>
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: collection.color }} />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{collection.name}</span>
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{collection.link_count ?? 0}</span>
              <button onClick={async () => { try { await api.toggleCollectionPin(collection.id); onChanged(); toast.success(collection.is_pinned ? 'Collection unpinned' : 'Collection pinned') } catch { toast.error('Could not update pin') } }} aria-label={`${collection.is_pinned ? 'Unpin' : 'Pin'} ${collection.name}`} className="rounded-lg p-2" style={{ color: collection.is_pinned ? 'var(--color-accent)' : 'var(--color-text-muted)' }}><PushPin size={17} weight={collection.is_pinned ? 'fill' : 'regular'} /></button>
              <button onClick={() => setEditing(collection.id)} aria-label={`Edit ${collection.name}`} className="rounded-lg p-2"><img src="/icons/edit-pencil-2.svg" alt="" aria-hidden="true" className="h-[17px] w-[17px]" /></button>
              <button onClick={() => setDeleting(collection.id)} aria-label={`Delete ${collection.name}`} className="rounded-lg p-2" style={{ color: 'var(--color-error)' }}><img src="/icons/delete.svg" alt="" aria-hidden="true" className="h-[17px] w-[17px]" /></button>
            </div>)}
          </div>
        </>
      )}
    </Drawer>
    <Dialog highLayer open={!!deleting} onClose={() => setDeleting(null)} title="Delete collection and links?" description="Are you sure? This will permanently delete the collection and every link inside it." confirmText="Delete" cancelText="Cancel" variant="danger" onConfirm={remove} />
    {pendingDelete && <div className="fixed bottom-5 left-1/2 z-[80] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 overflow-hidden rounded-2xl border p-3 shadow-2xl" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">Deleting “{pendingDelete.name}” and its links</p><div className="mt-2 h-1 overflow-hidden rounded-full bg-red-500/15"><div className="animate-delete-progress h-full w-full origin-left rounded-full bg-red-500" /></div></div>
      <button onClick={undoDelete} className="rounded-lg px-3 py-2 text-sm font-semibold" style={{ color: 'var(--color-accent)' }}>Undo</button>
    </div>}
  </>
}
