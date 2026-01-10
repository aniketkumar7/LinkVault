import { useState, useRef, useEffect } from 'react'

interface Option {
    value: string
    label: string
    color?: string
}

interface Props {
    value: string
    onChange: (value: string) => void
    options: Option[]
    placeholder?: string
    className?: string
    size?: 'sm' | 'md'
}

export function Select({ value, onChange, options, placeholder = 'Select...', className = '', size = 'md' }: Props) {
    const [isOpen, setIsOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    const selectedOption = options.find(o => o.value === value)

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelect = (optionValue: string) => {
        onChange(optionValue)
        setIsOpen(false)
    }

    const sizeClasses = size === 'sm'
        ? 'px-3 py-1.5 text-xs'
        : 'px-4 py-3 text-sm'

    return (
        <div ref={ref} className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full ${sizeClasses} rounded-xl font-medium flex items-center justify-between gap-2 transition-all`}
                style={{
                    background: 'var(--color-bg-card)',
                    border: `1px solid ${isOpen ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    color: selectedOption ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                    boxShadow: isOpen ? '0 0 0 3px rgba(42, 187, 247, 0.1)' : 'none',
                }}
            >
                <span className="flex items-center gap-2 truncate">
                    {selectedOption?.color && (
                        <span className="w-2 h-2 rounded-full" style={{ background: selectedOption.color }} />
                    )}
                    {selectedOption?.label || placeholder}
                </span>
                <svg
                    className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    style={{ color: 'var(--color-text-muted)' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div
                    className="absolute z-50 w-full mt-2 py-1 rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
                    style={{
                        background: 'var(--color-bg-card)',
                        border: '1px solid var(--color-border)',
                        boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.5)',
                    }}
                >
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => handleSelect(option.value)}
                            className={`w-full ${sizeClasses} text-left flex items-center gap-2 transition-colors`}
                            style={{
                                background: value === option.value ? 'var(--color-bg-tertiary)' : 'transparent',
                                color: value === option.value ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-tertiary)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = value === option.value ? 'var(--color-bg-tertiary)' : 'transparent'}
                        >
                            {option.color && (
                                <span className="w-2 h-2 rounded-full" style={{ background: option.color }} />
                            )}
                            <span className="truncate">{option.label}</span>
                            {value === option.value && (
                                <svg className="w-4 h-4 ml-auto" style={{ color: 'var(--color-accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

