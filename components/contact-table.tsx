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

const deliveryColors: Record<string, { border: string; color: string }> = {
  print:     { border: 'rgba(192,92,46,0.30)', color: '#C05C2E' },
  digital:   { border: 'rgba(90,122,90,0.30)', color: '#5A7A5A' },
  handwrite: { border: 'rgba(81,97,131,0.30)', color: '#516183' },
}

const avatarColors = [
  'linear-gradient(135deg,#3358ba,#516183)',
  'linear-gradient(135deg,#516183,#3a4263)',
  'linear-gradient(135deg,#5A7A5A,#3a4263)',
  'linear-gradient(135deg,#b8453b,#3358ba)',
  'linear-gradient(135deg,#C05C2E,#516183)',
]

function avatarGradient(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

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
      <div className="rounded-xl border border-dashed border-border py-14 text-center">
        <p
          style={{
            fontFamily: 'var(--font-ppwriter), Georgia, serif',
            fontSize: 22,
            fontWeight: 400,
            color: 'var(--ink-muted)',
            marginBottom: 6,
          }}
        >
          No friends yet
        </p>
        <p className="text-sm text-ink-muted">Share your link to start collecting addresses.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Column headers */}
      <div className="grid grid-cols-[1fr_100px_110px_100px_80px_60px] gap-3 items-center px-1 pb-2.5 border-b border-border/50">
        {['Name', 'Location', 'Delivery', 'Group', 'Status', ''].map((h, i) => (
          <span key={i} className="text-[10px] uppercase tracking-[0.13em] text-ink-muted font-medium">{h}</span>
        ))}
      </div>

      {contacts.map(contact => {
        const isVerified = Boolean(contact.verified_at) && !contact.opted_out
        const isOptedOut = contact.opted_out
        const initials = `${contact.first_name[0] ?? ''}${contact.last_name[0] ?? ''}`.toUpperCase()
        const gradient = avatarGradient(contact.first_name + contact.last_name)
        const dc = deliveryColors[contact.delivery_method] ?? deliveryColors.handwrite

        return (
          <div
            key={contact.id}
            className={`group grid grid-cols-[1fr_100px_110px_100px_80px_60px] gap-3 items-center py-2.5 px-1 border-b border-border/30 transition-colors hover:bg-blue-ink/[0.03] ${pending === contact.id ? 'opacity-50' : ''}`}
          >
            {/* Name + avatar */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                style={{ background: gradient }}
              >
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
              className="text-xs rounded-full px-2.5 py-1 bg-surface cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-ink/30 disabled:opacity-50 border transition-colors"
              style={{ borderColor: dc.border, color: dc.color }}
            >
              {deliveryOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {/* Group */}
            <ContactGroupSelect contactId={contact.id} allGroups={allGroups} />

            {/* Status */}
            <span
              className="text-xs font-medium"
              style={{
                color: isOptedOut ? '#b8453b' : isVerified ? '#5A7A5A' : 'var(--ink-muted)',
              }}
            >
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
                className="hidden group-hover:flex h-7 w-7 items-center justify-center rounded-full text-ink-muted hover:text-blue-ink hover:bg-blue-ink/10 disabled:opacity-50 text-xs transition-colors"
              >
                ↩
              </button>
              <button
                onClick={() => handleDelete(contact.id)}
                disabled={pending === contact.id}
                aria-label={`Delete ${contact.first_name} ${contact.last_name}`}
                className="hidden group-hover:flex h-7 w-7 items-center justify-center rounded-full text-ink-muted hover:text-stamp hover:bg-stamp/10 disabled:opacity-50 transition-colors"
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
