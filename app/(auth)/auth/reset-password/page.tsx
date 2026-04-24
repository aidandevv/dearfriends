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
