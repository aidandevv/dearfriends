'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { verifySchema, type VerifyInput } from '@/lib/schemas'
import { US_STATES } from '@/lib/us-states'
import { handleVerifyToken, type VerificationContext } from '@/lib/actions/verification'
import { Postmark } from '@/components/ui/postmark'
import { PostalLineArt } from '@/components/ui/postal-line-art'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

export function VerificationForm({ token, context }: { token: string; context: Extract<VerificationContext, { valid: true }> }) {
  const [done, setDone] = useState<'confirmed' | 'updated' | 'optedout' | null>(null)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [optOutOpen, setOptOutOpen] = useState(false)
  const errorRef = useRef<HTMLDivElement>(null)
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<VerifyInput>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      address_line_1: context.contact.address_line_1,
      address_line_2: context.contact.address_line_2 ?? '',
      city: context.contact.city,
      state: context.contact.state,
      zip: context.contact.zip,
      is_international: context.contact.is_international,
      country: context.contact.country ?? '',
    },
  })
  const international = watch('is_international')

  useEffect(() => {
    if (error || Object.keys(errors).length > 0) errorRef.current?.focus()
  }, [error, errors])

  async function run(action: 'confirm' | 'optout', success: 'confirmed' | 'optedout') {
    setError(null)
    setPending(true)
    const result = await handleVerifyToken(token, action)
    setPending(false)
    setOptOutOpen(false)
    if (result.error) return setError(result.error)
    setDone(success)
  }

  async function onUpdate(data: VerifyInput) {
    setError(null)
    const result = await handleVerifyToken(token, 'update', data)
    if (result.error) return setError(result.error)
    setDone('updated')
  }

  if (done) {
    const messages = {
      confirmed: { heading: 'All confirmed.', body: 'Your address is correct. The sender now has the current details.' },
      updated: { heading: 'Address updated.', body: 'Thanks for keeping things current.' },
      optedout: { heading: "You're off the list.", body: "You won't receive further mailings from this list." },
    }
    const message = messages[done]
    return <PostalShell><div className="postal-card postal-card-plain flex max-w-sm flex-col items-center gap-3 px-7 py-8 text-center"><Postmark /><h1 className="font-serif text-3xl text-ink">{message.heading}</h1><p className="text-sm text-ink-muted">{message.body}</p></div></PostalShell>
  }

  const address = context.contact
  return (
    <PostalShell>
      <div className="postal-card w-full max-w-md px-6 py-7">
        <div className="mb-7 flex flex-col items-center"><Postmark /><p className="eyebrow mt-2">For {address.first_name}</p><h1 className="text-center font-serif text-3xl text-ink">Is your address still correct?</h1><p className="mt-2 text-center text-sm text-ink-muted">{context.senderName ? `${context.senderName} wants` : 'The sender wants'} to make sure their mail reaches you.</p></div>

        <div ref={errorRef} tabIndex={-1} aria-live="assertive">
          {(error || Object.keys(errors).length > 0) && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert"><p className="font-medium">Please check this form.</p>{error && <p>{error}</p>}{Object.values(errors).map((fieldError, index) => fieldError?.message ? <p key={index}>{String(fieldError.message)}</p> : null)}</div>}
        </div>

        {!editing ? (
          <div className="flex flex-col gap-4">
            <address className="rounded-xl border border-border/70 bg-linen px-4 py-3 text-sm not-italic leading-6 text-ink">
              {address.address_line_1}<br />{address.address_line_2 && <>{address.address_line_2}<br /></>}{address.city}, {address.state} {address.zip}{address.country && <><br />{address.country}</>}
            </address>
            <button type="button" onClick={() => void run('confirm', 'confirmed')} disabled={pending} className="btn-primary min-h-12 w-full">{pending ? 'Saving…' : 'Yes, this is correct'}</button>
            <button type="button" onClick={() => setEditing(true)} disabled={pending} className="btn-outline min-h-12 w-full">Update this address</button>
            <button type="button" onClick={() => setOptOutOpen(true)} disabled={pending} className="mx-auto block min-h-11 text-xs text-ink-muted underline-offset-2 hover:text-ink hover:underline">Opt out of future mailings</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onUpdate)} className="flex flex-col gap-4" noValidate>
            <fieldset><legend className="mb-2 text-xs font-medium text-ink-muted">Address type</legend><div className="grid grid-cols-2 gap-2" role="radiogroup">
              <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-border px-3 text-sm"><input type="radio" value="false" {...register('is_international', { setValueAs: value => value === 'true' })} />U.S.</label>
              <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-border px-3 text-sm"><input type="radio" value="true" {...register('is_international', { setValueAs: value => value === 'true' })} />International</label>
            </div></fieldset>
            <Field id="verify-address-1" label="Street address" error={errors.address_line_1?.message}><input id="verify-address-1" {...register('address_line_1')} className="input" aria-invalid={Boolean(errors.address_line_1)} /></Field>
            <Field id="verify-address-2" label="Apartment, suite, etc. (optional)"><input id="verify-address-2" {...register('address_line_2')} className="input" /></Field>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field id="verify-city" label="City" error={errors.city?.message}><input id="verify-city" {...register('city')} className="input" aria-invalid={Boolean(errors.city)} /></Field>
              <Field id="verify-state" label={international ? 'State / region' : 'State'} error={errors.state?.message}>{international ? <input id="verify-state" {...register('state')} className="input" aria-invalid={Boolean(errors.state)} /> : <select id="verify-state" {...register('state')} className="input" aria-invalid={Boolean(errors.state)}><option value="">Select</option>{US_STATES.map(state => <option key={state.code} value={state.code}>{state.name}</option>)}</select>}</Field>
              <Field id="verify-zip" label={international ? 'Postal code' : 'ZIP'} error={errors.zip?.message}><input id="verify-zip" {...register('zip')} className="input" aria-invalid={Boolean(errors.zip)} /></Field>
            </div>
            {international && <Field id="verify-country" label="Country" error={errors.country?.message}><input id="verify-country" {...register('country')} className="input" aria-invalid={Boolean(errors.country)} /></Field>}
            <button type="submit" disabled={isSubmitting || pending} className="btn-primary mt-2 min-h-12 w-full">{isSubmitting ? 'Saving…' : 'Save updated address'}</button>
            <button type="button" onClick={() => setEditing(false)} className="mx-auto block min-h-11 text-xs text-ink-muted underline-offset-2 hover:text-ink hover:underline">Cancel</button>
          </form>
        )}
      </div>
      <ConfirmDialog open={optOutOpen} title="Opt out of future mailings?" description={context.senderName ? `You will no longer receive mailings from ${context.senderName}'s list.` : 'You will no longer receive mailings from this list.'} confirmLabel="Opt out" destructive pending={pending} onCancel={() => setOptOutOpen(false)} onConfirm={() => run('optout', 'optedout')} />
    </PostalShell>
  )
}

function PostalShell({ children }: { children: React.ReactNode }) {
  return <main className="postal-page flex items-center justify-center p-6"><PostalLineArt variant="compact" className="postal-art left-1/2 top-1/2 h-[360px] w-[720px] -translate-x-1/2 -translate-y-1/2" /><div className="postal-page-content w-full max-w-md">{children}</div></main>
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-1"><label htmlFor={id} className="text-xs font-medium text-ink-muted">{label}</label>{children}{error && <p className="text-xs text-red-600" role="alert">{error}</p>}</div>
}
