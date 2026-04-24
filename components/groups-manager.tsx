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
          <div key={group.id} className="surface-panel flex items-center justify-between gap-4 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-ink/10 text-blue-ink">
                <Users size={15} />
              </span>
              <span className="font-medium text-ink">{group.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-ink-muted cursor-pointer">
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
                className="text-ink-muted hover:text-red-500 transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
