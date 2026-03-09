'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfile } from '@/lib/actions/user'
import type { UserProfile } from '@/lib/user-profile'

export function ProfileForm({ profile }: { profile: UserProfile }) {
  const router = useRouter()
  const [fullName, setFullName] = useState(profile.fullName ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [senderName, setSenderName] = useState(profile.senderName ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSaved(false)

    const result = await updateProfile({
      full_name: fullName,
      bio: bio || undefined,
      sender_name: senderName || undefined,
    })

    if (result.error) {
      setError(result.error)
    } else {
      setSaved(true)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="surface-panel flex flex-col gap-5 px-5 py-5 shadow-sm max-w-lg">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="full-name" className="text-xs font-medium uppercase tracking-[0.22em] text-ink-muted">Display name</label>
        <input id="full-name" value={fullName} onChange={e => setFullName(e.target.value)} className="input min-h-11" required />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="bio" className="text-xs font-medium uppercase tracking-[0.22em] text-ink-muted">
          Bio <span className="normal-case font-normal">(shown to recipients, 160 chars)</span>
        </label>
        <input
          id="bio"
          value={bio}
          onChange={e => setBio(e.target.value)}
          maxLength={160}
          placeholder="e.g. Sending love from Portland, OR"
          className="input min-h-11"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="sender-name" className="text-xs font-medium uppercase tracking-[0.22em] text-ink-muted">
          Sender name <span className="normal-case font-normal">(in email From: field)</span>
        </label>
        <input
          id="sender-name"
          value={senderName}
          onChange={e => setSenderName(e.target.value)}
          placeholder={fullName || 'Your name'}
          className="input min-h-11"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-600">Profile saved.</p>}

      <button type="submit" disabled={loading} className="btn-primary min-h-11 max-w-[180px]">
        {loading ? 'Saving...' : 'Save profile'}
      </button>
    </form>
  )
}
