import type { PlaySoundOptions, SoundSource, SoundSynthesizer } from './engine'
import type { SoundCategory, SoundRole } from './sound-roles'

export interface SensoryUIConfig {
  enabled: boolean
  volume: number
  theme: string
  categories: Record<SoundCategory, boolean>
  overrides: Partial<Record<SoundRole, string>>
  reducedMotion: 'inherit' | 'force-off' | 'force-on'
}

export const defaultConfig: SensoryUIConfig = {
  enabled: true,
  volume: 0.35,
  theme: 'soft',
  categories: { interaction: true, overlay: true, navigation: true, notification: true, hero: false },
  overrides: {},
  reducedMotion: 'inherit',
}

export function mergeConfig(user: Partial<SensoryUIConfig>): SensoryUIConfig {
  return {
    ...defaultConfig,
    ...user,
    categories: { ...defaultConfig.categories, ...user.categories },
    overrides: { ...defaultConfig.overrides, ...user.overrides },
  }
}

const tones: Record<SoundRole, [number, number, number]> = {
  'interaction.tap': [510, 0.035, 0.16],
  'interaction.subtle': [440, 0.04, 0.14],
  'interaction.toggle': [620, 0.055, 0.2],
  'interaction.confirm': [740, 0.09, 0.23],
  'overlay.open': [480, 0.06, 0.18],
  'overlay.close': [390, 0.055, 0.17],
  'overlay.expand': [560, 0.07, 0.19],
  'overlay.collapse': [420, 0.07, 0.17],
  'navigation.forward': [560, 0.05, 0.19],
  'navigation.backward': [460, 0.05, 0.18],
  'navigation.tab': [520, 0.035, 0.15],
  'notification.info': [570, 0.11, 0.2],
  'notification.success': [720, 0.13, 0.23],
  'notification.warning': [500, 0.13, 0.21],
  'notification.error': [300, 0.15, 0.24],
  'hero.complete': [820, 0.18, 0.25],
  'hero.milestone': [670, 0.2, 0.25],
}

function synthesize(role: SoundRole): SoundSynthesizer {
  return (context, options: PlaySoundOptions) => {
    const [frequency, duration, peak] = tones[role]
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const start = context.currentTime
    const volume = Math.max(0, Math.min(1, options.volume ?? 1))
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(frequency, start)
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.82, start + duration)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak * volume), start + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.onended = () => options.onEnd?.()
    oscillator.start(start)
    oscillator.stop(start + duration + 0.01)
    return { stop: () => { try { oscillator.stop() } catch { /* Already stopped. */ } } }
  }
}

const sounds = Object.fromEntries(Object.keys(tones).map(role => [role, synthesize(role as SoundRole)])) as Record<SoundRole, SoundSource>

export function resolveRole(role: SoundRole, config: SensoryUIConfig): SoundSource | null {
  const category = role.split('.')[0] as SoundCategory
  if (!config.categories[category]) return null
  return config.overrides[role] ?? sounds[role]
}
