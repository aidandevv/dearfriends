'use client'

import { useState } from 'react'
import { deleteContact, updateContact, sendAddressRefreshNudge } from '@/lib/actions/contacts'
import { ContactEditForm } from '@/components/contact-edit-form'
import { ContactGroupSelect } from '@/components/contact-group-select'
import { Pencil, Trash2 } from 'lucide-react'
import type { Contact } from '@/lib/database.types'

const deliveryOptions = [
  { value: 'handwrite', label: 'Handwrite' },
  { value: 'print', label: 'Print' },
  { value: 'digital', label: 'Digital' },
]

const avatarColors = ['#516183', '#4A6CD4', '#5A7A5A', '#E8927C', '#3A55AC', '#4A5168']

function avatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

const COL = 'minmax(0, 2fr) minmax(0, 1.1fr) minmax(0, 1.2fr) minmax(0, 1.1fr) minmax(0, 1fr) 60px'

export function ContactTable({
  contacts,
  allGroups = [],
  birthdayEditableIds = [],
}: {
  contacts: Contact[]
  allGroups?: { id: string; name: string }[]
  birthdayEditableIds?: string[]
}) {
  const [pending, setPending] = useState<string | null>(null)
  const [nudgePending, setNudgePending] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const birthdayEditable = new Set(birthdayEditableIds)

  async function handleDeliveryChange(id: string, value: string) {
    setPending(id)
    await updateContact(id, { delivery_method: value })
    setPending(null)
  }

  async function handleBirthdayChange(id: string, value: string) {
    setPending(id)
    await updateContact(id, { birthday: value || null })
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

      {contacts.map(contact => {
        const isVerified = Boolean(contact.verified_at) && !contact.opted_out
        const isOptedOut = contact.opted_out
        const initials = `${contact.first_name[0] ?? ''}${contact.last_name[0] ?? ''}`.toUpperCase()
        const bg = avatarColor(contact.first_name + contact.last_name)
        const canEditBirthday = birthdayEditable.has(contact.id)

        return (
          <div key={contact.id}>
          <div
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
              <div style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 500, color: 'var(--ink)', fontSize: 14.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {contact.first_name} {contact.last_name}
                </span>
                {contact.note && (
                  <span style={{ display: 'block', marginTop: 2, fontSize: 12, fontStyle: 'italic', color: 'var(--blue-slate)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={contact.note}>
                    “{contact.note}”
                  </span>
                )}
              </div>
            </div>

            <div style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 13.5, color: 'var(--ink-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {contact.city}, {contact.state} {contact.zip}
              </span>
              <span style={{ display: 'block', marginTop: 2, fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {contact.address_line_1}
              </span>
              {canEditBirthday && (
                <input
                  type="date"
                  value={contact.birthday?.split('T')[0] ?? ''}
                  onChange={e => handleBirthdayChange(contact.id, e.target.value)}
                  disabled={pending === contact.id}
                  aria-label={`Birthday for ${contact.first_name}`}
                  style={{
                    marginTop: 6,
                    width: '100%',
                    maxWidth: 150,
                    padding: '4px 8px',
                    borderRadius: 8,
                    border: '1px solid var(--line)',
                    fontSize: 12,
                    color: 'var(--ink-soft)',
                    background: 'var(--paper)',
                  }}
                />
              )}
            </div>

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
                color: 'var(--periwinkle)',
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

            <ContactGroupSelect contactId={contact.id} allGroups={allGroups} />

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--ink-soft)' }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                ...(isOptedOut ? { background: 'var(--stamp)' } :
                   isVerified  ? { background: 'var(--sage)' } :
                   { background: 'var(--surface)', border: '1px solid var(--peach)' }),
              }} />
              <span style={{ color: isOptedOut ? 'var(--stamp)' : isVerified ? 'var(--sage)' : 'var(--ink-soft)' }}>
                {isOptedOut ? 'Opted out' : isVerified ? 'Verified' : 'Pending'}
              </span>
            </div>

            <div className="contact-table-row-actions flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setEditingId(editingId === contact.id ? null : contact.id)}
                title="Edit contact"
                aria-label={`Edit ${contact.first_name} ${contact.last_name}`}
                className={`flex h-7 w-7 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-periwinkle/10 hover:text-periwinkle ${editingId === contact.id ? 'bg-periwinkle/10 text-periwinkle opacity-100' : ''}`}
              >
                <Pencil size={13} />
              </button>
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
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs text-ink-muted transition-colors hover:bg-periwinkle/10 hover:text-periwinkle disabled:opacity-50"
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

          {editingId === contact.id && (
            <ContactEditForm
              contact={contact}
              onCancel={() => setEditingId(null)}
              onSaved={() => setEditingId(null)}
            />
          )}
          </div>
        )
      })}
    </div>
  )
}
