import { useEffect, useState } from 'react'
import { subscribeToasts, type ToastPayload } from '@/lib/toast'

const colors = { default: '#64748b', success: '#16a34a', error: '#dc2626', warning: '#d97706', info: '#2563eb' }

export function ToastProvider() {
  const [items, setItems] = useState<Array<ToastPayload & { id: number }>>([])
  useEffect(() => subscribeToasts(payload => {
    const id = Date.now() + Math.random()
    setItems(current => [...current.slice(-4), { ...payload, id }])
    window.setTimeout(() => setItems(current => current.filter(item => item.id !== id)), 4000)
  }), [])
  const dismiss = (id: number) => setItems(current => current.filter(item => item.id !== id))
  return <div className="pointer-events-none fixed bottom-5 right-5 z-[9999] flex w-[min(380px,calc(100vw-24px))] flex-col gap-3 max-sm:bottom-3 max-sm:right-3">
    {items.map(item => <div key={item.id} role="status" className="toast-enter pointer-events-auto overflow-hidden rounded-[18px] border bg-white/95 p-3 shadow-2xl backdrop-blur-xl dark:bg-zinc-900/95" style={{ borderColor: `${colors[item.kind]}35` }}>
      <div className="flex items-center gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-bold text-white" style={{ background: colors[item.kind] }}>{item.kind === 'success' ? '✓' : item.kind === 'error' ? '×' : 'i'}</div><p className="min-w-0 flex-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{item.message}</p>{item.action && <button onClick={() => { item.action?.onClick(); dismiss(item.id) }} className="text-sm font-semibold" style={{ color: colors[item.kind] }}>{item.action.label}</button>}<button onClick={() => dismiss(item.id)} aria-label="Close notification" className="text-lg text-zinc-400">×</button></div>
      <div className="toast-progress mt-3 h-1 rounded-full" style={{ background: colors[item.kind] }} />
    </div>)}
  </div>
}
