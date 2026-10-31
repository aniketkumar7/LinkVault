import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'
import { toast } from '@/lib/toast'
import {
  NAME_MAX,
  profileMetadata,
} from '@/lib/profile'
import { Drawer } from './ui/Drawer'

const inputStyle = { background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }

/** Edit first/last name (stored in Supabase user metadata). */
export function ProfileDrawer({ open, onClose, onBack, user }: { open: boolean; onClose: () => void; onBack?: () => void; user: User | null }) {
  return (
    <Drawer open={open} onClose={onClose} eyebrow="Account" title="Edit profile" onBack={onBack}>
      <ProfileForm user={user} onSaved={onClose} />
    </Drawer>
  )
}

function ProfileForm({ user, onSaved }: { user: User | null; onSaved: () => void }) {
  const meta = user?.user_metadata ?? {}
  const legacy = String(meta.full_name || '').trim().split(' ')
  const [first, setFirst] = useState<string>(meta.first_name ?? legacy[0] ?? '')
  const [last, setLast] = useState<string>(meta.last_name ?? legacy.slice(1).join(' '))
  const [saving, setSaving] = useState(false)

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!first.trim() || saving) return
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ data: profileMetadata(first, last) })
      if (error) throw error
      void api.recordProfileUpdate().catch(() => {})
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
