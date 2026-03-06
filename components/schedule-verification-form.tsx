'use client'

import type { FormEvent } from 'react'
import { useState } from 'react'
import { scheduleVerification } from '@/lib/actions/verification'
import { CalendarClock } from 'lucide-react'

export function ScheduleVerificationForm() {
  const [status, setStatus] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const result = await scheduleVerification(formData)
    setStatus(result.error ? `Error: ${result.error}` : 'Scheduled.')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-ink-muted">
          <CalendarClock size={14} />
          Send at
        </label>
        <input
          type="datetime-local"
          name="send_at"
          required
          className="input min-h-12 text-sm"
        />
      </div>
      <button type="submit" className="btn-primary min-h-12 text-sm">
        Schedule verification
      </button>
      {status && <p className="text-sm text-ink-muted">{status}</p>}
    </form>
  )
}
