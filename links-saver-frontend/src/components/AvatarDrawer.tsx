import { useState } from 'react'
import { Check } from '@phosphor-icons/react'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'
import { toast } from '@/lib/toast'
import { AVATAR_ACCESSORIES, AVATAR_DEFAULT_FUR, AVATAR_EYES, AVATAR_FUR_COLORS, AVATAR_MOUTHS, PROFILE_AVATARS, profileAvatarConfig, profileMetadata, type ProfileAvatarConfig } from '@/lib/profile'
import { Drawer } from './ui/Drawer'
import { FluidOrbAvatar } from './ui/FluidOrbAvatar'

export function AvatarDrawer({ open, onClose, onBack, user }: { open: boolean; onClose: () => void; onBack: () => void; user: import('@supabase/supabase-js').User | null }) {
  const [avatar, setAvatar] = useState<ProfileAvatarConfig>(() => profileAvatarConfig(user))
  const [saving, setSaving] = useState(false)
  const meta = user?.user_metadata ?? {}
  const first = String(meta.first_name ?? meta.full_name ?? '').trim().split(' ')[0]
  const last = String(meta.last_name ?? '').trim()
  const isGif = avatar.character.startsWith('vibegif-')

  const save = async () => {
    if (saving) return
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ data: profileMetadata(first, last, avatar) })
      if (error) throw error
      void api.recordProfileUpdate().catch(() => {})
      toast.success('Avatar updated')
      onClose()
    } catch { toast.error('Could not update avatar') } finally { setSaving(false) }
  }

  return <Drawer open={open} onClose={onClose} onBack={onBack} title="Edit avatar">
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-2.5">
        {PROFILE_AVATARS.map(option => {
          const selected = avatar.character === option.id
          return <button key={option.id} type="button" aria-label={`${option.label} avatar`} aria-pressed={selected} onClick={() => setAvatar(current => ({ ...current, character: option.id, furColor: current.character === option.id ? current.furColor : AVATAR_DEFAULT_FUR[option.id] }))} className="group flex min-w-0 flex-col items-center gap-1.5 rounded-xl p-1.5" style={{ background: selected ? 'color-mix(in srgb, var(--color-accent-fill) 13%, transparent)' : 'transparent' }}>
            <span className="relative block h-12 w-12"><FluidOrbAvatar avatar={selected ? avatar : { ...avatar, character: option.id, furColor: AVATAR_DEFAULT_FUR[option.id] }} />{selected && <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full" style={{ background: 'var(--color-accent-fill)', color: 'var(--color-on-accent)' }}><Check size={12} weight="bold" /></span>}</span>
            <span className="text-[11px] font-medium leading-tight" style={{ color: selected ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>{option.label}</span>
          </button>
        })}
      </div>
      <div className="space-y-3 border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{isGif ? 'Circle color' : 'Customize avatar'}</p>
        <ColorPicker value={avatar.furColor} onChange={furColor => setAvatar(current => ({ ...current, furColor }))} label={isGif ? 'Circle color' : 'Fur color'} />
        {!isGif && <><OptionChips label="Eyes" options={AVATAR_EYES} value={avatar.eyes} onChange={eyes => setAvatar(current => ({ ...current, eyes }))} /><OptionChips label="Smile" options={AVATAR_MOUTHS} value={avatar.mouth} onChange={mouth => setAvatar(current => ({ ...current, mouth }))} /><OptionChips label="Accessory" options={AVATAR_ACCESSORIES} value={avatar.accessory} onChange={accessory => setAvatar(current => ({ ...current, accessory }))} /></>}
      </div>
      <button type="button" onClick={() => void save()} disabled={saving} className="w-full rounded-xl py-3 text-sm font-semibold disabled:opacity-40" style={{ background: 'var(--color-accent-fill)', color: 'var(--color-on-accent)' }}>{saving ? 'Saving…' : 'Save avatar'}</button>
    </div>
  </Drawer>
}

function ColorPicker({ value, onChange, label }: { value: string; onChange: (value: ProfileAvatarConfig['furColor']) => void; label: string }) { return <div className="space-y-2"><p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>{label}</p><div className="flex flex-wrap gap-2.5">{AVATAR_FUR_COLORS.map(color => <button key={color.value} type="button" aria-label={`${color.label} ${label.toLowerCase()}`} aria-pressed={value === color.value} onClick={() => onChange(color.value)} className="grid h-7 w-7 place-items-center rounded-full" style={{ background: color.value, boxShadow: value === color.value ? '0 0 0 2px var(--color-bg-card), 0 0 0 4px var(--color-accent-fill)' : 'inset 0 0 0 1px rgba(0,0,0,.12)' }}>{value === color.value && <Check size={13} weight="bold" color="#fff" />}</button>)}</div></div> }
function OptionChips<T extends string>({ label, options, value, onChange }: { label: string; options: readonly { id: T; label: string }[]; value: T; onChange: (value: T) => void }) { return <div className="space-y-2 pt-1"><p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>{label}</p><div className="flex flex-wrap gap-1.5">{options.map(option => <button key={option.id} type="button" aria-pressed={value === option.id} onClick={() => onChange(option.id)} className="rounded-full px-3 py-2 text-xs font-medium" style={{ color: value === option.id ? 'var(--color-on-accent)' : 'var(--color-text-secondary)', background: value === option.id ? 'var(--color-accent-fill)' : 'var(--color-bg-tertiary)' }}>{option.label}</button>)}</div></div> }
