'use client'

import { useState } from 'react'
import { sendVerificationToAll } from '@/lib/actions/verification'

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
      {status && <p className="text-xs text-gray-600">{status}</p>}
      <button
        onClick={handleClick}
        disabled={loading}
        className="border rounded px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
      >
        {loading ? 'Sending...' : 'Send Verification'}
      </button>
    </div>
  )
}
