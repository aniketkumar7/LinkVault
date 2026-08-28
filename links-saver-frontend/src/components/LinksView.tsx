import { useState, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLinks, useDeleteWithUndo, useBatchActions, useToggleFavorite } from '@/hooks/useLinks'
import type { LinkFilters, Collection } from '@/lib/api'
import { SkeletonGrid } from '@/components/ui/Skeleton'
import { NoLinksEmpty, NoResultsEmpty } from '@/components/ui/EmptyState'
import { LinkCard } from './LinkCard'
import { Select } from './ui/Select'

type SortField = 'created_at' | 'updated_at' | 'title'
type SortOrder = 'asc' | 'desc'
type ViewMode = 'grid' | 'list'

interface Props {
  collections: Collection[]
  initialCollectionId?: string
  onRefetchNeeded?: () => void
}


export function LinksView({ collections, initialCollectionId = '', onRefetchNeeded }: Props) {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [favoriteFilter, setFavoriteFilter] = useState(false)
  const [collectionFilter, setCollectionFilter] = useState(initialCollectionId)
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [viewMode, setViewMode] = useState<ViewMode>(() => (localStorage.getItem('view-mode') as ViewMode) || 'grid')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectMode, setSelectMode] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const filters: LinkFilters = useMemo(() => ({
    favorite: favoriteFilter || undefined,
    collection_id: collectionFilter || undefined,
    search: search || undefined,
    sort: sortField,
    order: sortOrder,
  }), [favoriteFilter, collectionFilter, search, sortField, sortOrder])

  const { data: links = [], isLoading, error, refetch } = useLinks(filters)
  const { deleteWithUndo } = useDeleteWithUndo()
  const { batchDelete, batchMoveToCollection } = useBatchActions()
  const toggleFavorite = useToggleFavorite()

  const isDefaultSort = sortField === 'created_at' && sortOrder === 'desc'
  const hasFilters = Boolean(search || favoriteFilter || collectionFilter || !isDefaultSort)

  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const handleSearch = (val: string) => {
    setSearchInput(val)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setSearch(val), 300)
  }

  const clearFilters = () => {
    setSearchInput('')
    setSearch('')
    setFavoriteFilter(false)
    setCollectionFilter('')
    setSortField('created_at')
    setSortOrder('desc')
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

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

  const done = () => { refetch(); onRefetchNeeded?.() }

  return (
    <div>
      {/* ── Toolbar ── */}
      <div className="mb-5 flex items-center justify-between gap-2">
        {/* Search */}
        <div className="relative flex-1 md:max-w-xs">
          <svg className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            data-search-input
            type="text"
            value={searchInput}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search links..."
            className="w-full rounded-2xl border py-2.5 pl-10 pr-8 text-sm"
            style={{ background: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          />
          {searchInput && (
            <button type="button" onClick={() => handleSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-lg leading-none"
              style={{ color: 'var(--color-text-muted)' }}
            >×</button>
          )}
        </div>

        {/* Desktop filters */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {/* Collection — ✕ badge top-right when active */}
          {collections.length > 0 && (
            <div className="relative">
              <Select
                value={collectionFilter}
                onChange={setCollectionFilter}
                options={[
                  { value: '', label: 'All collections' },
                  ...collections.map(col => ({ value: col.id, label: col.name, color: col.color }))
                ]}
                size="sm"
                width={160}
              />
              {collectionFilter && (
                <button
                  type="button"
                  onClick={() => setCollectionFilter('')}
                  className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold leading-none z-10"
                  style={{ background: 'var(--color-accent)', color: 'var(--color-bg-primary)' }}
                >✕</button>
              )}
            </div>
          )}

          {collections.length > 0 && <div className="h-5 w-px shrink-0" style={{ background: 'var(--color-border)' }} />}

          {/* Sort — ✕ badge top-right when non-default */}
          <div className="relative">
            <Select
              value={`${sortField}-${sortOrder}`}
              onChange={val => { const [f, o] = val.split('-'); setSortField(f as SortField); setSortOrder(o as SortOrder) }}
              options={[
                { value: 'created_at-desc', label: 'Newest' },
                { value: 'created_at-asc', label: 'Oldest' },
                { value: 'updated_at-desc', label: 'Updated' },
                { value: 'title-asc', label: 'A–Z' },
                { value: 'title-desc', label: 'Z–A' },
              ]}
              size="sm"
              width={108}
            />
            {!isDefaultSort && (
              <button
                type="button"
                onClick={() => { setSortField('created_at'); setSortOrder('desc') }}
                className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold leading-none z-10"
                style={{ background: 'var(--color-accent)', color: 'var(--color-bg-primary)' }}
              >✕</button>
            )}
          </div>

          {/* Favorite toggle */}
          <button
            type="button"
            onClick={() => setFavoriteFilter(v => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border text-sm"
            style={{
              background: favoriteFilter ? 'rgba(251,191,36,0.12)' : 'var(--color-bg-tertiary)',
              borderColor: favoriteFilter ? '#fbbf24' : 'var(--color-border)',
              color: favoriteFilter ? '#fbbf24' : 'var(--color-text-secondary)',
            }}
            title={favoriteFilter ? 'Show all' : 'Favorites only'}
          >★</button>

          {/* Grid / list toggle */}
          <div className="flex h-10 items-center rounded-xl border p-0.5" style={{ background: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)' }}>
            <button type="button" onClick={() => { setViewMode('grid'); localStorage.setItem('view-mode', 'grid') }}
              className="flex h-full items-center rounded-lg px-2.5 text-xs"
              style={{ background: viewMode === 'grid' ? 'var(--color-bg-card)' : 'transparent', color: viewMode === 'grid' ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
            >▦</button>
            <button type="button" onClick={() => { setViewMode('list'); localStorage.setItem('view-mode', 'list') }}
              className="flex h-full items-center rounded-lg px-2.5 text-xs"
              style={{ background: viewMode === 'list' ? 'var(--color-bg-card)' : 'transparent', color: viewMode === 'list' ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
            >☰</button>
          </div>
        </div>

        {/* Mobile filter button */}
        <div className="relative shrink-0 md:hidden">
          <button
            type="button"
            onClick={e => { e.stopPropagation(); setShowMobileFilters(v => !v) }}
            className="flex items-center gap-1.5 rounded-2xl border px-3.5 py-2.5 text-sm font-medium"
            style={{
              background: hasFilters ? 'rgba(42,187,247,0.08)' : 'var(--color-bg-tertiary)',
              borderColor: hasFilters ? 'var(--color-accent)' : 'var(--color-border)',
              color: hasFilters ? 'var(--color-accent)' : 'var(--color-text-secondary)',
            }}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 8h10M11 12h2" /></svg>
            Filters
          </button>
          {hasFilters && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); clearFilters() }}
              className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold leading-none z-10"
              style={{ background: 'var(--color-accent)', color: 'var(--color-bg-primary)' }}
            >✕</button>
          )}
          <AnimatePresence>
          {showMobileFilters && (
            <motion.div
              key="mobile-filters"
              initial={{ opacity: 0, scaleY: 0.8, scaleX: 0.95, y: -10 }}
              animate={{ opacity: 1, scaleY: 1, scaleX: 1, y: 0 }}
              exit={{ opacity: 0, scaleY: 0.8, scaleX: 0.95, y: -10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{ transformOrigin: 'top right', background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
              className="absolute right-0 top-[calc(100%+8px)] z-20 w-64 rounded-2xl border p-3 shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex flex-col gap-3">
                {/* Fav */}
                <button onClick={() => setFavoriteFilter(v => !v)}
                  className="w-full flex items-center justify-between rounded-2xl border px-3 py-2.5 text-sm font-medium"
                  style={{ background: favoriteFilter ? 'rgba(251,191,36,0.1)' : 'var(--color-bg-card)', borderColor: favoriteFilter ? '#fbbf24' : 'var(--color-border)', color: favoriteFilter ? '#fbbf24' : 'var(--color-text-secondary)' }}
                >
                  <span>★ Favorites only</span>
                  {favoriteFilter && <span className="text-xs">✓</span>}
                </button>

                {/* Collection — z-10 so its panel renders above sort */}
                {collections.length > 0 && (
                  <Select value={collectionFilter} onChange={setCollectionFilter}
                    options={[{ value: '', label: 'All collections' }, ...collections.map(col => ({ value: col.id, label: col.name, color: col.color }))]}
                    fullWidth
                    className="z-10"
                  />
                )}

                {/* Sort */}
                <Select
                  value={`${sortField}-${sortOrder}`}
                  onChange={val => { const [f, o] = val.split('-'); setSortField(f as SortField); setSortOrder(o as SortOrder) }}
                  options={[
                    { value: 'created_at-desc', label: 'Newest' },
                    { value: 'created_at-asc', label: 'Oldest' },
                    { value: 'updated_at-desc', label: 'Updated' },
                    { value: 'title-asc', label: 'A – Z' },
                    { value: 'title-desc', label: 'Z – A' },
                  ]}
                  fullWidth
                />

                {/* View */}
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setViewMode('grid'); localStorage.setItem('view-mode', 'grid') }}
                    className="flex-1 rounded-xl border py-2.5 text-xs font-medium"
                    style={{ background: viewMode === 'grid' ? 'rgba(42,187,247,0.1)' : 'var(--color-bg-card)', borderColor: viewMode === 'grid' ? 'var(--color-accent)' : 'var(--color-border)', color: viewMode === 'grid' ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
                  >▦ Grid</button>
                  <button type="button" onClick={() => { setViewMode('list'); localStorage.setItem('view-mode', 'list') }}
                    className="flex-1 rounded-xl border py-2.5 text-xs font-medium"
                    style={{ background: viewMode === 'list' ? 'rgba(42,187,247,0.1)' : 'var(--color-bg-card)', borderColor: viewMode === 'list' ? 'var(--color-accent)' : 'var(--color-border)', color: viewMode === 'list' ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
                  >☰ List</button>
                </div>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>

      {/* Batch actions */}
      {selectMode && selectedIds.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border p-3" style={{ background: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)' }}>
          <button onClick={() => setSelectedIds(new Set(links.map(l => l.id)))} className="rounded-lg px-4 py-2 text-sm font-medium" style={{ background: 'var(--color-bg-card)', color: 'var(--color-text-secondary)' }}>Select all</button>
          <button onClick={() => setSelectedIds(new Set())} className="rounded-lg px-4 py-2 text-sm font-medium" style={{ background: 'var(--color-bg-card)', color: 'var(--color-text-secondary)' }}>Clear</button>
          <button onClick={handleBatchDelete} className="ml-auto rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>Delete selected</button>
          <Select
            value=""
            onChange={val => val && handleBatchCollection(val === 'null' ? null : val)}
            options={[
              { value: '', label: 'Move to...' },
              { value: 'null', label: 'No collection' },
              ...collections.map(col => ({ value: col.id, label: col.name, color: col.color }))
            ]}
            size="md"
            width={144}
          />
        </div>
      )}

      {/* ── Content ── */}
      {isLoading ? (
        <SkeletonGrid count={6} />
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-lg mb-4" style={{ color: 'var(--color-error)' }}>Failed to load links</p>
          <button onClick={() => refetch()} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--color-accent)', color: 'white' }}>Retry</button>
        </div>
      ) : links.length === 0 ? (
        hasFilters ? <NoResultsEmpty onClearFilters={clearFilters} /> : <NoLinksEmpty />
      ) : viewMode === 'grid' ? (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {links.map((link, index) => (
            <div key={link.id} className="w-full min-w-0 animate-fade-in" style={{ animationDelay: `${index * 40}ms` }}>
              <LinkCard
                link={link}
                onDeleted={() => deleteWithUndo(link)}
                onUpdated={done}
                collections={collections}
                selectable={selectMode}
                selected={selectedIds.has(link.id)}
                onSelect={() => toggleSelect(link.id)}
                onToggleFavorite={() => toggleFavorite.mutate(link.id)}
              />
            </div>
          ))}
        </div>
      ) : (
        /* ── List view ── */
        <div className="flex flex-col gap-1.5">
          {links.map((link, index) => (
            <motion.div
              key={link.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28, delay: index * 0.028 }}
            >
              <LinkCard
                link={link}
                viewMode="list"
                onDeleted={() => deleteWithUndo(link)}
                onUpdated={done}
                collections={collections}
                selectable={selectMode}
                selected={selectedIds.has(link.id)}
                onSelect={() => toggleSelect(link.id)}
                onToggleFavorite={() => toggleFavorite.mutate(link.id)}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
