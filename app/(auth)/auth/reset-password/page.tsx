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
