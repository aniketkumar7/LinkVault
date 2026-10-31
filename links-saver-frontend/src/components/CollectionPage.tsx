import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useCollections, useInvalidateCollections, useStats } from '@/hooks/useLinks'
import { useCircularTheme } from './CircularThemeProvider'
import { AddLinkForm } from './AddLinkForm'
import { BulkImportModal } from './BulkImportModal'
import { LinksView } from './LinksView'
import { AccountDrawer } from './AccountDrawer'
import { ProfileDrawer } from './ProfileDrawer'
import { AvatarDrawer } from './AvatarDrawer'
import { ThemeDrawer } from './ThemeDrawer'
import { FolderStyleDrawer } from './FolderStyleDrawer'
import { profileAvatarConfig } from '@/lib/profile'
import { SMART_FOLDERS, smartKey } from '@/lib/smartFolders'
import { SkeletonGrid } from './ui/Skeleton'
import { FluidOrbAvatar } from './ui/FluidOrbAvatar'
import { NotificationCenter } from './ui/NotificationCenter'

interface Props {
  collectionId: string
  onBack: () => void
}

export function CollectionPage({ collectionId, onBack }: Props) {
  const { user, signOut } = useAuth()
  const avatar = profileAvatarConfig(user)
  const { data: collections = [], isLoading: collectionsLoading } = useCollections()
  const { data: stats } = useStats()
  const invalidateCollections = useInvalidateCollections()
  const { theme, triggerTransition } = useCircularTheme()

  const [showAccountDrawer, setShowAccountDrawer] = useState(false)
  const [showAddLink, setShowAddLink] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)

  const smart = smartKey(collectionId)
  const smartFolder = SMART_FOLDERS.find(f => f.key === smart)
  const collection = smart ? undefined : collections.find(c => c.id === collectionId || c.name.toLowerCase() === decodeURIComponent(collectionId).toLowerCase())
  const smartCount = smart === 'all' ? stats?.total : smart === 'favorites' ? stats?.favorites : stats?.unsorted
  const header = smartFolder
    ? { name: smartFolder.name, color: smartFolder.color, count: smartCount ?? 0 }
    : collection && { name: collection.name, color: collection.color, count: collection.link_count ?? 0 }
  const [showProfile, setShowProfile] = useState(false)
  const [showAvatar, setShowAvatar] = useState(false)
  const [showTheme, setShowTheme] = useState(false)
  const [showFolderStyle, setShowFolderStyle] = useState(false)

  return (
    <div className="min-h-screen">
      <header className="dot-surface sticky top-0 z-50">
        <div className="page-gutter mx-auto flex items-center justify-between gap-4 py-4">
          {/* Left: back + collection name */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to collections"
              className="flex items-center justify-center rounded-2xl border p-2.5 shrink-0"
              style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
            >
              <svg className="h-4 w-4" style={{ color: 'var(--color-text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {header && (
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-3 w-3 rounded-full shrink-0" style={{ background: header.color }} />
                <h1 className="text-lg font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {header.name}
                </h1>
                <span className="text-sm shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                  {header.count} links
                </span>
              </div>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={e => triggerTransition(e)}
              data-sound="interaction.toggle"
              className="rounded-2xl border p-2.5"
              style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <img src={theme === 'dark' ? '/icons/sun-smile.svg' : '/icons/moon-craters.svg'} alt="" aria-hidden="true" className="h-5 w-5" style={{ color: 'var(--color-text-secondary)' }} />
            </button>

            <NotificationCenter />

            <div>
              <button
                type="button"
                onClick={() => setShowAccountDrawer(true)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl p-0 text-sm font-semibold"
                style={{ background: 'transparent', color: 'var(--color-on-accent)' }}
                aria-label="Open profile and settings"
                aria-haspopup="dialog"
                aria-expanded={showAccountDrawer}
              >
                <FluidOrbAvatar avatar={avatar} className="!rounded-2xl" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="page-gutter mx-auto pt-6 pb-32">
        {smart || collection ? (
          <LinksView
            key={collectionId}
            collections={collections}
            initialCollectionId={smart ? (smart === 'unsorted' ? 'none' : '') : collection!.id}
            initialFavorite={smart === 'favorites'}
            onRefetchNeeded={invalidateCollections}
          />
        ) : collectionsLoading ? (
          <SkeletonGrid count={5} />
        ) : (
          <p className="py-12 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
            This collection could not be found. Go back and open it again.
          </p>
        )}
      </main>

      <div className="capture-dock">
        <button type="button" onClick={() => setShowAddLink(true)} className="capture-primary">+ Add link</button>
        <button type="button" onClick={() => setShowBulkImport(true)} className="capture-secondary">Import links</button>
      </div>

      <AddLinkForm open={showAddLink} onOpenChange={setShowAddLink} onLinkAdded={invalidateCollections} collections={collections} onCollectionCreated={invalidateCollections} avatar={avatar} />
      {showBulkImport && <BulkImportModal onClose={() => setShowBulkImport(false)} onImported={invalidateCollections} collections={collections} avatar={avatar} />}
      <AccountDrawer
        open={showAccountDrawer}
        onClose={() => setShowAccountDrawer(false)}
        user={user}
        avatar={avatar}
        totalLinks={stats?.total}
        onEditProfile={() => { setShowAccountDrawer(false); setShowProfile(true) }}
        onEditAvatar={() => { setShowAccountDrawer(false); setShowAvatar(true) }}
        onEditTheme={() => { setShowAccountDrawer(false); setShowTheme(true) }}
        onEditFolderStyle={() => { setShowAccountDrawer(false); setShowFolderStyle(true) }}
        onSignOut={signOut}
      />
      <ProfileDrawer open={showProfile} onClose={() => setShowProfile(false)} onBack={() => { setShowProfile(false); setShowAccountDrawer(true) }} user={user} />
      <AvatarDrawer open={showAvatar} onClose={() => setShowAvatar(false)} onBack={() => { setShowAvatar(false); setShowAccountDrawer(true) }} user={user} />
      <ThemeDrawer open={showTheme} onClose={() => setShowTheme(false)} onBack={() => { setShowTheme(false); setShowAccountDrawer(true) }} />
      <FolderStyleDrawer open={showFolderStyle} onClose={() => setShowFolderStyle(false)} onBack={() => { setShowFolderStyle(false); setShowAccountDrawer(true) }} />
    </div>
  )
}
