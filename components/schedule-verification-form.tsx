'use client'

import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { scheduleVerification } from '@/lib/actions/verification'
import { CalendarClock } from 'lucide-react'
import { ActionFeedback } from '@/components/ui/action-feedback'
import type { ActionState } from '@/lib/action-result'

export function ScheduleVerificationForm() {
  const timeZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', [])
  const [feedback, setFeedback] = useState<{ state: ActionState; message: string } | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const localValue = new FormData(form).get('send_at_local')
    if (typeof localValue !== 'string' || !localValue) return
    const date = new Date(localValue)
    if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
      setFeedback({ state: 'error', message: 'Choose a future date and time.' })
      return
    }
    const formData = new FormData()
    formData.set('send_at', date.toISOString())
    formData.set('time_zone', timeZone)
    setPending(true)
    setFeedback({ state: 'pending', message: 'Scheduling…' })
    const result = await scheduleVerification(formData)
    setPending(false)
    if (result.error) setFeedback({ state: 'error', message: result.error })
    else {
      setFeedback({ state: result.warning ? 'error' : 'saved', message: result.warning ?? `Scheduled for ${date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZoneName: 'short' })}.` })
      form.reset()
    }
  }

  const minimum = new Date(Date.now() + 60_000).toISOString().slice(0, 16)
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="verification-send-at" className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-ink-muted"><CalendarClock size={14} />Send at</label>
        <input id="verification-send-at" type="datetime-local" name="send_at_local" min={minimum} required className="input min-h-12 text-sm" />
        <p className="text-xs text-ink-muted">Times use {timeZone.replaceAll('_', ' ')}.</p>
      </div>
      <button type="submit" disabled={pending} className="btn-primary min-h-12 text-sm">{pending ? 'Scheduling…' : 'Schedule verification'}</button>
      {feedback && <ActionFeedback {...feedback} className="text-sm" />}
    </form>
  )
}
