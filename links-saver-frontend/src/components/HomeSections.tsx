import { useCallback, useEffect, useRef, useState } from 'react'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { useDeleteWithUndo, useLinks, useToggleFavorite } from '@/hooks/useLinks'
import type { Collection, Link } from '@/lib/api'
import { SkeletonGrid } from '@/components/ui/Skeleton'
import { LinkCard } from './LinkCard'

function domainOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <h2 className="text-lg font-semibold tracking-[-0.01em] sm:text-xl" style={{ color: 'var(--color-text-primary)' }}>{children}</h2>
      {right}
    </div>
  )
}

function timeAgo(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// Stable tint per domain for cards without a preview image
function domainHue(domain: string) {
  let hash = 0
  for (const char of domain) hash = (hash * 31 + char.charCodeAt(0)) % 360
  return hash
}

function RecentCard({ link }: { link: Link }) {
  const domain = domainOf(link.url)
  const [iconFailed, setIconFailed] = useState(false)
  const hue = domainHue(domain)

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex w-64 shrink-0 snap-start items-center gap-3 rounded-2xl border p-2.5 pr-3.5 transition-colors duration-200 hover:border-[var(--color-border-hover)] hover:bg-[var(--color-bg-hover)]"
      style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
    >
      {/* Favicon on a tile tinted per domain; letter fallback */}
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ background: `hsl(${hue} 45% 50% / 0.16)` }}>
        {link.favicon_url && !iconFailed
          ? <img src={link.favicon_url} alt="" className="h-5 w-5 object-contain" onError={() => setIconFailed(true)} />
          : <span className="text-base font-bold" style={{ color: `hsl(${hue} 50% 58%)` }}>{domain.charAt(0).toUpperCase()}</span>}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold leading-5" style={{ color: 'var(--color-text-primary)' }}>{link.title || domain}</span>
        <span className="flex min-w-0 gap-1 text-[11px] leading-4" style={{ color: 'var(--color-text-muted)' }}>
          <span className="truncate">{domain}</span>
          <span className="shrink-0">· {timeAgo(link.created_at)}</span>
        </span>
      </span>
    </a>
  )
}

function ArrowButton({ direction, disabled, onClick }: { direction: 'prev' | 'next'; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      data-sound="interaction.subtle"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === 'prev' ? 'Scroll back' : 'Scroll forward'}
      className="grid h-8 w-8 place-items-center rounded-full border transition-opacity disabled:opacity-30"
      style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
    >
      {direction === 'prev' ? <CaretLeft size={14} weight="bold" /> : <CaretRight size={14} weight="bold" />}
    </button>
  )
}

/** Recent saves as a swipeable/arrow-paged row, no visible scrollbar. Hidden when empty. */
export function RecentStrip() {
  const { data: links = [], isLoading } = useLinks({ sort: 'created_at', order: 'desc', limit: 12 })
  const scroller = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: true, end: true })

  const updateEdges = useCallback(() => {
    const el = scroller.current
    if (!el) return
    setEdges({ start: el.scrollLeft <= 2, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 })
  }, [])

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    updateEdges()
    const observer = new ResizeObserver(updateEdges)
    observer.observe(el)
    return () => observer.disconnect()
  }, [updateEdges, links.length])

  const page = (direction: 1 | -1) => scroller.current?.scrollBy({ left: direction * scroller.current.clientWidth * 0.85, behavior: 'smooth' })

  if (!isLoading && links.length === 0) return null

  // Fade whichever edge has more cards behind it
  const fade = `linear-gradient(to right, ${edges.start ? '#000' : 'transparent'} 0, #000 40px, #000 calc(100% - 40px), ${edges.end ? '#000' : 'transparent'} 100%)`

  return (
    <section className="mb-10">
      <SectionTitle right={!(edges.start && edges.end) && (
        <div className="hidden gap-1.5 sm:flex">
          <ArrowButton direction="prev" disabled={edges.start} onClick={() => page(-1)} />
          <ArrowButton direction="next" disabled={edges.end} onClick={() => page(1)} />
        </div>
      )}>Recently saved</SectionTitle>
      <div
        ref={scroller}
        onScroll={updateEdges}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pt-1 pb-1 sm:mx-0 sm:scroll-px-0 sm:px-0"
        style={{ maskImage: fade, WebkitMaskImage: fade }}
      >
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-[66px] w-64 shrink-0 rounded-2xl shimmer" />)
          : links.map(link => <RecentCard key={link.id} link={link} />)}
      </div>
    </section>
  )
}

/** Search across every collection; replaces the folder grid while a query is active. */
export function SearchResults({ query, collections, onChanged }: { query: string; collections: Collection[]; onChanged: () => void }) {
  const { data: links = [], isLoading } = useLinks({ search: query })
  const { deleteWithUndo } = useDeleteWithUndo()
  const toggleFavorite = useToggleFavorite()

  return (
    <section>
      <SectionTitle>{isLoading ? 'Searching…' : `${links.length} result${links.length === 1 ? '' : 's'} for “${query}”`}</SectionTitle>
      {isLoading ? (
        <SkeletonGrid count={5} />
      ) : links.length === 0 ? (
        <p className="py-16 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>No links match. Try a word from the title, URL or note.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {links.map(link => (
            <LinkCard
              key={link.id}
              link={link}
              collections={collections}
              onDeleted={() => deleteWithUndo(link)}
              onUpdated={onChanged}
              onToggleFavorite={() => toggleFavorite.mutate(link.id)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
