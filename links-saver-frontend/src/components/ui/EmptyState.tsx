interface Props {
    icon: React.ReactNode
    title: string
    description: string
    action?: {
        label: string
        onClick: () => void
    }
}

export function EmptyState({ icon, title, description, action }: Props) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: 'var(--color-bg-tertiary)' }}
            >
                <div style={{ color: 'var(--color-text-muted)' }}>
                    {icon}
                </div>
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                {title}
            </h3>
            <p className="text-sm max-w-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
                {description}
            </p>
            {action && (
                <button
                    onClick={action.onClick}
                    className="px-6 py-3 rounded-xl font-medium text-white transition-all hover:scale-105"
                    style={{
                        background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-muted) 100%)',
                        boxShadow: 'var(--shadow-glow)',
                    }}
                >
                    {action.label}
                </button>
            )}
        </div>
    )
}

// Pre-built empty states
export function NoLinksEmpty({ onAddLink }: { onAddLink?: () => void }) {
    return (
        <EmptyState
            icon={
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
            }
            title="No links saved yet"
            description="Start saving useful links from YouTube, Medium, websites, and more. They'll appear here with rich previews."
            action={onAddLink ? { label: 'Save your first link', onClick: onAddLink } : undefined}
        />
    )
}

export function NoResultsEmpty({ onClearFilters }: { onClearFilters: () => void }) {
    return (
        <EmptyState
            icon={
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            }
            title="No results found"
            description="Try adjusting your search or filters to find what you're looking for."
            action={{ label: 'Clear filters', onClick: onClearFilters }}
        />
    )
}

export function NoCollectionsEmpty({ onCreateCollection }: { onCreateCollection: () => void }) {
    return (
        <EmptyState
            icon={
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            }
            title="No collections yet"
            description="Create collections to organize your links by topic, project, or anything you like."
            action={{ label: 'Create collection', onClick: onCreateCollection }}
        />
    )
}

