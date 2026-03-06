'use client'

import type { FormEvent } from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, UserRound } from 'lucide-react'
import { completeOnboarding } from '@/lib/actions/user'

export function OnboardingForm({ email }: { email: string }) {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await completeOnboarding({ full_name: fullName })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="surface-panel flex flex-col gap-5 px-5 py-5 shadow-sm">
      <div className="rounded-[1.2rem] border border-border/80 bg-surface-raised px-4 py-4">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-ink-muted">Signing in as</p>
        <p className="mt-2 text-sm text-ink">{email}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium uppercase tracking-[0.22em] text-ink-muted">Your name</label>
        <div className="relative">
          <UserRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Aidan"
            className="input min-h-12 pl-10"
            autoFocus
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary inline-flex min-h-12 items-center justify-center gap-2">
        {loading ? 'Saving...' : 'Continue to dashboard'}
        {!loading && <ArrowRight size={16} />}
      </button>
    </form>
  )
}
