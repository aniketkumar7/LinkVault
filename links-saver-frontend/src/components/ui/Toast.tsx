import { useEffect, useState } from 'react'
import { subscribeToasts, type ToastPayload } from '@/lib/toast'

const colors = { default: '#64748b', success: '#16a34a', error: '#dc2626', warning: '#d97706', info: '#2563eb' }
const labels = { default: 'Notice', success: 'Success', error: 'Error', warning: 'Warning', info: 'Info' }

export function ToastProvider() {
  const [items, setItems] = useState<Array<ToastPayload & { id: number }>>([])
  useEffect(() => subscribeToasts(payload => {
    const id = Date.now() + Math.random()
    setItems(current => [...current.slice(-4), { ...payload, id }])
    window.setTimeout(() => setItems(current => current.filter(item => item.id !== id)), 4000)
  }), [])
  const dismiss = (id: number) => setItems(current => current.filter(item => item.id !== id))
  return <div className="pointer-events-none fixed left-1/2 top-5 z-[9999] flex w-[min(380px,calc(100vw-24px))] -translate-x-1/2 flex-col gap-3 max-sm:top-3">
    {items.map(item => <div key={item.id} role="status" className="toast-enter pointer-events-auto overflow-hidden rounded-[18px] border bg-zinc-950/95 p-3 shadow-2xl backdrop-blur-xl" style={{ borderColor: `${colors[item.kind]}45` }}>
      <div className="flex items-start gap-3">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold text-zinc-950" style={{ background: colors[item.kind] }}>{item.kind === 'success' ? '✓' : item.kind === 'error' ? '×' : 'i'}</div>
        <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-white">{labels[item.kind]}</p><p className="mt-1 text-sm leading-5 text-zinc-400">{item.message}</p></div>
        {item.action && <button onClick={() => { item.action?.onClick(); dismiss(item.id) }} className="text-sm font-semibold" style={{ color: colors[item.kind] }}>{item.action.label}</button>}
        <button onClick={() => dismiss(item.id)} aria-label="Close notification" className="text-lg leading-none text-zinc-500">×</button>
      </div>
      <div className="toast-progress mt-3 h-1 rounded-full" style={{ background: colors[item.kind] }} />
    </div>)}
  </div>
}
