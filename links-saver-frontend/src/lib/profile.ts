import type { User } from '@supabase/supabase-js'

export const NAME_MAX = 50

export const PROFILE_AVATARS = [
  { id: 'penguin', label: 'Penguin' },
  { id: 'fox', label: 'Fox' },
  { id: 'cat', label: 'Cat' },
  { id: 'bear', label: 'Bear' },
  { id: 'bunny', label: 'Bunny' },
  { id: 'frog', label: 'Frog' },
  { id: 'owl', label: 'Owl' },
  { id: 'chick', label: 'Chick' },
  { id: 'lion', label: 'Lion' },
  { id: 'tiger', label: 'Tiger' },
  { id: 'elephant', label: 'Elephant' },
  { id: 'rhino', label: 'Rhino' },
  { id: 'monkey', label: 'Monkey' },
  { id: 'vibegif-owl', label: 'Animated owl' },
  { id: 'vibegif-redpanda', label: 'Animated red panda' },
  { id: 'vibegif-foxgirl', label: 'Animated fox girl' },
  { id: 'vibegif-fish', label: 'Animated fish' },
  { id: 'vibegif-jellyfish', label: 'Animated jellyfish' },
  { id: 'vibegif-cactus', label: 'Animated cactus' },
  { id: 'vibegif-mushroom', label: 'Animated mushroom' },
  { id: 'vibegif-seaturtle', label: 'Animated sea turtle' },
  { id: 'vibegif-butterfly', label: 'Animated butterfly' },
  { id: 'vibegif-peacock', label: 'Animated peacock' },
] as const

export type ProfileAvatarId = (typeof PROFILE_AVATARS)[number]['id']
export const DEFAULT_PROFILE_AVATAR: ProfileAvatarId = 'penguin'

export const AVATAR_FUR_COLORS = [
  { label: 'Tangerine', value: '#F68330' },
  { label: 'Berry', value: '#D96B79' },
  { label: 'Lilac', value: '#8A76C6' },
  { label: 'Ocean', value: '#4F87B8' },
  { label: 'Mint', value: '#5D9B7B' },
  { label: 'Cocoa', value: '#94674D' },
  { label: 'Midnight', value: '#45445E' },
  { label: 'Cream', value: '#E7CFA6' },
] as const

export type AvatarFurColor = (typeof AVATAR_FUR_COLORS)[number]['value']
export const AVATAR_DEFAULT_FUR: Record<ProfileAvatarId, AvatarFurColor> = {
  penguin: '#F68330', fox: '#D96B79', cat: '#8A76C6', bear: '#94674D',
  bunny: '#D96B79', frog: '#5D9B7B', owl: '#4F87B8', chick: '#E7CFA6',
  lion: '#F68330', tiger: '#F68330', elephant: '#4F87B8', rhino: '#45445E', monkey: '#94674D',
  'vibegif-owl': '#4F87B8', 'vibegif-redpanda': '#D96B79', 'vibegif-foxgirl': '#D96B79', 'vibegif-fish': '#4F87B8',
  'vibegif-jellyfish': '#8A76C6', 'vibegif-cactus': '#5D9B7B', 'vibegif-mushroom': '#D96B79', 'vibegif-seaturtle': '#5D9B7B',
  'vibegif-butterfly': '#8A76C6', 'vibegif-peacock': '#4F87B8',
}
export const AVATAR_EYES = [
  { id: 'open', label: 'Open' },
  { id: 'happy', label: 'Happy' },
  { id: 'wink', label: 'Wink' },
  { id: 'sleepy', label: 'Sleepy' },
  { id: 'heart', label: 'Heart' },
] as const
export type AvatarEyes = (typeof AVATAR_EYES)[number]['id']
export const AVATAR_MOUTHS = [
  { id: 'smile', label: 'Smile' },
  { id: 'open', label: 'Open' },
  { id: 'flat', label: 'Neutral' },
  { id: 'tongue', label: 'Tongue' },
] as const
export type AvatarMouth = (typeof AVATAR_MOUTHS)[number]['id']
export const AVATAR_ACCESSORIES = [
  { id: 'none', label: 'None' },
  { id: 'glasses', label: 'Glasses' },
  { id: 'cap', label: 'Cap' },
  { id: 'bow', label: 'Bow' },
] as const
export type AvatarAccessory = (typeof AVATAR_ACCESSORIES)[number]['id']

export interface ProfileAvatarConfig {
  character: ProfileAvatarId
  furColor: AvatarFurColor
  eyes: AvatarEyes
  mouth: AvatarMouth
  accessory: AvatarAccessory
}

export const DEFAULT_AVATAR_CONFIG: ProfileAvatarConfig = {
  character: DEFAULT_PROFILE_AVATAR,
  furColor: '#F68330',
  eyes: 'open',
  mouth: 'smile',
  accessory: 'none',
}

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

export function profileAvatarConfig(user: User | null): ProfileAvatarConfig {
  const stored = user?.user_metadata?.avatar_config
  const legacyCharacter = user?.user_metadata?.avatar_id
  const hash = user?.id
    ? Array.from(user.id).reduce((value, character) => (value * 31 + character.charCodeAt(0)) >>> 0, 7)
    : 0
  const defaultCharacter = PROFILE_AVATARS[hash % PROFILE_AVATARS.length].id
  const character = PROFILE_AVATARS.some(avatar => avatar.id === stored?.character)
    ? stored.character as ProfileAvatarId
    : PROFILE_AVATARS.some(avatar => avatar.id === legacyCharacter)
      ? legacyCharacter as ProfileAvatarId
      : defaultCharacter

  return {
    character,
    furColor: AVATAR_FUR_COLORS.some(color => color.value === stored?.furColor)
      ? stored.furColor as AvatarFurColor
      : AVATAR_DEFAULT_FUR[character],
    eyes: AVATAR_EYES.some(option => option.id === stored?.eyes)
      ? stored.eyes as AvatarEyes
      : DEFAULT_AVATAR_CONFIG.eyes,
    mouth: AVATAR_MOUTHS.some(option => option.id === stored?.mouth)
      ? stored.mouth as AvatarMouth
      : DEFAULT_AVATAR_CONFIG.mouth,
    accessory: AVATAR_ACCESSORIES.some(option => option.id === stored?.accessory)
      ? stored.accessory as AvatarAccessory
      : DEFAULT_AVATAR_CONFIG.accessory,
  }
}

export function profileMetadata(first: string, last: string, avatar?: ProfileAvatarConfig) {
  const first_name = first.trim().slice(0, NAME_MAX)
  const last_name = last.trim().slice(0, NAME_MAX)
  return {
    first_name,
    last_name,
    full_name: [first_name, last_name].filter(Boolean).join(' '),
    ...(avatar ? { avatar_id: avatar.character, avatar_config: avatar } : {}),
  }
}
