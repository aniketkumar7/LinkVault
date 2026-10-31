import type { User } from '@supabase/supabase-js'
import { CaretRight, DownloadSimple, PencilSimple, SignOut, Stack, UserCircle, Palette, FolderSimple, SpeakerHigh } from '@phosphor-icons/react'
import { displayName, type ProfileAvatarConfig } from '@/lib/profile'
import { Drawer } from './ui/Drawer'
import { FluidOrbAvatar } from './ui/FluidOrbAvatar'
import { SoundEffectsSwitch } from './ui/SoundEffectsSwitch'

interface AccountDrawerProps {
  open: boolean
  onClose: () => void
  user: User | null
  avatar: ProfileAvatarConfig
  totalLinks?: number
  onEditProfile: () => void
  onEditAvatar: () => void
  onEditTheme: () => void
  onEditFolderStyle: () => void
  onManageCollections?: () => void
  onExportLinks?: () => void
  onSignOut: () => void | Promise<void>
}

export function AccountDrawer({
  open,
  onClose,
  user,
  avatar,
  totalLinks,
  onEditProfile,
  onEditAvatar,
  onEditTheme,
  onEditFolderStyle,
  onManageCollections,
  onExportLinks,
  onSignOut,
}: AccountDrawerProps) {
  return (
    <Drawer open={open} onClose={onClose} eyebrow="Your account" title="Profile & settings">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onEditAvatar} aria-label="Edit avatar" className="group relative block size-14 shrink-0 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" style={{ outlineColor: 'var(--color-accent-fill)' }}>
            <FluidOrbAvatar avatar={avatar} />
            <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full border-2 text-white" style={{ background: 'var(--color-accent-fill)', borderColor: 'var(--color-bg-card)' }}><PencilSimple size={11} weight="bold" /></span>
          </button>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>{displayName(user)}</p>
            <p className="mt-0.5 truncate text-sm" style={{ color: 'var(--color-text-secondary)' }}>{user?.email}</p>
            {totalLinks !== undefined && <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>{totalLinks} saved link{totalLinks === 1 ? '' : 's'}</p>}
          </div>
        </div>

        <nav aria-label="Account actions" className="space-y-1 border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
          <ActionButton icon={<UserCircle size={18} weight="duotone" />} label="Edit profile" onClick={onEditProfile} />
          <ActionButton icon={<Palette size={18} weight="duotone" />} label="Theme" onClick={onEditTheme} />
          <ActionButton icon={<FolderSimple size={18} weight="duotone" />} label="Folder style" onClick={onEditFolderStyle} />
          <div className="flex items-center rounded-xl transition-colors hover:bg-[var(--color-bg-tertiary)]"><SpeakerHigh size={18} weight="duotone" className="ml-3 shrink-0" style={{ color: 'var(--color-text-secondary)' }} /><div className="min-w-0 flex-1"><SoundEffectsSwitch /></div></div>
          {onManageCollections && <ActionButton icon={<Stack size={18} weight="duotone" />} label="Manage collections" onClick={() => { onClose(); onManageCollections() }} />}
          {onExportLinks && <ActionButton icon={<DownloadSimple size={18} weight="duotone" />} label="Export links" onClick={() => { onClose(); onExportLinks() }} />}
          <ActionButton danger icon={<SignOut size={18} weight="duotone" />} label="Sign out" onClick={() => { onClose(); void onSignOut() }} />
        </nav>
      </div>
    </Drawer>
  )
}

function ActionButton({ icon, label, onClick, danger = false }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-[var(--color-bg-tertiary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ color: danger ? 'var(--color-error)' : 'var(--color-text-secondary)', outlineColor: 'var(--color-accent-fill)' }}
    >
      {icon}
      <span className="min-w-0 flex-1">{label}</span>
      {!danger && <CaretRight size={16} style={{ color: 'var(--color-text-muted)' }} />}
    </button>
  )
}
