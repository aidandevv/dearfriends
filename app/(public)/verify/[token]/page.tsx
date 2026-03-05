'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { verifySchema, type VerifyInput } from '@/lib/schemas'
import { handleVerifyToken } from '@/lib/actions/verification'

export default function VerifyPage({ params }: { params: Promise<{ token: string }> }) {
  const [done, setDone] = useState<'confirmed' | 'updated' | 'optedout' | null>(null)
  const [editing, setEditing] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyInput>({
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
      confirmed: 'Your address is confirmed. Thanks!',
      updated: 'Your address has been updated. Thanks!',
      optedout: "You've been opted out. You won't receive further mailings.",
    }

    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <p className="text-sm text-gray-600">{messages[done]}</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <h1 className="text-xl font-semibold mb-4">Verify your address</h1>

        {!editing ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-600">Is your address still correct?</p>
            <button onClick={handleConfirm} className="bg-black text-white rounded px-4 py-2 text-sm">
              Yes, confirm
            </button>
            <button onClick={() => setEditing(true)} className="border rounded px-4 py-2 text-sm">
              No, update my address
            </button>
            <button onClick={handleOptOut} className="text-sm text-red-500 hover:underline text-left mt-2">
              Opt out of future mailings
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onUpdate)} className="flex flex-col gap-3">
            <input {...register('address_line_1')} placeholder="Address line 1" className="border rounded px-3 py-2 text-sm" />
            {errors.address_line_1 && <p className="text-xs text-red-500">{String(errors.address_line_1.message)}</p>}

            <input
              {...register('address_line_2')}
              placeholder="Address line 2 (optional)"
              className="border rounded px-3 py-2 text-sm"
            />

            <div className="grid grid-cols-3 gap-2">
              <input {...register('city')} placeholder="City" className="border rounded px-3 py-2 text-sm" />
              <input {...register('state')} placeholder="State" className="border rounded px-3 py-2 text-sm" />
              <input {...register('zip')} placeholder="ZIP" className="border rounded px-3 py-2 text-sm" />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Update address'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
