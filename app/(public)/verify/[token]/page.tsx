'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { verifySchema, type VerifyInput } from '@/lib/schemas'
import { handleVerifyToken } from '@/lib/actions/verification'
import { Postmark } from '@/components/ui/postmark'

export default function VerifyPage({ params }: { params: Promise<{ token: string }> }) {
  const [done, setDone] = useState<'confirmed' | 'updated' | 'optedout' | null>(null)
  const [editing, setEditing] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<VerifyInput>({
    resolver: zodResolver(verifySchema),
  })

  async function handleConfirm() {
    const { token } = await params
    await handleVerifyToken(token, 'confirm')
    setDone('confirmed')
  }

  async function handleOptOut() {
    if (!confirm('Are you sure you want to opt out?')) return
    const { token } = await params
    await handleVerifyToken(token, 'optout')
    setDone('optedout')
  }

  async function onUpdate(data: VerifyInput) {
    const { token } = await params
    await handleVerifyToken(token, 'update', data)
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
      <main className="min-h-screen bg-linen flex items-center justify-center p-6">
        <div className="flex flex-col items-center text-center gap-3 max-w-sm">
          <Postmark />
          <h1 className="font-serif text-3xl text-ink">{msg.heading}</h1>
          <p className="text-ink-muted text-sm">{msg.body}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-linen flex items-center justify-center p-6">
      <div className="max-w-sm w-full">
        <div className="flex flex-col items-center mb-8">
          <Postmark />
          <h1 className="font-serif text-3xl text-ink text-center">Is your address still correct?</h1>
          <p className="text-ink-muted text-sm mt-2 text-center">
            Something special is heading your way &mdash; we want to make sure it reaches you.
          </p>
        </div>

        {!editing ? (
          <div className="flex flex-col gap-3">
            <button onClick={handleConfirm} className="btn-primary w-full">
              Yes, my address is correct
            </button>
            <button onClick={() => setEditing(true)} className="btn-outline w-full">
              No, I need to update it
            </button>
            <button
              onClick={handleOptOut}
              className="text-xs text-ink-muted hover:text-ink underline-offset-2 hover:underline mt-2 mx-auto block"
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
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-2">
              {isSubmitting ? 'Saving...' : 'Update my address'}
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
