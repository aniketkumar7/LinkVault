import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { Check } from '@phosphor-icons/react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/toast'
import {
  AVATAR_ACCESSORIES,
  AVATAR_DEFAULT_FUR,
  AVATAR_EYES,
  AVATAR_FUR_COLORS,
  AVATAR_MOUTHS,
  NAME_MAX,
  PROFILE_AVATARS,
  profileAvatarConfig,
  profileMetadata,
  type ProfileAvatarConfig,
} from '@/lib/profile'
import { Drawer } from './ui/Drawer'
import { FluidOrbAvatar } from './ui/FluidOrbAvatar'

const inputStyle = { background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }

/** Edit first/last name (stored in Supabase user metadata). */
export function ProfileDrawer({ open, onClose, user }: { open: boolean; onClose: () => void; user: User | null }) {
  return (
    <Drawer open={open} onClose={onClose} eyebrow="Account" title="Edit profile">
      <ProfileForm user={user} onSaved={onClose} />
    </Drawer>
  )
}

function ProfileForm({ user, onSaved }: { user: User | null; onSaved: () => void }) {
  const meta = user?.user_metadata ?? {}
  const legacy = String(meta.full_name || '').trim().split(' ')
  const [first, setFirst] = useState<string>(meta.first_name ?? legacy[0] ?? '')
  const [last, setLast] = useState<string>(meta.last_name ?? legacy.slice(1).join(' '))
  const [avatarConfig, setAvatarConfig] = useState<ProfileAvatarConfig>(() => profileAvatarConfig(user))
  const [saving, setSaving] = useState(false)

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!first.trim() || saving) return
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ data: profileMetadata(first, last, avatarConfig) })
      if (error) throw error
      toast.success('Profile updated')
      onSaved()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Choose a character</legend>
        <p className="mb-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>Start with a buddy, then make it yours.</p>
        <div className="grid grid-cols-4 gap-2.5">
          {PROFILE_AVATARS.map(avatarOption => {
            const selected = avatarConfig.character === avatarOption.id
            return (
              <button
                key={avatarOption.id}
                type="button"
                aria-label={`${avatarOption.label} avatar`}
                aria-pressed={selected}
                onClick={() => setAvatarConfig(current => ({
                  ...current,
                  character: avatarOption.id,
                  furColor: current.character === avatarOption.id ? current.furColor : AVATAR_DEFAULT_FUR[avatarOption.id],
                }))}
                className="group flex min-w-0 flex-col items-center gap-1.5 rounded-xl p-1.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ background: selected ? 'color-mix(in srgb, var(--color-accent-fill) 13%, transparent)' : 'transparent', outlineColor: 'var(--color-accent-fill)' }}
              >
                <span className="relative block h-12 w-12">
                  <FluidOrbAvatar avatar={selected ? avatarConfig : { ...avatarConfig, character: avatarOption.id, furColor: AVATAR_DEFAULT_FUR[avatarOption.id] }} />
                  {selected && (
                    <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full" style={{ background: 'var(--color-accent-fill)', color: 'var(--color-on-accent)' }}>
                      <Check size={12} weight="bold" />
                    </span>
                  )}
                </span>
                <span className="text-[11px] font-medium leading-tight" style={{ color: selected ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>{avatarOption.label}</span>
              </button>
            )
          })}
        </div>
      </fieldset>
      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Customize your buddy</legend>

        <div className="flex items-center gap-3 rounded-xl p-2.5" style={{ background: 'var(--color-bg-tertiary)' }}>
          <span className="block h-14 w-14 shrink-0"><FluidOrbAvatar avatar={avatarConfig} /></span>
          <div className="min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{PROFILE_AVATARS.find(option => option.id === avatarConfig.character)?.label}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Your avatar preview</p>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Fur color</p>
          <div className="flex flex-wrap gap-2.5">
            {AVATAR_FUR_COLORS.map(color => {
              const selected = avatarConfig.furColor === color.value
              return (
                <button
                  key={color.value}
                  type="button"
                  aria-label={`${color.label} fur`}
                  aria-pressed={selected}
                  title={color.label}
                  onClick={() => setAvatarConfig(current => ({ ...current, furColor: color.value }))}
                  className="grid h-7 w-7 place-items-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{ background: color.value, outlineColor: 'var(--color-accent-fill)', boxShadow: selected ? '0 0 0 2px var(--color-bg-card), 0 0 0 4px var(--color-accent-fill)' : 'inset 0 0 0 1px rgba(0,0,0,.12)' }}
                >
                  {selected && <Check size={13} weight="bold" color={color.value === '#E7CFA6' ? '#2B2238' : '#fff'} />}
                </button>
              )
            })}
          </div>
        </div>

        <OptionChips label="Eyes" options={AVATAR_EYES} value={avatarConfig.eyes} onChange={eyes => setAvatarConfig(current => ({ ...current, eyes }))} />
        <OptionChips label="Smile" options={AVATAR_MOUTHS} value={avatarConfig.mouth} onChange={mouth => setAvatarConfig(current => ({ ...current, mouth }))} />
        <OptionChips label="Accessory" options={AVATAR_ACCESSORIES} value={avatarConfig.accessory} onChange={accessory => setAvatarConfig(current => ({ ...current, accessory }))} />
      </fieldset>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>First name</span>
          <input value={first} onChange={e => setFirst(e.target.value)} maxLength={NAME_MAX} required autoComplete="given-name" className="w-full rounded-xl px-3 py-2.5 text-sm" style={inputStyle} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Last name</span>
          <input value={last} onChange={e => setLast(e.target.value)} maxLength={NAME_MAX} autoComplete="family-name" className="w-full rounded-xl px-3 py-2.5 text-sm" style={inputStyle} />
        </label>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Email</span>
        <input value={user?.email ?? ''} disabled className="w-full rounded-xl px-3 py-2.5 text-sm opacity-60" style={inputStyle} />
      </label>
      <button
        type="submit"
        disabled={saving || !first.trim()}
        className="w-full rounded-xl py-3 text-sm font-semibold disabled:opacity-40"
        style={{ background: 'var(--color-accent-fill)', color: 'var(--color-on-accent)' }}
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}

function OptionChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: readonly { id: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="space-y-2 pt-1">
      <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map(option => {
          const selected = value === option.id
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option.id)}
              className="rounded-full px-3 py-2 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                color: selected ? 'var(--color-on-accent)' : 'var(--color-text-secondary)',
                background: selected ? 'var(--color-accent-fill)' : 'var(--color-bg-tertiary)',
                outlineColor: 'var(--color-accent-fill)',
              }}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
