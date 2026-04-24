# App-wide Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the dearfriends design system (paper/ink palette, Newsreader serif, blue-ink primary) to every page and component in the app.

**Architecture:** Token changes in `globals.css` + `tailwind.config.ts` cascade to all dashboard components automatically. The three layout rewrites (login, reset-password, share form) get new split-panel structures while preserving all existing logic. A shared `AuthArtPanel` component is extracted to avoid duplicating the ink-dark left panel across auth pages.

**Tech Stack:** Next.js App Router, Tailwind CSS, inline React styles for design-specific values, `next/font/google` (Newsreader + Caveat already loaded in `app/layout.tsx`).

---

## File map

| File | Change |
|---|---|
| `app/globals.css` | Replace token values + update `.btn-primary`, `.input` class refs |
| `tailwind.config.ts` | Rename terra→blue-ink, update all color values, swap serif font |
| `components/ui/auth-art-panel.tsx` | **New** — ink-dark left panel with envelope art, used by auth pages |
| `app/(auth)/login/page.tsx` | Split layout rewrite (preserve all state + handlers) |
| `app/(auth)/auth/reset-password/page.tsx` | Split layout rewrite (preserve all state + handlers) |
| `app/onboarding/page.tsx` | Background + heading update only |
| `components/ui/postmark.tsx` | terra→blue-ink |
| `components/nav-link.tsx` | Active/hover terra→blue-ink |
| `app/dashboard/layout.tsx` | Sidebar brand mark + avatar gradient |
| `components/share-form.tsx` | Split layout rewrite (preserve all state + handlers) |
| `components/site-shell.tsx` | Swap MarketingNav→LandingNav, background update |
| `app/about/page.tsx` | terra→blue-ink refs |
| All other files with `terra` | Bulk sed rename (19 files, covered in Task 2) |

---

## Task 1: Update design tokens

**Files:**
- Modify: `app/globals.css`
- Modify: `tailwind.config.ts`

- [ ] **Replace `:root` variables in `app/globals.css`**

Replace the entire `:root` block and `.btn-primary` / `.input` classes:

```css
:root {
  --linen: #F8F3EA;
  --surface: #faf4e4;
  --surface-raised: #FFFFFF;
  --blue-ink: #3358ba;
  --blue-mid: #3e5da0;
  --ink: #1d2442;
  --ink-muted: #6b7290;
  --border: #d9cfb0;
  --sage: #5A7A5A;
  --sidebar: #EDE6D4;
  --cream: #E4CE95;
  --blue-slate: #516183;
  --stamp: #b8453b;
}
```

Replace `.btn-primary`:
```css
.btn-primary {
  @apply cursor-pointer rounded-full bg-blue-ink px-6 py-2.5 text-sm font-medium text-white
         transition-colors hover:bg-blue-mid disabled:opacity-50;
}
```

Replace `.input` focus ring:
```css
.input {
  @apply w-full rounded-lg border border-border bg-linen px-3 py-2 text-sm text-ink
         transition-colors placeholder:text-ink-muted/50
         focus:border-blue-ink focus:outline-none focus:ring-2 focus:ring-blue-ink/40;
}
```

- [ ] **Update `tailwind.config.ts`**

Full replacement:
```ts
import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["var(--font-newsreader)", "Georgia", "serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        linen: "#F8F3EA",
        surface: "#faf4e4",
        "surface-raised": "#FFFFFF",
        "blue-ink": "#3358ba",
        "blue-mid": "#3e5da0",
        ink: "#1d2442",
        "ink-muted": "#6b7290",
        border: "#d9cfb0",
        sage: "#5A7A5A",
        sidebar: "#EDE6D4",
        cream: "#E4CE95",
        "blue-slate": "#516183",
        stamp: "#b8453b",
      },
    },
  },
  plugins: [typography],
};
export default config;
```

- [ ] **Type-check**

```bash
cd "/Volumes/General External/dev/dearfriends" && npx tsc --noEmit 2>&1 | head -30
```

Expected: errors about `terra` / `terra-dark` in Tailwind class names — these will be fixed in Task 2.

- [ ] **Commit**

```bash
git add app/globals.css tailwind.config.ts
git commit -m "feat(design): update token palette — blue-ink replaces terra, navy ink, paper surface"
```

---

## Task 2: Rename terra → blue-ink across all files

**Files:** All 19 files containing `terra` (found by prior grep)

- [ ] **Run bulk rename via sed**

```bash
cd "/Volumes/General External/dev/dearfriends"
find app components -name "*.tsx" -o -name "*.css" | xargs sed -i '' \
  -e 's/terra-dark/blue-mid/g' \
  -e 's/terra/blue-ink/g'
```

This handles every pattern: `bg-terra`, `text-terra`, `border-terra`, `hover:bg-terra`, `bg-terra/10`, `ring-terra/40`, `--terra`, `terra-dark`, etc.

- [ ] **Verify no unintended replacements**

```bash
grep -rn "terra" app/ components/ --include="*.tsx" --include="*.css"
```

Expected: zero matches. If any remain, fix manually.

- [ ] **Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Commit**

```bash
git add -A
git commit -m "feat(design): rename terra→blue-ink class names app-wide"
```

---

## Task 3: Create AuthArtPanel component

**Files:**
- Create: `components/ui/auth-art-panel.tsx`

- [ ] **Create the file**

```tsx
// components/ui/auth-art-panel.tsx

const newsreader = "var(--font-newsreader), Georgia, serif"

export function AuthArtPanel() {
  return (
    <div
      className="hidden md:flex md:w-[40%] min-h-screen flex-col items-center justify-between py-12 px-8 relative overflow-hidden flex-shrink-0"
      style={{ background: '#1d2442' }}
    >
      {/* Dot-grid texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(rgba(228,206,149,.06) 1px, transparent 1px)',
          backgroundSize: '4px 4px',
        }}
      />

      {/* Brand mark */}
      <div style={{ fontFamily: newsreader, fontSize: 18, color: '#E4CE95', position: 'relative', zIndex: 1 }}>
        <em>dear</em>friends
      </div>

      {/* Envelope art + tagline */}
      <div className="flex flex-col items-center gap-7 relative z-10">
        {/* Envelope */}
        <div style={{
          width: 148, height: 92,
          background: '#f5ecd3',
          border: '1px solid rgba(255,255,255,.1)',
          borderRadius: 3,
          transform: 'rotate(-4deg)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 50px -16px rgba(0,0,0,.7)',
        }}>
          {/* Stripes top */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 8,
            background: 'repeating-linear-gradient(-45deg, #3358ba 0 6px, transparent 6px 12px, #b8453b 12px 18px, transparent 18px 24px)',
            opacity: 0.85,
          }} />
          {/* Stripes bottom */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 8,
            background: 'repeating-linear-gradient(-45deg, #3358ba 0 6px, transparent 6px 12px, #b8453b 12px 18px, transparent 18px 24px)',
            opacity: 0.85,
          }} />
          {/* Stamp */}
          <div style={{
            position: 'absolute', top: 12, right: 12,
            width: 32, height: 38,
            background: '#E4CE95',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 24, height: 30,
              background: '#3358ba',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: newsreader, fontSize: 9, fontStyle: 'italic', color: '#E4CE95',
            }}>df</div>
          </div>
          {/* Postmark */}
          <div style={{
            position: 'absolute', top: 18, right: 54,
            width: 42, height: 42,
            border: '1.5px solid #b8453b', borderRadius: '50%',
            color: '#b8453b', opacity: 0.5,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: 'rotate(-12deg)',
            fontFamily: 'var(--font-dm-sans)', fontSize: 5.5,
            textTransform: 'uppercase', letterSpacing: '0.08em',
            textAlign: 'center', lineHeight: 1.3,
          }}>
            <div style={{ position: 'absolute', inset: 5, border: '1px dashed #b8453b', borderRadius: '50%' }} />
            New York<br />Apr · 26
          </div>
          {/* Address hint */}
          <div style={{
            position: 'absolute', bottom: 13, left: 11,
            fontFamily: newsreader, fontSize: 10,
            color: '#3a4263', lineHeight: 1.4, fontStyle: 'italic',
          }}>
            A letter, soon
          </div>
        </div>

        {/* Tagline */}
        <p style={{
          fontFamily: newsreader,
          fontSize: 21, lineHeight: 1.3,
          color: '#faf4e4',
          textAlign: 'center', maxWidth: 200,
        }}>
          keep up with<br />
          <em style={{ color: '#E4CE95', fontStyle: 'italic' }}>the people</em><br />
          you love
        </p>
      </div>

      {/* Bottom spacer (balances brand mark top) */}
      <div aria-hidden style={{ height: 18 }} />
    </div>
  )
}
```

- [ ] **Type-check**

```bash
npx tsc --noEmit 2>&1 | head -10
```

Expected: no errors.

- [ ] **Commit**

```bash
git add components/ui/auth-art-panel.tsx
git commit -m "feat(design): add AuthArtPanel component for auth split layout"
```

---

## Task 4: Rewrite login page with split layout

**Files:**
- Modify: `app/(auth)/login/page.tsx`

All existing state (`mode`, `email`, `password`, `confirmPassword`, `error`, `sent`, `loading`), event handlers (`handleSignIn`, `handleSignUp`, `handleMagicLink`, `handleForgotPassword`, `switchMode`), and the `heading`/`subtitle`/`sentMessages` lookup objects are **unchanged**. Only the returned JSX changes.

- [ ] **Replace the file**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AuthArtPanel } from '@/components/ui/auth-art-panel'
import { Mail, LogIn, UserPlus, KeyRound } from 'lucide-react'

type Mode = 'sign-in' | 'sign-up' | 'magic-link' | 'forgot-password'

const newsreader = "var(--font-newsreader), Georgia, serif"

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
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
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

  const heading: Record<Mode, string> = {
    'sign-in': 'Welcome back',
    'sign-up': 'Create an account',
    'magic-link': 'Magic link',
    'forgot-password': 'Reset password',
  }

  const subtitle: Record<Mode, string> = {
    'sign-in': 'Sign in to your little book',
    'sign-up': 'Start keeping up with the people you love',
    'magic-link': 'We’ll email you a sign-in link',
    'forgot-password': 'We’ll email you a reset link',
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
          <div
            className="flex items-center justify-center w-14 h-14 rounded-full border-2 border-dashed border-blue-ink text-blue-ink mb-1"
          >
            <Mail size={22} strokeWidth={1.5} />
          </div>
          <h1 style={{ fontFamily: newsreader, fontSize: 28, color: '#1d2442', fontWeight: 400 }}>
            Check your inbox
          </h1>
          <p className="text-ink-muted text-sm leading-6">
            {sentMessages[mode] ?? 'We sent a link to'}{' '}
            <strong className="text-ink">{email}</strong>. Click it to continue.
          </p>
          <a href="/" className="mt-2 text-sm text-blue-ink hover:underline underline-offset-2">
            ← back to dearfriends
          </a>
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
```

- [ ] **Type-check**

```bash
npx tsc --noEmit 2>&1 | head -10
```

Expected: no errors.

- [ ] **Commit**

```bash
git add "app/(auth)/login/page.tsx"
git commit -m "feat(design): login page — split layout with AuthArtPanel"
```

---

## Task 5: Rewrite reset-password page with split layout

**Files:**
- Modify: `app/(auth)/auth/reset-password/page.tsx`

All state and the `handleSubmit` handler are unchanged. Only the returned JSX changes.

- [ ] **Replace the file**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AuthArtPanel } from '@/components/ui/auth-art-panel'
import { KeyRound } from 'lucide-react'

const newsreader = "var(--font-newsreader), Georgia, serif"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) { setError(updateError.message); setLoading(false); return }
    router.push('/dashboard')
  }

  return (
    <div className="flex min-h-screen">
      <AuthArtPanel />

      <div className="flex flex-1 items-center justify-center p-8 bg-linen">
        <div className="w-full max-w-sm">
          <h1 style={{ fontFamily: newsreader, fontSize: 30, color: '#1d2442', fontWeight: 400, marginBottom: 4 }}>
            Set new password
          </h1>
          <p className="text-sm text-ink-muted mb-7">Choose a new password for your account</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink-muted font-medium">New password</label>
              <input
                type="password" required minLength={8} value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="input"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink-muted font-medium">Confirm new password</label>
              <input
                type="password" required minLength={8} value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                className="input"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center gap-2 w-full">
              <KeyRound size={16} />
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <a href="/login" className="text-sm text-ink-muted hover:text-ink underline-offset-2 hover:underline">
              Back to sign in
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Type-check**

```bash
npx tsc --noEmit 2>&1 | head -10
```

- [ ] **Commit**

```bash
git add "app/(auth)/auth/reset-password/page.tsx"
git commit -m "feat(design): reset-password page — split layout with AuthArtPanel"
```

---

## Task 6: Update Postmark, NavLink, and dashboard sidebar

**Files:**
- Modify: `components/ui/postmark.tsx`
- Modify: `components/nav-link.tsx`
- Modify: `app/dashboard/layout.tsx`

- [ ] **Update `components/ui/postmark.tsx`**

```tsx
import { Mail } from 'lucide-react'

export function Postmark() {
  return (
    <div className="flex items-center justify-center w-16 h-16 rounded-full border-2 border-dashed border-blue-ink text-blue-ink mb-4">
      <Mail size={24} />
    </div>
  )
}
```

- [ ] **Update `components/nav-link.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

export function NavLink({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      title={label}
      className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
        isActive
          ? 'bg-blue-ink text-white'
          : 'text-ink-muted hover:bg-blue-ink/10 hover:text-blue-ink'
      }`}
    >
      {children}
    </Link>
  )
}
```

- [ ] **Update sidebar brand mark + avatar in `app/dashboard/layout.tsx`**

Find and replace the two brand mark and avatar lines inside the nav element:

```tsx
// Replace the existing <span> brand mark (was "DF" in text-terra):
<span
  className="mb-5 font-serif text-[13px] italic text-blue-ink"
  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
>
  df
</span>

// Replace the existing avatar div (was from-terra to-border):
<div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-ink to-blue-slate" />
```

- [ ] **Type-check**

```bash
npx tsc --noEmit 2>&1 | head -10
```

- [ ] **Commit**

```bash
git add components/ui/postmark.tsx components/nav-link.tsx app/dashboard/layout.tsx
git commit -m "feat(design): postmark, nav-link, sidebar — blue-ink active states"
```

---

## Task 7: Update onboarding page

**Files:**
- Modify: `app/onboarding/page.tsx`

Minor update: the `<Postmark />` now renders in blue-ink (from Task 6), and `bg-linen` gets the updated linen color (from Task 1). Only one line needs changing — the `.info-chip` text to match.

- [ ] **Replace `app/onboarding/page.tsx`**

```tsx
import { redirect } from 'next/navigation'
import { OnboardingForm } from '@/components/onboarding-form'
import { Postmark } from '@/components/ui/postmark'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/user-profile'

const newsreader = "var(--font-newsreader), Georgia, serif"

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const profile = getUserProfile(user)
  if (profile.hasCompletedOnboarding) redirect('/dashboard')

  return (
    <main className="min-h-screen bg-linen flex items-center justify-center p-6">
      <div className="w-full max-w-lg animate-fade-up">
        <div className="mb-8 flex flex-col items-center text-center">
          <Postmark />
          <p className="info-chip">A quick setup before you head inside</p>
          <h1 style={{ fontFamily: newsreader, fontWeight: 400, fontSize: 36, marginTop: 20, color: '#1d2442' }}>
            What should your friends call you?
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-ink-muted">
            We&apos;ll use your name to personalize address requests and make your first dashboard tour feel a little more welcoming.
          </p>
        </div>

        <OnboardingForm email={user.email ?? ''} />
      </div>
    </main>
  )
}
```

- [ ] **Type-check**

```bash
npx tsc --noEmit 2>&1 | head -10
```

- [ ] **Commit**

```bash
git add app/onboarding/page.tsx
git commit -m "feat(design): onboarding — Newsreader heading, updated token colors"
```

---

## Task 8: Rewrite share form with split layout

**Files:**
- Modify: `components/share-form.tsx`

All state, event handlers, and form fields are **unchanged**. The JSX gets a split-panel wrapper. The submitted state becomes a full-width centered layout.

- [ ] **Replace `components/share-form.tsx`**

```tsx
'use client'

import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail } from 'lucide-react'
import { upsertContact, submitNote, notifyAdminOfNote } from '@/lib/actions/contacts'
import { contactSchema, type ContactInput } from '@/lib/schemas'

function firstName(name: string | null) {
  return name?.trim().split(/\s+/)[0] ?? null
}

const newsreader = "var(--font-newsreader), Georgia, serif"
const caveat = "var(--font-caveat), cursive"

export function ShareForm({ adminId, senderName, senderBio }: {
  adminId: string
  senderName: string | null
  senderBio: string | null
}) {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [contactId, setContactId] = useState<string | null>(null)
  const [recipientFirstName, setRecipientFirstName] = useState<string>('')
  const [note, setNote] = useState('')
  const [noteSubmitting, setNoteSubmitting] = useState(false)
  const [noteSubmitted, setNoteSubmitted] = useState(false)

  const displayName = useMemo(() => firstName(senderName) ?? senderName, [senderName])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { delivery_method: 'print' },
  })

  async function onSubmit(data: ContactInput) {
    const result = await upsertContact(adminId, data)
    if (result.error) {
      setServerError(typeof result.error === 'string' ? result.error : 'Something went wrong.')
      return
    }
    setRecipientFirstName(data.first_name)
    setContactId(result.contactId ?? null)
    setSubmitted(true)
  }

  async function handleNoteSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!contactId || !note.trim()) return
    setNoteSubmitting(true)
    const result = await submitNote(contactId, note)
    if (!result.error) {
      await notifyAdminOfNote({ adminId, recipientFirstName, note })
      setNoteSubmitted(true)
    }
    setNoteSubmitting(false)
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <main
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: '#faf4e4' }}
      >
        <div className="max-w-md w-full flex flex-col items-center text-center gap-4 animate-fade-up">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-blue-ink text-blue-ink">
            <Mail size={22} strokeWidth={1.5} />
          </div>
          <h1 style={{ fontFamily: newsreader, fontSize: 30, fontWeight: 400, color: '#1d2442' }}>
            Sealed &amp; sent.
          </h1>
          {displayName && (
            <div className="flex flex-col items-center gap-1">
              <p style={{ fontFamily: newsreader, fontSize: 18, fontStyle: 'italic', color: '#3358ba' }}>
                {displayName}
              </p>
              {senderBio && <p className="text-sm text-ink-muted">{senderBio}</p>}
            </div>
          )}
          <p className="text-ink-muted text-sm leading-6">
            {displayName
              ? `Thanks, ${recipientFirstName}! Your address is saved. ${displayName} can't wait to send you something.`
              : 'Your address has been saved. Expect something special in the mail.'}
          </p>

          {contactId && !noteSubmitted && (
            <form
              onSubmit={handleNoteSubmit}
              className="w-full flex flex-col gap-3"
              style={{ background: 'white', border: '1px solid #d9cfb0', borderRadius: 10, padding: '16px 20px' }}
            >
              <label className="text-xs font-medium uppercase tracking-[0.22em] text-ink-muted text-left">
                Leave a note for {displayName ?? 'them'} (optional)
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value.slice(0, 280))}
                rows={3}
                placeholder={`Leave a note for ${displayName ?? 'them'}…`}
                className="input resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-muted">{note.length}/280</span>
                <button
                  type="submit"
                  disabled={noteSubmitting || !note.trim()}
                  className="btn-primary min-h-9 px-4 text-sm"
                >
                  {noteSubmitting ? 'Sending...' : 'Send note'}
                </button>
              </div>
            </form>
          )}

          {noteSubmitted && <p className="text-sm text-ink-muted">Note sent ✓</p>}
        </div>
      </main>
    )
  }

  // ── Form state — split layout ──────────────────────────────────────────────
  return (
    <div className="flex min-h-screen">
      {/* Left panel: sender identity */}
      <div
        className="hidden md:flex md:w-[38%] min-h-screen flex-col items-center justify-between py-12 px-8 relative overflow-hidden flex-shrink-0"
        style={{ background: '#faf4e4', borderRight: '1px solid #d9cfb0' }}
      >
        {/* Grain texture */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(rgba(140,110,50,.07) 1px, transparent 1px)',
            backgroundSize: '3px 3px',
            opacity: 0.6,
          }}
        />

        {/* Brand */}
        <div style={{ fontFamily: newsreader, fontSize: 18, color: '#1d2442', position: 'relative', zIndex: 1 }}>
          <em>dear</em>friends
        </div>

        {/* Sender block */}
        <div className="flex flex-col items-center gap-5 relative z-10 text-center">
          {/* Mini envelope */}
          <div style={{
            width: 120, height: 75,
            background: '#f5ecd3',
            border: '1px solid #d9cfb0',
            borderRadius: 3,
            transform: 'rotate(3deg)',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 12px 30px -10px rgba(45,35,10,.25)',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 7,
              background: 'repeating-linear-gradient(-45deg, #3358ba 0 5px, transparent 5px 10px, #b8453b 10px 15px, transparent 15px 20px)',
              opacity: 0.8,
            }} />
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: 7,
              background: 'repeating-linear-gradient(-45deg, #3358ba 0 5px, transparent 5px 10px, #b8453b 10px 15px, transparent 15px 20px)',
              opacity: 0.8,
            }} />
            <div style={{
              position: 'absolute', top: 10, right: 10,
              width: 26, height: 32, background: '#E4CE95',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                width: 20, height: 26, background: '#3358ba',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: newsreader, fontSize: 8, fontStyle: 'italic', color: '#E4CE95',
              }}>df</div>
            </div>
          </div>

          <div>
            <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#6b7290', marginBottom: 6 }}>
              from
            </p>
            <p style={{ fontFamily: newsreader, fontStyle: 'italic', fontSize: 26, color: '#3358ba', lineHeight: 1.1 }}>
              {displayName ?? 'a friend'}
            </p>
            {senderBio && (
              <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 13, color: '#6b7290', marginTop: 6, lineHeight: 1.5, maxWidth: 200 }}>
                {senderBio}
              </p>
            )}
          </div>

          <p style={{ fontFamily: caveat, fontSize: 17, color: '#3a4263', lineHeight: 1.5 }}>
            Can&apos;t wait to send<br />you something ✉
          </p>
        </div>

        <div aria-hidden style={{ height: 18 }} />
      </div>

      {/* Right panel: form */}
      <div className="flex flex-1 items-center justify-center p-8" style={{ background: 'white' }}>
        <div className="w-full max-w-[420px]">
          {/* Mobile-only sender header */}
          <div className="md:hidden flex flex-col items-center text-center mb-6">
            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#6b7290', marginBottom: 4 }}>
              from
            </p>
            <p style={{ fontFamily: newsreader, fontStyle: 'italic', fontSize: 22, color: '#3358ba' }}>
              {displayName ?? 'a friend'}
            </p>
          </div>

          <h1 style={{ fontFamily: newsreader, fontSize: 26, fontWeight: 400, color: '#1d2442', marginBottom: 4 }}>
            Share your address
          </h1>
          <p className="text-sm text-ink-muted mb-6">
            {displayName
              ? `${displayName} will use this to send you something in the mail.`
              : 'Your address will be used to send you something special.'}
          </p>

          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-ink-muted font-medium uppercase tracking-[0.18em]">First name</label>
                <input {...register('first_name')} className="input min-h-11" />
                {errors.first_name && <p className="text-xs text-red-500">{errors.first_name.message}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-ink-muted font-medium uppercase tracking-[0.18em]">Last name</label>
                <input {...register('last_name')} className="input min-h-11" />
                {errors.last_name && <p className="text-xs text-red-500">{errors.last_name.message}</p>}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink-muted font-medium uppercase tracking-[0.18em]">Email</label>
              <input {...register('email')} type="email" className="input min-h-11" />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink-muted font-medium uppercase tracking-[0.18em]">Address</label>
              <input {...register('address_line_1')} placeholder="Street address" className="input min-h-11" />
              {errors.address_line_1 && <p className="text-xs text-red-500">{errors.address_line_1.message}</p>}
              <input
                {...register('address_line_2')}
                placeholder="Apt, suite, etc. (optional)"
                className="input min-h-11 mt-2"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-ink-muted font-medium uppercase tracking-[0.18em]">City</label>
                <input {...register('city')} className="input min-h-11" />
                {errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-ink-muted font-medium uppercase tracking-[0.18em]">State</label>
                <input {...register('state')} className="input min-h-11" />
                {errors.state && <p className="text-xs text-red-500">{errors.state.message}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-ink-muted font-medium uppercase tracking-[0.18em]">ZIP</label>
                <input {...register('zip')} className="input min-h-11" />
                {errors.zip && <p className="text-xs text-red-500">{errors.zip.message}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex items-center justify-center mt-1 min-h-12 w-full"
            >
              {isSubmitting ? 'Saving…' : 'Send my address →'}
            </button>
          </form>

          <p className="mt-5 text-center text-[11px] text-ink-muted/70">
            Powered by dearfriends · your address stays private
          </p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Type-check**

```bash
npx tsc --noEmit 2>&1 | head -10
```

- [ ] **Commit**

```bash
git add components/share-form.tsx
git commit -m "feat(design): share form — split layout with sender panel + Caveat handwriting"
```

---

## Task 9: Update SiteShell and About page

**Files:**
- Modify: `components/site-shell.tsx`
- Modify: `app/about/page.tsx`

- [ ] **Replace `components/site-shell.tsx`**

```tsx
import type { ReactNode } from 'react'
import Link from 'next/link'
import { LandingNav } from '@/components/marketing/landing-nav'

const newsreader = "var(--font-newsreader), Georgia, serif"

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface text-ink">
      <LandingNav />
      {children}
      <footer className="border-t border-border/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-ink-muted md:flex-row md:items-center md:justify-between">
          <p style={{ fontFamily: newsreader, fontSize: 16, fontStyle: 'italic', color: '#1d2442' }}>
            dearfriends
          </p>
          <p>Made for thoughtful address books, warm updates, and real mail.</p>
          <Link href="/login" className="inline-flex items-center gap-2 text-ink transition-colors hover:text-blue-ink">
            Open your dashboard →
          </Link>
        </div>
      </footer>
    </div>
  )
}
```

- [ ] **Fix remaining `terra` refs in `app/about/page.tsx`**

The bulk sed in Task 2 will have already replaced all `terra` class names with `blue-ink` in `about/page.tsx`. Verify manually:

```bash
grep -n "terra" "app/about/page.tsx"
```

Expected: no matches. If any remain, replace `terra` with `blue-ink` and `terra-dark` with `blue-mid` manually.

- [ ] **Type-check**

```bash
npx tsc --noEmit 2>&1 | head -10
```

Expected: no errors.

- [ ] **Start dev server and verify visually**

```bash
npm run dev
```

Open in browser and check each page:
- `/` — landing page (unchanged)
- `/login` — split layout with ink-dark left panel, form right
- `/share/<any-slug>` — split layout with cream left panel, form right
- `/dashboard` — crisp linen background, blue-ink sidebar active state, Newsreader headings
- `/about` — paper background, LandingNav, blue-ink icon accents

- [ ] **Final commit**

```bash
git add components/site-shell.tsx app/about/page.tsx
git commit -m "feat(design): site-shell uses LandingNav; about page blue-ink accents"
```

---

## Self-review

**Spec coverage:**
- ✅ Token overhaul — Task 1
- ✅ terra→blue-ink rename — Task 2
- ✅ `fontFamily.serif` → Newsreader — Task 1 (tailwind.config.ts)
- ✅ Dashboard sidebar (brand mark, avatar, active state) — Task 6
- ✅ `nav-link.tsx` active/hover — Task 6
- ✅ Login split layout — Task 4
- ✅ Reset-password split layout — Task 5
- ✅ Onboarding token updates — Task 7
- ✅ Postmark blue-ink — Task 6
- ✅ Share form split layout — Task 8
- ✅ SiteShell → LandingNav + paper bg — Task 9
- ✅ About page terra→blue-ink — Task 9 (+ Task 2 bulk rename)
- ✅ `share-link-card.tsx` — inherits from token changes (no `terra` direct refs confirmed)

**Placeholder scan:** No TBD, no TODO, complete code in every step. ✅

**Type consistency:** `AuthArtPanel` created in Task 3, imported by name in Tasks 4 and 5. `newsreader`/`caveat` CSS var strings are inlined independently per file (no shared export needed — they're constants). ✅
