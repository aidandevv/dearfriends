'use client'

import { useState } from 'react'
import { scheduleVerification } from '@/lib/actions/verification'

export function ScheduleVerificationForm() {
  const [status, setStatus] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const result = await scheduleVerification(formData)
    setStatus(result.error ? `Error: ${result.error}` : 'Scheduled.')
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div>
        <label className="text-xs text-gray-500 block mb-1">Send at</label>
        <input type="datetime-local" name="send_at" required className="border rounded px-3 py-1.5 text-sm" />
      </div>
      <button type="submit" className="border rounded px-3 py-1.5 text-sm hover:bg-gray-50">
        Schedule
      </button>
      {status && <p className="text-xs text-gray-600">{status}</p>}
    </form>
  )
}
