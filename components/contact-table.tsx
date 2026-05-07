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

const avatarColors = ['#516183', '#3358ba', '#5A7A5A', '#b8453b', '#3e5da0', '#3a4263']

function avatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

const COL = 'minmax(0, 2fr) minmax(0, 1.1fr) minmax(0, 1.2fr) minmax(0, 1.1fr) minmax(0, 1fr) 60px'

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
      <div style={{ padding: '56px 24px', textAlign: 'center' }}>
        <p style={{
          fontFamily: 'var(--font-ppwriter), Georgia, serif',
          fontStyle: 'italic', fontSize: 20, fontWeight: 400,
          color: 'var(--blue-slate)', marginBottom: 6,
        }}>
          No friends yet
        </p>
        <p style={{ fontSize: 14, color: 'var(--muted)' }}>
          Share your invite link to start collecting addresses.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Table header */}
      <div className="contact-table-header" style={{
        display: 'grid',
        gridTemplateColumns: COL,
        gap: 14,
        padding: '14px 24px 12px',
        borderBottom: '1px solid var(--line)',
        background: 'var(--paper-3)',
      }}>
        {['Name', 'Location', 'Delivery', 'Group', 'Status', ''].map((h, i) => (
          <span key={i} style={{
            fontSize: 10.5, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.16em',
            color: 'var(--muted)',
          }}>
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      {contacts.map(contact => {
        const isVerified = Boolean(contact.verified_at) && !contact.opted_out
        const isOptedOut = contact.opted_out
        const initials = `${contact.first_name[0] ?? ''}${contact.last_name[0] ?? ''}`.toUpperCase()
        const bg = avatarColor(contact.first_name + contact.last_name)

        return (
          <div
            key={contact.id}
            className="contact-table-row group"
            style={{
              display: 'grid',
              gridTemplateColumns: COL,
              gap: 14,
              padding: '18px 24px',
              alignItems: 'center',
              borderBottom: '1px solid rgba(217,207,176,.5)',
              transition: 'background 0.15s ease',
              opacity: pending === contact.id ? 0.5 : 1,
            }}
            onMouseOver={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(228,206,149,.18)'}
            onMouseOut={e => (e.currentTarget as HTMLDivElement).style.background = ''}
          >
            {/* Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-ppwriter), Georgia, serif',
                fontSize: 13, fontWeight: 500,
                color: 'var(--cream)',
                background: bg,
                letterSpacing: '0.02em',
              }}>
                {initials}
              </div>
              <span style={{ fontWeight: 500, color: 'var(--ink)', fontSize: 14.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {contact.first_name} {contact.last_name}
              </span>
            </div>

            {/* Location */}
            <span style={{ fontSize: 13.5, color: 'var(--ink-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {contact.city}, {contact.state}
            </span>

            {/* Delivery */}
            <select
              value={contact.delivery_method}
              onChange={e => handleDeliveryChange(contact.id, e.target.value)}
              disabled={pending === contact.id}
              style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '5px 28px 5px 12px',
                background: 'var(--paper)',
                border: '1px solid var(--line)',
                borderRadius: 999,
                fontFamily: 'var(--font-dm-sans), sans-serif',
                fontSize: 13, fontWeight: 500,
                color: 'var(--blue-ink)',
                cursor: 'pointer',
                appearance: 'none',
                WebkitAppearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath d='M2 4l3 3 3-3' stroke='%233358ba' stroke-width='1.4' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 10px center',
              }}
            >
              {deliveryOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {/* Group */}
            <ContactGroupSelect contactId={contact.id} allGroups={allGroups} />

            {/* Status */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--ink-soft)' }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                ...(isOptedOut ? { background: 'var(--stamp)' } :
                   isVerified  ? { background: '#5A7A5A' } :
                   { background: 'var(--cream)', border: '1px solid #b8a657' }),
              }} />
              <span style={{ color: isOptedOut ? 'var(--stamp)' : isVerified ? '#5A7A5A' : 'var(--ink-soft)' }}>
                {isOptedOut ? 'Opted out' : isVerified ? 'Verified' : 'Pending'}
              </span>
            </div>

            {/* Actions */}
            <div className="contact-table-row-actions flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
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
                className="flex h-7 w-7 items-center justify-center rounded-full text-ink-muted hover:text-blue-ink hover:bg-blue-ink/10 disabled:opacity-50 text-xs transition-colors"
              >
                ↩
              </button>
              <button
                onClick={() => handleDelete(contact.id)}
                disabled={pending === contact.id}
                aria-label={`Delete ${contact.first_name} ${contact.last_name}`}
                className="flex h-7 w-7 items-center justify-center rounded-full text-ink-muted hover:text-stamp hover:bg-stamp/10 disabled:opacity-50 transition-colors"
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
