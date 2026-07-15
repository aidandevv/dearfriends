'use client'

import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { submitPublicContact } from '@/lib/actions/contacts'
import { contactSchema, type ContactInput } from '@/lib/schemas'
import { US_STATES } from '@/lib/us-states'
import { PostalLineArt } from '@/components/ui/postal-line-art'

function firstName(name: string | null) {
  return name?.trim().split(/\s+/)[0] ?? null
}

const inputClass =
  'w-full min-h-12 rounded-xl border border-line bg-white px-4 text-base text-ink transition-colors placeholder:text-ink-muted/60 focus:border-periwinkle focus:outline-none focus:ring-2 focus:ring-periwinkle/20'

function Field({ id, label, error, children }: {
  id?: string
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium text-ink-soft">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2.5 text-[13px] font-semibold text-ink-soft">
      {children}
      <span aria-hidden className="h-px flex-1 border-t border-dashed border-line" />
    </p>
  )
}

export function ShareForm({ shareCapability, senderName, senderBio, shareMessage }: {
  shareCapability: string
  senderName: string | null
  senderBio: string | null
  shareMessage?: string | null
}) {
  const [submitted, setSubmitted] = useState(false)
  const [alreadyOnFile, setAlreadyOnFile] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [recipientFirstName, setRecipientFirstName] = useState<string>('')
  const [note, setNote] = useState('')
  const [noteSubmitted, setNoteSubmitted] = useState(false)
  const [isInternational, setIsInternational] = useState(false)

  const displayName = useMemo(() => firstName(senderName) ?? senderName, [senderName])
  const recipientMessage = shareMessage?.trim() || "Can't wait to send you something"

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { delivery_method: 'print', state: '' },
  })

  async function onSubmit(data: ContactInput) {
    setServerError(null)
    const result = await submitPublicContact(shareCapability, data, note)
    if (result.error) {
      setServerError(typeof result.error === 'string' ? result.error : 'Something went wrong.')
      return
    }
    if ('alreadyExists' in result && result.alreadyExists) {
      setRecipientFirstName(data.first_name)
      setAlreadyOnFile(true)
      setSubmitted(true)
      return
    }
    setRecipientFirstName(data.first_name)
    setNoteSubmitted(Boolean(note.trim()))
    setSubmitted(true)
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <main className="postal-page flex items-center justify-center p-6">
        <PostalLineArt variant="compact" className="postal-art left-1/2 top-1/2 h-[360px] w-[720px] -translate-x-1/2 -translate-y-1/2" />
        <div className="postal-page-content postal-card postal-card-plain animate-fade-up flex w-full max-w-md flex-col items-center gap-5 px-7 py-8 text-center">
          {/* Peach stamp mark */}
          <span className="flex h-16 w-14 items-center justify-center rounded-[6px] bg-peach shadow-[0_10px_24px_-8px_rgba(232,146,124,0.6)]">
            <span className="flex h-[52px] w-[44px] items-center justify-center rounded-[3px] border border-dashed border-white/80 font-serif text-[16px] italic text-white">
              df
            </span>
          </span>

          <h1 className="font-serif text-[30px] font-normal text-ink" style={{ letterSpacing: '-0.02em' }}>
            {alreadyOnFile ? 'You\'re already on the list.' : 'Address received.'}
          </h1>

          <p className="text-[15px] leading-relaxed text-ink-soft">
            {alreadyOnFile
              ? (displayName
                ? `Thanks, ${recipientFirstName} — ${displayName} already has your address on file.`
                : 'Your friend already has your address on file.')
              : (displayName
                ? `Thanks, ${recipientFirstName} — ${displayName} can take it from here.`
                : 'Your address is on its way to your friend.')}
          </p>

          {senderBio && displayName && (
            <p className="text-[13.5px] text-ink-muted">{senderBio}</p>
          )}

          {noteSubmitted && <p className="text-[13.5px] text-ink-muted">Note sent ✓</p>}
        </div>
      </main>
    )
  }

  // ── Form state ─────────────────────────────────────────────────────────────
  return (
    <main className="postal-page px-5 py-10 sm:py-16">
      <PostalLineArt variant="full" className="postal-art-fixed -right-44 top-8 z-0 h-[70vh] w-[86vw]" />
      <div className="postal-page-content mx-auto w-full max-w-md">
        {/* Wordmark */}
        <p className="mb-8 text-center font-serif text-[17px] text-ink">
          <em className="italic">dear</em>friends
        </p>

        {/* Sender header */}
        <div className="mb-7 flex flex-col items-center text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-periwinkle font-serif text-[22px] text-white shadow-[0_8px_20px_-6px_rgba(74,108,212,0.5)]">
            {(displayName ?? 'A').charAt(0).toUpperCase()}
          </span>
          <h1 className="font-serif text-[26px] font-normal leading-tight text-ink" style={{ letterSpacing: '-0.02em' }}>
            {displayName ?? 'A friend'} wants to mail you something
          </h1>
          <p className="mt-2.5 max-w-xs font-serif text-[16px] italic leading-relaxed text-ink-soft">
            {recipientMessage}
          </p>
        </div>

        {serverError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        {/* Form card */}
        <div className="postal-card p-5 sm:p-7">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <GroupLabel>You</GroupLabel>

            <div className="grid grid-cols-2 gap-3">
              <Field id="first-name" label="First name" error={errors.first_name?.message}>
                <input id="first-name" {...register('first_name')} className={inputClass} />
              </Field>
              <Field id="last-name" label="Last name" error={errors.last_name?.message}>
                <input id="last-name" {...register('last_name')} className={inputClass} />
              </Field>
            </div>

            <Field id="email" label="Email" error={errors.email?.message}>
              <input id="email" {...register('email')} type="email" className={inputClass} />
            </Field>

            <GroupLabel>Where to send it</GroupLabel>

            <div
              className="grid grid-cols-2 gap-1 rounded-full bg-surface p-1"
              role="radiogroup"
              aria-label="Address location"
            >
              {[
                { value: false, label: 'U.S.' },
                { value: true, label: 'International' },
              ].map(tab => (
                <button
                  key={tab.label}
                  type="button"
                  role="radio"
                  aria-checked={isInternational === tab.value}
                  onClick={() => setIsInternational(tab.value)}
                  className={`min-h-10 rounded-full text-sm font-medium transition-all ${
                    isInternational === tab.value
                      ? 'bg-white text-periwinkle shadow-[0_2px_8px_-2px_rgba(35,41,64,0.18)]'
                      : 'text-ink-muted'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <input
              type="hidden"
              {...register('is_international', { setValueAs: value => value === true || value === 'true' })}
              value={isInternational ? 'true' : 'false'}
            />

            <Field id="address-line-1" label="Address" error={errors.address_line_1?.message}>
              <input id="address-line-1" {...register('address_line_1')} placeholder="Street address" className={inputClass} />
              <input
                aria-label="Address line 2"
                {...register('address_line_2')}
                placeholder="Apt, suite, etc. (optional)"
                className={`${inputClass} mt-1`}
              />
            </Field>

            <div className="grid grid-cols-3 gap-3">
              <Field id="city" label="City" error={errors.city?.message}>
                <input id="city" {...register('city')} className={inputClass} />
              </Field>
              <Field id="state" label={isInternational ? 'Region' : 'State'} error={errors.state?.message}>
                {isInternational ? (
                  <input id="state" {...register('state')} className={inputClass} />
                ) : (
                  <select id="state" {...register('state')} className={inputClass}>
                    <option value="">Select</option>
                    {US_STATES.map(state => (
                      <option key={state.code} value={state.code}>{state.name}</option>
                    ))}
                  </select>
                )}
              </Field>
              <Field id="zip" label={isInternational ? 'Postal' : 'ZIP'} error={errors.zip?.message}>
                <input id="zip" {...register('zip')} className={inputClass} />
              </Field>
            </div>

            {isInternational && (
              <Field id="country" label="Country" error={errors.country?.message}>
                <input id="country" {...register('country')} className={inputClass} placeholder="Country" />
              </Field>
            )}

            <div className="flex flex-col gap-2.5 rounded-xl bg-surface p-4">
              <div>
                <label htmlFor="share-note" className="text-[13px] font-medium text-ink-soft">
                  Note for {displayName ?? 'your friend'} (optional)
                </label>
                <p className="mt-1 text-[12.5px] leading-5 text-ink-muted">
                  Say hello, share a tiny life update, or leave a mailing note.
                </p>
              </div>
              <textarea
                id="share-note"
                value={note}
                onChange={e => setNote(e.target.value.slice(0, 280))}
                rows={3}
                placeholder={displayName ? `Hi ${displayName}, I wanted to say…` : 'A quick note…'}
                className={`${inputClass} resize-none py-3`}
              />
              <div className="flex justify-end text-[12px] text-ink-muted">{note.length}/280</div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 flex min-h-12 w-full items-center justify-center rounded-full bg-periwinkle text-[15px] font-medium text-white shadow-[0_6px_20px_-6px_rgba(74,108,212,0.55)] transition-all hover:bg-periwinkle-deep disabled:opacity-50"
            >
              {isSubmitting ? 'Saving…' : 'Send my address'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-[11.5px] text-ink-muted/80">
          Powered by dearfriends · your address stays private
        </p>
      </div>
    </main>
  )
}
