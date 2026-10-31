import { Check } from '@phosphor-icons/react'
import { FOLDER_STYLES, setFolderStyle, useFolderStyle } from '@/lib/folderStyle'
import { Drawer } from './ui/Drawer'
import { Folder } from './Folder'

export function FolderStyleDrawer({ open, onClose, onBack }: { open: boolean; onClose: () => void; onBack: () => void }) {
  const current = useFolderStyle()
  return <Drawer open={open} onClose={onClose} onBack={onBack} title="Folder style">
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Folder style">
        {FOLDER_STYLES.map(style => {
          const selected = current === style.key
          return <button key={style.key} type="button" role="radio" aria-checked={selected} onClick={() => setFolderStyle(style.key)} className="group flex min-w-0 flex-col rounded-2xl border p-2 text-left transition-transform hover:-translate-y-0.5" style={{ borderColor: selected ? 'var(--color-accent-fill)' : 'var(--color-border)', background: selected ? 'color-mix(in srgb, var(--color-accent-fill) 10%, var(--color-bg-card))' : 'var(--color-bg-card)', boxShadow: selected ? '0 0 0 2px color-mix(in srgb, var(--color-accent-fill) 25%, transparent)' : 'none' }}>
            <span className="grid h-28 w-full place-items-center overflow-hidden rounded-xl" style={{ background: 'var(--color-bg-tertiary)' }}><Folder color="#F5CB5C" hasLinks linkCount={3} width={94} desktopWidth={94} previewStyle={style.key} /></span>
            <span className="mt-2 flex items-center justify-between gap-1 px-1 text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>{style.label}{selected && <Check size={15} weight="bold" style={{ color: 'var(--color-accent)' }} />}</span>
          </button>
        })}
      </div>
    </div>
  </Drawer>
}
