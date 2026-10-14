const cardStyle = { background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }

export function SkeletonCard() {
  return (
    <div className="flex w-full flex-col overflow-hidden rounded-[20px]" style={cardStyle}>
      <div className="h-24 w-full sm:h-[170px] shimmer" />
      <div className="flex flex-col gap-2 px-2.5 pb-1.5 pt-2 sm:px-3.5 sm:pb-2 sm:pt-3">
        <div className="h-3.5 w-3/4 rounded shimmer" />
        <div className="h-2.5 w-full rounded shimmer" />
        <div className="h-2.5 w-2/3 rounded shimmer" />
        <div className="h-4 w-12 rounded-full shimmer" />
      </div>
      <div className="flex items-center justify-between px-2 pb-2 pt-0.5 sm:px-3 sm:pb-3 sm:pt-1">
        <div className="flex gap-1"><div className="h-8 w-8 rounded-xl shimmer" /><div className="h-8 w-8 rounded-xl shimmer" /></div>
        <div className="flex gap-1"><div className="h-8 w-8 rounded-xl shimmer" /><div className="h-8 w-8 rounded-xl shimmer" /></div>
      </div>
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 rounded-2xl p-2.5" style={cardStyle}>
      <div className="h-10 w-14 sm:h-11 sm:w-17 shrink-0 rounded-xl shimmer" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-1/2 rounded shimmer" />
        <div className="h-2.5 w-1/4 rounded shimmer" />
      </div>
    </div>
  )
}

export function SkeletonGrid({ count = 10, viewMode = 'grid' }: { count?: number; viewMode?: 'grid' | 'list' }) {
  const items = Array.from({ length: count })
  if (viewMode === 'list') {
    return <div className="flex flex-col gap-1.5">{items.map((_, i) => <SkeletonRow key={i} />)}</div>
  }
  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      {items.map((_, i) => <SkeletonCard key={i} />)}
    </div>
  )
}
