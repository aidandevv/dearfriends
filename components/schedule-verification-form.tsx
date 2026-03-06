'use client'

import { useState } from 'react'
import { scheduleVerification } from '@/lib/actions/verification'
import { CalendarClock } from 'lucide-react'

export function ScheduleVerificationForm() {
  const [status, setStatus] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const result = await scheduleVerification(formData)
    setStatus(result.error ? `Error: ${result.error}` : 'Scheduled.')
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3 flex-wrap">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-muted font-medium flex items-center gap-1">
          <CalendarClock size={12} /> Send at
        </label>
        <input
          type="datetime-local"
          name="send_at"
          required
          className="input w-auto"
        />
      </div>
      <button type="submit" className="btn-outline text-sm px-4 py-2 w-auto rounded-full">
        Schedule
      </button>
      {status && <p className="text-xs text-ink-muted self-center">{status}</p>}
    </form>
  )
}
