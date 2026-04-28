'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AuthArtPanel } from '@/components/ui/auth-art-panel'
import { Mail, LogIn, UserPlus, KeyRound } from 'lucide-react'

type Mode = 'sign-in' | 'sign-up' | 'magic-link' | 'forgot-password'

const newsreader = "var(--font-ppwriter), Georgia, serif"
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')

function authRedirectUrl(path: string) {
  const origin = siteUrl || (typeof window === 'undefined' ? 'http://localhost:3000' : window.location.origin)
  return `${origin}${path}`
}

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
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: authRedirectUrl('/auth/callback') },
    })
    if (error) { setError(error.message); setLoading(false); return }
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
      options: { emailRedirectTo: authRedirectUrl('/auth/callback') },
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
      redirectTo: authRedirectUrl('/auth/callback'),
    })
    setSent(true)
    setLoading(false)
  }

  const heading: Record<Mode, string> = {
    'sign-in': 'Welcome back',
    'sign-up': 'Create an account',
    'magic-link': 'Magic link',
    'forgot-password': 'Reset password',
  }

  const subtitle: Record<Mode, string> = {
    'sign-in': 'Sign in to your little book',
    'sign-up': 'Start keeping up with the people you love',
    'magic-link': 'We\'ll email you a sign-in link',
    'forgot-password': 'We\'ll email you a reset link',
  }

  const sentMessages: Record<string, string> = {
    'sign-up': 'We sent a confirmation link to',
    'magic-link': 'We sent a magic link to',
    'forgot-password': 'We sent a password reset link to',
  }

  if (sent) {
    return (
      <main
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: '#faf4e4' }}
      >
        <div className="flex flex-col items-center text-center gap-3 max-w-sm">
          <div className="flex items-center justify-center w-14 h-14 rounded-full border-2 border-dashed border-blue-ink text-blue-ink mb-1">
            <Mail size={22} strokeWidth={1.5} />
          </div>
          <h1 style={{ fontFamily: newsreader, fontSize: 28, color: '#1d2442', fontWeight: 400 }}>
            Check your inbox
          </h1>
          <p className="text-ink-muted text-sm leading-6">
            {sentMessages[mode] ?? 'We sent a link to'}{' '}
            <strong className="text-ink">{email}</strong>. Click it to continue.
          </p>
          <Link href="/" className="mt-2 text-sm text-blue-ink hover:underline underline-offset-2">
            ← back to dearfriends
          </Link>
        </div>
      </main>
    )
  }

  return (
    <div className="flex min-h-screen">
      <AuthArtPanel />

      <div className="flex flex-1 items-center justify-center p-8 bg-linen">
        <div className="w-full max-w-sm">
          <h1 style={{ fontFamily: newsreader, fontSize: 30, color: '#1d2442', fontWeight: 400, marginBottom: 4 }}>
            {heading[mode]}
          </h1>
          <p className="text-sm text-ink-muted mb-7">{subtitle[mode]}</p>

          <form
            onSubmit={
              mode === 'sign-in' ? handleSignIn
              : mode === 'sign-up' ? handleSignUp
              : mode === 'magic-link' ? handleMagicLink
              : handleForgotPassword
            }
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink-muted font-medium">Email</label>
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input"
              />
            </div>

            {(mode === 'sign-in' || mode === 'sign-up') && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-ink-muted font-medium">Password</label>
                <input
                  type="password" required minLength={8} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="input"
                />
              </div>
            )}

            {mode === 'sign-up' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-ink-muted font-medium">Confirm password</label>
                <input
                  type="password" required minLength={8} value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="input"
                />
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            {mode === 'sign-in' && (
              <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center gap-2 w-full">
                <LogIn size={16} />
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            )}
            {mode === 'sign-up' && (
              <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center gap-2 w-full">
                <UserPlus size={16} />
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            )}
            {mode === 'magic-link' && (
              <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center gap-2 w-full">
                <Mail size={16} />
                {loading ? 'Sending…' : 'Send magic link'}
              </button>
            )}
            {mode === 'forgot-password' && (
              <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center gap-2 w-full">
                <KeyRound size={16} />
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            )}
          </form>

          <div className="flex flex-col items-center gap-2 mt-5 text-sm">
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
      </div>
    </div>
  )
}
