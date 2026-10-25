import { createContext, useContext, useState, type ReactNode } from 'react'
import { SensoryUIProvider } from '@/lib/provider'

const STORAGE_KEY = 'linkvault:sound-effects'

const SoundEffectsContext = createContext<{
  enabled: boolean
  setEnabled: (enabled: boolean) => void
} | null>(null)

export function useSoundEffects() {
  const context = useContext(SoundEffectsContext)
  if (!context) throw new Error('useSoundEffects must be used inside SoundEffectsProvider')
  return context
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
    setEnabledState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next))
    } catch {
      // The preference still applies for this session when storage is unavailable.
    }
  }

  return (
    <SoundEffectsContext.Provider value={{ enabled, setEnabled }}>
      <SensoryUIProvider config={{ enabled, theme: 'soft', volume: 0.2 }}>
        {children}
      </SensoryUIProvider>
    </SoundEffectsContext.Provider>
  )
}
