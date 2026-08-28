import { useState } from 'react'
import { LiquidDropdown, LiquidDropdownItem } from './LiquidDropdown'

interface Option {
  value: string
  label: string
  icon?: React.ReactNode
  color?: string
  description?: string
}

interface Props {
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  className?: string
  size?: 'sm' | 'md'
  disabled?: boolean
  width?: number
  fullWidth?: boolean
}

export function Select({
  value, onChange, options,
  placeholder = 'Select…',
  className = '',
  size = 'md',
  disabled = false,
  width,
  fullWidth = false,
}: Props) {
  const [highlighted, setHighlighted] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  const selectedOption = options.find(o => o.value === value)
  const selectedIndex  = Math.max(0, options.findIndex(o => o.value === value))

  // Compute panel height: 36px per item + 8px padding, capped at 146px
  const panelH = Math.min(146, options.length * 36 + 8)

  // Width: explicit prop → size default → undefined (ResizeObserver) when fullWidth
  const tw = fullWidth ? undefined : (width ?? (size === 'sm' ? 160 : 200))

  const triggerLabel = (
    <span style={{
      display: 'flex', alignItems: 'center', gap: 8,
      flex: 1, minWidth: 0,
      color: selectedOption && selectedOption.value !== ''
        ? 'var(--color-text-primary)'
        : 'var(--color-text-muted)',
    }}>
      {selectedOption?.color && (
        <span style={{
          width: 9, height: 9, borderRadius: '50%',
          background: selectedOption.color, flexShrink: 0,
        }} />
      )}
      {selectedOption?.icon}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {selectedOption?.label || placeholder}
      </span>
    </span>
  )

  return (
    <LiquidDropdown
      trigger={triggerLabel}
      width={tw ?? undefined}
      panelHeight={panelH}
      className={className}
      disabled={disabled}
      onOpen={() => { setIsOpen(true); setHighlighted(selectedIndex) }}
      onClose={() => setIsOpen(false)}
      onKeyDown={e => {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setHighlighted(i => Math.min(options.length - 1, i + 1))
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          setHighlighted(i => Math.max(0, i - 1))
        } else if ((e.key === 'Enter' || e.key === ' ') && isOpen) {
          e.preventDefault()
          const opt = options[highlighted]
          if (opt) onChange(opt.value)
        }
      }}
    >
      {options.map((opt, i) => (
        <LiquidDropdownItem
          key={opt.value}
          selected={value === opt.value}
          highlighted={highlighted === i && isOpen}
          icon={opt.icon}
          color={opt.color}
          description={opt.description}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </LiquidDropdownItem>
      ))}
    </LiquidDropdown>
  )
}
