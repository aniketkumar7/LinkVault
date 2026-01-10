import { useState, useEffect, useMemo, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { jsPDF } from 'jspdf'
import { useAuth } from '@/hooks/useAuth'
import { useLinks, useCollections, useStats, useDeleteWithUndo, useBatchActions, useToggleFavorite } from '@/hooks/useLinks'
import type { LinkFilters } from '@/lib/api'
import { toast } from '@/lib/toast'
import { SkeletonGrid } from '@/components/ui/Skeleton'
import { NoLinksEmpty, NoResultsEmpty } from '@/components/ui/EmptyState'
import { AddLinkForm } from './AddLinkForm'
import { LinkCard } from './LinkCard'
import { BulkImportModal } from './BulkImportModal'
import { CollectionsPanel } from './CollectionsPanel'

type Theme = 'dark' | 'light'
type SortField = 'created_at' | 'updated_at' | 'title'
type SortOrder = 'asc' | 'desc'

export function Dashboard() {
  const { signOut } = useAuth()
  const parentRef = useRef<HTMLDivElement>(null)
  
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
  const [showCollections, setShowCollections] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  
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
  const { deleteWithUndo } = useDeleteWithUndo()
  const { batchDelete, batchMoveToCollection } = useBatchActions()
  const toggleFavorite = useToggleFavorite()

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
        setMobileFiltersOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Virtualization for large lists
  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(links.length / 3),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 420,
    overscan: 2,
  })

  // Derived data
  const allTags = useMemo(() => [...new Set(links.flatMap(l => l.tags))], [links])
  const hasFilters = search || tagFilter || favoriteFilter || collectionFilter

  const clearFilters = () => {
    setSearchInput('')
    setSearch('')
    setTagFilter('')
    setFavoriteFilter(false)
    setCollectionFilter('')
  }

  const handleExportPDF = async () => {
    setExporting(true)
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      
      // Header
      doc.setFontSize(20)
      doc.setTextColor(42, 187, 247) // accent color
      doc.text('LinkVault Export', 14, 20)
      
      doc.setFontSize(10)
      doc.setTextColor(128, 128, 128)
      doc.text(`Exported on ${new Date().toLocaleDateString()}`, 14, 28)
      doc.text(`Total: ${links.length} links`, 14, 34)
      
      let y = 45
      const lineHeight = 7
      const maxWidth = pageWidth - 28
      
      links.forEach((link, index) => {
        // Check if we need a new page
        if (y > 270) {
          doc.addPage()
          y = 20
        }
        
        // Link number and title
        doc.setFontSize(11)
        doc.setTextColor(0, 0, 0)
        const title = `${index + 1}. ${link.title || 'Untitled'}`
        const titleLines = doc.splitTextToSize(title, maxWidth)
        doc.text(titleLines, 14, y)
        y += titleLines.length * lineHeight
        
        // URL
        doc.setFontSize(9)
        doc.setTextColor(42, 187, 247)
        const urlLines = doc.splitTextToSize(link.url, maxWidth)
        doc.text(urlLines, 14, y)
        y += urlLines.length * lineHeight
        
        // Note (if exists)
        if (link.note) {
          doc.setTextColor(100, 100, 100)
          const noteLines = doc.splitTextToSize(`Note: ${link.note}`, maxWidth)
          doc.text(noteLines, 14, y)
          y += noteLines.length * lineHeight
        }
        
        // Tags
        if (link.tags.length > 0) {
          doc.setTextColor(150, 150, 150)
          doc.text(`Tags: ${link.tags.join(', ')}`, 14, y)
          y += lineHeight
        }
        
        // Separator
        y += 4
        doc.setDrawColor(230, 230, 230)
        doc.line(14, y, pageWidth - 14, y)
        y += 8
      })
      
      // Save
      doc.save(`linkvault-export-${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success('Exported as PDF')
    } catch (err) {
      console.error('PDF export failed:', err)
      toast.error('Export failed')
    } finally {
      setExporting(false)
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

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ 
        background: 'var(--color-bg-primary)', 
        borderBottom: '1px solid var(--color-border)' 
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                <img src="/Logo.svg" alt="LinkVault" className="w-10 h-10" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>LinkVault</h1>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {stats?.total ?? links.length} links saved
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Theme toggle */}
              <button
                onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg transition-colors"
                style={{ background: 'var(--color-bg-tertiary)' }}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? (
                  <svg className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {/* User menu */}
              <button
                onClick={signOut}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Add Link Form */}
        <AddLinkForm 
          onLinkAdded={() => refetch()} 
          existingTags={allTags}
          collections={collections}
        />

        {/* Toolbar */}
        <div className="mt-8 mb-6 space-y-4">
          {/* Search + Actions row */}
          <div className="flex flex-wrap gap-3">
            {/* Search */}
            <div className="flex-1 min-w-64 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                data-search-input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search links... (⌘/)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all"
                style={{
                  background: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowBulkImport(true)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                <span className="hidden sm:inline">Bulk Import</span>
                <span className="sm:hidden">Import</span>
              </button>
              <button
                onClick={() => setShowCollections(true)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                Collections
              </button>
              <button
                onClick={handleExportPDF}
                disabled={exporting || links.length === 0}
                className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                {exporting ? 'Exporting...' : 'Export PDF'}
              </button>
            </div>
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* Mobile filter toggle */}
            <button
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="sm:hidden px-3 py-2 rounded-lg text-sm"
              style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              Filters {hasFilters && '•'}
            </button>

            {/* Filter chips - hidden on mobile unless open */}
            <div className={`${mobileFiltersOpen ? 'flex' : 'hidden'} sm:flex flex-wrap gap-2 w-full sm:w-auto`}>
              {collections.length > 0 && (
                <select value={collectionFilter} onChange={(e) => setCollectionFilter(e.target.value)} className="px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                  <option value="">All Collections</option>
                  {collections.map(col => <option key={col.id} value={col.id}>{col.name}</option>)}
                </select>
              )}

              {allTags.length > 0 && (
                <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} className="px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                  <option value="">All Tags</option>
                  {allTags.map(tag => <option key={tag} value={tag}>#{tag}</option>)}
                </select>
              )}

              <button
                onClick={() => setFavoriteFilter(!favoriteFilter)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${favoriteFilter ? 'text-white' : ''}`}
                style={{ 
                  background: favoriteFilter ? 'var(--color-accent)' : 'var(--color-bg-card)', 
                  border: '1px solid var(--color-border)',
                  color: favoriteFilter ? 'white' : 'var(--color-text-secondary)',
                }}
              >
                ★ Favorites
              </button>

              <select value={`${sortField}-${sortOrder}`} onChange={(e) => { const [f, o] = e.target.value.split('-'); setSortField(f as SortField); setSortOrder(o as SortOrder) }} className="px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                <option value="created_at-desc">Newest first</option>
                <option value="created_at-asc">Oldest first</option>
                <option value="updated_at-desc">Recently updated</option>
                <option value="title-asc">Title A-Z</option>
                <option value="title-desc">Title Z-A</option>
              </select>

              {hasFilters && (
                <button onClick={clearFilters} className="px-3 py-2 rounded-lg text-sm" style={{ color: 'var(--color-accent)' }}>
                  Clear filters
                </button>
              )}
            </div>

            {/* Batch mode toggle */}
            <button
              onClick={() => { setSelectMode(!selectMode); setSelectedIds(new Set()) }}
              className={`ml-auto px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectMode ? 'text-white' : ''}`}
              style={{ 
                background: selectMode ? 'var(--color-accent)' : 'var(--color-bg-card)', 
                border: '1px solid var(--color-border)',
                color: selectMode ? 'white' : 'var(--color-text-secondary)',
              }}
            >
              {selectMode ? `${selectedIds.size} selected` : 'Select'}
            </button>
          </div>

          {/* Batch actions bar */}
          {selectMode && selectedIds.size > 0 && (
            <div className="flex flex-wrap gap-2 p-3 rounded-xl animate-slide-up" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
              <button onClick={selectAll} className="px-3 py-1.5 rounded-lg text-xs" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>Select All</button>
              <button onClick={deselectAll} className="px-3 py-1.5 rounded-lg text-xs" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>Deselect All</button>
              <div className="w-px mx-2" style={{ background: 'var(--color-border)' }} />
              <select onChange={(e) => e.target.value && handleBatchCollection(e.target.value === 'null' ? null : e.target.value)} className="px-3 py-1.5 rounded-lg text-xs" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                <option value="">Move to collection...</option>
                <option value="null">No collection</option>
                {collections.map(col => <option key={col.id} value={col.id}>{col.name}</option>)}
              </select>
              <button onClick={handleBatchDelete} className="px-3 py-1.5 rounded-lg text-xs ml-auto" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>Delete Selected</button>
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
        ) : links.length <= 30 ? (
          // Regular grid for small lists
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {links.map((link, index) => (
              <div 
                key={link.id} 
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
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
        ) : (
          // Virtualized grid for large lists
          <div ref={parentRef} className="h-[calc(100vh-400px)] overflow-auto">
            <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const startIndex = virtualRow.index * 3
                const rowLinks = links.slice(startIndex, startIndex + 3)
                return (
                  <div
                    key={virtualRow.index}
                    className="absolute top-0 left-0 w-full grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                    style={{ transform: `translateY(${virtualRow.start}px)` }}
                  >
                    {rowLinks.map((link) => (
                      <LinkCard
                        key={link.id}
                        link={link}
                        onDeleted={() => deleteWithUndo(link)}
                        onUpdated={() => refetch()}
                        collections={collections}
                        selectable={selectMode}
                        selected={selectedIds.has(link.id)}
                        onSelect={() => toggleSelect(link.id)}
                        onToggleFavorite={() => toggleFavorite.mutate(link.id)}
                      />
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {showBulkImport && (
        <BulkImportModal 
          onClose={() => setShowBulkImport(false)} 
          onImported={() => refetch()}
          collections={collections}
        />
      )}

      {showCollections && (
        <CollectionsPanel 
          onClose={() => setShowCollections(false)}
          onCollectionChange={() => refetch()}
        />
      )}
    </div>
  )
}
