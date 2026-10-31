import { AccentPicker } from './ui/AccentPicker'
import { Drawer } from './ui/Drawer'

export function ThemeDrawer({ open, onClose, onBack }: { open: boolean; onClose: () => void; onBack: () => void }) {
  return <Drawer open={open} onClose={onClose} onBack={onBack} title="Theme">
    <div className="space-y-4">
      <AccentPicker />
    </div>
  </Drawer>
}
