'use client'

import { useState, useEffect } from 'react'
import { setContactGroups, getContactGroups } from '@/lib/actions/groups'

type Group = { id: string; name: string }

export function ContactGroupSelect({
  contactId,
  allGroups,
}: {
  contactId: string
  allGroups: Group[]
}) {
  const [selected, setSelected] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getContactGroups(contactId).then(ids => setSelected(ids))
  }, [contactId])

  async function toggle(groupId: string) {
    const next = selected.includes(groupId)
      ? selected.filter(id => id !== groupId)
      : [...selected, groupId]
    setSelected(next)
    setLoading(true)
    await setContactGroups(contactId, next)
    setLoading(false)
  }

  const names = allGroups.filter(g => selected.includes(g.id)).map(g => g.name)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="text-xs text-ink-muted underline hover:text-ink"
        disabled={loading}
      >
        {names.length > 0 ? names.join(', ') : 'Assign group'}
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-44 rounded-xl border border-border bg-surface shadow-md">
          {allGroups.length === 0 && (
            <p className="px-3 py-2 text-xs text-ink-muted">No groups yet</p>
          )}
          {allGroups.map(group => (
            <label key={group.id} className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-linen text-sm">
              <input
                type="checkbox"
                checked={selected.includes(group.id)}
                onChange={() => toggle(group.id)}
                className="h-3.5 w-3.5"
              />
              {group.name}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
