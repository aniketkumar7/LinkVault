import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Bell, FolderSimple, LinkSimple, ShieldCheck, ShareNetwork, UserCircle, UploadSimple, X } from '@phosphor-icons/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, NOTIFICATIONS_UPDATED, type AppNotification } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/lib/toast'

const queryKey = (userId: string) => ['notifications', userId] as const

function NotificationIcon({ type }: { type: AppNotification['type'] }) {
  if (type.startsWith('link_')) return <LinkSimple size={17} weight="duotone" />
  if (type.startsWith('collection_')) {
    return type.includes('shared') ? <ShareNetwork size={17} weight="duotone" /> : <FolderSimple size={17} weight="duotone" />
  }
  if (type === 'profile_updated') return <UserCircle size={17} weight="duotone" />
  if (type === 'password_updated') return <ShieldCheck size={17} weight="duotone" />
  return <UploadSimple size={17} weight="duotone" />
}

function timeLabel(value: string) {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime())
  const minutes = Math.floor(elapsed / 60_000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function groupLabel(value: string) {
  const date = new Date(value)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const dayOffset = Math.round((startOfToday - startOfDate) / 86_400_000)
  if (dayOffset <= 0) return 'Today'
  if (dayOffset === 1) return 'Yesterday'
  return 'Earlier this week'
}

function NotificationRow({
  notification,
  onRead,
  onDismiss,
  reduceMotion,
}: {
  notification: AppNotification
  onRead: (item: AppNotification) => void
  onDismiss: (item: AppNotification) => void
  reduceMotion: boolean | null
}) {
  return (
    <motion.article
      layout={!reduceMotion}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 24, height: 0, marginTop: 0 }}
      transition={reduceMotion ? { duration: 0.12 } : { duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      drag={reduceMotion ? false : 'x'}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0.04, right: 0.42 }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 76 || info.velocity.x > 450) onDismiss(notification)
      }}
      className="group relative flex items-start gap-3 rounded-xl px-3 py-3 touch-pan-y"
      style={{ background: notification.read_at ? 'transparent' : 'var(--color-bg-tertiary)' }}
    >
      <span
        className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl"
        style={{ background: 'color-mix(in srgb, var(--color-accent-fill) 18%, var(--color-bg-card))', color: 'var(--color-accent)' }}
        aria-hidden="true"
      >
        <NotificationIcon type={notification.type} />
      </span>

      <button
        type="button"
        onClick={() => onRead(notification)}
        className="min-w-0 flex-1 text-left focus-visible:rounded-md"
        aria-label={`${notification.read_at ? '' : 'Unread: '}${notification.title}. ${notification.message}. ${timeLabel(notification.created_at)}`}
      >
        <span className="flex items-center gap-2">
          <span className="truncate text-[13px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {notification.title}
          </span>
          {!notification.read_at && <span className="size-1.5 shrink-0 rounded-full" style={{ background: 'var(--color-accent-fill)' }} aria-hidden="true" />}
        </span>
        <span className="mt-1 block text-xs leading-[1.45]" style={{ color: 'var(--color-text-secondary)' }}>{notification.message}</span>
        <span className="mt-1.5 block text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{timeLabel(notification.created_at)}</span>
      </button>

      <button
        type="button"
        onPointerDown={event => event.stopPropagation()}
        onClick={() => onDismiss(notification)}
        className="grid size-7 shrink-0 place-items-center rounded-lg opacity-70 transition-colors hover:bg-[var(--color-bg-hover)] hover:opacity-100 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        style={{ color: 'var(--color-text-muted)' }}
        aria-label="Clear notification"
        title="Clear notification"
      >
        <X size={14} weight="bold" aria-hidden="true" />
      </button>
    </motion.article>
  )
}

export function NotificationCenter() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const reduceMotion = useReducedMotion()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [mobilePanelTop, setMobilePanelTop] = useState(0)
  const key = user ? queryKey(user.id) : ['notifications', 'signed-out'] as const
  const { data: notifications = [], isLoading, isError, refetch } = useQuery({
    queryKey: key,
    queryFn: api.getNotifications,
    enabled: Boolean(user),
    staleTime: 20_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })
  const unreadCount = notifications.reduce((count, item) => count + Number(!item.read_at), 0)

  useEffect(() => {
    const refreshNotifications = () => { void refetch() }
    window.addEventListener(NOTIFICATIONS_UPDATED, refreshNotifications)
    return () => window.removeEventListener(NOTIFICATIONS_UPDATED, refreshNotifications)
  }, [refetch])

  const groups = useMemo(() => {
    const result = new Map<string, AppNotification[]>()
    notifications.forEach(item => {
      const label = groupLabel(item.created_at)
      result.set(label, [...(result.get(label) ?? []), item])
    })
    return [...result.entries()]
  }, [notifications])

  useEffect(() => {
    if (!open) return
    const updateMobilePanelPosition = () => {
      const trigger = triggerRef.current
      if (trigger) setMobilePanelTop(Math.ceil(trigger.getBoundingClientRect().bottom + 8))
    }
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', updateMobilePanelPosition)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', updateMobilePanelPosition)
    }
  }, [open])

  const updateCache = (updater: (current: AppNotification[]) => AppNotification[]) => {
    queryClient.setQueryData<AppNotification[]>(key, current => updater(current ?? []))
  }

  const restore = async (ids: string[]) => {
    try {
      await api.restoreNotifications(ids)
      await queryClient.invalidateQueries({ queryKey: key })
    } catch {
      toast.error('Could not restore notifications')
    }
  }

  const dismissOne = async (item: AppNotification) => {
    const previous = notifications
    updateCache(current => current.filter(notification => notification.id !== item.id))
    try {
      await api.dismissNotification(item.id)
      toast('Notification cleared', { action: { label: 'Undo', onClick: () => { void restore([item.id]) } } })
    } catch {
      queryClient.setQueryData(key, previous)
      toast.error('Could not clear notification')
    }
  }

  const dismissAll = async () => {
    if (!notifications.length) return
    const previous = notifications
    updateCache(() => [])
    try {
      const ids = await api.dismissAllNotifications()
      toast.success(`Cleared ${ids.length} notification${ids.length === 1 ? '' : 's'}`, {
        action: { label: 'Undo', onClick: () => { void restore(ids) } },
      })
    } catch {
      queryClient.setQueryData(key, previous)
      toast.error('Could not clear notifications')
    }
  }

  const markRead = async (item: AppNotification) => {
    if (item.read_at) return
    const readAt = new Date().toISOString()
    updateCache(current => current.map(notification => notification.id === item.id ? { ...notification, read_at: readAt } : notification))
    try {
      await api.markNotificationRead(item.id)
    } catch {
      await queryClient.invalidateQueries({ queryKey: key })
      toast.error('Could not update notification')
    }
  }

  const markAllRead = async () => {
    if (!unreadCount) return
    const readAt = new Date().toISOString()
    updateCache(current => current.map(item => item.read_at ? item : { ...item, read_at: readAt }))
    try {
      await api.markAllNotificationsRead()
    } catch {
      await queryClient.invalidateQueries({ queryKey: key })
      toast.error('Could not mark notifications as read')
    }
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          const trigger = triggerRef.current
          if (trigger) setMobilePanelTop(Math.ceil(trigger.getBoundingClientRect().bottom + 8))
          setOpen(value => !value)
        }}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="bookmarky-notifications-panel"
        className="relative grid size-10 shrink-0 place-items-center rounded-2xl border transition-colors hover:bg-[var(--color-bg-hover)] focus-visible:outline-none focus-visible:ring-2"
        style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
      >
        <Bell size={19} weight={unreadCount ? 'fill' : 'regular'} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 grid min-h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-bold" style={{ background: 'var(--color-accent-fill)', color: 'var(--color-on-accent)' }} aria-hidden="true">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.section
            id="bookmarky-notifications-panel"
            role="dialog"
            aria-label="Notifications"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -7, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -5, scale: 0.99 }}
            transition={{ duration: reduceMotion ? 0.12 : 0.17, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-3 right-3 top-[var(--notification-panel-top)] z-[55] flex max-h-[min(72vh,560px)] w-auto origin-top-right flex-col overflow-hidden rounded-2xl border sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[min(390px,calc(100vw-24px))]"
            style={{ '--notification-panel-top': `${mobilePanelTop}px`, background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', boxShadow: '0 8px 28px rgba(0,0,0,0.24)' } as CSSProperties}
          >
            <header className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: 'var(--color-border)' }}>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Notifications</h2>
                <p className="mt-0.5 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                  {unreadCount ? `${unreadCount} unread` : 'You’re all caught up'}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {unreadCount > 0 && (
                  <button type="button" onClick={() => void markAllRead()} className="rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors hover:bg-[var(--color-bg-tertiary)]" style={{ color: 'var(--color-accent)' }}>
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button type="button" onClick={() => void dismissAll()} className="rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors hover:bg-[var(--color-bg-tertiary)]" style={{ color: 'var(--color-text-secondary)' }}>
                    Clear all
                  </button>
                )}
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2" aria-live="polite">
              {isLoading ? (
                <div className="space-y-2 p-2" role="status" aria-label="Loading notifications">
                  {[0, 1, 2].map(index => <div key={index} className="h-[76px] animate-pulse rounded-xl" style={{ background: 'var(--color-bg-tertiary)' }} />)}
                </div>
              ) : isError ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Couldn’t load notifications</p>
                  <button type="button" onClick={() => void refetch()} className="mt-2 text-xs font-semibold" style={{ color: 'var(--color-accent)' }}>Try again</button>
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-5 py-9 text-center">
                  <span className="mx-auto mb-3 grid size-10 place-items-center rounded-2xl" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-muted)' }} aria-hidden="true"><Bell size={18} /></span>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>All caught up</p>
                  <p className="mx-auto mt-1 max-w-[230px] text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>Important import updates will show up here.</p>
                </div>
              ) : (
                groups.map(([label, group]) => (
                  <section key={label} className="mb-2 last:mb-0" aria-label={label}>
                    <h3 className="px-3 pb-1 pt-2 text-[10px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>{label}</h3>
                    <div className="space-y-1">
                      <AnimatePresence initial={false} mode="popLayout">
                        {group.map(notification => (
                          <NotificationRow
                            key={notification.id}
                            notification={notification}
                            onRead={item => { void markRead(item) }}
                            onDismiss={item => { void dismissOne(item) }}
                            reduceMotion={reduceMotion}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </section>
                ))
              )}
            </div>

            <footer className="border-t px-4 py-2 text-center text-[10px]" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
              Automatically cleared after 7 days
            </footer>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}
