export function SkeletonCard() {
  return (
    <div
      className="rounded-2xl overflow-hidden animate-pulse"
      style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
    >
      {/* Image skeleton */}
      <div className="aspect-video" style={{ background: 'var(--color-bg-tertiary)' }} />
      
      {/* Content skeleton */}
      <div className="p-5 space-y-3">
        {/* Title */}
        <div className="h-5 rounded-lg w-3/4" style={{ background: 'var(--color-bg-tertiary)' }} />
        {/* Description */}
        <div className="space-y-2">
          <div className="h-3 rounded w-full" style={{ background: 'var(--color-bg-tertiary)' }} />
          <div className="h-3 rounded w-2/3" style={{ background: 'var(--color-bg-tertiary)' }} />
        </div>
        {/* Tags */}
        <div className="flex gap-2">
          <div className="h-6 w-16 rounded-full" style={{ background: 'var(--color-bg-tertiary)' }} />
          <div className="h-6 w-12 rounded-full" style={{ background: 'var(--color-bg-tertiary)' }} />
        </div>
        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <div className="h-8 flex-1 rounded-lg" style={{ background: 'var(--color-bg-tertiary)' }} />
          <div className="h-8 flex-1 rounded-lg" style={{ background: 'var(--color-bg-tertiary)' }} />
          <div className="h-8 flex-1 rounded-lg" style={{ background: 'var(--color-bg-tertiary)' }} />
        </div>
      </div>
    </div>
  )
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

