import { FOLDER_STYLES, setFolderStyle, useFolderStyle } from '@/lib/folderStyle'

export function FolderStylePicker() {
  const current = useFolderStyle()
  return (
    <div className="px-3 py-2">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Folder style</p>
      <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="Folder style">
        {FOLDER_STYLES.map(s => (
          <button
            key={s.key}
            type="button"
            role="radio"
            aria-checked={current === s.key}
            onClick={() => setFolderStyle(s.key)}
            className="rounded-lg border px-2 py-1.5 text-xs font-medium"
            style={{
              background: current === s.key ? 'var(--color-accent-fill)' : 'var(--color-bg-tertiary)',
              borderColor: current === s.key ? 'var(--color-accent-fill)' : 'var(--color-border)',
              color: current === s.key ? 'var(--color-on-accent)' : 'var(--color-text-secondary)',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
