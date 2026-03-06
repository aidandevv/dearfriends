'use client'

import { useState } from 'react'
import { deleteContact, updateContact } from '@/lib/actions/contacts'
import { PillBadge } from '@/components/ui/pill-badge'
import { Ban, CheckCircle, Circle, Trash2 } from 'lucide-react'

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
      <div className="rounded-[1.25rem] border border-dashed border-border bg-surface px-6 py-12 text-center">
        <p className="font-serif text-2xl text-ink-muted">No contacts yet</p>
        <p className="mt-2 text-sm text-ink-muted">Share your link to start collecting addresses.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {contacts.map(contact => {
        const status = contact.opted_out
          ? { label: 'Opted out', icon: Ban, iconClass: 'text-red-400' }
          : contact.verified_at
            ? { label: 'Verified', icon: CheckCircle, iconClass: 'text-sage' }
            : { label: 'Unverified', icon: Circle, iconClass: 'text-ink-muted' }

        const StatusIcon = status.icon

        return (
          <div
            key={contact.id}
            className={`rounded-[1.35rem] border border-border/80 bg-surface px-4 py-4 transition-colors hover:bg-linen/50 ${pending === contact.id ? 'opacity-60' : ''}`}
          >
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-serif text-2xl leading-none text-ink">
                    {contact.first_name} {contact.last_name}
                  </p>
                  <PillBadge method={contact.delivery_method} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-ink-muted">
                  <span>{contact.email}</span>
                  <span className="hidden h-1 w-1 rounded-full bg-border sm:inline-block" />
                  <span>
                    {contact.city}, {contact.state}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 xl:min-w-[410px] xl:items-end">
                <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                  <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface-raised px-3 py-2 text-sm text-ink-muted">
                    <StatusIcon size={16} className={status.iconClass} />
                    <span>{status.label}</span>
                  </div>

                  <button
                    onClick={() => handleDelete(contact.id)}
                    disabled={pending === contact.id}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/80 bg-surface-raised text-ink-muted transition-colors hover:border-red-200 hover:text-red-500 disabled:opacity-50"
                    aria-label={`Delete ${contact.first_name} ${contact.last_name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="grid gap-2 sm:grid-cols-3 xl:w-full">
                  {deliveryOptions.map(option => {
                    const selected = contact.delivery_method === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        disabled={pending === contact.id}
                        onClick={() => handleDeliveryChange(contact.id, option.value)}
                        className={selected
                          ? 'rounded-full border border-terra bg-terra px-4 py-3 text-sm font-medium text-white shadow-sm'
                          : 'rounded-full border border-border/80 bg-surface-raised px-4 py-3 text-sm font-medium text-ink transition-colors hover:border-terra/50 hover:bg-linen disabled:opacity-50'}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
