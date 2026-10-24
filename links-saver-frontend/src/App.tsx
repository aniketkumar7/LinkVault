import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { LandingPage } from '@/components/LandingPage'
import { LoginPage } from '@/components/LoginPage'
import { Home } from '@/components/Home'
import { CollectionPage } from '@/components/CollectionPage'
import CircularThemeProvider from '@/components/CircularThemeProvider'
import PixelPageTransition from '@/components/PixelPageTransition'
import { DotBackground } from '@/components/ui/DotBackground'
import { collectionPath, routeToCollectionId } from '@/lib/smartFolders'
import { takeIncomingShare } from '@/lib/shareTarget'
import type { IncomingShare } from '@/lib/shareTarget'

function AppInner() {
  const { user, loading, isRecoverySession } = useAuth()
  const [showLogin, setShowLogin] = useState(() => window.location.pathname === '/auth')
  const [authSignUp, setAuthSignUp] = useState(() => new URLSearchParams(window.location.search).get('mode') === 'signup')
  const [openCollectionId, setOpenCollectionId] = useState<string | null>(() => routeToCollectionId(window.location.pathname))
  const [pendingShare, setPendingShare] = useState<IncomingShare | null>(null)

  useEffect(() => {
    const search = new URLSearchParams(window.location.search)
    if (search.get('share-target') !== '1') return

    window.history.replaceState({}, '', `${window.location.pathname}${window.location.hash}`)
    void takeIncomingShare()
      .then(setPendingShare)
      .catch(error => console.error('Could not read shared content', error))
  }, [])

  useEffect(() => {
    const onPopState = () => {
      setOpenCollectionId(routeToCollectionId(window.location.pathname))
      setShowLogin(window.location.pathname === '/auth')
      setAuthSignUp(new URLSearchParams(window.location.search).get('mode') === 'signup')
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  // Pixel transition plumbing
  const [trigger, setTrigger] = useState(0)
  const pendingNav = useRef<(() => void) | null>(null)

  const navigate = (action: () => void) => {
    pendingNav.current = action
    setTrigger(t => t + 1)
  }

  const openCollection = (id: string, name?: string) => {
    window.history.pushState({}, '', collectionPath(id, name))
    navigate(() => setOpenCollectionId(id))
  }

  const openAuth = (signUp = false) => {
    window.history.pushState({}, '', signUp ? '/auth?mode=signup' : '/auth')
    setAuthSignUp(signUp)
    navigate(() => setShowLogin(true))
  }

  const handleViewSwap = () => {
    pendingNav.current?.()
    pendingNav.current = null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg-primary)' }}>
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: 'var(--color-accent-fill)' }} />
            <div className="absolute inset-2 rounded-full animate-pulse" style={{ background: 'var(--color-accent-fill)' }} />
            <svg className="absolute inset-0 w-full h-full p-4 text-on-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <p className="animate-pulse" style={{ color: 'var(--color-text-muted)' }}>Loading...</p>
        </div>
      </div>
    )
  }

  const page = (() => {
    if (isRecoverySession) return <LoginPage isRecovery onPasswordUpdated={() => navigate(() => undefined)} />
    if (user) {
      if (openCollectionId) return (
        <CollectionPage
          collectionId={openCollectionId}
          onBack={() => { window.history.pushState({}, '', '/'); navigate(() => setOpenCollectionId(null)) }}
        />
      )
      return <Home
        onOpenCollection={openCollection}
        incomingShare={pendingShare}
        onIncomingShareHandled={() => setPendingShare(null)}
      />
    }
    if (showLogin) return <LoginPage initialSignUp={authSignUp} onBack={() => { window.history.pushState({}, '', '/'); navigate(() => setShowLogin(false)) }} />
    return <LandingPage onGetStarted={openAuth} />
  })()

  return (
    <>
      <PixelPageTransition trigger={trigger} onViewSwap={handleViewSwap} />
      <DotBackground />
      <div className="relative z-[1]">{page}</div>
    </>
  )
}

function App() {
  // useState so App re-renders when theme changes (fixes controlled theme prop)
  const [theme, setTheme] = useState<'dark' | 'light'>(
    () => (localStorage.getItem('theme') as 'dark' | 'light') || 'dark'
  )

  return (
    <CircularThemeProvider
      theme={theme}
      onThemeChange={t => { setTheme(t); localStorage.setItem('theme', t) }}
    >
      <AppInner />
    </CircularThemeProvider>
  )
}

export default App
