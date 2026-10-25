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

interface SoundRecipe {
  wave: OscillatorType
  notes: number[]
  duration: number
  peak: number
  gap?: number
}

// Keep roles recognizably different: taps are single soft pips, navigation and
// overlays move in a direction, while status sounds use short musical phrases.
const recipes: Record<SoundRole, SoundRecipe> = {
  'interaction.tap': { wave: 'sine', notes: [510], duration: 0.035, peak: 0.16 },
  'interaction.subtle': { wave: 'triangle', notes: [430], duration: 0.04, peak: 0.12 },
  'interaction.toggle': { wave: 'triangle', notes: [540, 760], duration: 0.045, peak: 0.15, gap: 0.012 },
  'interaction.confirm': { wave: 'sine', notes: [660, 880], duration: 0.075, peak: 0.18, gap: 0.018 },
  'interaction.type': { wave: 'triangle', notes: [1120], duration: 0.018, peak: 0.09 },
  'overlay.open': { wave: 'sine', notes: [390, 540], duration: 0.055, peak: 0.13, gap: 0.012 },
  'overlay.close': { wave: 'sine', notes: [540, 390], duration: 0.055, peak: 0.12, gap: 0.012 },
  'overlay.expand': { wave: 'triangle', notes: [460, 650], duration: 0.055, peak: 0.13, gap: 0.01 },
  'overlay.collapse': { wave: 'triangle', notes: [650, 460], duration: 0.055, peak: 0.12, gap: 0.01 },
  'navigation.forward': { wave: 'sine', notes: [520, 690], duration: 0.045, peak: 0.14, gap: 0.012 },
  'navigation.backward': { wave: 'sine', notes: [690, 520], duration: 0.045, peak: 0.13, gap: 0.012 },
  'navigation.tab': { wave: 'triangle', notes: [560], duration: 0.032, peak: 0.11 },
  'notification.info': { wave: 'sine', notes: [590, 740], duration: 0.075, peak: 0.16, gap: 0.035 },
  'notification.success': { wave: 'sine', notes: [660, 830, 990], duration: 0.085, peak: 0.19, gap: 0.025 },
  'notification.warning': { wave: 'triangle', notes: [620, 500], duration: 0.09, peak: 0.17, gap: 0.025 },
  'notification.error': { wave: 'triangle', notes: [390, 310], duration: 0.095, peak: 0.18, gap: 0.025 },
  'hero.complete': { wave: 'sine', notes: [660, 830, 990, 1180], duration: 0.095, peak: 0.2, gap: 0.025 },
  'hero.milestone': { wave: 'sine', notes: [590, 740, 880], duration: 0.085, peak: 0.18, gap: 0.03 },
}

function synthesize(role: SoundRole): SoundSynthesizer {
  return (context, options: PlaySoundOptions) => {
    const recipe = recipes[role]
    const volume = Math.max(0, Math.min(1, options.volume ?? 1))
    const oscillators: OscillatorNode[] = []
    const start = context.currentTime
    const gap = recipe.gap ?? 0

    recipe.notes.forEach((frequency, index) => {
      const noteStart = start + index * (recipe.duration + gap)
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = recipe.wave
      oscillator.frequency.setValueAtTime(frequency, noteStart)
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.9, noteStart + recipe.duration)
      gain.gain.setValueAtTime(0.0001, noteStart)
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, recipe.peak * volume), noteStart + Math.min(0.008, recipe.duration / 3))
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + recipe.duration)
      oscillator.connect(gain)
      gain.connect(context.destination)
      if (index === recipe.notes.length - 1) oscillator.onended = () => options.onEnd?.()
      oscillator.start(noteStart)
      oscillator.stop(noteStart + recipe.duration + 0.005)
      oscillators.push(oscillator)
    })

    return {
      stop: () => {
        for (const oscillator of oscillators) {
          try { oscillator.stop() } catch { /* Already stopped. */ }
        }
      },
    }
  }
}

const sounds = Object.fromEntries(Object.keys(recipes).map(role => [role, synthesize(role as SoundRole)])) as Record<SoundRole, SoundSource>

export function resolveRole(role: SoundRole, config: SensoryUIConfig): SoundSource | null {
  const category = role.split('.')[0] as SoundCategory
  if (!config.categories[category]) return null
  return config.overrides[role] ?? sounds[role]
}
