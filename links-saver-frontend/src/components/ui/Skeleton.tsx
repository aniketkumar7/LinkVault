export function SkeletonCard() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
    >
      {/* Image skeleton */}
      <div className="aspect-video shimmer" />
      
      {/* Content skeleton */}
      <div className="p-5 space-y-3">
        {/* Title */}
        <div className="h-5 rounded-lg w-3/4 shimmer" />
        {/* Description */}
        <div className="space-y-2">
          <div className="h-3 rounded w-full shimmer" />
          <div className="h-3 rounded w-2/3 shimmer" />
        </div>
        {/* Tags */}
        <div className="flex gap-2">
          <div className="h-6 w-16 rounded-full shimmer" />
          <div className="h-6 w-12 rounded-full shimmer" />
        </div>
        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <div className="h-8 flex-1 rounded-lg shimmer" />
          <div className="h-8 flex-1 rounded-lg shimmer" />
          <div className="h-8 flex-1 rounded-lg shimmer" />
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

