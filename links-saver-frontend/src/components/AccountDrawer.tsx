import type { User } from '@supabase/supabase-js'
import { DownloadSimple, SignOut, Stack, UserCircle } from '@phosphor-icons/react'
import { displayName, type ProfileAvatarConfig } from '@/lib/profile'
import { AccentPicker } from './ui/AccentPicker'
import { Drawer } from './ui/Drawer'
import { FluidOrbAvatar } from './ui/FluidOrbAvatar'
import { FolderStylePicker } from './ui/FolderStylePicker'
import { SoundEffectsSwitch } from './ui/SoundEffectsSwitch'

interface AccountDrawerProps {
  open: boolean
  onClose: () => void
  user: User | null
  avatar: ProfileAvatarConfig
  totalLinks?: number
  onEditProfile: () => void
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
  onManageCollections,
  onExportLinks,
  onSignOut,
}: AccountDrawerProps) {
  return (
    <Drawer open={open} onClose={onClose} eyebrow="Your account" title="Profile & settings">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <span className="block size-14 shrink-0"><FluidOrbAvatar avatar={avatar} /></span>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>{displayName(user)}</p>
            <p className="mt-0.5 truncate text-sm" style={{ color: 'var(--color-text-secondary)' }}>{user?.email}</p>
            {totalLinks !== undefined && <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>{totalLinks} saved link{totalLinks === 1 ? '' : 's'}</p>}
          </div>
        </div>

        <section aria-labelledby="account-appearance-heading" className="space-y-2 border-y py-4" style={{ borderColor: 'var(--color-border)' }}>
          <h3 id="account-appearance-heading" className="mb-2 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Appearance</h3>
          <AccentPicker />
          <FolderStylePicker />
        </section>

        <section aria-labelledby="account-sound-heading" className="space-y-2">
          <h3 id="account-sound-heading" className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Sound</h3>
          <div className="rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
            <SoundEffectsSwitch />
          </div>
        </section>

        <nav aria-label="Account actions" className="space-y-1 border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
          <ActionButton icon={<UserCircle size={18} weight="duotone" />} label="Edit profile" onClick={() => { onClose(); onEditProfile() }} />
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
      <span>{label}</span>
    </button>
  )
}
