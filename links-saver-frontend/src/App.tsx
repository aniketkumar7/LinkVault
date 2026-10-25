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

  const openCollection = (id: string) => {
    window.history.pushState({}, '', collectionPath(id))
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg-primary)' }} role="status" aria-live="polite">
        <div className="text-center">
          <div className="bookmarky-loading-stage mx-auto mb-4 grid size-[76px] place-items-center" aria-hidden="true">
            <img className="bookmarky-loading-mark h-16 w-16" src="/Logo.svg" alt="" />
          </div>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Getting your bookmarks ready...</p>
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
