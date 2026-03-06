'use client'

import { useState } from 'react'
import { updateContact, deleteContact } from '@/lib/actions/contacts'
import { PillBadge } from '@/components/ui/pill-badge'
import { CheckCircle, Circle, Ban, Trash2 } from 'lucide-react'

type Contact = {
  id: string
  first_name: string
  last_name: string
  email: string
  city: string
  state: string
  delivery_method: string
  opted_out: boolean
  verified_at: string | null
  tags: string[]
}

export function ContactTable({ contacts }: { contacts: Contact[] }) {
  const [pending, setPending] = useState<string | null>(null)

  async function handleDeliveryChange(id: string, value: string) {
    setPending(id)
    await updateContact(id, { delivery_method: value })
    setPending(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this contact?')) return
    setPending(id)
    await deleteContact(id)
    setPending(null)
  }

  if (contacts.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="font-serif text-2xl text-ink-muted">No contacts yet</p>
        <p className="text-sm text-ink-muted mt-2">Share your link to start collecting addresses.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {contacts.map(c => (
        <div
          key={c.id}
          className={`flex items-center gap-4 px-4 py-3 rounded-xl border border-border bg-surface hover:bg-linen/40 transition-colors ${pending === c.id ? 'opacity-50' : ''}`}
        >
          <div className="flex-1 min-w-0">
            <p className="font-serif text-base text-ink">{c.first_name} {c.last_name}</p>
            <p className="text-xs text-ink-muted mt-0.5 truncate">{c.email} · {c.city}, {c.state}</p>
          </div>

          <PillBadge method={c.delivery_method} />

          <div className="flex items-center gap-1 text-ink-muted shrink-0">
            {c.opted_out
              ? <Ban size={14} className="text-red-400" />
              : c.verified_at
              ? <CheckCircle size={14} className="text-sage" />
              : <Circle size={14} />
            }
            <span className="text-xs">
              {c.opted_out ? 'Opted out' : c.verified_at ? 'Verified' : 'Unverified'}
            </span>
          </div>

          <select
            value={c.delivery_method}
            disabled={pending === c.id}
            onChange={e => handleDeliveryChange(c.id, e.target.value)}
            className="border border-border rounded-lg px-2 py-1 text-xs bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-terra/40 shrink-0"
          >
            <option value="handwrite">Handwrite</option>
            <option value="print">Print</option>
            <option value="digital">Digital</option>
          </select>

          <button
            onClick={() => handleDelete(c.id)}
            disabled={pending === c.id}
            className="text-ink-muted hover:text-red-500 transition-colors disabled:opacity-50 shrink-0"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
