import { useDeleteWithUndo, useLinks, useToggleFavorite } from '@/hooks/useLinks'
import type { Collection } from '@/lib/api'
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

/** Last few saved links, one click to reopen. Hidden when there are none. */
export function RecentStrip() {
  const { data: links = [], isLoading } = useLinks({ sort: 'created_at', order: 'desc', limit: 6 })
  if (!isLoading && links.length === 0) return null

  return (
    <section className="mb-10">
      <SectionTitle>Recently saved</SectionTitle>
      <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-[62px] w-56 shrink-0 rounded-2xl shimmer sm:w-auto" />)
          : links.map(link => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex w-56 shrink-0 items-center gap-2.5 rounded-2xl border px-3 py-2.5 transition-colors sm:w-auto"
              style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl" style={{ background: 'var(--color-bg-tertiary)' }}>
                {link.favicon_url
                  ? <img src={link.favicon_url} alt="" className="h-4 w-4 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  : <span className="text-sm font-bold" style={{ color: 'var(--color-text-muted)' }}>{domainOf(link.url).charAt(0).toUpperCase()}</span>}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold group-hover:underline" style={{ color: 'var(--color-text-primary)' }}>{link.title || domainOf(link.url)}</span>
                <span className="block truncate text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{domainOf(link.url)}</span>
              </span>
            </a>
          ))}
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
