import * as React from 'react'
import { cn } from '@/lib/utils'

type SwitchProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> & {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  size?: 'sm' | 'default'
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { className, checked, defaultChecked = false, onCheckedChange, size = 'default', disabled, onClick, ...props },
  ref,
) {
  const [uncontrolledChecked, setUncontrolledChecked] = React.useState(defaultChecked)
  const isControlled = checked !== undefined
  const isChecked = isControlled ? checked : uncontrolledChecked

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event)
    if (event.defaultPrevented || disabled) return

    const next = !isChecked
    if (!isControlled) setUncontrolledChecked(next)
    onCheckedChange?.(next)
  }

  return (
    <button
      {...props}
      ref={ref}
      type="button"
      role="switch"
      aria-checked={isChecked}
      data-slot="switch"
      data-state={isChecked ? 'checked' : 'unchecked'}
      data-size={size}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        'peer inline-flex shrink-0 items-center rounded-full border border-transparent outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-card)] disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'h-4 w-7' : 'h-6 w-11',
        isChecked ? 'bg-[var(--color-accent-fill)]' : 'bg-[var(--color-border)]',
        className,
      )}
    >
      <span
        data-slot="switch-thumb"
        className={cn(
          'pointer-events-none block rounded-full bg-white shadow-sm transition-transform',
          size === 'sm' ? 'size-3' : 'size-5',
          isChecked ? 'translate-x-[calc(100%-2px)]' : 'translate-x-0',
        )}
      />
    </button>
  )
})

export { Switch }
