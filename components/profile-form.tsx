'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfile, updateShareSlug } from '@/lib/actions/user'
import { slugSchema } from '@/lib/schemas'
import type { UserProfile } from '@/lib/user-profile'

export function ProfileForm({ profile }: { profile: UserProfile }) {
  const router = useRouter()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const [fullName, setFullName] = useState(profile.fullName ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [senderName, setSenderName] = useState(profile.senderName ?? '')
  const [anniversaryReminders, setAnniversaryReminders] = useState(profile.anniversaryRemindersEnabled)
  const [birthdayReminders, setBirthdayReminders] = useState(profile.birthdayRemindersEnabled)
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
      anniversary_reminders_enabled: anniversaryReminders,
      birthday_reminders_enabled: birthdayReminders,
    })

    if (result.error) {
      setError(result.error)
    } else {
      setSaved(true)
      router.refresh()
    }
    setLoading(false)
  }

  const [slug, setSlug] = useState(profile.shareSlug ?? '')
  const [slugError, setSlugError] = useState<string | null>(null)
  const [slugSaved, setSlugSaved] = useState(false)
  const [slugLoading, setSlugLoading] = useState(false)

  const slugUnchanged = slug.toLowerCase() === (profile.shareSlug ?? '')

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.toLowerCase()
    setSlug(val)
    setSlugError(null)
    setSlugSaved(false)
  }

  function validateSlugLocally(val: string): string | null {
    const result = slugSchema.safeParse(val)
    return result.success ? null : (result.error.errors[0]?.message ?? 'Invalid slug')
  }

  async function handleSlugSubmit(e: React.FormEvent) {
    e.preventDefault()
    const localErr = validateSlugLocally(slug)
    if (localErr) { setSlugError(localErr); return }

    setSlugLoading(true)
    setSlugError(null)
    setSlugSaved(false)

    const result = await updateShareSlug(slug)
    if (result.error === 'slug_taken') {
      setSlugError('That slug is already taken — try another')
    } else if (result.error === 'slug_limit') {
      setSlugError('You can have up to 10 share slugs.')
    } else if (result.error) {
      setSlugError(result.error)
    } else {
      setSlugSaved(true)
      router.refresh()
    }
    setSlugLoading(false)
  }

  return (
    <div className="flex flex-col gap-5 max-w-lg">
      {/* Profile form */}
      <form onSubmit={handleSubmit} className="form-panel flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="full-name" className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted">Display name</label>
          <input id="full-name" value={fullName} onChange={e => setFullName(e.target.value)} className="input min-h-11" required />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="bio" className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted">
            Bio <span className="normal-case font-normal tracking-normal">(shown to recipients, 160 chars)</span>
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
          <label htmlFor="sender-name" className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted">
            Sender name <span className="normal-case font-normal tracking-normal">(in email From: field)</span>
          </label>
          <input
            id="sender-name"
            value={senderName}
            onChange={e => setSenderName(e.target.value)}
            placeholder={fullName || 'Your name'}
            className="input min-h-11"
          />
        </div>

        <label className="flex items-center gap-2.5 text-sm text-ink-muted cursor-pointer">
          <input
            type="checkbox"
            checked={anniversaryReminders}
            onChange={e => setAnniversaryReminders(e.target.checked)}
            className="h-4 w-4"
          />
          Send me annual reminders to write again
        </label>

        <label className="flex items-center gap-2.5 text-sm text-ink-muted cursor-pointer">
          <input
            type="checkbox"
            checked={birthdayReminders}
            onChange={e => setBirthdayReminders(e.target.checked)}
            className="h-4 w-4"
          />
          Send weekly birthday digests for tracked groups
        </label>

        {error && <p className="text-sm text-stamp">{error}</p>}
        {saved && <p className="text-sm text-sage">Profile saved.</p>}

        <button type="submit" disabled={loading} className="btn-primary min-h-11 max-w-[180px]">
          {loading ? 'Saving...' : 'Save profile'}
        </button>
      </form>

      {/* Slug mini-form */}
      <form onSubmit={handleSlugSubmit} className="form-panel flex flex-col gap-5">
        <div>
          <p className="eyebrow">Share link</p>
          <p className="mt-1 text-sm text-ink-muted">
            This is the link you share with people. Changing it will break any previously shared links.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center rounded-xl border border-border/80 bg-surface-raised px-3 min-h-11 gap-0">
            <span className="shrink-0 text-sm text-ink-muted select-none">{siteUrl}/share/</span>
            <input
              value={slug}
              onChange={handleSlugChange}
              onBlur={() => { if (slug) setSlugError(validateSlugLocally(slug)) }}
              placeholder="your-slug"
              className="flex-1 bg-transparent py-2 text-sm text-ink outline-none placeholder:text-ink-muted/50"
              minLength={3}
              maxLength={30}
            />
          </div>
          {slugError && <p className="text-sm text-stamp">{slugError}</p>}
          {slugSaved && (
            <p className="text-sm text-sage">
              Saved! Your new link: {siteUrl}/share/{slug}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={slugLoading || slugUnchanged}
          className="btn-primary min-h-11 max-w-[180px]"
        >
          {slugLoading ? 'Saving...' : 'Save slug'}
        </button>
      </form>
    </div>
  )
}
