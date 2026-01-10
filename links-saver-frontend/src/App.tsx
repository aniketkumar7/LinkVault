import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { LandingPage } from '@/components/LandingPage'
import { LoginPage } from '@/components/LoginPage'
import { Dashboard } from '@/components/Dashboard'

function App() {
  const { user, loading } = useAuth()
  const [showLogin, setShowLogin] = useState(false)

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg-primary)' }}>
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div 
              className="absolute inset-0 rounded-full animate-ping opacity-20"
              style={{ background: 'var(--color-accent)' }}
            />
            <div 
              className="absolute inset-2 rounded-full animate-pulse"
              style={{ background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-muted) 100%)' }}
            />
            <svg className="absolute inset-0 w-full h-full p-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <p className="animate-pulse" style={{ color: 'var(--color-text-muted)' }}>Loading...</p>
        </div>
      </div>
    )
  }

  // Authenticated → show dashboard
  if (user) {
    return <Dashboard />
  }

  // Show login page
  if (showLogin) {
    return <LoginPage onBack={() => setShowLogin(false)} />
  }

  // Show landing page
  return <LandingPage onGetStarted={() => setShowLogin(true)} />
}

export default App
