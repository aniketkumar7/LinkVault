import { useState } from 'react'
import { api } from '@/lib/api'
import type { Collection, BulkImportResult } from '@/lib/api'
import { toast } from '@/lib/toast'

interface Props {
    onClose: () => void
    onImported: () => void
    collections: Collection[]
}

export function BulkImportModal({ onClose, onImported, collections }: Props) {
    const [urlsText, setUrlsText] = useState('')
    const [tags, setTags] = useState('')
    const [collectionId, setCollectionId] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<BulkImportResult | null>(null)

    const urls = urlsText
        .split('\n')
        .map(line => line.trim())
        .filter(line => {
            try {
                new URL(line)
                return true
            } catch {
                return false
            }
        })

    const handleImport = async () => {
        if (urls.length === 0) return

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
            if (importResult.duplicates.length > 0) {
                toast(`${importResult.duplicates.length} duplicates skipped`)
            }
        } catch (err) {
            console.error('Bulk import failed:', err)
            toast.error('Bulk import failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
            <div
                className="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-2xl p-6"
                style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                        Bulk Import
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-lg" style={{ color: 'var(--color-text-muted)' }}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {result ? (
                    // Results view
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-4 rounded-xl" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                                <p className="text-2xl font-bold" style={{ color: 'var(--color-success)' }}>
                                    {result.success.length}
                                </p>
                                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Imported</p>
                            </div>
                            <div className="p-4 rounded-xl" style={{ background: 'rgba(42, 187, 247, 0.1)' }}>
                                <p className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>
                                    {result.duplicates.length}
                                </p>
                                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Duplicates</p>
                            </div>
                            <div className="p-4 rounded-xl" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                                <p className="text-2xl font-bold" style={{ color: 'var(--color-error)' }}>
                                    {result.failed.length}
                                </p>
                                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Failed</p>
                            </div>
                        </div>

                        {result.failed.length > 0 && (
                            <div className="p-4 rounded-xl" style={{ background: 'var(--color-bg-tertiary)' }}>
                                <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-error)' }}>Failed URLs:</p>
                                {result.failed.map((f, i) => (
                                    <p key={i} className="text-sm truncate" style={{ color: 'var(--color-text-muted)' }}>
                                        {f.url}: {f.error}
                                    </p>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={onClose}
                            className="w-full py-3 rounded-xl font-semibold text-white"
                            style={{ background: 'var(--color-accent)' }}
                        >
                            Done
                        </button>
                    </div>
                ) : (
                    // Input view
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                                Paste URLs (one per line)
                            </label>
                            <textarea
                                value={urlsText}
                                onChange={(e) => setUrlsText(e.target.value)}
                                placeholder="https://example.com/link1&#10;https://example.com/link2&#10;https://example.com/link3"
                                rows={8}
                                className="w-full px-4 py-3 rounded-xl resize-none font-mono text-sm"
                                style={{
                                    background: 'var(--color-bg-tertiary)',
                                    border: '1px solid var(--color-border)',
                                    color: 'var(--color-text-primary)',
                                }}
                            />
                            <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
                                {urls.length} valid URL{urls.length !== 1 ? 's' : ''} detected (max 20)
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                                Tags (optional)
                            </label>
                            <input
                                type="text"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                placeholder="tag1, tag2"
                                className="w-full px-4 py-3 rounded-xl"
                                style={{
                                    background: 'var(--color-bg-tertiary)',
                                    border: '1px solid var(--color-border)',
                                    color: 'var(--color-text-primary)',
                                }}
                            />
                        </div>

                        {collections.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                                    Add to Collection (optional)
                                </label>
                                <select
                                    value={collectionId}
                                    onChange={(e) => setCollectionId(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl"
                                    style={{
                                        background: 'var(--color-bg-tertiary)',
                                        border: '1px solid var(--color-border)',
                                        color: 'var(--color-text-primary)',
                                    }}
                                >
                                    <option value="">No Collection</option>
                                    {collections.map(col => (
                                        <option key={col.id} value={col.id}>{col.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 rounded-xl font-semibold"
                                style={{
                                    background: 'var(--color-bg-tertiary)',
                                    color: 'var(--color-text-secondary)',
                                    border: '1px solid var(--color-border)',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={loading || urls.length === 0 || urls.length > 20}
                                className="flex-1 py-3 rounded-xl font-semibold text-white disabled:opacity-50"
                                style={{ background: 'var(--color-accent)' }}
                            >
                                {loading ? 'Importing...' : `Import ${urls.length} URL${urls.length !== 1 ? 's' : ''}`}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

