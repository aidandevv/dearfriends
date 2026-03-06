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
    <div className="flex items-center gap-3">
      {status && <p className="text-xs text-ink-muted">{status}</p>}
      <button
        onClick={handleClick}
        disabled={loading}
        className="btn-outline flex items-center gap-1.5 text-sm px-4 py-2 w-auto rounded-full"
      >
        <MailCheck size={14} />
        {loading ? 'Sending...' : 'Send Verification'}
      </button>
    </div>
  )
}
