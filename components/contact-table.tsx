'use client'

import { useState } from 'react'
import { updateContact, deleteContact } from '@/lib/actions/contacts'

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
    return <p className="text-sm text-gray-500">No contacts yet. Share your link to collect addresses.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="pb-2 pr-4">Name</th>
            <th className="pb-2 pr-4">Email</th>
            <th className="pb-2 pr-4">Location</th>
            <th className="pb-2 pr-4">Delivery</th>
            <th className="pb-2 pr-4">Status</th>
            <th className="pb-2"></th>
          </tr>
        </thead>
        <tbody>
          {contacts.map(c => (
            <tr key={c.id} className="border-b hover:bg-gray-50">
              <td className="py-2 pr-4">{c.first_name} {c.last_name}</td>
              <td className="py-2 pr-4 text-gray-600">{c.email}</td>
              <td className="py-2 pr-4 text-gray-600">{c.city}, {c.state}</td>
              <td className="py-2 pr-4">
                <select
                  value={c.delivery_method}
                  disabled={pending === c.id}
                  onChange={e => handleDeliveryChange(c.id, e.target.value)}
                  className="border rounded px-2 py-1 text-xs"
                >
                  <option value="handwrite">Handwrite</option>
                  <option value="print">Print</option>
                  <option value="digital">Digital</option>
                </select>
              </td>
              <td className="py-2 pr-4 text-xs text-gray-500">
                {c.opted_out ? 'Opted out' : c.verified_at ? 'Verified' : 'Unverified'}
              </td>
              <td className="py-2">
                <button
                  onClick={() => handleDelete(c.id)}
                  disabled={pending === c.id}
                  className="text-xs text-red-500 hover:underline disabled:opacity-50"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
