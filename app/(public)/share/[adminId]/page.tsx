'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { contactSchema, type ContactInput } from '@/lib/schemas'
import { upsertContact } from '@/lib/actions/contacts'
import { Postmark } from '@/components/ui/postmark'
import { Mail } from 'lucide-react'

export default function SharePage({ params }: { params: Promise<{ adminId: string }> }) {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { delivery_method: 'print' },
  })

  async function onSubmit(data: ContactInput) {
    const { adminId } = await params
    const result = await upsertContact(adminId, data)
    if (result.error) {
      setServerError(typeof result.error === 'string' ? result.error : 'Something went wrong.')
    } else {
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-linen flex items-center justify-center p-6">
        <div className="max-w-md w-full flex flex-col items-center text-center gap-3">
          <Postmark />
          <h1 className="font-serif text-3xl text-ink">Sealed &amp; sent.</h1>
          <p className="text-ink-muted text-sm">Your address has been saved. Expect something special in the mail.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-linen flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="flex flex-col items-center mb-8">
          <Postmark />
          <h1 className="font-serif text-3xl text-ink text-center">Share your address</h1>
          <p className="text-ink-muted text-sm mt-2 text-center">
            Something special is being put together, and they&apos;d love to send it your way.
          </p>
        </div>

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink-muted font-medium">First name</label>
              <input {...register('first_name')} className="input" />
              {errors.first_name && <p className="text-xs text-red-500">{errors.first_name.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink-muted font-medium">Last name</label>
              <input {...register('last_name')} className="input" />
              {errors.last_name && <p className="text-xs text-red-500">{errors.last_name.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-ink-muted font-medium">Email</label>
            <input {...register('email')} type="email" className="input" />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-ink-muted font-medium">Address</label>
            <input {...register('address_line_1')} placeholder="Street address" className="input" />
            {errors.address_line_1 && <p className="text-xs text-red-500">{errors.address_line_1.message}</p>}
            <input
              {...register('address_line_2')}
              placeholder="Apt, suite, etc. (optional)"
              className="input mt-2"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink-muted font-medium">City</label>
              <input {...register('city')} className="input" />
              {errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink-muted font-medium">State</label>
              <input {...register('state')} className="input" />
              {errors.state && <p className="text-xs text-red-500">{errors.state.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink-muted font-medium">ZIP</label>
              <input {...register('zip')} className="input" />
              {errors.zip && <p className="text-xs text-red-500">{errors.zip.message}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex items-center justify-center gap-2 mt-2 w-full"
          >
            <Mail size={16} />
            {isSubmitting ? 'Saving\u2026' : 'Submit my address'}
          </button>
        </form>
      </div>
    </main>
  )
}
