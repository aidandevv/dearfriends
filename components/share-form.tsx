'use client'

import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail } from 'lucide-react'
import { upsertContact, submitNote, notifyAdminOfNote } from '@/lib/actions/contacts'
import { contactSchema, type ContactInput } from '@/lib/schemas'

function firstName(name: string | null) {
  return name?.trim().split(/\s+/)[0] ?? null
}

export function ShareForm({ adminId, senderName, senderBio }: { adminId: string; senderName: string | null; senderBio: string | null }) {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [contactId, setContactId] = useState<string | null>(null)
  const [recipientFirstName, setRecipientFirstName] = useState<string>('')
  const [note, setNote] = useState('')
  const [noteSubmitting, setNoteSubmitting] = useState(false)
  const [noteSubmitted, setNoteSubmitted] = useState(false)

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
    setRecipientFirstName(data.first_name)
    setContactId(result.contactId ?? null)
    setSubmitted(true)
  }

  async function handleNoteSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!contactId || !note.trim()) return
    setNoteSubmitting(true)
    const result = await submitNote(contactId, note)
    if (!result.error) {
      await notifyAdminOfNote({ adminId, recipientFirstName, note })
      setNoteSubmitted(true)
    }
    setNoteSubmitting(false)
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-linen flex items-center justify-center p-6">
        <div className="max-w-md w-full flex flex-col items-center text-center gap-4 animate-fade-up">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-terra text-terra">
            <Mail size={22} strokeWidth={1.5} />
          </div>
          <h1 className="font-serif text-3xl text-ink">Sealed &amp; sent.</h1>
          {displayName && (
            <div className="flex flex-col items-center gap-1">
              <p className="font-medium text-ink">{displayName}</p>
              {senderBio && <p className="text-sm text-ink-muted">{senderBio}</p>}
            </div>
          )}
          <p className="text-ink-muted text-sm leading-6">
            {displayName
              ? `Thanks, ${recipientFirstName}! Your address is saved. ${displayName} can't wait to send you something.`
              : 'Your address has been saved. Expect something special in the mail.'}
          </p>

          {contactId && !noteSubmitted && (
            <form onSubmit={handleNoteSubmit} className="w-full surface-panel px-4 py-4 flex flex-col gap-3">
              <label className="text-xs font-medium uppercase tracking-[0.22em] text-ink-muted text-left">
                Leave a note for {displayName ?? 'them'} (optional)
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value.slice(0, 280))}
                rows={3}
                placeholder={`Leave a note for ${displayName ?? 'them'}...`}
                className="input resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-muted">{note.length}/280</span>
                <button
                  type="submit"
                  disabled={noteSubmitting || !note.trim()}
                  className="btn-primary min-h-9 px-4 text-sm"
                >
                  {noteSubmitting ? 'Sending...' : 'Send note'}
                </button>
              </div>
            </form>
          )}

          {noteSubmitted && (
            <p className="text-sm text-ink-muted">Note sent ✓</p>
          )}
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-linen flex items-center justify-center p-6">
      <div className="max-w-md w-full animate-fade-up">
        <div className="flex flex-col items-center mb-8 text-center">
          {/* Postmark circle */}
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border-2 border-terra text-terra">
            <Mail size={22} strokeWidth={1.5} />
          </div>

          {displayName && (
            <p className="text-[11px] uppercase tracking-[0.16em] text-ink-muted mb-1.5">
              from {displayName}
            </p>
          )}

          <h1 className="font-serif text-[1.75rem] leading-snug text-ink">
            {displayName
              ? <>{displayName} wants to<br />send you something</>
              : <>Someone wants to<br />send you something</>}
          </h1>

          <p className="text-ink-muted text-sm mt-3 leading-6 max-w-[280px]">
            {senderBio ?? 'Share your address and something special will find its way to you.'}
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
            className="btn-primary flex items-center justify-center mt-1 min-h-12 w-full"
          >
            {isSubmitting ? 'Saving\u2026' : 'Send my address \u2192'}
          </button>
        </form>

        <p className="mt-5 text-center text-[11px] text-ink-muted/70">
          Powered by Dear Friends · your address stays private
        </p>
      </div>
    </main>
  )
}
