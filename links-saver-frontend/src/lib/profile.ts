import type { User } from '@supabase/supabase-js'

export const NAME_MAX = 50

/** First name, or null when the user hasn't set one (legacy accounts). */
export function firstName(user: User | null): string | null {
  const meta = user?.user_metadata ?? {}
  const first = String(meta.first_name || '').trim() || String(meta.full_name || '').trim().split(' ')[0]
  return first || null
}

export function displayName(user: User | null): string {
  const meta = user?.user_metadata ?? {}
  const full = [meta.first_name, meta.last_name].filter(Boolean).join(' ').trim() || String(meta.full_name || '').trim()
  return full || user?.email?.split('@')[0] || 'User'
}

export function profileMetadata(first: string, last: string) {
  const first_name = first.trim().slice(0, NAME_MAX)
  const last_name = last.trim().slice(0, NAME_MAX)
  return { first_name, last_name, full_name: [first_name, last_name].filter(Boolean).join(' ') }
}
