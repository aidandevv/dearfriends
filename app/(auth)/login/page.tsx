'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Postmark } from '@/components/ui/postmark'
import { Mail } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <main className="min-h-screen bg-linen flex items-center justify-center p-6">
        <div className="flex flex-col items-center text-center gap-3 max-w-sm">
          <Postmark />
          <h1 className="font-serif text-3xl text-ink">Check your inbox</h1>
          <p className="text-ink-muted text-sm">
            We sent a magic link to <strong className="text-ink">{email}</strong>. Click it to sign in.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-linen flex items-center justify-center p-6">
      <div className="bg-surface rounded-2xl shadow-sm border border-border p-8 w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <Postmark />
          <h1 className="font-serif text-3xl text-ink">Welcome back</h1>
          <p className="text-ink-muted text-sm mt-1">Sign in to manage your contacts</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center gap-2 w-full">
            <Mail size={16} />
            {loading ? 'Sending\u2026' : 'Send magic link'}
          </button>
        </form>
      </div>
    </main>
  )
}
