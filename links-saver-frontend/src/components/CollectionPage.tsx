import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useCollections, useInvalidateCollections, useStats } from '@/hooks/useLinks'
import { useCircularTheme } from './CircularThemeProvider'
import { AddLinkForm } from './AddLinkForm'
import { BulkImportModal } from './BulkImportModal'
import { LinksView } from './LinksView'

interface Props {
  collectionId: string
  onBack: () => void
}

export function CollectionPage({ collectionId, onBack }: Props) {
  const { user, signOut } = useAuth()
  const { data: collections = [] } = useCollections()
  const { data: stats } = useStats()
  const invalidateCollections = useInvalidateCollections()
  const { theme, triggerTransition } = useCircularTheme()

  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showAddLink, setShowAddLink] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)

  const collection = collections.find(c => c.id === collectionId || c.name.toLowerCase() === decodeURIComponent(collectionId).toLowerCase())
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
        <div className="mx-auto flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          {/* Left: back + collection name */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center justify-center rounded-2xl border p-2.5 shrink-0"
              style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
            >
              <svg className="h-4 w-4" style={{ color: 'var(--color-text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {collection && (
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-3 w-3 rounded-full shrink-0" style={{ background: collection.color }} />
                <h1 className="text-lg font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {collection.name}
                </h1>
                <span className="text-sm shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                  {collection.link_count ?? 0} links
                </span>
              </div>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
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
                    <p className="mt-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>{stats?.total ?? 0} links saved</p>
                  </div>
                  <motion.button whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }} onClick={() => { setShowProfileMenu(false); signOut() }} className="w-full rounded-xl px-3 py-2.5 text-sm text-left" style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--color-error)' }}>
                    Sign out
                  </motion.button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto px-2 pt-6 pb-32 sm:px-4 lg:px-6">
        <LinksView collections={collections} initialCollectionId={collection?.id || collectionId} onRefetchNeeded={invalidateCollections} />
      </main>

      <div className="capture-dock">
        <button type="button" onClick={() => setShowAddLink(true)} className="capture-primary">+ Add link</button>
        <button type="button" onClick={() => setShowBulkImport(true)} className="capture-secondary">Bulk import</button>
      </div>

      <AddLinkForm open={showAddLink} onOpenChange={setShowAddLink} onLinkAdded={invalidateCollections} existingTags={[]} collections={collections} onCollectionCreated={invalidateCollections} />
      {showBulkImport && <BulkImportModal onClose={() => setShowBulkImport(false)} onImported={invalidateCollections} collections={collections} />}
    </div>
  )
}
