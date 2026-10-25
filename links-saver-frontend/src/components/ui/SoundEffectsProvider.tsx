import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { SensoryUIProvider } from '@/lib/provider'
import { useSensoryUI } from '@/lib/provider'
import { playSound as playAudio } from '@/lib/engine'
import { mergeConfig, resolveRole } from '@/lib/config'
import { ALL_SOUND_ROLES, type SoundRole } from '@/lib/sound-roles'

const STORAGE_KEY = 'linkvault:sound-effects'

const SoundEffectsContext = createContext<{
  enabled: boolean
  setEnabled: (enabled: boolean) => void
} | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useSoundEffects() {
  const context = useContext(SoundEffectsContext)
  if (!context) throw new Error('useSoundEffects must be used inside SoundEffectsProvider')
  return context
}

function isSoundRole(value: string): value is SoundRole {
  return (ALL_SOUND_ROLES as readonly string[]).includes(value)
}

function GlobalSoundFeedback() {
  const { playSound, enabled } = useSensoryUI()

  useEffect(() => {
    if (!enabled) return

    const handleClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return

      const control = event.target.closest<HTMLElement>(
        'a[href], button, [role="button"], [role="menuitem"], [role="tab"], summary, [data-sound-target]',
      )
      if (!control || control.matches(':disabled, [aria-disabled="true"]')) return

      const explicitRole = control.dataset.sound
      if (explicitRole === 'off' || explicitRole === 'managed') return

      let role: SoundRole = 'interaction.tap'
      if (explicitRole && isSoundRole(explicitRole)) {
        role = explicitRole
      } else if (control.matches('a[href]')) {
        role = 'navigation.forward'
      } else if (control.getAttribute('role') === 'tab') {
        role = 'navigation.tab'
      } else if (control.hasAttribute('aria-haspopup')) {
        role = control.getAttribute('aria-expanded') === 'true' ? 'overlay.close' : 'overlay.open'
      } else if (control.matches('[aria-pressed], [role="switch"]')) {
        role = 'interaction.toggle'
      } else if (control.matches('button[type="submit"]')) {
        role = 'interaction.confirm'
      }

      void playSound(role, { volume: 0.7 })
    }

    const handleChange = (event: Event) => {
      const control = event.target
      if (!(control instanceof HTMLSelectElement || control instanceof HTMLInputElement)) return
      if (control instanceof HTMLInputElement && !['checkbox', 'radio', 'range'].includes(control.type)) return
      if (control.matches(':disabled, [aria-disabled="true"]')) return

      const explicitRole = control.dataset.sound
      if (explicitRole === 'off' || explicitRole === 'managed') return
      const role = explicitRole && isSoundRole(explicitRole) ? explicitRole : 'interaction.toggle'
      void playSound(role, { volume: 0.7 })
    }

    document.addEventListener('click', handleClick, true)
    document.addEventListener('change', handleChange, true)
    return () => {
      document.removeEventListener('click', handleClick, true)
      document.removeEventListener('change', handleChange, true)
    }
  }, [enabled, playSound])

  return null
}

export function SoundEffectsProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  const setEnabled = (next: boolean) => {
    // Give immediate confirmation on the enabling gesture, even though the
    // provider is intentionally muted until this preference changes.
    if (next) {
      const soundConfig = mergeConfig({ enabled: true, theme: 'soft', volume: 0.32, reducedMotion: 'force-on' })
      const source = resolveRole('interaction.toggle', soundConfig)
      if (source) void playAudio(source, { volume: soundConfig.volume * 0.55 })
    }
    setEnabledState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next))
    } catch {
      // The preference still applies for this session when storage is unavailable.
    }
  }

  return (
    <SoundEffectsContext.Provider value={{ enabled, setEnabled }}>
      <SensoryUIProvider config={{ enabled, theme: 'soft', volume: 0.32, reducedMotion: 'force-on' }}>
        <GlobalSoundFeedback />
        {children}
      </SensoryUIProvider>
    </SoundEffectsContext.Provider>
  )
}
