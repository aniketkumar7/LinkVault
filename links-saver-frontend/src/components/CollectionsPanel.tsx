import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import type { Collection } from '@/lib/api'
import { toast } from '@/lib/toast'
import { Dialog } from '@/components/ui/Dialog'
import { NoCollectionsEmpty } from '@/components/ui/EmptyState'

interface Props {
    onClose: () => void
    onCollectionChange: () => void
}

const COLORS = [
    '#2ABBF7', '#ef4444', '#22c55e', '#3b82f6', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f59e0b', '#6366f1', '#84cc16'
]

export function CollectionsPanel({ onClose, onCollectionChange }: Props) {
    const [collections, setCollections] = useState<Collection[]>([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [saving, setSaving] = useState(false)
    const [newName, setNewName] = useState('')
    const [newDescription, setNewDescription] = useState('')
    const [newColor, setNewColor] = useState('#2ABBF7')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editName, setEditName] = useState('')
    const [editDescription, setEditDescription] = useState('')
    const [editColor, setEditColor] = useState('')
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' })
    const [deleting, setDeleting] = useState(false)

    const fetchCollections = async () => {
        try {
            const data = await api.getCollections()
            setCollections(data)
        } catch {
            toast.error('Failed to load collections')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCollections()
    }, [])

    const handleCreate = async () => {
        if (!newName.trim()) return
        setSaving(true)
        try {
            await api.createCollection({
                name: newName.trim(),
                description: newDescription.trim() || undefined,
                color: newColor,
            })
            setNewName('')
            setNewDescription('')
            setCreating(false)
            toast.success('Collection created')
            fetchCollections()
            onCollectionChange()
        } catch {
            toast.error('Failed to create collection')
        } finally {
            setSaving(false)
        }
    }

    const handleUpdate = async (id: string) => {
        setSaving(true)
        try {
            await api.updateCollection(id, {
                name: editName.trim(),
                description: editDescription.trim() || undefined,
                color: editColor,
            })
            setEditingId(null)
            toast.success('Collection updated')
            fetchCollections()
            onCollectionChange()
        } catch {
            toast.error('Failed to update collection')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        setDeleting(true)
        try {
            await api.deleteCollection(deleteDialog.id)
            setDeleteDialog({ open: false, id: '', name: '' })
            toast.success('Collection deleted')
            fetchCollections()
            onCollectionChange()
        } catch {
            toast.error('Failed to delete collection')
        } finally {
            setDeleting(false)
        }
    }

    const handleShare = async (col: Collection) => {
        try {
            if (col.is_public) {
                await api.unshareCollection(col.id)
                toast.success('Collection is now private')
            } else {
                const result = await api.shareCollection(col.id)
                const url = `${window.location.origin}${result.shareUrl}`
                await navigator.clipboard.writeText(url)
                toast.success('Share link copied!')
            }
            fetchCollections()
            onCollectionChange()
        } catch {
            toast.error('Share action failed')
        }
    }

    const startEditing = (col: Collection) => {
        setEditingId(col.id)
        setEditName(col.name)
        setEditDescription(col.description || '')
        setEditColor(col.color)
    }

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={onClose}>
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
                <div
                    className="relative w-full max-w-md h-full overflow-auto p-6 animate-slide-left"
                    style={{ background: 'var(--color-bg-card)' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                            Collections
                        </h2>
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors" style={{ color: 'var(--color-text-muted)' }}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Create new */}
                    {creating ? (
                        <div className="mb-6 p-4 rounded-xl animate-slide-down" style={{ background: 'var(--color-bg-tertiary)' }}>
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Collection name"
                                className="w-full px-4 py-2 rounded-lg mb-3"
                                style={{
                                    background: 'var(--color-bg-primary)',
                                    border: '1px solid var(--color-border)',
                                    color: 'var(--color-text-primary)',
                                }}
                                autoFocus
                            />
                            <input
                                type="text"
                                value={newDescription}
                                onChange={(e) => setNewDescription(e.target.value)}
                                placeholder="Description (optional)"
                                className="w-full px-4 py-2 rounded-lg mb-3"
                                style={{
                                    background: 'var(--color-bg-primary)',
                                    border: '1px solid var(--color-border)',
                                    color: 'var(--color-text-primary)',
                                }}
                            />
                            <div className="flex gap-2 mb-3 flex-wrap">
                                {COLORS.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setNewColor(color)}
                                        className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                                        style={{
                                            background: color,
                                            transform: newColor === color ? 'scale(1.2)' : 'scale(1)',
                                            border: newColor === color ? '2px solid white' : 'none',
                                        }}
                                    />
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCreating(false)}
                                    disabled={saving}
                                    className="flex-1 py-2 rounded-lg text-sm"
                                    style={{ background: 'var(--color-bg-primary)', color: 'var(--color-text-secondary)' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={saving || !newName.trim()}
                                    className="flex-1 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 flex items-center justify-center gap-2"
                                    style={{ background: 'var(--color-accent)' }}
                                >
                                    {saving && (
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                    )}
                                    Create
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setCreating(true)}
                            className="w-full mb-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors hover:bg-bg-tertiary"
                            style={{
                                background: 'var(--color-bg-tertiary)',
                                color: 'var(--color-text-secondary)',
                                border: '1px dashed var(--color-border)',
                            }}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            New Collection
                        </button>
                    )}

                    {/* Collections list */}
                    <div className="space-y-3">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <svg className="animate-spin h-8 w-8" style={{ color: 'var(--color-accent)' }} viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            </div>
                        ) : collections.length === 0 ? (
                            <NoCollectionsEmpty onCreateCollection={() => setCreating(true)} />
                        ) : (
                            collections.map((col, index) => (
                                <div
                                    key={col.id}
                                    className="p-4 rounded-xl animate-fade-in"
                                    style={{
                                        background: 'var(--color-bg-tertiary)',
                                        borderLeft: `4px solid ${col.color}`,
                                        animationDelay: `${index * 50}ms`,
                                    }}
                                >
                                    {editingId === col.id ? (
                                        <div className="space-y-3 animate-fade-in">
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg text-sm"
                                                style={{
                                                    background: 'var(--color-bg-primary)',
                                                    border: '1px solid var(--color-border)',
                                                    color: 'var(--color-text-primary)',
                                                }}
                                            />
                                            <input
                                                type="text"
                                                value={editDescription}
                                                onChange={(e) => setEditDescription(e.target.value)}
                                                placeholder="Description"
                                                className="w-full px-3 py-2 rounded-lg text-sm"
                                                style={{
                                                    background: 'var(--color-bg-primary)',
                                                    border: '1px solid var(--color-border)',
                                                    color: 'var(--color-text-primary)',
                                                }}
                                            />
                                            <div className="flex gap-1 flex-wrap">
                                                {COLORS.map(color => (
                                                    <button
                                                        key={color}
                                                        onClick={() => setEditColor(color)}
                                                        className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                                                        style={{
                                                            background: color,
                                                            border: editColor === color ? '2px solid white' : 'none',
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    disabled={saving}
                                                    className="flex-1 py-1.5 rounded-lg text-sm"
                                                    style={{ background: 'var(--color-bg-primary)', color: 'var(--color-text-secondary)' }}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => handleUpdate(col.id)}
                                                    disabled={saving}
                                                    className="flex-1 py-1.5 rounded-lg text-sm font-medium text-white disabled:opacity-50 flex items-center justify-center gap-2"
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
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                                                        {col.name}
                                                    </h3>
                                                    {col.description && (
                                                        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                                                            {col.description}
                                                        </p>
                                                    )}
                                                    <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
                                                        {col.link_count || 0} links
                                                        {col.is_public && ' • 🔗 Shared'}
                                                    </p>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => handleShare(col)}
                                                        className="p-1.5 rounded-lg hover:bg-bg-primary transition-colors"
                                                        style={{ color: col.is_public ? 'var(--color-success)' : 'var(--color-text-muted)' }}
                                                        title={col.is_public ? 'Unshare' : 'Share'}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => startEditing(col)}
                                                        className="p-1.5 rounded-lg hover:bg-bg-primary transition-colors"
                                                        style={{ color: 'var(--color-text-muted)' }}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteDialog({ open: true, id: col.id, name: col.name })}
                                                        className="p-1.5 rounded-lg hover:bg-bg-primary transition-colors"
                                                        style={{ color: 'var(--color-error)' }}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Delete confirmation dialog */}
            <Dialog
                open={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, id: '', name: '' })}
                title={`Delete "${deleteDialog.name}"?`}
                description="Links in this collection will be kept but unassigned."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleDelete}
                variant="danger"
                loading={deleting}
            />
        </>
    )
}
