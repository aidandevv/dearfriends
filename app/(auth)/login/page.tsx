'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Postmark } from '@/components/ui/postmark'
import { Mail, LogIn, UserPlus, KeyRound } from 'lucide-react'

type Mode = 'sign-in' | 'sign-up' | 'magic-link' | 'forgot-password'

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setPassword('')
    setConfirmPassword('')
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Invalid email or password')
      setLoading(false)
      return
    }
    router.push('/dashboard')
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    setSent(true)
    setLoading(false)
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    setSent(true)
    setLoading(false)
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/reset-password`,
    })
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    const sentMessages: Record<string, string> = {
      'sign-up': 'We sent a confirmation link to',
      'magic-link': 'We sent a magic link to',
      'forgot-password': 'We sent a password reset link to',
    }
    return (
      <main className="min-h-screen bg-linen flex items-center justify-center p-6">
        <div className="flex flex-col items-center text-center gap-3 max-w-sm">
          <Postmark />
          <h1 className="font-serif text-3xl text-ink">Check your inbox</h1>
          <p className="text-ink-muted text-sm">
            {sentMessages[mode] ?? 'We sent a link to'}{' '}
            <strong className="text-ink">{email}</strong>. Click it to continue.
          </p>
        </div>
      </main>
    )
  }

  const heading: Record<Mode, string> = {
    'sign-in': 'Welcome back',
    'sign-up': 'Create an account',
    'magic-link': 'Magic link',
    'forgot-password': 'Reset password',
  }

  const subtitle: Record<Mode, string> = {
    'sign-in': 'Sign in to manage your contacts',
    'sign-up': 'Get started with NomadMail',
    'magic-link': 'We\u2019ll email you a sign-in link',
    'forgot-password': 'We\u2019ll email you a reset link',
  }

  return (
    <main className="min-h-screen bg-linen flex items-center justify-center p-6">
      <div className="bg-surface rounded-2xl shadow-sm border border-border p-8 w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <Postmark />
          <h1 className="font-serif text-3xl text-ink">{heading[mode]}</h1>
          <p className="text-ink-muted text-sm mt-1">{subtitle[mode]}</p>
        </div>

        <form
          onSubmit={
            mode === 'sign-in' ? handleSignIn
            : mode === 'sign-up' ? handleSignUp
            : mode === 'magic-link' ? handleMagicLink
            : handleForgotPassword
          }
          className="flex flex-col gap-4"
        >
          {/* Email — always shown */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-ink-muted font-medium">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input"
            />
          </div>

          {/* Password — sign-in and sign-up */}
          {(mode === 'sign-in' || mode === 'sign-up') && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink-muted font-medium">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="input"
              />
            </div>
          )}

          {/* Confirm password — sign-up only */}
          {mode === 'sign-up' && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink-muted font-medium">Confirm password</label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                className="input"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          {/* Primary action button */}
          {mode === 'sign-in' && (
            <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center gap-2 w-full">
              <LogIn size={16} />
              {loading ? 'Signing in\u2026' : 'Sign in'}
            </button>
          )}
          {mode === 'sign-up' && (
            <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center gap-2 w-full">
              <UserPlus size={16} />
              {loading ? 'Creating account\u2026' : 'Create account'}
            </button>
          )}
          {mode === 'magic-link' && (
            <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center gap-2 w-full">
              <Mail size={16} />
              {loading ? 'Sending\u2026' : 'Send magic link'}
            </button>
          )}
          {mode === 'forgot-password' && (
            <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center gap-2 w-full">
              <KeyRound size={16} />
              {loading ? 'Sending\u2026' : 'Send reset link'}
            </button>
          )}
        </form>

        {/* Mode-switching links */}
        <div className="flex flex-col items-center gap-2 mt-4 text-sm">
          {mode === 'sign-in' && (
            <>
              <button type="button" onClick={() => switchMode('forgot-password')} className="text-ink-muted hover:text-ink underline-offset-2 hover:underline">
                Forgot password?
              </button>
              <button type="button" onClick={() => switchMode('magic-link')} className="text-ink-muted hover:text-ink underline-offset-2 hover:underline">
                Send magic link instead
              </button>
              <p className="text-ink-muted">
                Don&apos;t have an account?{' '}
                <button type="button" onClick={() => switchMode('sign-up')} className="text-ink font-medium hover:underline underline-offset-2">
                  Sign up
                </button>
              </p>
            </>
          )}
          {mode === 'sign-up' && (
            <>
              <button type="button" onClick={() => switchMode('magic-link')} className="text-ink-muted hover:text-ink underline-offset-2 hover:underline">
                Send magic link instead
              </button>
              <p className="text-ink-muted">
                Already have an account?{' '}
                <button type="button" onClick={() => switchMode('sign-in')} className="text-ink font-medium hover:underline underline-offset-2">
                  Sign in
                </button>
              </p>
            </>
          )}
          {mode === 'magic-link' && (
            <button type="button" onClick={() => switchMode('sign-in')} className="text-ink-muted hover:text-ink underline-offset-2 hover:underline">
              Sign in with password
            </button>
          )}
          {mode === 'forgot-password' && (
            <button type="button" onClick={() => switchMode('sign-in')} className="text-ink-muted hover:text-ink underline-offset-2 hover:underline">
              Back to sign in
            </button>
          )}
        </div>
      </div>
    </main>
  )
}
