import { motion } from 'framer-motion'
import { Plus } from '@phosphor-icons/react'
import type { CSSProperties } from 'react'
import type { Collection } from '@/lib/api'

interface Props {
  collections: Collection[]
  onSelect: (collectionId: string) => void
  onManage: () => void
}

export function CollectionGallery({ collections, onSelect, onManage }: Props) {
  return (
    <section className="pt-8" aria-label="Collections">
      <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((collection, index) => (
          <motion.button
            key={collection.id}
            type="button"
            onClick={() => onSelect(collection.id)}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.055, duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -6 }}
            whileTap={{ scale: 0.985 }}
            className="collection-tile group relative text-left"
            style={{ background: 'transparent', border: 'none' }}
          >
            <div className="folder-visual" style={{ '--folder-color': collection.color } as CSSProperties}>
              {(collection.link_count ?? 0) > 0 && (
                <div className="folder-papers"><span /><span /><span /></div>
              )}
              <div className="folder-back" />
              <div className="folder-flap" />
            </div>
            <div className="mt-3 flex items-end justify-between px-1">
              <div>
                <h3 className="truncate text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {collection.name}
                </h3>
                <p className="mt-0.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  {collection.link_count ?? 0} {(collection.link_count ?? 0) === 1 ? 'link' : 'links'}
                </p>
              </div>
              <span className="text-xs font-bold" style={{ color: collection.color }}>Open →</span>
            </div>
          </motion.button>
        ))}

        {/* Create new collection tile */}
        <button
          type="button"
          onClick={onManage}
          className="flex min-h-[190px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-5 transition-colors hover:border-[var(--color-accent)]"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
        >
          <Plus size={22} />
          <span className="text-sm font-semibold">New collection</span>
        </button>
      </div>
    </section>
  )
}
