import { useState, useEffect, useMemo, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { jsPDF } from 'jspdf'
import { useAuth } from '@/hooks/useAuth'
import { useLinks, useCollections, useStats, useDeleteWithUndo, useBatchActions, useToggleFavorite, useInvalidateCollections } from '@/hooks/useLinks'
import type { LinkFilters } from '@/lib/api'
import { api } from '@/lib/api'
import { toast } from '@/lib/toast'
import { Dialog } from '@/components/ui/Dialog'
import { SkeletonGrid } from '@/components/ui/Skeleton'
import { NoLinksEmpty, NoResultsEmpty } from '@/components/ui/EmptyState'
import { AddLinkForm } from './AddLinkForm'
import { LinkCard } from './LinkCard'
import { BulkImportModal } from './BulkImportModal'
import { Select } from './ui/Select'

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
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportCollectionId, setExportCollectionId] = useState<string>('')
  const [exporting, setExporting] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  
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
    setShowExportModal(false)
    
    try {
      // Filter links by selected collection
      const exportLinks = exportCollectionId 
        ? links.filter(l => l.collection_id === exportCollectionId)
        : links
      
      const exportCollectionName = exportCollectionId 
        ? collections.find(c => c.id === exportCollectionId)?.name || 'Collection'
        : 'All Links'
      
      if (exportLinks.length === 0) {
        toast.error('No links to export')
        setExporting(false)
        return
      }
      
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 15
      const contentWidth = pageWidth - margin * 2
      
      // Colors
      const accent: [number, number, number] = [42, 187, 247]
      const dark: [number, number, number] = [15, 23, 42]
      const muted: [number, number, number] = [100, 116, 139]
      const light: [number, number, number] = [241, 245, 249]
      
      // === COVER PAGE ===
      // Gradient header simulation
      doc.setFillColor(15, 23, 42)
      doc.rect(0, 0, pageWidth, pageHeight, 'F')
      
      // Accent circle decoration
      doc.setFillColor(...accent)
      doc.circle(pageWidth - 30, 40, 60, 'F')
      doc.setFillColor(6, 182, 212)
      doc.circle(30, pageHeight - 50, 40, 'F')
      
      // Title
      doc.setFontSize(42)
      doc.setTextColor(255, 255, 255)
      doc.text('LinkVault', margin + 5, 60)
      
      doc.setFontSize(16)
      doc.setTextColor(...accent)
      doc.text(exportCollectionName, margin + 5, 75)
      
      // Stats box
      const boxY = 100
      doc.setFillColor(30, 41, 59)
      doc.roundedRect(margin, boxY, contentWidth, 50, 5, 5, 'F')
      
      // Stats
      const statWidth = contentWidth / 3
      doc.setFontSize(32)
      doc.setTextColor(...accent)
      doc.text(String(exportLinks.length), margin + statWidth * 0.5, boxY + 28, { align: 'center' })
      doc.text(String(exportLinks.filter(l => l.is_favorite).length), margin + statWidth * 1.5, boxY + 28, { align: 'center' })
      doc.text(String(new Set(exportLinks.flatMap(l => l.tags)).size), margin + statWidth * 2.5, boxY + 28, { align: 'center' })
      
      doc.setFontSize(10)
      doc.setTextColor(148, 163, 184)
      doc.text('Links', margin + statWidth * 0.5, boxY + 42, { align: 'center' })
      doc.text('Favorites', margin + statWidth * 1.5, boxY + 42, { align: 'center' })
      doc.text('Tags', margin + statWidth * 2.5, boxY + 42, { align: 'center' })
      
      // Date
      doc.setFontSize(11)
      doc.setTextColor(148, 163, 184)
      doc.text(`Exported ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, margin + 5, boxY + 70)
      
      // Decorative line
      doc.setDrawColor(...accent)
      doc.setLineWidth(2)
      doc.line(margin, boxY + 80, margin + 60, boxY + 80)
      
      // === LINK PAGES ===
      doc.addPage()
      doc.setFillColor(255, 255, 255)
      doc.rect(0, 0, pageWidth, pageHeight, 'F')
      
      let y = 20
      const rowHeight = 28
      
      exportLinks.forEach((link, index) => {
        if (y + rowHeight > pageHeight - 20) {
          doc.addPage()
          y = 20
        }
        
        // Alternating row bg
        if (index % 2 === 0) {
          doc.setFillColor(...light)
          doc.rect(margin, y - 5, contentWidth, rowHeight - 2, 'F')
        }
        
        // Number
        doc.setFontSize(9)
        doc.setTextColor(...muted)
        doc.text(String(index + 1).padStart(2, '0'), margin + 5, y + 8)
        
        // Favorite
        if (link.is_favorite) {
          doc.setTextColor(251, 191, 36)
          doc.text('★', margin + 18, y + 8)
        }
        
        // Title
        doc.setFontSize(10)
        doc.setTextColor(...dark)
        const title = (link.title || 'Untitled').substring(0, 50) + (link.title && link.title.length > 50 ? '...' : '')
        doc.text(title, margin + 28, y + 8)
        
        // URL below title
        doc.setFontSize(7)
        doc.setTextColor(...accent)
        const url = link.url.substring(0, 70) + (link.url.length > 70 ? '...' : '')
        doc.text(url, margin + 28, y + 16)
        
        // Tags on right
        if (link.tags.length > 0) {
          doc.setFontSize(7)
          doc.setTextColor(...muted)
          const tagText = link.tags.slice(0, 3).map(t => `#${t}`).join(' ')
          doc.text(tagText, pageWidth - margin - 5, y + 8, { align: 'right' })
        }
        
        y += rowHeight
      })
      
      // Footer on all pages
      const totalPages = doc.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(...muted)
        doc.text('LinkVault', margin, pageHeight - 8)
        doc.text(`${i}/${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' })
      }
      
      // Save
      const filename = exportCollectionId 
        ? `linkvault-${exportCollectionName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`
        : `linkvault-all-${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(filename)
      toast.success(`Exported ${exportLinks.length} links`)
    } catch (err) {
      console.error('PDF export failed:', err)
      toast.error('Export failed')
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
          onCollectionCreated={invalidateCollections}
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
                className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors btn-press"
                style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                <span className="hidden sm:inline">Bulk Import</span>
                <span className="sm:hidden">Import</span>
              </button>
              <button
                onClick={() => setShowExportModal(true)}
                disabled={exporting || links.length === 0}
                className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 btn-press"
                style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                {exporting ? 'Exporting...' : 'Export'}
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
            <div className={`${mobileFiltersOpen ? 'flex' : 'hidden'} sm:flex flex-wrap gap-2 w-full sm:w-auto items-center`}>
              {collections.length > 0 && (
                <div className="flex items-center gap-1">
                  <Select
                    value={collectionFilter}
                    onChange={setCollectionFilter}
                    options={[
                      { value: '', label: 'All Collections', icon: <span className="text-sm">📁</span> },
                      ...collections.map(col => ({ value: col.id, label: col.name, color: col.color }))
                    ]}
                    placeholder="Collection"
                    size="sm"
                    className="min-w-32"
                  />
                  {collectionFilter && (
                    <>
                      <button
                        onClick={() => {
                          const col = collections.find(c => c.id === collectionFilter)
                          if (col) setEditingCollection({ id: col.id, name: col.name })
                        }}
                        className="p-1.5 rounded btn-press"
                        style={{ color: 'var(--color-text-muted)' }}
                        title="Edit collection"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeletingCollectionId(collectionFilter)}
                        className="p-1.5 rounded btn-press"
                        style={{ color: 'var(--color-error)' }}
                        title="Delete collection"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
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
                    { value: '', label: 'All Tags', icon: <span className="text-sm">#</span> },
                    ...allTags.map(tag => ({ value: tag, label: `#${tag}` }))
                  ]}
                  placeholder="Tag"
                  size="sm"
                  className="min-w-32"
                />
              )}

              <button
                onClick={() => setFavoriteFilter(!favoriteFilter)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all btn-press ${favoriteFilter ? 'text-white' : ''}`}
                style={{ 
                  background: favoriteFilter ? 'var(--color-accent)' : 'var(--color-bg-tertiary)', 
                  border: '1px solid var(--color-border)',
                  color: favoriteFilter ? 'white' : 'var(--color-text-secondary)',
                  boxShadow: favoriteFilter ? 'var(--shadow-glow)' : 'none',
                }}
              >
                ★ Favorites
              </button>

              <Select
                value={`${sortField}-${sortOrder}`}
                onChange={(val) => { const [f, o] = val.split('-'); setSortField(f as SortField); setSortOrder(o as SortOrder) }}
                options={[
                  { value: 'created_at-desc', label: 'Newest first', icon: <span className="text-sm">📅</span> },
                  { value: 'created_at-asc', label: 'Oldest first' },
                  { value: 'updated_at-desc', label: 'Recently updated' },
                  { value: 'title-asc', label: 'Title A-Z' },
                  { value: 'title-desc', label: 'Title Z-A' },
                ]}
                size="sm"
                className="min-w-36"
              />

              {hasFilters && (
                <button onClick={clearFilters} className="px-3 py-2 rounded-xl text-sm font-medium btn-press" style={{ color: 'var(--color-accent)', background: 'rgba(42, 187, 247, 0.1)' }}>
                  ✕ Clear
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
              <button onClick={selectAll} className="px-3 py-1.5 rounded-xl text-xs btn-press" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>Select All</button>
              <button onClick={deselectAll} className="px-3 py-1.5 rounded-xl text-xs btn-press" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>Deselect All</button>
              <div className="w-px mx-2 h-6" style={{ background: 'var(--color-border)' }} />
              <Select
                value=""
                onChange={(val) => val && handleBatchCollection(val === 'null' ? null : val)}
                options={[
                  { value: '', label: 'Move to...' },
                  { value: 'null', label: 'No collection' },
                  ...collections.map(col => ({ value: col.id, label: col.name, color: col.color }))
                ]}
                size="sm"
                className="min-w-36"
              />
              <button onClick={handleBatchDelete} className="px-3 py-1.5 rounded-xl text-xs font-medium ml-auto btn-press" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>Delete Selected</button>
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
