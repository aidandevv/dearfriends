'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { contactSchema, type ContactInput } from '@/lib/schemas'
import { upsertContact } from '@/lib/actions/contacts'

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
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <h1 className="text-xl font-semibold mb-2">Thanks!</h1>
          <p className="text-sm text-gray-600">Your address has been saved.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-md w-full flex flex-col gap-4">
        <h1 className="text-xl font-semibold">Share your address</h1>

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <input {...register('first_name')} placeholder="First name" className="border rounded px-3 py-2 text-sm w-full" />
            {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name.message}</p>}
          </div>
          <div>
            <input {...register('last_name')} placeholder="Last name" className="border rounded px-3 py-2 text-sm w-full" />
            {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name.message}</p>}
          </div>
        </div>

        <div>
          <input {...register('email')} type="email" placeholder="Email" className="border rounded px-3 py-2 text-sm w-full" />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <input {...register('address_line_1')} placeholder="Address line 1" className="border rounded px-3 py-2 text-sm w-full" />
          {errors.address_line_1 && <p className="text-xs text-red-500 mt-1">{errors.address_line_1.message}</p>}
        </div>

        <input {...register('address_line_2')} placeholder="Address line 2 (optional)" className="border rounded px-3 py-2 text-sm w-full" />

        <div className="grid grid-cols-3 gap-3">
          <div>
            <input {...register('city')} placeholder="City" className="border rounded px-3 py-2 text-sm w-full" />
            {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>}
          </div>
          <div>
            <input {...register('state')} placeholder="State" className="border rounded px-3 py-2 text-sm w-full" />
            {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state.message}</p>}
          </div>
          <div>
            <input {...register('zip')} placeholder="ZIP" className="border rounded px-3 py-2 text-sm w-full" />
            {errors.zip && <p className="text-xs text-red-500 mt-1">{errors.zip.message}</p>}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-50"
        >
          {isSubmitting ? 'Saving\u2026' : 'Submit'}
        </button>
      </form>
    </main>
  )
}
