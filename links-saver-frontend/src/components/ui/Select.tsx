import { useState, useRef, useEffect } from 'react'

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
}

export function Select({ value, onChange, options, placeholder = 'Select...', className = '', size = 'md', disabled = false }: Props) {
    const [isOpen, setIsOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    const selectedOption = options.find(o => o.value === value)

    useEffect(() => {
        const onOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false)
        }
        document.addEventListener('mousedown', onOutside)
        return () => document.removeEventListener('mousedown', onOutside)
    }, [])

    useEffect(() => {
        if (!isOpen) return
        const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false) }
        document.addEventListener('keydown', onEsc)
        return () => document.removeEventListener('keydown', onEsc)
    }, [isOpen])

    const pad = size === 'sm' ? 'px-3 py-2 text-xs' : 'px-3.5 py-2.5 text-sm'

    return (
        <div ref={ref} className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full ${pad} rounded-2xl font-medium flex items-center justify-between gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{
                    background: 'var(--color-bg-tertiary)',
                    border: `1px solid ${isOpen ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    color: selectedOption && selectedOption.value !== '' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                }}
            >
                <span className="flex items-center gap-2 truncate min-w-0">
                    {selectedOption?.color && (
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: selectedOption.color }} />
                    )}
                    {selectedOption?.icon}
                    <span className="truncate">{selectedOption?.label || placeholder}</span>
                </span>
                <svg
                    className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    style={{ color: 'var(--color-text-muted)' }}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div
                    className="absolute z-50 w-full mt-1.5 rounded-2xl overflow-hidden max-h-60 overflow-y-auto"
                    style={{
                        background: 'var(--color-bg-card)',
                        border: '1px solid var(--color-border)',
                        boxShadow: '0 16px 40px -8px rgba(0,0,0,0.5)',
                        minWidth: '10rem',
                    }}
                >
                    <div className="py-1.5">
                        {options.map(option => {
                            const active = value === option.value
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => { onChange(option.value); setIsOpen(false) }}
                                    className={`w-full ${pad} text-left flex items-center gap-2.5 transition-colors`}
                                    style={{
                                        background: active ? 'rgba(42,187,247,0.1)' : 'transparent',
                                        color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                                    }}
                                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--color-bg-tertiary)' }}
                                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                                >
                                    {option.color && (
                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: option.color }} />
                                    )}
                                    {option.icon}
                                    <div className="flex-1 min-w-0">
                                        <span className="truncate block">{option.label}</span>
                                        {option.description && (
                                            <span className="text-[11px] truncate block opacity-50">{option.description}</span>
                                        )}
                                    </div>
                                    {active && (
                                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
