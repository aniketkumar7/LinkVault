import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from '@/components/ui/Toast'
import { SoundEffectsProvider } from '@/components/ui/SoundEffectsProvider'
import './index.css'
import App from './App.tsx'

// Apply saved theme + accent before first paint
const root = document.documentElement
root.setAttribute('data-theme', localStorage.getItem('theme') === 'light' ? 'light' : 'dark')
root.setAttribute('data-accent', localStorage.getItem('accent') || 'sun')

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SoundEffectsProvider>
        <App />
        <ToastProvider />
      </SoundEffectsProvider>
    </QueryClientProvider>
  </StrictMode>,
)

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(error => {
      console.error('Could not register LinkVault share target', error)
    })
  })
}
