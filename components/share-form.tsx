'use client'

import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail } from 'lucide-react'
import { upsertContact } from '@/lib/actions/contacts'
import { contactSchema, type ContactInput } from '@/lib/schemas'
import { Postmark } from '@/components/ui/postmark'

function firstName(name: string | null) {
  return name?.trim().split(/\s+/)[0] ?? null
}

export function ShareForm({ adminId, senderName }: { adminId: string; senderName: string | null }) {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const displayName = useMemo(() => firstName(senderName) ?? senderName, [senderName])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { delivery_method: 'print' },
  })

  async function onSubmit(data: ContactInput) {
    const result = await upsertContact(adminId, data)
    if (result.error) {
      setServerError(typeof result.error === 'string' ? result.error : 'Something went wrong.')
      return
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-linen flex items-center justify-center p-6">
        <div className="max-w-md w-full flex flex-col items-center text-center gap-3 animate-fade-up">
          <Postmark />
          <h1 className="font-serif text-3xl text-ink">Sealed &amp; sent.</h1>
          <p className="text-ink-muted text-sm leading-6">
            Your address has been saved.
            {displayName ? ` ${displayName} now has what they need to send something special.` : ' Expect something special in the mail.'}
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-linen flex items-center justify-center p-6">
      <div className="max-w-md w-full animate-fade-up">
        <div className="flex flex-col items-center mb-8 text-center">
          <Postmark />
          <div className="info-chip">
            <Mail size={14} className="text-terra" />
            Address request
          </div>
          <h1 className="font-serif text-3xl text-ink mt-5">Share your address</h1>
          <p className="text-ink-muted text-sm mt-3 leading-6 max-w-sm">
            {displayName
              ? `${displayName} is putting together something special and would love to send it your way.`
              : 'Something special is being put together, and they would love to send it your way.'}
          </p>
        </div>

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="surface-panel flex flex-col gap-5 px-5 py-5 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink-muted font-medium uppercase tracking-[0.18em]">First name</label>
              <input {...register('first_name')} className="input min-h-11" />
              {errors.first_name && <p className="text-xs text-red-500">{errors.first_name.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink-muted font-medium uppercase tracking-[0.18em]">Last name</label>
              <input {...register('last_name')} className="input min-h-11" />
              {errors.last_name && <p className="text-xs text-red-500">{errors.last_name.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-ink-muted font-medium uppercase tracking-[0.18em]">Email</label>
            <input {...register('email')} type="email" className="input min-h-11" />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-ink-muted font-medium uppercase tracking-[0.18em]">Address</label>
            <input {...register('address_line_1')} placeholder="Street address" className="input min-h-11" />
            {errors.address_line_1 && <p className="text-xs text-red-500">{errors.address_line_1.message}</p>}
            <input
              {...register('address_line_2')}
              placeholder="Apt, suite, etc. (optional)"
              className="input min-h-11 mt-2"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink-muted font-medium uppercase tracking-[0.18em]">City</label>
              <input {...register('city')} className="input min-h-11" />
              {errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink-muted font-medium uppercase tracking-[0.18em]">State</label>
              <input {...register('state')} className="input min-h-11" />
              {errors.state && <p className="text-xs text-red-500">{errors.state.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink-muted font-medium uppercase tracking-[0.18em]">ZIP</label>
              <input {...register('zip')} className="input min-h-11" />
              {errors.zip && <p className="text-xs text-red-500">{errors.zip.message}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex items-center justify-center gap-2 mt-1 min-h-12 w-full"
          >
            <Mail size={16} />
            {isSubmitting ? 'Saving\u2026' : 'Submit my address'}
          </button>
        </form>
      </div>
    </main>
  )
}
