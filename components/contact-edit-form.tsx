'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateContactDetails } from '@/lib/actions/contacts'
import { contactEditSchema, type ContactEditInput } from '@/lib/schemas'
import type { Contact } from '@/lib/database.types'

const inputClass =
  'w-full min-h-10 rounded-lg border border-line bg-white px-3 text-sm text-ink transition-colors placeholder:text-ink-muted/60 focus:border-periwinkle focus:outline-none focus:ring-2 focus:ring-periwinkle/20'

function toFormValues(contact: Contact): ContactEditInput {
  return {
    first_name: contact.first_name,
    last_name: contact.last_name,
    email: contact.email,
    address_line_1: contact.address_line_1,
    address_line_2: contact.address_line_2 ?? '',
    city: contact.city,
    state: contact.state,
    zip: contact.zip,
    is_international: contact.is_international,
    country: contact.country ?? '',
    tags: contact.tags.join(', '),
  }
}

export function ContactEditForm({
  contact,
  onCancel,
  onSaved,
}: {
  contact: Contact
  onCancel: () => void
  onSaved: () => void
}) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ContactEditInput>({
    resolver: zodResolver(contactEditSchema),
    defaultValues: toFormValues(contact),
  })

  const isInternational = watch('is_international')

  async function onSubmit(data: ContactEditInput) {
    setServerError(null)
    const result = await updateContactDetails(contact.id, data)
    if (result.error) {
      setServerError(typeof result.error === 'string' ? result.error : 'Could not save contact.')
      return
    }
    router.refresh()
    onSaved()
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="border-t border-dashed border-line bg-paper-2/70 px-6 py-5"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">
          Edit contact
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="btn-outline min-h-9 px-3 text-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary min-h-9 px-3 text-xs"
          >
            {isSubmitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-xs font-medium text-ink-soft">First name</span>
          <input {...register('first_name')} className={inputClass} />
          {errors.first_name && <span className="text-xs text-stamp">{errors.first_name.message}</span>}
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-xs font-medium text-ink-soft">Last name</span>
          <input {...register('last_name')} className={inputClass} />
          {errors.last_name && <span className="text-xs text-stamp">{errors.last_name.message}</span>}
        </label>

        <label className="flex flex-col gap-1.5 text-sm md:col-span-2">
          <span className="text-xs font-medium text-ink-soft">Email</span>
          <input {...register('email')} type="email" className={inputClass} />
          {errors.email && <span className="text-xs text-stamp">{errors.email.message}</span>}
        </label>

        <label className="flex flex-col gap-1.5 text-sm md:col-span-2">
          <span className="text-xs font-medium text-ink-soft">Address line 1</span>
          <input {...register('address_line_1')} className={inputClass} />
          {errors.address_line_1 && <span className="text-xs text-stamp">{errors.address_line_1.message}</span>}
        </label>

        <label className="flex flex-col gap-1.5 text-sm md:col-span-2">
          <span className="text-xs font-medium text-ink-soft">Address line 2</span>
          <input {...register('address_line_2')} className={inputClass} />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-xs font-medium text-ink-soft">City</span>
          <input {...register('city')} className={inputClass} />
          {errors.city && <span className="text-xs text-stamp">{errors.city.message}</span>}
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-xs font-medium text-ink-soft">State / region</span>
          <input {...register('state')} className={inputClass} />
          {errors.state && <span className="text-xs text-stamp">{errors.state.message}</span>}
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-xs font-medium text-ink-soft">ZIP / postal code</span>
          <input {...register('zip')} className={inputClass} />
          {errors.zip && <span className="text-xs text-stamp">{errors.zip.message}</span>}
        </label>

        <label className="flex items-center gap-2 text-sm text-ink-soft md:col-span-2">
          <input type="checkbox" {...register('is_international')} className="h-4 w-4" />
          International address
        </label>

        {isInternational && (
          <label className="flex flex-col gap-1.5 text-sm md:col-span-2">
            <span className="text-xs font-medium text-ink-soft">Country</span>
            <input {...register('country')} className={inputClass} />
            {errors.country && <span className="text-xs text-stamp">{errors.country.message}</span>}
          </label>
        )}

        <label className="flex flex-col gap-1.5 text-sm md:col-span-2">
          <span className="text-xs font-medium text-ink-soft">Tags (comma-separated)</span>
          <input {...register('tags')} placeholder="family, college" className={inputClass} />
        </label>
      </div>

      {serverError && (
        <p className="mt-4 text-sm text-stamp">{serverError}</p>
      )}
    </form>
  )
}
