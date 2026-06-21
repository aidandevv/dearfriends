'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { verifySchema, type VerifyInput } from '@/lib/schemas'
import { handleVerifyToken } from '@/lib/actions/verification'
import { Postmark } from '@/components/ui/postmark'
import { PostalLineArt } from '@/components/ui/postal-line-art'

export default function VerifyPage({ params }: { params: Promise<{ token: string }> }) {
  const [done, setDone] = useState<'confirmed' | 'updated' | 'optedout' | null>(null)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<VerifyInput>({
    resolver: zodResolver(verifySchema),
  })

  async function handleConfirm() {
    setError(null)
    setPending(true)
    const { token } = await params
    const result = await handleVerifyToken(token, 'confirm')
    setPending(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setDone('confirmed')
  }

  async function handleOptOut() {
    if (!confirm('Are you sure you want to opt out?')) return
    setError(null)
    setPending(true)
    const { token } = await params
    const result = await handleVerifyToken(token, 'optout')
    setPending(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setDone('optedout')
  }

  async function onUpdate(data: VerifyInput) {
    setError(null)
    const { token } = await params
    const result = await handleVerifyToken(token, 'update', data)
    if (result.error) {
      setError(result.error)
      return
    }
    setDone('updated')
  }

  if (done) {
    const messages = {
      confirmed: { heading: 'All confirmed.', body: 'Your address is correct. Something is on its way.' },
      updated: { heading: 'Address updated.', body: 'Thanks for keeping things current.' },
      optedout: { heading: "You're off the list.", body: "You won't receive any further mailings." },
    }
    const msg = messages[done]

    return (
      <main className="postal-page flex items-center justify-center p-6">
        <PostalLineArt variant="compact" className="postal-art left-1/2 top-1/2 h-[360px] w-[720px] -translate-x-1/2 -translate-y-1/2" />
        <div className="postal-page-content postal-card postal-card-plain flex max-w-sm flex-col items-center gap-3 px-7 py-8 text-center">
          <Postmark />
          <h1 className="font-serif text-3xl text-ink">{msg.heading}</h1>
          <p className="text-ink-muted text-sm">{msg.body}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="postal-page flex items-center justify-center p-6">
      <PostalLineArt variant="compact" className="postal-art left-1/2 top-1/2 h-[360px] w-[720px] -translate-x-1/2 -translate-y-1/2" />
      <div className="postal-page-content postal-card max-w-sm w-full px-6 py-7">
        <div className="flex flex-col items-center mb-8">
          <Postmark />
          <h1 className="font-serif text-3xl text-ink text-center">Is your address still correct?</h1>
          <p className="text-ink-muted text-sm mt-2 text-center">
            Something special is heading your way &mdash; we want to make sure it reaches you.
          </p>
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700">
            {error}
          </p>
        )}

        {!editing ? (
          <div className="flex flex-col gap-3">
            <button onClick={handleConfirm} disabled={pending} className="btn-primary w-full">
              {pending ? 'Saving...' : 'Yes, my address is correct'}
            </button>
            <button onClick={() => setEditing(true)} disabled={pending} className="btn-outline w-full">
              No, I need to update it
            </button>
            <button
              onClick={handleOptOut}
              disabled={pending}
              className="text-xs text-ink-muted hover:text-ink underline-offset-2 hover:underline mt-2 mx-auto block disabled:opacity-50"
            >
              Opt out of future mailings
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onUpdate)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink-muted font-medium">Address</label>
              <input {...register('address_line_1')} placeholder="Street address" className="input" />
              {errors.address_line_1 && <p className="text-xs text-red-500">{String(errors.address_line_1.message)}</p>}
              <input {...register('address_line_2')} placeholder="Apt, suite, etc. (optional)" className="input mt-2" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-ink-muted font-medium">City</label>
                <input {...register('city')} className="input" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-ink-muted font-medium">State</label>
                <input {...register('state')} className="input" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-ink-muted font-medium">ZIP</label>
                <input {...register('zip')} className="input" />
              </div>
            </div>
            <button type="submit" disabled={isSubmitting || pending} className="btn-primary w-full mt-2">
              {isSubmitting || pending ? 'Saving...' : 'Update my address'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-xs text-ink-muted hover:text-ink underline-offset-2 hover:underline mx-auto block"
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
