import { useState } from 'react'

interface Props {
  onGetStarted: () => void
}

const FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Lightning Fast',
    description: 'Save any link in under 10 seconds. Paste, add a note, done.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Rich Previews',
    description: 'Auto-fetches title, description, and preview images from any website.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
    title: 'Tags & Categories',
    description: 'Organize with tags, categories, and collections. Find anything instantly.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Track Status',
    description: 'Mark links as "To Try", "Tried", or "Useful". Never lose track again.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    ),
    title: 'Share Collections',
    description: 'Create collections and share them with a public link.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    ),
    title: 'Bulk Import & Export',
    description: 'Import multiple links at once. Export to JSON or CSV anytime.',
  },
]

export function LandingPage({ onGetStarted }: Props) {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null)

  return (
    <div className="min-h-screen overflow-hidden" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute -top-1/2 -right-1/2 w-full h-full rounded-full opacity-30 blur-3xl animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 50%)',
            animationDuration: '4s',
          }} 
        />
        <div 
          className="absolute -bottom-1/2 -left-1/2 w-full h-full rounded-full opacity-20 blur-3xl animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, #3b82f6 0%, transparent 50%)',
            animationDuration: '6s',
            animationDelay: '2s',
          }} 
        />
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(var(--color-border) 1px, transparent 1px),
                              linear-gradient(90deg, var(--color-border) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                style={{ 
                  background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-muted) 100%)',
                  boxShadow: '0 0 30px rgba(42, 187, 247, 0.3)',
                }}
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <span className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                LinkVault
              </span>
            </div>
            <button
              onClick={onGetStarted}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-105 active:scale-95"
              style={{
                background: 'var(--color-bg-card)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
              }}
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 pt-16 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-8"
            style={{ 
              background: 'rgba(42, 187, 247, 0.1)',
              border: '1px solid rgba(42, 187, 247, 0.2)',
              color: 'var(--color-accent)',
            }}
          >
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--color-accent)' }} />
            Save links from Reels, Shorts & TikToks
          </div>
          
          <h1 
            className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Never forget a
            <span 
              className="block bg-clip-text text-transparent"
              style={{ 
                backgroundImage: 'linear-gradient(135deg, var(--color-accent) 0%, #06b6d4 50%, var(--color-accent) 100%)',
                backgroundSize: '200% 200%',
                animation: 'gradient 3s ease infinite',
              }}
            >
              useful link
            </span>
            again
          </h1>
          
          <p 
            className="text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Found something cool in a reel? Save it instantly with your personal note. 
            Rich previews, smart organization, and lightning-fast search.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="group px-8 py-4 rounded-2xl font-semibold text-lg text-white transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
              style={{
                background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-muted) 100%)',
                boxShadow: '0 0 40px rgba(42, 187, 247, 0.3)',
              }}
            >
              Get Started Free
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              Everything you need
            </h2>
            <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
              Simple yet powerful features to manage your saved links
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl transition-all duration-300 cursor-default"
                style={{
                  background: hoveredFeature === index ? 'var(--color-bg-card)' : 'transparent',
                  border: `1px solid ${hoveredFeature === index ? 'var(--color-border)' : 'transparent'}`,
                  transform: hoveredFeature === index ? 'translateY(-4px)' : 'translateY(0)',
                  boxShadow: hoveredFeature === index ? 'var(--shadow-card)' : 'none',
                }}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors"
                  style={{ 
                    background: hoveredFeature === index 
                      ? 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-muted) 100%)'
                      : 'var(--color-bg-tertiary)',
                    color: hoveredFeature === index ? 'white' : 'var(--color-accent)',
                  }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-24 px-6">
        <div 
          className="max-w-4xl mx-auto rounded-3xl p-12 text-center"
          style={{ 
            background: 'linear-gradient(135deg, var(--color-bg-card) 0%, var(--color-bg-secondary) 100%)',
            border: '1px solid var(--color-border)',
          }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Start saving links today
          </h2>
          <p className="text-lg mb-8" style={{ color: 'var(--color-text-secondary)' }}>
            Join and never lose a useful link from your feed again.
          </p>
          <button
            onClick={onGetStarted}
            className="px-8 py-4 rounded-2xl font-semibold text-lg text-white transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-muted) 100%)',
              boxShadow: '0 0 40px rgba(42, 187, 247, 0.3)',
            }}
          >
            Get Started — It's Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div 
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--color-accent)' }}
            >
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              LinkVault
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Save links. Remember why. Find them later.
          </p>
        </div>
      </footer>

      {/* CSS for gradient animation */}
      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  )
}

