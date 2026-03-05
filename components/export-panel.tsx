'use client'

import { useState } from 'react'
import { sendDigitalLetters } from '@/lib/actions/letter'

export function ExportPanel() {
  const [digitalStatus, setDigitalStatus] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  async function handleDigitalSend() {
    if (!confirm('Send the composed letter to all digital contacts?')) return

    setSending(true)
    const result = await sendDigitalLetters()
    setDigitalStatus(result.error ? `Error: ${result.error}` : `Sent to ${(result as { count?: number }).count} contacts.`)
    setSending(false)
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="text-sm font-semibold mb-3">CSV Export (Avery label format)</h2>
        <div className="flex gap-2 flex-wrap">
          <a href="/api/export/csv?method=handwrite" className="border rounded px-3 py-1.5 text-sm hover:bg-gray-50">
            Handwrite contacts
          </a>
          <a href="/api/export/csv?method=print" className="border rounded px-3 py-1.5 text-sm hover:bg-gray-50">
            Print contacts
          </a>
          <a href="/api/export/csv?method=all" className="border rounded px-3 py-1.5 text-sm hover:bg-gray-50">
            All contacts
          </a>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-3">PDF Export (Print contacts)</h2>
        <a href="/api/export/pdf" className="inline-block border rounded px-3 py-1.5 text-sm hover:bg-gray-50">
          Download PDF
        </a>
        <p className="text-xs text-gray-400 mt-1">One page per print contact. Letter variables interpolated.</p>
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-3">Digital Send (via Resend)</h2>
        <button
          onClick={handleDigitalSend}
          disabled={sending}
          className="border rounded px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {sending ? 'Sending...' : 'Send to digital contacts'}
        </button>
        {digitalStatus && <p className="text-xs text-gray-600 mt-2">{digitalStatus}</p>}
        <p className="text-xs text-gray-400 mt-1">
          Sends the composed letter to all contacts marked Digital (excluding opted-out).
        </p>
      </section>
    </div>
  )
}
