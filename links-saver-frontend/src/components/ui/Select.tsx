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
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false)
        }
        if (isOpen) {
            document.addEventListener('keydown', handleEsc)
            return () => document.removeEventListener('keydown', handleEsc)
        }
    }, [isOpen])

    const handleSelect = (optionValue: string) => {
        onChange(optionValue)
        setIsOpen(false)
    }

    const sizeClasses = size === 'sm'
        ? 'px-3 py-2 text-xs'
        : 'px-4 py-2.5 text-sm'

    return (
        <div ref={ref} className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full ${sizeClasses} rounded-xl font-medium flex items-center justify-between gap-2 transition-all btn-press disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{
                    background: 'var(--color-bg-tertiary)',
                    border: `1px solid ${isOpen ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    color: selectedOption ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                    boxShadow: isOpen ? '0 0 0 3px rgba(42, 187, 247, 0.15)' : 'none',
                }}
            >
                <span className="flex items-center gap-2 truncate">
                    {selectedOption?.icon}
                    {selectedOption?.color && (
                        <span className="w-3 h-3 rounded-full ring-2 ring-white/20" style={{ background: selectedOption.color }} />
                    )}
                    {selectedOption?.label || placeholder}
                </span>
                <svg
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
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
                    className="absolute z-50 w-full mt-1.5 py-1.5 rounded-xl overflow-hidden animate-scale-in max-h-64 overflow-y-auto"
                    style={{
                        background: 'var(--color-bg-card)',
                        border: '1px solid var(--color-border)',
                        boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.6)',
                    }}
                >
                    {options.map((option, index) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => handleSelect(option.value)}
                            className={`w-full ${sizeClasses} text-left flex items-center gap-2.5 transition-all`}
                            style={{
                                background: value === option.value ? 'var(--color-accent)' : 'transparent',
                                color: value === option.value ? 'white' : 'var(--color-text-secondary)',
                                animationDelay: `${index * 20}ms`,
                            }}
                            onMouseEnter={(e) => {
                                if (value !== option.value) {
                                    e.currentTarget.style.background = 'var(--color-bg-tertiary)'
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (value !== option.value) {
                                    e.currentTarget.style.background = 'transparent'
                                }
                            }}
                        >
                            {option.icon}
                            {option.color && (
                                <span 
                                    className="w-3 h-3 rounded-full shrink-0 ring-2" 
                                    style={{ 
                                        background: option.color,
                                    }} 
                                />
                            )}
                            <div className="flex-1 min-w-0">
                                <span className="truncate block">{option.label}</span>
                                {option.description && (
                                    <span className="text-xs truncate block opacity-60">{option.description}</span>
                                )}
                            </div>
                            {value === option.value && (
                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

