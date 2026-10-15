import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { queryKeys, useCollections, useStats } from '@/hooks/useLinks'
import type { Collection } from '@/lib/api'
import { normalizeUrl } from '@/lib/url'
import { SMART_FOLDERS, SMART_PREFIX } from '@/lib/smartFolders'
import { RecentStrip, SearchResults, SectionTitle } from './HomeSections'
import { Select } from './ui/Select'
import { useCircularTheme } from './CircularThemeProvider'
import { CollectionManager } from './CollectionManager'
import { AddLinkForm } from './AddLinkForm'
import { BulkImportModal } from './BulkImportModal'
import { Folder } from './Folder'
import { ExportModal } from './ExportModal'
import { AddCollectionModal } from './AddCollectionModal'
import { AccentPicker } from './ui/AccentPicker'
import { ProfileDrawer } from './ProfileDrawer'
import { displayName, firstName } from '@/lib/profile'
import { FolderStylePicker } from './ui/FolderStylePicker'

interface Props {
  onOpenCollection: (collectionId: string, collectionName?: string) => void
}

type FolderSort = 'recent' | 'name' | 'size' | 'newest'

const FOLDER_SORTS: { value: FolderSort; label: string }[] = [
  { value: 'recent', label: 'Recent' },
  { value: 'name', label: 'Name' },
  { value: 'size', label: 'Most links' },
  { value: 'newest', label: 'Newest' },
]

function sortCollections(collections: Collection[], sort: FolderSort) {
  const list = [...collections]
  if (sort === 'name') return list.sort((a, b) => a.name.localeCompare(b.name))
  if (sort === 'size') return list.sort((a, b) => (b.link_count ?? 0) - (a.link_count ?? 0))
  if (sort === 'newest') return list.sort((a, b) => b.created_at.localeCompare(a.created_at))
  // recent: latest saved link first, empty collections fall back to creation date
  return list.sort((a, b) => (b.last_link_at ?? b.created_at).localeCompare(a.last_link_at ?? a.created_at))
}

function isLikelyUrl(text: string) {
  if (!text || text.length > 2048 || /\s/.test(text)) return false
  try {
    return new URL(normalizeUrl(text)).hostname.includes('.')
  } catch {
    return false
  }
}

function greeting() {
  const hour = new Date().getHours()
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
}

export function Home({ onOpenCollection }: Props) {
  const { user, signOut } = useAuth()
  const { data: collections = [] } = useCollections()
  const { data: stats } = useStats()
  const queryClient = useQueryClient()
  // Home shows links, collections and stats together, so refresh all three after changes
  const invalidateCollections = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.collections })
    queryClient.invalidateQueries({ queryKey: ['links'] })
    queryClient.invalidateQueries({ queryKey: queryKeys.stats })
  }
  const { theme, triggerTransition } = useCircularTheme()

  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showCollectionManager, setShowCollectionManager] = useState(false)
  const [showAddLink, setShowAddLink] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showAddCollection, setShowAddCollection] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')
  const [folderSort, setFolderSort] = useState<FolderSort>(() => (localStorage.getItem('folder-sort') as FolderSort) || 'recent')
  const [pastedUrl, setPastedUrl] = useState('')
  const [addLinkKey, setAddLinkKey] = useState(0)
  const searchRef = useRef<HTMLInputElement>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const sortedCollections = useMemo(() => sortCollections(collections, folderSort), [collections, folderSort])
  const smartFolders = SMART_FOLDERS
    .map(f => ({ ...f, count: (f.key === 'all' ? stats?.total : f.key === 'favorites' ? stats?.favorites : stats?.unsorted) ?? 0 }))
    .filter(f => f.key !== 'unsorted' || f.count > 0)

  const handleSearch = (value: string) => {
    setSearchInput(value)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setQuery(value.trim()), 250)
  }

  // Ctrl/Cmd+K focuses search
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Paste a URL anywhere on Home (outside inputs) to save it
  const modalOpen = showAddLink || showBulkImport || showAddCollection || showCollectionManager || showExport
  useEffect(() => {
    if (modalOpen) return
    const onPaste = (event: ClipboardEvent) => {
      if ((event.target as HTMLElement | null)?.closest('input, textarea, [contenteditable="true"]')) return
      const text = event.clipboardData?.getData('text')?.trim() ?? ''
      if (!isLikelyUrl(text)) return
      event.preventDefault()
      setPastedUrl(text)
      setAddLinkKey(k => k + 1)
      setShowAddLink(true)
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [modalOpen])

  const profileName = displayName(user)
  const userFirstName = firstName(user)
  const [showProfile, setShowProfile] = useState(false)
  const profileInitial = profileName.charAt(0).toUpperCase()

  useEffect(() => {
    if (!showProfileMenu) return
    const closeOnOutsideClick = (event: PointerEvent) => {
      const target = event.target as Element
      if (!target.closest('[data-profile-menu]')) setShowProfileMenu(false)
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [showProfileMenu])

  return (
    <div className="min-h-screen">
      <header className="dot-surface sticky top-0 z-30">
        <div className="page-gutter mx-auto flex w-full items-center justify-between gap-4 py-4">
          <div className="flex shrink-0 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
              <img src="/Logo.svg" alt="LinkVault" className="h-8 w-8" />
            </div>
            <h1 className="hidden font-brand text-lg sm:block sm:text-xl" style={{ color: 'var(--color-text-primary)' }}>LinkVault</h1>
          </div>

          <div className="relative min-w-0 flex-1 md:max-w-md">
            <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchRef}
              type="text"
              value={searchInput}
              onChange={e => handleSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') { handleSearch(''); e.currentTarget.blur() } }}
              placeholder="Search all links…"
              aria-label="Search all links"
              className="w-full rounded-2xl border py-2.5 pl-10 pr-14 text-sm"
              style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
            />
            {searchInput ? (
              <button type="button" onClick={() => handleSearch('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-lg leading-none" style={{ color: 'var(--color-text-muted)' }}>×</button>
            ) : (
              <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold sm:block" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>Ctrl K</kbd>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={e => triggerTransition(e)}
              className="rounded-2xl border p-2.5"
              style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <img src={theme === 'dark' ? '/icons/sun-smile.svg' : '/icons/moon-craters.svg'} alt="" aria-hidden="true" className="h-5 w-5" style={{ color: 'var(--color-text-secondary)' }} />
            </button>

            <div className="relative" data-profile-menu>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setShowProfileMenu(v => !v) }}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border text-sm font-semibold"
                style={{ background: 'var(--color-accent-fill)', borderColor: 'var(--color-accent-fill)', color: 'var(--color-on-accent)' }}
              >
                {profileInitial}
              </button>

              {showProfileMenu && (
                <motion.div initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 26 }} className="absolute right-0 mt-2 w-60 origin-top-right rounded-2xl border p-3 shadow-2xl" style={{ background: 'color-mix(in srgb, var(--color-bg-card) 94%, transparent)', borderColor: 'var(--color-border)', backdropFilter: 'blur(18px)' }} onClick={e => e.stopPropagation()}>
                  <div className="mb-3 px-3 py-2">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xs font-bold" style={{ background: 'var(--color-accent-fill)', color: 'var(--color-on-accent)' }}>{profileInitial}</div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{profileName}</p>
                        <p className="mt-1 truncate text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{user?.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mb-2"><AccentPicker /><FolderStylePicker /></div>
                  <div className="flex flex-col gap-1.5">
                    <motion.button whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }} onClick={() => { setShowProfile(true); setShowProfileMenu(false) }} className="rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-[var(--color-bg-tertiary)]" style={{ color: 'var(--color-text-secondary)' }}>
                    Edit profile
                  </motion.button>
                                      <motion.button whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }} onClick={() => { setShowCollectionManager(true); setShowProfileMenu(false) }} className="rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-[var(--color-bg-tertiary)]" style={{ color: 'var(--color-text-secondary)' }}>
                      Manage collections
                    </motion.button>
                    <motion.button whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }} onClick={() => { setShowExport(true); setShowProfileMenu(false) }} className="rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-[var(--color-bg-tertiary)]" style={{ color: 'var(--color-text-secondary)' }}>
                      Export links
                    </motion.button>
                    <motion.button whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }} onClick={() => { setShowProfileMenu(false); signOut() }} className="rounded-xl px-3 py-2.5 text-sm text-left" style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--color-error)' }}>
                      Sign out
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="page-gutter mx-auto pt-8 pb-32">
        {query ? (
          <SearchResults query={query} collections={collections} onChanged={invalidateCollections} />
        ) : (
          <>
            <section className="mb-8">
              <div className="min-w-0">
                <h2 className="text-3xl font-bold tracking-[-0.03em] sm:text-4xl" style={{ color: 'var(--color-text-primary)' }}>
                  {greeting()}{userFirstName && <>, <span style={{ color: 'var(--color-accent)' }}>{userFirstName}</span></>}
                </h2>
                {!userFirstName && (
                  <button type="button" onClick={() => setShowProfile(true)} className="mt-2 text-sm font-medium hover:underline" style={{ color: 'var(--color-accent)' }}>
                    Add your name →
                  </button>
                )}
                <p className="mt-3 hidden items-center gap-2 text-sm md:flex" style={{ color: 'var(--color-text-muted)' }}>
                  <kbd className="rounded-md border px-1.5 py-0.5 text-[10px] font-semibold" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}>Ctrl V</kbd>
                  Paste a link anywhere to save it
                </p>
              </div>
            </section>

            <RecentStrip />

            <SectionTitle right={collections.length > 1 && (
              <Select value={folderSort} onChange={v => { setFolderSort(v as FolderSort); localStorage.setItem('folder-sort', v) }} options={FOLDER_SORTS} size="sm" width={130} />
            )}>Collections</SectionTitle>

            {/* Fixed columns = visible folder width (126px mobile, 179px md+), spread edge to edge */}
            <div className="grid grid-cols-[repeat(auto-fill,126px)] justify-between gap-x-3 gap-y-5 pt-4 md:grid-cols-[repeat(auto-fill,179px)] md:gap-y-10">
              {smartFolders.map((folder, index) => (
                <FolderTile
                  key={folder.key}
                  index={index}
                  name={folder.name}
                  color={folder.color}
                  count={folder.count}
                  onOpen={() => onOpenCollection(SMART_PREFIX + folder.key)}
                />
              ))}
              {sortedCollections.map((collection, index) => (
                <FolderTile
                  key={collection.id}
                  index={smartFolders.length + index}
                  name={collection.name}
                  color={collection.color}
                  count={collection.link_count ?? 0}
                  onOpen={() => onOpenCollection(collection.id, collection.name)}
                />
              ))}
            </div>

            {collections.length === 0 && (
              <div className="mt-10 flex flex-col items-center text-center">
                <p className="mb-2 text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>No collections yet</p>
                <p className="mb-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>Create a collection to start organizing your links.</p>
                <button onClick={() => setShowAddCollection(true)} className="rounded-2xl px-5 py-2.5 text-sm font-semibold" style={{ background: 'var(--color-accent-fill)', color: 'var(--color-on-accent)' }}>
                  + New collection
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <div className="capture-dock">
        <button type="button" onClick={() => setShowAddCollection(true)} className="capture-secondary">New collection</button>
        <button type="button" onClick={() => { setPastedUrl(''); setShowAddLink(true) }} className="capture-primary">+ Add link</button>
        <button type="button" onClick={() => setShowBulkImport(true)} className="capture-secondary">Bulk import</button>
      </div>

      <CollectionManager open={showCollectionManager} onClose={() => setShowCollectionManager(false)} collections={collections} onChanged={invalidateCollections} />
      <AddCollectionModal key={showAddCollection ? 'new-open' : 'new-closed'} open={showAddCollection} onClose={() => setShowAddCollection(false)} onCreated={invalidateCollections} />
      <AddLinkForm key={addLinkKey} initialUrl={pastedUrl} open={showAddLink} onOpenChange={setShowAddLink} onLinkAdded={invalidateCollections} existingTags={[]} collections={collections} onCollectionCreated={invalidateCollections} />
      {showBulkImport && <BulkImportModal onClose={() => setShowBulkImport(false)} onImported={invalidateCollections} collections={collections} />}
      {showExport && <ExportModal collections={collections} onClose={() => setShowExport(false)} />}
      <ProfileDrawer open={showProfile} onClose={() => setShowProfile(false)} user={user} />
    </div>
  )
}

function FolderTile({ index, name, color, count, onOpen }: { index: number; name: string; color: string; count: number; onOpen: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="group flex w-full flex-col items-center text-center focus:outline-none"
    >
      <div>
        <Folder color={color} hasLinks={count > 0} linkCount={count} width={148} desktopWidth={210} />
      </div>
      <p className="mt-1.5 w-full truncate text-[13px] font-semibold tracking-[-0.01em]" style={{ color: 'var(--color-text-primary)' }}>
        {name}
      </p>
    </motion.button>
  )
}

