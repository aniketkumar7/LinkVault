import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useCollections, useInvalidateCollections } from '@/hooks/useLinks'
import { useCircularTheme } from './CircularThemeProvider'
import { CollectionManager } from './CollectionManager'
import { AddLinkForm } from './AddLinkForm'
import { BulkImportModal } from './BulkImportModal'
import { Folder } from './Folder'
import { ExportModal } from './ExportModal'
import { AddCollectionModal } from './AddCollectionModal'

interface Props {
  onOpenCollection: (collectionId: string, collectionName?: string) => void
}

export function Home({ onOpenCollection }: Props) {
  const { user, signOut } = useAuth()
  const { data: collections = [] } = useCollections()
  const invalidateCollections = useInvalidateCollections()
  const { theme, triggerTransition } = useCircularTheme()

  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showCollectionManager, setShowCollectionManager] = useState(false)
  const [showAddLink, setShowAddLink] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showAddCollection, setShowAddCollection] = useState(false)

  const profileName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
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
    <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'var(--color-bg-primary)' }}>
        <div className="mx-auto flex w-full items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
              <img src="/Logo.svg" alt="LinkVault" className="h-8 w-8" />
            </div>
            <h1 className="font-brand text-lg sm:text-xl" style={{ color: 'var(--color-text-primary)' }}>LinkVault</h1>
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
                style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)', color: 'var(--color-bg-primary)' }}
              >
                {profileInitial}
              </button>

              {showProfileMenu && (
                <motion.div initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 26 }} className="absolute right-0 mt-2 w-60 origin-top-right rounded-2xl border p-3 shadow-2xl" style={{ background: 'color-mix(in srgb, var(--color-bg-card) 94%, transparent)', borderColor: 'var(--color-border)', backdropFilter: 'blur(18px)' }} onClick={e => e.stopPropagation()}>
                  <div className="mb-3 px-3 py-2">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xs font-bold" style={{ background: 'var(--color-accent)', color: 'var(--color-bg-primary)' }}>{profileInitial}</div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{profileName}</p>
                        <p className="mt-1 truncate text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{user?.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
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

      <main className="mx-auto px-4 pt-8 pb-32 sm:px-6 lg:px-10">
        {collections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 opacity-40">
              <Folder color="#f68330" hasLinks={false} linkCount={0} width={148} desktopWidth={210} />
            </div>
            <p className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>No collections yet</p>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>Create a collection to start organizing your links.</p>
            <button onClick={() => setShowCollectionManager(true)} className="rounded-2xl px-5 py-2.5 text-sm font-semibold" style={{ background: 'var(--color-accent)', color: 'var(--color-bg-primary)' }}>
              + New collection
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 justify-items-center gap-x-1 gap-y-5 sm:grid-cols-4 sm:gap-x-8 sm:gap-y-10 lg:grid-cols-5 lg:gap-x-12 xl:grid-cols-7">
            {collections.map((collection, index) => (
              <motion.button
                key={collection.id}
                type="button"
                onClick={() => onOpenCollection(collection.id, collection.name)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="group flex w-full max-w-[160px] flex-col items-center text-center focus:outline-none md:w-[158px]"
              >
                <div>
                  <Folder color={collection.color} hasLinks={(collection.link_count ?? 0) > 0} linkCount={collection.link_count ?? 0} width={148} desktopWidth={210} />
                </div>
                <p className="mt-1.5 w-full truncate text-[13px] font-semibold tracking-[-0.01em]" style={{ color: 'var(--color-text-primary)' }}>
                  {collection.name}
                </p>
              </motion.button>
            ))}

          </div>
        )}
      </main>

      <div className="capture-dock">
        <button type="button" onClick={() => setShowAddCollection(true)} className="capture-secondary">New collection</button>
        <button type="button" onClick={() => setShowAddLink(true)} className="capture-primary">+ Add link</button>
        <button type="button" onClick={() => setShowBulkImport(true)} className="capture-secondary">Bulk import</button>
      </div>

      <CollectionManager open={showCollectionManager} onClose={() => setShowCollectionManager(false)} collections={collections} onChanged={invalidateCollections} />
      <AddCollectionModal key={showAddCollection ? 'new-open' : 'new-closed'} open={showAddCollection} onClose={() => setShowAddCollection(false)} onCreated={invalidateCollections} />
      <AddLinkForm open={showAddLink} onOpenChange={setShowAddLink} onLinkAdded={invalidateCollections} existingTags={[]} collections={collections} onCollectionCreated={invalidateCollections} />
      {showBulkImport && <BulkImportModal onClose={() => setShowBulkImport(false)} onImported={invalidateCollections} collections={collections} />}
      {showExport && <ExportModal collections={collections} onClose={() => setShowExport(false)} />}
    </div>
  )
}
