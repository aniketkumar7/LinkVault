import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useLinks, useCollections, useStats, useDeleteWithUndo, useBatchActions, useToggleFavorite, useInvalidateCollections } from '@/hooks/useLinks'
import type { LinkFilters } from '@/lib/api'
import { api } from '@/lib/api'
import { toast } from '@/lib/toast'
import { Dialog } from '@/components/ui/Dialog'
import { generatePDF } from '@/utils/pdfExport'
import { SkeletonGrid } from '@/components/ui/Skeleton'
import { NoLinksEmpty, NoResultsEmpty } from '@/components/ui/EmptyState'
import { AddLinkForm } from './AddLinkForm'
import { LinkCard } from './LinkCard'
import { BulkImportModal } from './BulkImportModal'
import { Select } from './ui/Select'
import { CollectionManager } from './CollectionManager'

type Theme = 'dark' | 'light'
type SortField = 'created_at' | 'updated_at' | 'title'
type SortOrder = 'asc' | 'desc'

export function Dashboard() {
  const { user, signOut } = useAuth()

  // Filters
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [favoriteFilter, setFavoriteFilter] = useState(false)
  const [collectionFilter, setCollectionFilter] = useState('')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // UI state
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'dark')
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [showAddLinkForm, setShowAddLinkForm] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showCollectionManager, setShowCollectionManager] = useState(false)
  const [exportCollectionId, setExportCollectionId] = useState<string>('')
  const [exporting, setExporting] = useState(false)

  // Collection management
  const [editingCollection, setEditingCollection] = useState<{ id: string; name: string } | null>(null)
  const [deletingCollectionId, setDeletingCollectionId] = useState<string | null>(null)

  // Selection for batch actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectMode, setSelectMode] = useState(false)

  // Build filters object
  const filters: LinkFilters = useMemo(() => ({
    favorite: favoriteFilter || undefined,
    collection_id: collectionFilter || undefined,
    tag: tagFilter || undefined,
    search: search || undefined,
    sort: sortField,
    order: sortOrder,
  }), [favoriteFilter, collectionFilter, tagFilter, search, sortField, sortOrder])

  // React Query hooks
  const { data: links = [], isLoading, error, refetch } = useLinks(filters)
  const { data: collections = [] } = useCollections()
  const { data: stats } = useStats()

  // Cold start detection (first load taking > 3s)
  const [coldStartMessage, setColdStartMessage] = useState<string | null>(null)
  const isInitialLoading = isLoading && collections.length === 0

  useEffect(() => {
    if (!isInitialLoading) {
      setColdStartMessage(null)
      return
    }

    const timer1 = setTimeout(() => {
      setColdStartMessage('Waking up server...')
    }, 3000)

    const timer2 = setTimeout(() => {
      setColdStartMessage('Still loading (free tier cold start)...')
    }, 8000)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [isInitialLoading])
  const { deleteWithUndo } = useDeleteWithUndo()
  const { batchDelete, batchMoveToCollection } = useBatchActions()
  const toggleFavorite = useToggleFavorite()
  const invalidateCollections = useInvalidateCollections()

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    const handleClickOutside = () => { setShowProfileMenu(false); setShowFilters(false) }
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        document.querySelector<HTMLInputElement>('[data-search-input]')?.focus()
      }
      if (e.key === 'Escape') {
        setSelectMode(false)
        setSelectedIds(new Set())
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Derived data
  const allTags = useMemo(() => [...new Set(links.flatMap((l) => l.tags ?? []))], [links])
  const hasFilters = Boolean(search || tagFilter || favoriteFilter || collectionFilter)
  const activeFilterCount = [favoriteFilter, Boolean(collectionFilter), Boolean(tagFilter), Boolean(search)].filter(Boolean).length
  const profileName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const profileInitial = profileName.charAt(0).toUpperCase()

  const clearFilters = () => {
    setSearchInput('')
    setSearch('')
    setTagFilter('')
    setFavoriteFilter(false)
    setCollectionFilter('')
    setShowFilters(false)
  }

  const handleExportPDF = async () => {
    setExporting(true)
    setShowExportModal(false)

    try {
      const collectionName = exportCollectionId
        ? collections.find(c => c.id === exportCollectionId)?.name
        : undefined

      await generatePDF({
        links,
        collections,
        collectionId: exportCollectionId || undefined,
        collectionName,
      })

      const count = exportCollectionId
        ? links.filter(l => l.collection_id === exportCollectionId).length
        : links.length
      toast.success(`Exported ${count} links`)
    } catch (err) {
      console.error('PDF export failed:', err)
      toast.error(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
      setExportCollectionId('')
    }
  }

  const handleEditCollection = async () => {
    if (!editingCollection) return
    try {
      await api.updateCollection(editingCollection.id, { name: editingCollection.name })
      invalidateCollections()
      setEditingCollection(null)
      toast.success('Collection updated')
    } catch {
      toast.error('Failed to update collection')
    }
  }

  const handleDeleteCollection = async () => {
    if (!deletingCollectionId) return
    try {
      await api.deleteCollection(deletingCollectionId)
      invalidateCollections()
      setDeletingCollectionId(null)
      if (collectionFilter === deletingCollectionId) setCollectionFilter('')
      toast.success('Collection deleted')
    } catch {
      toast.error('Failed to delete collection')
    }
  }

  // Selection handlers
  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const selectAll = () => setSelectedIds(new Set(links.map(l => l.id)))
  const deselectAll = () => setSelectedIds(new Set())

  const handleBatchDelete = () => {
    batchDelete.mutate([...selectedIds])
    setSelectedIds(new Set())
    setSelectMode(false)
  }

  const handleBatchCollection = (collectionId: string | null) => {
    batchMoveToCollection.mutate({ ids: [...selectedIds], collectionId })
    setSelectedIds(new Set())
    setSelectMode(false)
  }

  // Show cold start overlay for initial load
  if (isInitialLoading && coldStartMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg-primary)' }}>
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-6">
            <img src="/Logo.svg" alt="LinkVault" className="w-16 h-16 animate-pulse" />
          </div>
          <div className="flex items-center justify-center gap-3 mb-4">
            <svg className="animate-spin h-5 w-5" style={{ color: 'var(--color-accent)' }} viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-lg font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {coldStartMessage}
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            This may take up to 60 seconds on first visit
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      <header className="sticky top-0 z-30 backdrop-blur-xl mx-auto" style={{
        background: 'var(--color-bg-primary)',
        borderBottom: '1px solid var(--color-border)'
      }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
              <img src="/Logo.svg" alt="LinkVault" className="h-8 w-8" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>LinkVault</h1>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {stats?.total ?? links.length} links saved
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              className="rounded-2xl border p-2.5"
              style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <svg className="h-5 w-5" style={{ color: 'var(--color-text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" style={{ color: 'var(--color-text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowProfileMenu((value) => !value)
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold"
                style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                aria-label="Open profile menu"
              >
                {profileInitial}
              </button>

              {showProfileMenu && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-2xl border p-3 shadow-xl"
                  style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mb-3 rounded-2xl border px-3 py-2" style={{ background: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)' }}>
                    <p className="text-[11px] uppercase tracking-[0.24em]" style={{ color: 'var(--color-text-muted)' }}>Account</p>
                    <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{profileName}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => { setShowCollectionManager(true); setShowProfileMenu(false) }}
                      className="rounded-xl border px-3 py-2 text-sm text-left"
                      style={{ background: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                    >
                      Manage collections
                    </button>
                    <button
                      onClick={() => {
                        setShowExportModal(true)
                        setShowProfileMenu(false)
                      }}
                      className="rounded-xl border px-3 py-2 text-sm text-left"
                      style={{ background: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                    >
                      Export links
                    </button>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false)
                        signOut()
                      }}
                      className="rounded-xl border px-3 py-2 text-sm text-left"
                      style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)', color: 'var(--color-error)' }}
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full px-4 py-2 pb-28 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-[28px] p-2">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="mt-1 text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>Your links</h2>
              <p className="mt-0.5 text-xs sm:text-base" style={{ color: 'var(--color-text-secondary)' }}>Manage everything in one calm view.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowAddLinkForm(true)}
                className="hidden sm:block rounded-2xl px-4 py-2 text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-muted) 100%)', boxShadow: 'var(--shadow-glow)' }}
              >
                + Add link
              </button>
              <button
                onClick={() => setShowBulkImport(true)}
                className="rounded-2xl border px-3.5 py-2 text-sm font-medium"
                style={{ background: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                Bulk import
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            {/* Search */}
            <div className="relative flex-1">
              <svg className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                data-search-input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search title, tag, or note"
                className="w-full rounded-2xl border py-2.5 pl-10 pr-8 text-sm"
                style={{ background: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              />
              {searchInput && (
                <button type="button" onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-lg leading-none"
                  style={{ color: 'var(--color-text-muted)' }}
                >×</button>
              )}
            </div>

            {/* Desktop inline filters */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              <button
                onClick={() => setFavoriteFilter(!favoriteFilter)}
                className="rounded-2xl border px-3 py-2.5 text-sm font-medium"
                style={{
                  background: favoriteFilter ? 'rgba(251,191,36,0.1)' : 'var(--color-bg-tertiary)',
                  borderColor: favoriteFilter ? '#fbbf24' : 'var(--color-border)',
                  color: favoriteFilter ? '#fbbf24' : 'var(--color-text-secondary)',
                }}
              >★ Favorites</button>

              {collections.length > 0 && (
                <div className="flex items-center gap-1">
                  <Select
                    value={collectionFilter}
                    onChange={setCollectionFilter}
                    options={[
                      { value: '', label: 'All collections' },
                      ...collections.map(col => ({ value: col.id, label: col.name, color: col.color }))
                    ]}
                    size="sm"
                    className="w-40"
                  />
                  {collectionFilter && (
                    <>
                      <button onClick={() => { const col = collections.find(c => c.id === collectionFilter); if (col) setEditingCollection({ id: col.id, name: col.name }) }}
                        className="rounded-xl border p-2" title="Edit"
                        style={{ color: 'var(--color-text-muted)', background: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)' }}
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => setDeletingCollectionId(collectionFilter)}
                        className="rounded-xl border p-2" title="Delete"
                        style={{ color: 'var(--color-error)', background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.2)' }}
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </>
                  )}
                </div>
              )}

              {allTags.length > 0 && (
                <Select
                  value={tagFilter}
                  onChange={setTagFilter}
                  options={[
                    { value: '', label: 'All tags' },
                    ...allTags.map(tag => ({ value: tag, label: `#${tag}` }))
                  ]}
                  size="sm"
                  className="w-32"
                />
              )}

              <Select
                value={`${sortField}-${sortOrder}`}
                onChange={(val) => { const [f, o] = val.split('-'); setSortField(f as SortField); setSortOrder(o as SortOrder) }}
                options={[
                  { value: 'created_at-desc', label: 'Newest' },
                  { value: 'created_at-asc', label: 'Oldest' },
                  { value: 'updated_at-desc', label: 'Updated' },
                  { value: 'title-asc', label: 'A–Z' },
                  { value: 'title-desc', label: 'Z–A' },
                ]}
                size="sm"
                className="w-28"
              />

              <button
                onClick={() => { setSelectMode(v => !v); setSelectedIds(new Set()) }}
                className="rounded-2xl border px-3 py-2.5 text-sm font-medium"
                style={{
                  background: selectMode ? 'rgba(42,187,247,0.1)' : 'var(--color-bg-tertiary)',
                  borderColor: selectMode ? 'var(--color-accent)' : 'var(--color-border)',
                  color: selectMode ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                }}
              >{selectMode ? `${selectedIds.size} selected` : 'Select'}</button>

              {hasFilters && (
                <button onClick={clearFilters}
                  className="rounded-2xl border px-3 py-2.5 text-sm font-medium"
                  style={{ color: 'var(--color-accent)', background: 'rgba(42,187,247,0.08)', borderColor: 'rgba(42,187,247,0.2)' }}
                >✕</button>
              )}
            </div>

            {/* Mobile filter button */}
            <div className="relative shrink-0 md:hidden">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setShowFilters(v => !v) }}
                className="flex items-center gap-1.5 rounded-2xl border px-3.5 py-2.5 text-sm font-medium"
                style={{
                  background: hasFilters ? 'rgba(42,187,247,0.08)' : 'var(--color-bg-tertiary)',
                  borderColor: hasFilters ? 'var(--color-accent)' : 'var(--color-border)',
                  color: hasFilters ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                }}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 8h10M11 12h2" /></svg>
                {activeFilterCount > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: 'var(--color-accent)' }}>{activeFilterCount}</span>
                )}
              </button>

              {showFilters && (
                <div
                  className="absolute right-0 top-[calc(100%+8px)] z-20 w-64 rounded-2xl border p-3 shadow-xl"
                  style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setFavoriteFilter(!favoriteFilter)}
                      className="flex items-center justify-between rounded-2xl border px-3 py-2.5 text-sm font-medium"
                      style={{
                        background: favoriteFilter ? 'rgba(251,191,36,0.1)' : 'var(--color-bg-tertiary)',
                        borderColor: favoriteFilter ? '#fbbf24' : 'var(--color-border)',
                        color: favoriteFilter ? '#fbbf24' : 'var(--color-text-secondary)',
                      }}
                    >
                      <span>★ Favorites only</span>
                      {favoriteFilter && <span className="text-xs">✓</span>}
                    </button>
                    {collections.length > 0 && (
                      <Select value={collectionFilter} onChange={setCollectionFilter}
                        options={[{ value: '', label: 'All collections' }, ...collections.map(col => ({ value: col.id, label: col.name, color: col.color }))]}
                        size="sm" className="w-full"
                      />
                    )}
                    {allTags.length > 0 && (
                      <Select value={tagFilter} onChange={setTagFilter}
                        options={[{ value: '', label: 'All tags' }, ...allTags.map(tag => ({ value: tag, label: `#${tag}` }))]}
                        size="sm" className="w-full"
                      />
                    )}
                    <Select
                      value={`${sortField}-${sortOrder}`}
                      onChange={(val) => { const [f, o] = val.split('-'); setSortField(f as SortField); setSortOrder(o as SortOrder) }}
                      options={[
                        { value: 'created_at-desc', label: 'Newest' },
                        { value: 'created_at-asc', label: 'Oldest' },
                        { value: 'updated_at-desc', label: 'Updated' },
                        { value: 'title-asc', label: 'A–Z' },
                        { value: 'title-desc', label: 'Z–A' },
                      ]}
                      size="sm" className="w-full"
                    />
                    <button
                      onClick={() => { setSelectMode(v => !v); setSelectedIds(new Set()); setShowFilters(false) }}
                      className="rounded-2xl border px-3 py-2.5 text-sm font-medium text-left"
                      style={{
                        background: selectMode ? 'rgba(42,187,247,0.1)' : 'var(--color-bg-tertiary)',
                        borderColor: selectMode ? 'var(--color-accent)' : 'var(--color-border)',
                        color: selectMode ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                      }}
                    >{selectMode ? `✓ ${selectedIds.size} selected` : 'Select cards'}</button>
                    {hasFilters && (
                      <button onClick={clearFilters}
                        className="rounded-2xl border px-3 py-2.5 text-sm font-medium"
                        style={{ color: 'var(--color-accent)', background: 'rgba(42,187,247,0.08)', borderColor: 'rgba(42,187,247,0.2)' }}
                      >✕ Clear all</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Batch actions bar */}
          {selectMode && selectedIds.size > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-2 rounded-2xl border p-3" style={{ background: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)' }}>
              <button onClick={selectAll} className="rounded-lg px-4 py-2 text-sm font-medium" style={{ background: 'var(--color-bg-card)', color: 'var(--color-text-secondary)' }}>Select all</button>
              <button onClick={deselectAll} className="rounded-lg px-4 py-2 text-sm font-medium" style={{ background: 'var(--color-bg-card)', color: 'var(--color-text-secondary)' }}>Clear</button>
              <button onClick={handleBatchDelete} className="ml-auto rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>Delete selected</button>
              <Select
                value=""
                onChange={(val) => val && handleBatchCollection(val === 'null' ? null : val)}
                options={[
                  { value: '', label: 'Move to...' },
                  { value: 'null', label: 'No collection' },
                  ...collections.map((col) => ({ value: col.id, label: col.name, color: col.color }))
                ]}
                size="md"
                className="w-36"
              />
            </div>
          )}
        </div>

        {/* Links Grid */}
        {isLoading ? (
          <SkeletonGrid count={6} />
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-lg mb-4" style={{ color: 'var(--color-error)' }}>Failed to load links</p>
            <button onClick={() => refetch()} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--color-accent)', color: 'white' }}>
              Retry
            </button>
          </div>
        ) : links.length === 0 ? (
          hasFilters ? (
            <NoResultsEmpty onClearFilters={clearFilters} />
          ) : (
            <NoLinksEmpty />
          )
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3 xl:grid-cols-4">
            {links.map((link, index) => (
              <div
                key={link.id}
                className="w-full min-w-0 animate-fade-in"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <LinkCard
                  link={link}
                  onDeleted={() => deleteWithUndo(link)}
                  onUpdated={() => refetch()}
                  collections={collections}
                  selectable={selectMode}
                  selected={selectedIds.has(link.id)}
                  onSelect={() => toggleSelect(link.id)}
                  onToggleFavorite={() => toggleFavorite.mutate(link.id)}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Floating Add Link */}
      <AddLinkForm
        onLinkAdded={() => refetch()}
        existingTags={allTags}
        collections={collections}
        onCollectionCreated={invalidateCollections}
        open={showAddLinkForm}
        onOpenChange={setShowAddLinkForm}
      />
      <CollectionManager open={showCollectionManager} onClose={() => setShowCollectionManager(false)} collections={collections} onChanged={() => { invalidateCollections(); refetch() }} />

      {/* Modals */}
      {showBulkImport && (
        <BulkImportModal
          onClose={() => setShowBulkImport(false)}
          onImported={() => refetch()}
          collections={collections}
        />
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div
            className="w-full max-w-sm rounded-2xl p-5 animate-scale-in"
            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              Export to PDF
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>
                  What to export?
                </label>
                <Select
                  value={exportCollectionId}
                  onChange={setExportCollectionId}
                  options={[
                    { value: '', label: `All Links (${links.length})` },
                    ...collections.map(col => ({
                      value: col.id,
                      label: `${col.name} (${links.filter(l => l.collection_id === col.id).length})`,
                      color: col.color
                    }))
                  ]}
                  placeholder="Select collection"
                  size="sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => { setShowExportModal(false); setExportCollectionId('') }}
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-medium"
                  style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleExportPDF}
                  disabled={exporting}
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                  style={{ background: 'var(--color-accent)' }}
                >
                  {exporting ? 'Exporting...' : 'Export PDF'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Collection Dialog */}
      {editingCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div
            className="w-full max-w-sm rounded-2xl p-5 animate-scale-in"
            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              Edit Collection
            </h3>
            <input
              type="text"
              value={editingCollection.name}
              onChange={(e) => setEditingCollection({ ...editingCollection, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl text-sm mb-4"
              style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => setEditingCollection(null)}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-medium"
                style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleEditCollection}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-medium text-white"
                style={{ background: 'var(--color-accent)' }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Collection Dialog */}
      <Dialog
        open={!!deletingCollectionId}
        onClose={() => setDeletingCollectionId(null)}
        title="Delete collection?"
        description="Links in this collection will not be deleted, but will no longer be in any collection."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteCollection}
        variant="danger"
      />
    </div>
  )
}
