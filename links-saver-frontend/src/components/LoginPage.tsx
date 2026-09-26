import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowUpRight, LinkSimple, Sparkle } from '@phosphor-icons/react'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/lib/toast'

interface Props {
  onBack?: () => void
  isRecovery?: boolean
  onPasswordUpdated?: () => void
  initialSignUp?: boolean
}

export function LoginPage({ onBack, isRecovery = false, onPasswordUpdated, initialSignUp = false }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(initialSignUp)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const { signInWithEmail, signUp, resetPassword, updatePassword } = useAuth()

  const changeMode = (nextSignUp: boolean) => {
    setIsForgotPassword(false)
    setIsSignUp(nextSignUp)
    setMessage(null)
    if (!isRecovery) window.history.replaceState({}, '', nextSignUp ? '/auth?mode=signup' : '/auth')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isRecovery ? (!password || password.length < 6 || password !== confirmPassword) : (!email.trim() || (!isForgotPassword && !password.trim()))) return

    setLoading(true)
    setMessage(null)

    try {
      if (isRecovery) {
        await updatePassword(password)
        setMessage({ type: 'success', text: 'Your password has been updated.' })
        toast.success('Password updated')
        onPasswordUpdated?.()
      } else if (isForgotPassword) {
        await resetPassword(email.trim())
        toast.success('Password reset email sent')
        setMessage({ type: 'success', text: 'If an account exists for this email, you’ll receive a password reset link shortly.' })
      } else if (isSignUp) {
        const result = await signUp(email.trim(), password)
        if (result.needsConfirmation) {
          toast.success('Confirmation email sent')
          setMessage({ type: 'success', text: 'Account created. Check your inbox and spam folder for the confirmation email, then return here to sign in.' })
        } else {
          toast.success('Account created')
          setMessage({ type: 'success', text: 'Account created and signed in.' })
        }
      } else {
        await signInWithEmail(email.trim(), password)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed'
      setMessage({ type: 'error', text: errorMessage })
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8"
         style={{ background: 'linear-gradient(135deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 50%, var(--color-bg-primary) 100%)' }}>

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20"
             style={{ background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
             style={{ background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 70%)' }} />
      </div>

      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-[30px] border shadow-2xl lg:grid-cols-[.9fr_1.1fr]" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}>
        <motion.aside initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} className="relative hidden overflow-hidden p-10 lg:flex lg:min-h-[680px] lg:flex-col lg:justify-between" style={{ background: 'linear-gradient(145deg, color-mix(in srgb, var(--color-accent) 18%, var(--color-bg-secondary)), var(--color-bg-secondary))' }}>
          <div className="relative z-10"><img src="/Logo.svg" alt="LinkVault" className="h-16 w-16" /><h2 className="mt-8 max-w-sm text-5xl font-semibold leading-[.98] tracking-[-.05em]">Keep the links that keep you moving.</h2><p className="mt-6 max-w-sm text-base leading-7" style={{ color: 'var(--color-text-secondary)' }}>One calm place for articles, videos, tools, screenshots, and the ideas hiding inside your documents.</p></div>
          <div className="relative z-10 space-y-3"><div className="flex items-center gap-3 rounded-2xl border p-3" style={{ borderColor: 'var(--color-border)', background: 'rgba(0,0,0,.12)' }}><span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: 'var(--color-accent)', color: 'var(--color-bg-primary)' }}><LinkSimple size={18} weight="bold" /></span><div><p className="text-sm font-semibold">Capture the thought</p><p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Save the link and why it mattered.</p></div><ArrowUpRight size={17} className="ml-auto" /></div><div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}><Sparkle size={14} style={{ color: 'var(--color-accent)' }} /> Built for curious people with too many tabs.</div></div>
          <svg className="pointer-events-none absolute -bottom-20 -right-24 h-96 w-96 opacity-30" viewBox="0 0 400 400" fill="none"><circle cx="200" cy="200" r="140" stroke="var(--color-accent)" strokeOpacity=".35" strokeDasharray="4 10"><animateTransform attributeName="transform" type="rotate" from="0 200 200" to="360 200 200" dur="24s" repeatCount="indefinite" /></circle><circle cx="200" cy="200" r="92" stroke="var(--color-accent)" strokeOpacity=".25" strokeDasharray="2 8" /></svg>
        </motion.aside>

      <div className="relative p-5 sm:p-10 lg:p-14">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 mb-8 px-4 py-2 rounded-xl transition-all hover:-translate-x-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <ArrowLeft size={18} />
            Back
          </button>
        )}

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 lg:hidden"
               style={{ background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-muted) 100%)', boxShadow: 'var(--shadow-glow)' }}>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h1 className="font-brand text-4xl tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
            LinkVault
          </h1>
          <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
            {isForgotPassword ? 'We’ll help you get back in' : isSignUp ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        <div className="rounded-2xl" style={{ background: 'var(--color-bg-card)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              {!isRecovery && <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Email address
              </label>}
              {!isRecovery && <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl text-base transition-all"
                style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                disabled={loading}
                required
              />}
            </div>

            {(isRecovery || !isForgotPassword) && <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-base transition-all"
                style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                disabled={loading}
                required
                minLength={6}
              />
            </div>}

            {isRecovery && <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Confirm new password</label>
              <input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3 rounded-xl text-base transition-all" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} disabled={loading} required minLength={6} />
            </div>}

            {!isRecovery && !isSignUp && !isForgotPassword && (
              <div className="text-right -mt-1">
                <button
                  type="button"
                  onClick={() => { setIsForgotPassword(true); setMessage(null) }}
                  className="text-sm font-medium hover:underline"
                  style={{ color: 'var(--color-accent)' }}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (isRecovery ? !password || password.length < 6 || password !== confirmPassword : !email.trim() || (!isForgotPassword && !password.trim()))}
              className="w-full py-3 px-4 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: loading ? 'var(--color-border)' : 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-muted) 100%)',
                boxShadow: loading ? 'none' : 'var(--shadow-glow)',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {isRecovery ? 'Updating password...' : isForgotPassword ? 'Sending reset link...' : isSignUp ? 'Creating account...' : 'Signing in...'}
                </span>
              ) : (
                isRecovery ? 'Update password' : isForgotPassword ? 'Send reset link' : isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

          {message && (
            <div
              className="mt-4 p-4 rounded-xl text-sm"
              style={{
                background: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${message.type === 'success' ? 'var(--color-success)' : 'var(--color-error)'}`,
                color: message.type === 'success' ? 'var(--color-success)' : 'var(--color-error)',
              }}
            >
              {message.text}
            </div>
          )}

          {!isRecovery && <p className="text-center mt-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {isForgotPassword ? 'Remember your password?' : isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => changeMode(isForgotPassword ? false : !isSignUp)}
              className="font-medium hover:underline"
              style={{ color: 'var(--color-accent)' }}
            >
              {isForgotPassword || isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>}
        </div>
      </div>
      </div>
    </div>
  )
}
