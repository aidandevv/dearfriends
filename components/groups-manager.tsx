'use client'

import { useState } from 'react'
import { Trash2, Users } from 'lucide-react'
import { createGroup, updateGroup, deleteGroup } from '@/lib/actions/groups'

type Group = { id: string; name: string; birthday_tracking: boolean }

export function GroupsManager({ initialGroups }: { initialGroups: Group[] }) {
  const [groups, setGroups] = useState(initialGroups)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    await createGroup(newName)
    setNewName('')
    setCreating(false)
  }

  async function handleToggleBirthday(group: Group) {
    await updateGroup(group.id, { birthday_tracking: !group.birthday_tracking })
    setGroups(prev => prev.map(g => g.id === group.id ? { ...g, birthday_tracking: !g.birthday_tracking } : g))
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this group? Contacts will not be deleted.')) return
    await deleteGroup(id)
    setGroups(prev => prev.filter(g => g.id !== id))
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="New group name (e.g. Family)"
          className="input flex-1 min-h-11"
        />
        <button type="submit" disabled={creating || !newName.trim()} className="btn-primary min-h-11 px-5">
          {creating ? 'Adding...' : 'Add group'}
        </button>
      </form>

      <div className="space-y-2">
        {groups.length === 0 && (
          <p className="text-sm text-ink-muted">No groups yet. Create one above.</p>
        )}
        {groups.map(group => (
          <div
            key={group.id}
            className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-linen/60 px-4 py-3 transition-colors hover:bg-linen"
          >
            <div className="flex items-center gap-3">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full text-white"
                style={{ background: 'linear-gradient(135deg, var(--blue-ink), var(--blue-slate))' }}
              >
                <Users size={14} />
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-ppwriter), Georgia, serif',
                  fontSize: 15,
                  fontWeight: 400,
                  color: 'var(--ink)',
                }}
              >
                {group.name}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-ink-muted cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={group.birthday_tracking}
                  onChange={() => handleToggleBirthday(group)}
                  className="h-4 w-4"
                />
                Birthday tracking
              </label>
              <button
                onClick={() => handleDelete(group.id)}
                className="text-ink-muted hover:text-stamp transition-colors p-1 rounded"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
