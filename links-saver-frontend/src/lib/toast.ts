export type ToastKind = 'default' | 'success' | 'error' | 'warning' | 'info'
export type ToastAction = { label: string; onClick: () => void }
export type ToastPayload = { message: string; kind: ToastKind; action?: ToastAction }
type ToastListener = (payload: ToastPayload) => void
const listeners = new Set<ToastListener>()
const pending: ToastPayload[] = []
export const subscribeToasts = (listener: ToastListener) => {
  listeners.add(listener)
  pending.splice(0).forEach(listener)
  return () => { listeners.delete(listener) }
}
const emit = (message: string, kind: ToastKind, options?: { action?: ToastAction }) => {
  const payload = { message, kind, action: options?.action }
  if (!listeners.size) pending.push(payload)
  listeners.forEach(listener => listener(payload))
}
export const toast = Object.assign(
  (message: string, options?: { action?: ToastAction }) => emit(message, 'default', options),
  {
    success: (message: string, options?: { action?: ToastAction }) => emit(message, 'success', options),
    error: (message: string, options?: { action?: ToastAction }) => emit(message, 'error', options),
    warning: (message: string, options?: { action?: ToastAction }) => emit(message, 'warning', options),
    info: (message: string, options?: { action?: ToastAction }) => emit(message, 'info', options),
  },
)

