'use client'

import { useState } from 'react'
import { sendVerificationToAll } from '@/lib/actions/verification'
import { MailCheck } from 'lucide-react'

export function SendVerificationButton() {
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (!confirm('Send verification emails to all non-opted-out contacts?')) return
    setLoading(true)
    const result = await sendVerificationToAll()
    setStatus(result.error ? `Error: ${result.error}` : `Sent to ${(result as { count?: number }).count} contacts.`)
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-stretch gap-2 lg:items-end">
      <button
        onClick={handleClick}
        disabled={loading}
        className="btn-outline inline-flex min-h-12 items-center justify-center gap-2 px-5 text-sm"
      >
        <MailCheck size={16} />
        {loading ? 'Sending...' : 'Send verification emails'}
      </button>
      {status && <p className="text-sm text-ink-muted lg:text-right">{status}</p>}
    </div>
  )
}
