'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Link2, Trash2, Users } from 'lucide-react'
import { createGroup, updateGroup, deleteGroup, updateGroupShareSlug } from '@/lib/actions/groups'
import { slugSchema } from '@/lib/schemas'

type Group = {
  id: string
  name: string
  birthday_tracking: boolean
  share_slug: string | null
}

export function GroupsManager({ initialGroups }: { initialGroups: Group[] }) {
  const router = useRouter()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const [groups, setGroups] = useState(initialGroups)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [slugValues, setSlugValues] = useState<Record<string, string>>(
    Object.fromEntries(initialGroups.map(group => [group.id, group.share_slug ?? ''])),
  )
  const [slugErrors, setSlugErrors] = useState<Record<string, string | null>>({})
  const [savingSlug, setSavingSlug] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    const result = await createGroup(newName)
    if (result.group) {
      setGroups(prev => [...prev, result.group as Group])
      setSlugValues(prev => ({ ...prev, [result.group.id]: result.group.share_slug ?? '' }))
      setNewName('')
    }
    setCreating(false)
    router.refresh()
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

  function handleSlugChange(groupId: string, value: string) {
    setSlugValues(prev => ({ ...prev, [groupId]: value.toLowerCase() }))
    setSlugErrors(prev => ({ ...prev, [groupId]: null }))
  }

  async function handleSaveSlug(group: Group) {
    const value = (slugValues[group.id] ?? '').trim().toLowerCase()
    if (value) {
      const parsed = slugSchema.safeParse(value)
      if (!parsed.success) {
        setSlugErrors(prev => ({
          ...prev,
          [group.id]: parsed.error.errors[0]?.message ?? 'Invalid slug',
        }))
        return
      }
    }

    setSavingSlug(group.id)
    const result = await updateGroupShareSlug(group.id, value)
    if (result.error === 'slug_taken') {
      setSlugErrors(prev => ({ ...prev, [group.id]: 'That slug is already taken.' }))
    } else if (result.error === 'slug_limit') {
      setSlugErrors(prev => ({ ...prev, [group.id]: 'You can have up to 10 share slugs.' }))
    } else if (result.error) {
      setSlugErrors(prev => ({ ...prev, [group.id]: result.error ?? 'Could not save slug.' }))
    } else {
      setGroups(prev => prev.map(g => g.id === group.id ? { ...g, share_slug: value || null } : g))
      setSlugValues(prev => ({ ...prev, [group.id]: value }))
      router.refresh()
    }
    setSavingSlug(null)
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
            className="flex flex-col gap-3 rounded-xl border border-border/60 bg-linen/60 px-4 py-3 transition-colors hover:bg-linen"
          >
            <div className="flex items-center justify-between gap-4">
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

            <div className="flex flex-col gap-1.5 border-t border-border/50 pt-3">
              <label className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted">
                Group share link
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="flex min-h-10 flex-1 items-center gap-0 rounded-xl border border-border/80 bg-surface-raised px-3">
                  <Link2 size={14} className="mr-2 shrink-0 text-ink-muted" />
                  <span className="shrink-0 text-sm text-ink-muted select-none">{siteUrl}/share/</span>
                  <input
                    aria-label={`${group.name} share slug`}
                    value={slugValues[group.id] ?? ''}
                    onChange={e => handleSlugChange(group.id, e.target.value)}
                    placeholder={`${group.name.toLowerCase().replace(/\s+/g, '-')}`}
                    className="min-w-0 flex-1 bg-transparent py-2 text-sm text-ink outline-none placeholder:text-ink-muted/50"
                    minLength={3}
                    maxLength={30}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleSaveSlug(group)}
                  disabled={savingSlug === group.id || (slugValues[group.id] ?? '') === (group.share_slug ?? '')}
                  aria-label={`Save ${group.name} share slug`}
                  className="btn-primary min-h-10 px-4 text-sm"
                >
                  {savingSlug === group.id ? 'Saving...' : 'Save'}
                </button>
              </div>
              {slugErrors[group.id] && <p className="text-sm text-stamp">{slugErrors[group.id]}</p>}
              {group.share_slug && !slugErrors[group.id] && (
                <p className="text-xs text-ink-muted">
                  New submissions through this link are added to {group.name}.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
