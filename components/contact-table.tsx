'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteContact, updateContact, sendAddressRefreshNudge } from '@/lib/actions/contacts'
import { ContactEditForm } from '@/components/contact-edit-form'
import { ContactGroupSelect } from '@/components/contact-group-select'
import { Pencil, Trash2 } from 'lucide-react'
import type { Contact } from '@/lib/database.types'
import { DELIVERY_LABELS, DELIVERY_METHODS, isDeliveryMethod } from '@/lib/delivery-methods'
import { ActionFeedback } from '@/components/ui/action-feedback'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import type { ActionState } from '@/lib/action-result'

const deliveryOptions = DELIVERY_METHODS.map(value => ({
  value,
  label: DELIVERY_LABELS[value],
}))

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
  groupMemberships = {},
  emptyMessage,
}: {
  contacts: Contact[]
  allGroups?: { id: string; name: string }[]
  birthdayEditableIds?: string[]
  groupMemberships?: Record<string, string[]>
  emptyMessage?: string
}) {
  const router = useRouter()
  const [visibleContacts, setVisibleContacts] = useState(contacts)
  const [pending, setPending] = useState<string | null>(null)
  const [nudgePending, setNudgePending] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null)
  const [feedback, setFeedback] = useState<Record<string, { state: ActionState; message: string }>>({})
  const birthdayEditable = new Set(birthdayEditableIds)

  useEffect(() => setVisibleContacts(contacts), [contacts])

  function setContactFeedback(id: string, state: ActionState, message: string) {
    setFeedback(current => ({ ...current, [id]: { state, message } }))
  }

  async function handleDeliveryChange(id: string, value: string) {
    if (!isDeliveryMethod(value)) return
    setPending(id)
    setContactFeedback(id, 'pending', 'Saving delivery method…')
    const result = await updateContact(id, { delivery_method: value })
    if (result.success) {
      setVisibleContacts(current => current.map(contact => contact.id === id ? { ...contact, delivery_method: value } : contact))
      setContactFeedback(id, 'saved', 'Delivery method saved.')
      router.refresh()
    } else {
      setContactFeedback(id, 'error', result.error)
    }
    setPending(null)
  }

  async function handleBirthdayChange(id: string, value: string) {
    setPending(id)
    setContactFeedback(id, 'pending', 'Saving birthday…')
    const result = await updateContact(id, { birthday: value || null })
    if (result.success) {
      setVisibleContacts(current => current.map(contact => contact.id === id ? { ...contact, birthday: value || null } : contact))
      setContactFeedback(id, 'saved', 'Birthday saved.')
      router.refresh()
    } else {
      setContactFeedback(id, 'error', result.error)
    }
    setPending(null)
  }

  async function handleDelete(contact: Contact) {
    setPending(contact.id)
    setContactFeedback(contact.id, 'pending', 'Deleting contact…')
    const result = await deleteContact(contact.id)
    if (result.success) {
      setVisibleContacts(current => current.filter(item => item.id !== contact.id))
      setDeleteTarget(null)
      router.refresh()
    } else {
      setContactFeedback(contact.id, 'error', result.error)
      setDeleteTarget(null)
    }
    setPending(null)
  }

  if (visibleContacts.length === 0) {
    return (
      <div style={{ padding: '56px 24px', textAlign: 'center' }}>
        <p style={{
          fontFamily: 'var(--font-ppwriter), Georgia, serif',
          fontStyle: 'italic', fontSize: 20, fontWeight: 400,
          color: 'var(--blue-slate)', marginBottom: 6,
        }}>
          {emptyMessage ? 'No matches' : 'No friends yet'}
        </p>
        <p style={{ fontSize: 14, color: 'var(--muted)' }}>
          {emptyMessage ?? 'Share your invite link to start collecting addresses.'}
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

      {visibleContacts.map(contact => {
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
              aria-label={`Delivery method for ${contact.first_name} ${contact.last_name}`}
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

            <ContactGroupSelect
              contactId={contact.id}
              contactName={`${contact.first_name} ${contact.last_name}`}
              allGroups={allGroups}
              initialSelected={groupMemberships[contact.id] ?? []}
            />

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
                className={`flex h-11 w-11 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-periwinkle/10 hover:text-periwinkle ${editingId === contact.id ? 'bg-periwinkle/10 text-periwinkle opacity-100' : ''}`}
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={async () => {
                  setNudgePending(contact.id)
                  setContactFeedback(contact.id, 'pending', `Sending a refresh request to ${contact.first_name}…`)
                  const result = await sendAddressRefreshNudge(contact.id)
                  setNudgePending(null)
                  if (result?.error) setContactFeedback(contact.id, 'error', result.error)
                  else setContactFeedback(contact.id, 'saved', `Refresh request sent to ${contact.first_name}.`)
                }}
                disabled={nudgePending === contact.id}
                title="Send address refresh nudge"
                aria-label={`Send address refresh nudge to ${contact.first_name} ${contact.last_name}`}
                className="flex h-11 w-11 items-center justify-center rounded-full text-xs text-ink-muted transition-colors hover:bg-periwinkle/10 hover:text-periwinkle disabled:opacity-50"
              >
                ↩
              </button>
              <button
                onClick={() => setDeleteTarget(contact)}
                disabled={pending === contact.id}
                aria-label={`Delete ${contact.first_name} ${contact.last_name}`}
                className="flex h-11 w-11 items-center justify-center rounded-full text-ink-muted hover:text-stamp hover:bg-stamp/10 disabled:opacity-50 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {feedback[contact.id] && (
            <ActionFeedback
              state={feedback[contact.id].state}
              message={feedback[contact.id].message}
              className="border-b border-line/50 px-6 py-2 text-xs"
            />
          )}

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
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={deleteTarget ? `Delete ${deleteTarget.first_name} ${deleteTarget.last_name}?` : 'Delete contact?'}
        description="This removes the contact and their group assignments. It cannot be undone."
        confirmLabel="Delete contact"
        destructive
        pending={Boolean(deleteTarget && pending === deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget ? handleDelete(deleteTarget) : undefined}
      />
    </div>
  )
}
