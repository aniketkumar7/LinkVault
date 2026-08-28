import { useState } from 'react'
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

  const collection = collections.find(c => c.id === collectionId)
  const profileName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const profileInitial = profileName.charAt(0).toUpperCase()

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
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{stats?.total ?? 0} links saved</p>
                  </div>
                  <button onClick={() => { setShowProfileMenu(false); signOut() }} className="w-full rounded-xl px-3 py-2 text-sm text-left" style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--color-error)' }}>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto px-4 pt-6 pb-32 sm:px-6 lg:px-8">
        <LinksView collections={collections} initialCollectionId={collectionId} onRefetchNeeded={invalidateCollections} />
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
