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

const newsreader = "var(--font-ppwriter), Georgia, serif"
const caveat = "var(--font-caveat), cursive"

export function ShareForm({ adminId, senderName, senderBio, autoGroupId }: {
  adminId: string
  senderName: string | null
  senderBio: string | null
  autoGroupId?: string | null
}) {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [contactId, setContactId] = useState<string | null>(null)
  const [recipientFirstName, setRecipientFirstName] = useState<string>('')
  const [note, setNote] = useState('')
  const [noteSubmitting, setNoteSubmitting] = useState(false)
  const [noteSubmitted, setNoteSubmitted] = useState(false)
  const [isInternational, setIsInternational] = useState(false)

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
    setServerError(null)
    const result = await upsertContact(adminId, data, autoGroupId)
    if (result.error) {
      setServerError(typeof result.error === 'string' ? result.error : 'Something went wrong.')
      return
    }
    setRecipientFirstName(data.first_name)
    setContactId(result.contactId ?? null)

    if (result.contactId && note.trim()) {
      const noteResult = await submitNote(result.contactId, note)
      if (!noteResult.error) {
        await notifyAdminOfNote({ adminId, recipientFirstName: data.first_name, note })
        setNoteSubmitted(true)
      }
    }

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

  // ── Success state ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <main
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: '#faf4e4' }}
      >
        <div className="max-w-md w-full flex flex-col items-center text-center gap-4 animate-fade-up">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-blue-ink text-blue-ink">
            <Mail size={22} strokeWidth={1.5} />
          </div>
          <h1 style={{ fontFamily: newsreader, fontSize: 30, fontWeight: 400, color: '#1d2442' }}>
            Sealed &amp; sent.
          </h1>
          {displayName && (
            <div className="flex flex-col items-center gap-1">
              <p style={{ fontFamily: newsreader, fontSize: 18, fontStyle: 'italic', color: '#3358ba' }}>
                {displayName}
              </p>
              {senderBio && <p className="text-sm text-ink-muted">{senderBio}</p>}
            </div>
          )}
          <p className="text-ink-muted text-sm leading-6">
            {displayName
              ? `Thanks, ${recipientFirstName}! Your address is saved. ${displayName} can't wait to send you something.`
              : 'Your address has been saved. Expect something special in the mail.'}
          </p>

          {contactId && !noteSubmitted && (
            <form
              onSubmit={handleNoteSubmit}
              className="w-full flex flex-col gap-3"
              style={{ background: 'white', border: '1px solid #d9cfb0', borderRadius: 10, padding: '16px 20px' }}
            >
              <label className="text-xs font-medium uppercase tracking-[0.22em] text-ink-muted text-left">
                Leave a note for {displayName ?? 'them'} (optional)
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value.slice(0, 280))}
                rows={3}
                placeholder={`Leave a note for ${displayName ?? 'them'}…`}
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

          {noteSubmitted && <p className="text-sm text-ink-muted">Note sent ✓</p>}
        </div>
      </main>
    )
  }

  // ── Form state — split layout ──────────────────────────────────────────────
  return (
    <div className="flex min-h-screen">
      {/* Left panel: sender identity */}
      <div
        className="hidden md:flex md:w-[38%] min-h-screen flex-col items-center justify-between py-12 px-8 relative overflow-hidden flex-shrink-0"
        style={{ background: '#faf4e4', borderRight: '1px solid #d9cfb0' }}
      >
        {/* Grain texture */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(rgba(140,110,50,.07) 1px, transparent 1px)',
            backgroundSize: '3px 3px',
            opacity: 0.6,
          }}
        />

        {/* Brand */}
        <div style={{ fontFamily: newsreader, fontSize: 18, color: '#1d2442', position: 'relative', zIndex: 1 }}>
          <em>dear</em>friends
        </div>

        {/* Sender block */}
        <div className="flex flex-col items-center gap-5 relative z-10 text-center">
          {/* Mini envelope */}
          <div style={{
            width: 120, height: 75,
            background: '#f5ecd3',
            border: '1px solid #d9cfb0',
            borderRadius: 3,
            transform: 'rotate(3deg)',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 12px 30px -10px rgba(45,35,10,.25)',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 7,
              background: 'repeating-linear-gradient(-45deg, #3358ba 0 5px, transparent 5px 10px, #b8453b 10px 15px, transparent 15px 20px)',
              opacity: 0.8,
            }} />
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: 7,
              background: 'repeating-linear-gradient(-45deg, #3358ba 0 5px, transparent 5px 10px, #b8453b 10px 15px, transparent 15px 20px)',
              opacity: 0.8,
            }} />
            <div style={{
              position: 'absolute', top: 10, right: 10,
              width: 26, height: 32, background: '#E4CE95',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                width: 20, height: 26, background: '#3358ba',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: newsreader, fontSize: 8, fontStyle: 'italic', color: '#E4CE95',
              }}>df</div>
            </div>
          </div>

          <div>
            <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#6b7290', marginBottom: 6 }}>
              from
            </p>
            <p style={{ fontFamily: newsreader, fontStyle: 'italic', fontSize: 26, color: '#3358ba', lineHeight: 1.1 }}>
              {displayName ?? 'a friend'}
            </p>
            {senderBio && (
              <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: 13, color: '#6b7290', marginTop: 6, lineHeight: 1.5, maxWidth: 200 }}>
                {senderBio}
              </p>
            )}
          </div>

          <p style={{ fontFamily: caveat, fontSize: 17, color: '#3a4263', lineHeight: 1.5 }}>
            Can&apos;t wait to send<br />you something ✉
          </p>
        </div>

        <div aria-hidden style={{ height: 18 }} />
      </div>

      {/* Right panel: form */}
      <div className="flex flex-1 items-center justify-center p-8" style={{ background: 'white' }}>
        <div className="w-full max-w-[420px]">
          {/* Mobile-only sender header */}
          <div className="md:hidden flex flex-col items-center text-center mb-6">
            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#6b7290', marginBottom: 4 }}>
              from
            </p>
            <p style={{ fontFamily: newsreader, fontStyle: 'italic', fontSize: 22, color: '#3358ba' }}>
              {displayName ?? 'a friend'}
            </p>
          </div>

          <h1 style={{ fontFamily: newsreader, fontSize: 26, fontWeight: 400, color: '#1d2442', marginBottom: 4 }}>
            Share your address
          </h1>
          <p className="text-sm text-ink-muted mb-6">
            {displayName
              ? `${displayName} will use this to send you something in the mail.`
              : 'Your address will be used to send you something special.'}
          </p>

          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
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

            <div
              className="grid grid-cols-2 gap-2 rounded-full border border-border bg-linen p-1"
              role="tablist"
              aria-label="Address location"
            >
              {[
                { value: false, label: 'U.S.' },
                { value: true, label: 'International' },
              ].map(tab => (
                <button
                  key={tab.label}
                  type="button"
                  role="tab"
                  aria-selected={isInternational === tab.value}
                  onClick={() => setIsInternational(tab.value)}
                  className="min-h-10 rounded-full text-sm font-medium transition-colors"
                  style={{
                    background: isInternational === tab.value ? 'var(--blue-ink)' : 'transparent',
                    color: isInternational === tab.value ? 'white' : 'var(--ink-muted)',
                  }}
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
                <label className="text-xs text-ink-muted font-medium uppercase tracking-[0.18em]">{isInternational ? 'Region' : 'State'}</label>
                <input {...register('state')} className="input min-h-11" />
                {errors.state && <p className="text-xs text-red-500">{errors.state.message}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-ink-muted font-medium uppercase tracking-[0.18em]">{isInternational ? 'Postal' : 'ZIP'}</label>
                <input {...register('zip')} className="input min-h-11" />
                {errors.zip && <p className="text-xs text-red-500">{errors.zip.message}</p>}
              </div>
            </div>

            {isInternational && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-ink-muted font-medium uppercase tracking-[0.18em]">Country</label>
                <input {...register('country')} className="input min-h-11" placeholder="Country" />
                {errors.country && <p className="text-xs text-red-500">{errors.country.message}</p>}
              </div>
            )}

            <div
              className="flex flex-col gap-2"
              style={{
                background: '#faf4e4',
                border: '1px solid #d9cfb0',
                borderRadius: 10,
                padding: '14px 16px',
              }}
            >
              <div>
                <label className="text-xs text-ink-muted font-medium uppercase tracking-[0.18em]">
                  Note for {displayName ?? 'your friend'} (optional)
                </label>
                <p className="mt-1 text-xs leading-5 text-ink-muted">
                  Say hello, share a tiny life update, or leave a mailing note.
                </p>
              </div>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value.slice(0, 280))}
                rows={3}
                placeholder={displayName ? `Hi ${displayName}, I wanted to say…` : 'A quick note…'}
                className="input resize-none bg-white"
              />
              <div className="flex justify-end text-xs text-ink-muted">{note.length}/280</div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex items-center justify-center mt-1 min-h-12 w-full"
            >
              {isSubmitting ? 'Saving…' : 'Send my address →'}
            </button>
          </form>

          <p className="mt-5 text-center text-[11px] text-ink-muted/70">
            Powered by dearfriends · your address stays private
          </p>
        </div>
      </div>
    </div>
  )
}
