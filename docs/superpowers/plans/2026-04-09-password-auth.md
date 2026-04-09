# Password Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add email/password sign-in, sign-up, and forgot/reset password flows alongside the existing magic link auth.

**Architecture:** The login page becomes a multi-mode form with four states (sign-in, sign-up, magic-link, forgot-password) managed via React state. A new reset-password page handles the post-email-click password update. The existing callback route gains recovery-type detection.

**Tech Stack:** Next.js App Router, Supabase Auth (`signInWithPassword`, `signUp`, `resetPasswordForEmail`, `updateUser`), React state, Tailwind CSS, lucide-react icons.

---

### Task 1: Update the Callback Route for Recovery Type

**Files:**
- Modify: `app/(auth)/auth/callback/route.ts`

- [ ] **Step 1: Add recovery type detection**

Update the callback route to check for `type=recovery` and redirect accordingly:

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/user-profile'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')

  if (!code) {
    return NextResponse.redirect(`${origin}/login`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/login`)
  }

  if (type === 'recovery') {
    return NextResponse.redirect(`${origin}/auth/reset-password`)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const profile = getUserProfile(user)
  const destination = profile.hasCompletedOnboarding ? '/dashboard' : '/onboarding'

  return NextResponse.redirect(`${origin}${destination}`)
}
```

- [ ] **Step 2: Verify**

Run: `npx next build`
Expected: Build succeeds with no type errors.

- [ ] **Step 3: Commit**

```bash
git add app/(auth)/auth/callback/route.ts
git commit -m "feat(auth): handle recovery type in callback route"
```

---

### Task 2: Create the Reset Password Page

**Files:**
- Create: `app/(auth)/auth/reset-password/page.tsx`

- [ ] **Step 1: Create the reset password page**

Create `app/(auth)/auth/reset-password/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Postmark } from '@/components/ui/postmark'
import { KeyRound } from 'lucide-react'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
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
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen bg-linen flex items-center justify-center p-6">
      <div className="bg-surface rounded-2xl shadow-sm border border-border p-8 w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <Postmark />
          <h1 className="font-serif text-3xl text-ink">Set new password</h1>
          <p className="text-ink-muted text-sm mt-1">Choose a new password for your account</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-ink-muted font-medium">New password</label>
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
          <div className="flex flex-col gap-1">
            <label className="text-xs text-ink-muted font-medium">Confirm new password</label>
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
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center gap-2 w-full">
            <KeyRound size={16} />
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Verify**

Run: `npx next build`
Expected: Build succeeds, new route `/auth/reset-password` is generated.

- [ ] **Step 3: Commit**

```bash
git add app/(auth)/auth/reset-password/page.tsx
git commit -m "feat(auth): add reset password page"
```

---

### Task 3: Rewrite the Login Page with Multi-Mode Forms

**Files:**
- Modify: `app/(auth)/login/page.tsx`

- [ ] **Step 1: Rewrite the login page**

Replace the contents of `app/(auth)/login/page.tsx` with the multi-mode form:

```tsx
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
```

- [ ] **Step 2: Verify build**

Run: `npx next build`
Expected: Build succeeds with no type errors.

- [ ] **Step 3: Manual smoke test**

Run: `npx next dev`

Verify all four modes work visually:
1. Visit `/login` — see email + password sign-in form
2. Click "Sign up" — form switches to show confirm password field
3. Click "Send magic link instead" — form switches to email-only
4. Click "Sign in with password" — back to sign-in mode
5. Click "Forgot password?" from sign-in — shows reset form
6. Click "Back to sign in" — returns to sign-in mode

- [ ] **Step 4: Commit**

```bash
git add app/(auth)/login/page.tsx
git commit -m "feat(auth): add password sign-in, sign-up, and forgot password modes to login page"
```

---

### Task 4: End-to-End Manual Verification

- [ ] **Step 1: Test password sign-up flow**

1. Go to `/login`, switch to sign-up mode
2. Enter email + password + confirm password, click "Create account"
3. Check inbox for confirmation email
4. Click the confirmation link — should arrive at `/onboarding`

- [ ] **Step 2: Test password sign-in flow**

1. Go to `/login` (default sign-in mode)
2. Enter email + password, click "Sign in"
3. Should redirect to `/dashboard`

- [ ] **Step 3: Test forgot password flow**

1. Go to `/login`, click "Forgot password?"
2. Enter email, click "Send reset link"
3. Check inbox for reset email
4. Click the reset link — should arrive at `/auth/reset-password`
5. Enter new password + confirm, click "Update password"
6. Should redirect to `/dashboard`

- [ ] **Step 4: Test magic link flow (regression)**

1. Go to `/login`, click "Send magic link instead"
2. Enter email, click "Send magic link"
3. Check inbox, click link — should work as before

- [ ] **Step 5: Test error states**

1. Sign in with wrong password — should show "Invalid email or password"
2. Sign up with mismatched passwords — should show "Passwords do not match"
3. Sign up with password under 8 chars — should show validation error
