'use client'

import { useState } from 'react'
import { deleteContact, updateContact, sendAddressRefreshNudge } from '@/lib/actions/contacts'
import { ContactGroupSelect } from '@/components/contact-group-select'
import { Trash2 } from 'lucide-react'

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

const deliveryOptions = [
  { value: 'handwrite', label: 'Handwrite' },
  { value: 'print', label: 'Print' },
  { value: 'digital', label: 'Digital' },
]

export function ContactTable({ contacts, allGroups = [] }: { contacts: Contact[]; allGroups?: { id: string; name: string }[] }) {
  const [pending, setPending] = useState<string | null>(null)
  const [nudgePending, setNudgePending] = useState<string | null>(null)

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
      <div className="rounded-2xl border border-dashed border-border py-12 text-center">
        <p className="font-serif text-xl text-ink-muted">No friends yet</p>
        <p className="mt-1 text-sm text-ink-muted">Share your link to start collecting addresses.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Column headers */}
      <div className="grid grid-cols-[1fr_100px_110px_100px_80px_60px] gap-3 items-center px-1 pb-2 border-b border-border/60">
        {['Name', 'Location', 'Delivery', 'Group', 'Status', ''].map((h, i) => (
          <span key={i} className="text-[10px] uppercase tracking-[0.1em] text-ink-muted">{h}</span>
        ))}
      </div>

      {contacts.map(contact => {
        const isVerified = Boolean(contact.verified_at) && !contact.opted_out
        const isOptedOut = contact.opted_out

        const initials = `${contact.first_name[0] ?? ''}${contact.last_name[0] ?? ''}`.toUpperCase()

        return (
          <div
            key={contact.id}
            className={`group grid grid-cols-[1fr_100px_110px_100px_80px_60px] gap-3 items-center py-2.5 px-1 border-b border-border/40 transition-colors hover:bg-terra/[0.025] ${pending === contact.id ? 'opacity-50' : ''}`}
          >
            {/* Name + initials */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-sidebar text-[10px] font-medium text-ink-muted">
                {initials}
              </div>
              <span className="text-sm text-ink truncate">{contact.first_name} {contact.last_name}</span>
            </div>

            {/* Location */}
            <span className="text-xs text-ink-muted truncate">{contact.city}, {contact.state}</span>

            {/* Delivery select */}
            <select
              value={contact.delivery_method}
              onChange={e => handleDeliveryChange(contact.id, e.target.value)}
              disabled={pending === contact.id}
              className="text-xs rounded-full border px-2.5 py-1 bg-surface cursor-pointer focus:outline-none focus:ring-1 focus:ring-terra/40 disabled:opacity-50"
              style={{
                borderColor: contact.delivery_method === 'print'
                  ? 'rgba(192,92,46,0.35)'
                  : contact.delivery_method === 'digital'
                    ? 'rgba(90,122,90,0.35)'
                    : undefined,
                color: contact.delivery_method === 'print'
                  ? '#C05C2E'
                  : contact.delivery_method === 'digital'
                    ? '#5A7A5A'
                    : '#7A6352',
              }}
            >
              {deliveryOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {/* Group */}
            <ContactGroupSelect contactId={contact.id} allGroups={allGroups} />

            {/* Status */}
            <span className={`text-xs ${isOptedOut ? 'text-red-400' : isVerified ? 'text-sage' : 'text-ink-muted'}`}>
              {isOptedOut ? 'Opted out' : isVerified ? '✓ Verified' : 'Pending'}
            </span>

            {/* Actions */}
            <div className="flex items-center gap-1 justify-end">
              <button
                onClick={async () => {
                  setNudgePending(contact.id)
                  const result = await sendAddressRefreshNudge(contact.id)
                  setNudgePending(null)
                  if (result?.error) alert(`Failed: ${result.error}`)
                }}
                disabled={nudgePending === contact.id}
                title="Send address refresh nudge"
                aria-label="Send address refresh nudge"
                className="hidden group-hover:flex h-7 w-7 items-center justify-center rounded-full text-ink-muted hover:text-terra hover:bg-terra/10 disabled:opacity-50 text-xs transition-colors"
              >
                ↩
              </button>
              <button
                onClick={() => handleDelete(contact.id)}
                disabled={pending === contact.id}
                aria-label={`Delete ${contact.first_name} ${contact.last_name}`}
                className="hidden group-hover:flex h-7 w-7 items-center justify-center rounded-full text-ink-muted hover:text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
