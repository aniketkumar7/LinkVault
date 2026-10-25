import { Switch } from '@/components/ui/sensory-ui/switch'
import { useSoundEffects } from '@/components/ui/SoundEffectsProvider'

export function SoundEffectsSwitch() {
  const { enabled, setEnabled } = useSoundEffects()

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Sound effects</p>
        <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>Subtle interface feedback</p>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={setEnabled}
        aria-label="Enable sound effects"
        sound="interaction.toggle"
        volume={0.55}
      />
    </div>
  )
}
