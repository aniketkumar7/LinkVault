import { AccentPicker } from './ui/AccentPicker'
import { Drawer } from './ui/Drawer'
import { FolderStylePicker } from './ui/FolderStylePicker'

export function AppearanceDrawer({ open, onClose, onBack }: { open: boolean; onClose: () => void; onBack: () => void }) {
  return <Drawer open={open} onClose={onClose} title="Appearance" onBack={onBack}>
    <div className="space-y-6">
      <section className="space-y-2" aria-labelledby="appearance-theme-heading">
        <h3 id="appearance-theme-heading" className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Theme and color</h3>
        <AccentPicker />
        <FolderStylePicker />
      </section>
    </div>
  </Drawer>
}
