'use client'

import { useEffect, useRef, useState } from 'react'
import { setContactGroups } from '@/lib/actions/groups'
import { ActionFeedback } from '@/components/ui/action-feedback'

type Group = { id: string; name: string }

export function ContactGroupSelect({
  contactId,
  contactName,
  allGroups,
  initialSelected = [],
}: {
  contactId: string
  contactName: string
  allGroups: Group[]
  initialSelected?: string[]
}) {
  const [selected, setSelected] = useState<string[]>(initialSelected)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const initialSelectedKey = initialSelected.join('\u0000')

  useEffect(() => {
    setSelected(initialSelectedKey ? initialSelectedKey.split('\u0000') : [])
  }, [contactId, initialSelectedKey])

  useEffect(() => {
    if (!open) return
    function closeOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', closeOutside)
    return () => document.removeEventListener('mousedown', closeOutside)
  }, [open])

  async function toggle(groupId: string) {
    const next = selected.includes(groupId)
      ? selected.filter(id => id !== groupId)
      : [...selected, groupId]
    setSelected(next)
    setLoading(true)
    setError(null)
    const result = await setContactGroups(contactId, next)
    if (result.error) {
      setSelected(selected)
      setError(result.error)
    }
    setLoading(false)
  }

  const names = allGroups.filter(g => selected.includes(g.id)).map(g => g.name)

  return (
    <div ref={rootRef} className="relative" onKeyDown={event => {
      if (event.key === 'Escape' && open) {
        event.preventDefault()
        setOpen(false)
        triggerRef.current?.focus()
      }
    }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        className="min-h-11 text-left text-xs text-ink-muted underline hover:text-ink"
        disabled={loading}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Assign groups for ${contactName}`}
      >
        {names.length > 0 ? names.join(', ') : 'Assign group'}
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-52 rounded-xl border border-border bg-surface p-1 shadow-md" role="menu" aria-label={`Groups for ${contactName}`}>
          {allGroups.length === 0 && (
            <p className="px-3 py-2 text-xs text-ink-muted">No groups yet</p>
          )}
          {allGroups.map(group => (
            <label key={group.id} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-linen">
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
      <ActionFeedback state="error" message={error} className="mt-1 text-xs" />
    </div>
  )
}
