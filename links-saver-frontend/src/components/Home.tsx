import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useCollections, useInvalidateCollections } from '@/hooks/useLinks'
import { useCircularTheme } from './CircularThemeProvider'
import { CollectionManager } from './CollectionManager'
import { AddLinkForm } from './AddLinkForm'
import { BulkImportModal } from './BulkImportModal'
import { Folder } from './Folder'
import { ExportModal } from './ExportModal'

interface Props {
  onOpenCollection: (collectionId: string) => void
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

  const profileName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const profileInitial = profileName.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'var(--color-bg-primary)' }}>
        <div className="mx-auto flex w-full items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
              <img src="/Logo.svg" alt="LinkVault" className="h-8 w-8" />
            </div>
            <h1 className="hidden sm:block text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>LinkVault</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={e => triggerTransition(e)}
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
                onClick={e => { e.stopPropagation(); setShowProfileMenu(v => !v) }}
                className="flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold"
                style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              >
                {profileInitial}
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl border p-3 shadow-xl" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }} onClick={e => e.stopPropagation()}>
                  <div className="mb-3 rounded-xl border px-3 py-2" style={{ background: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)' }}>
                    <p className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Account</p>
                    <p className="mt-0.5 text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{profileName}</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button onClick={() => { setShowCollectionManager(true); setShowProfileMenu(false) }} className="rounded-xl px-3 py-2 text-sm text-left" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                      Manage collections
                    </button>
                    <button onClick={() => { setShowExport(true); setShowProfileMenu(false) }} className="rounded-xl px-3 py-2 text-sm text-left" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                      Export links
                    </button>
                    <button onClick={() => { setShowProfileMenu(false); signOut() }} className="rounded-xl px-3 py-2 text-sm text-left" style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--color-error)' }}>
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto px-4 pt-10 pb-32 sm:px-6 lg:px-8">
        {collections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 opacity-40">
              <Folder color="#3b82f6" hasLinks={false} linkCount={0} width={80} desktopWidth={130} />
            </div>
            <p className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>No collections yet</p>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>Create a collection to start organizing your links.</p>
            <button onClick={() => setShowCollectionManager(true)} className="rounded-2xl px-5 py-2.5 text-sm font-semibold" style={{ background: 'var(--color-accent)', color: 'var(--color-bg-primary)' }}>
              + New collection
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {collections.map((collection, index) => (
              <motion.button
                key={collection.id}
                type="button"
                onClick={() => onOpenCollection(collection.id)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center text-center focus:outline-none group"
              >
                <div className="transition-transform duration-200 group-hover:-translate-y-1">
                  <Folder color={collection.color} hasLinks={(collection.link_count ?? 0) > 0} linkCount={collection.link_count ?? 0} width={80} desktopWidth={130} />
                </div>
                <p className="mt-2 text-sm font-semibold truncate w-full" style={{ color: 'var(--color-text-primary)' }}>
                  {collection.name}
                </p>
              </motion.button>
            ))}

            <motion.button
              type="button"
              onClick={() => setShowCollectionManager(true)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: collections.length * 0.05, duration: 0.35 }}
              className="justify-self-center self-start flex h-[80px] w-[95px] flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed text-center text-sm font-semibold transition-colors hover:border-[var(--color-accent)] sm:h-[105px] sm:w-[160px]"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="leading-tight">New collection</span>
            </motion.button>
          </div>
        )}
      </main>

      <div className="capture-dock">
        <button type="button" onClick={() => setShowAddLink(true)} className="capture-primary">+ Add link</button>
        <button type="button" onClick={() => setShowBulkImport(true)} className="capture-secondary">Bulk import</button>
      </div>

      <CollectionManager open={showCollectionManager} onClose={() => setShowCollectionManager(false)} collections={collections} onChanged={invalidateCollections} />
      <AddLinkForm open={showAddLink} onOpenChange={setShowAddLink} onLinkAdded={invalidateCollections} existingTags={[]} collections={collections} onCollectionCreated={invalidateCollections} />
      {showBulkImport && <BulkImportModal onClose={() => setShowBulkImport(false)} onImported={invalidateCollections} collections={collections} />}
      {showExport && <ExportModal collections={collections} onClose={() => setShowExport(false)} />}
    </div>
  )
}
