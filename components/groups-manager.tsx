'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy, ExternalLink, Link2, Trash2, Users } from 'lucide-react'
import { createGroup, updateGroup, deleteGroup, updateGroupShareSlug } from '@/lib/actions/groups'
import { slugSchema } from '@/lib/schemas'
import { ActionFeedback } from '@/components/ui/action-feedback'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import type { ActionState } from '@/lib/action-result'

type Group = {
  id: string
  name: string
  birthday_tracking: boolean
  share_slug: string | null
  contact_count: number
}

type Feedback = { state: ActionState; message: string }

export function GroupsManager({ initialGroups }: { initialGroups: Group[] }) {
  const router = useRouter()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const [groups, setGroups] = useState(initialGroups)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createFeedback, setCreateFeedback] = useState<Feedback | null>(null)
  const [feedback, setFeedback] = useState<Record<string, Feedback>>({})
  const [deleteTarget, setDeleteTarget] = useState<Group | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [slugValues, setSlugValues] = useState<Record<string, string>>(
    Object.fromEntries(initialGroups.map(group => [group.id, group.share_slug ?? ''])),
  )
  const [slugErrors, setSlugErrors] = useState<Record<string, string | null>>({})
  const [savingSlug, setSavingSlug] = useState<string | null>(null)

  function setGroupFeedback(id: string, state: ActionState, message: string) {
    setFeedback(current => ({ ...current, [id]: { state, message } }))
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    setCreateFeedback({ state: 'pending', message: 'Creating group…' })
    const result = await createGroup(newName)
    if (result.group) {
      const group = { ...result.group, contact_count: 0 } as Group
      setGroups(previous => [...previous, group])
      setSlugValues(previous => ({ ...previous, [group.id]: group.share_slug ?? '' }))
      setNewName('')
      setCreateFeedback({ state: 'saved', message: `${group.name} created.` })
      router.refresh()
    } else {
      setCreateFeedback({ state: 'error', message: result.error ?? 'Could not create group.' })
    }
    setCreating(false)
  }

  async function handleToggleBirthday(group: Group) {
    const next = !group.birthday_tracking
    setGroupFeedback(group.id, 'pending', 'Saving birthday tracking…')
    const result = await updateGroup(group.id, { birthday_tracking: next })
    if (result.error) {
      setGroupFeedback(group.id, 'error', result.error)
      return
    }
    setGroups(previous => previous.map(item => item.id === group.id ? { ...item, birthday_tracking: next } : item))
    setGroupFeedback(group.id, 'saved', `Birthday tracking ${next ? 'enabled' : 'disabled'}.`)
    router.refresh()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const result = await deleteGroup(deleteTarget.id)
    if (result.error) {
      setGroupFeedback(deleteTarget.id, 'error', result.error)
    } else {
      setGroups(previous => previous.filter(group => group.id !== deleteTarget.id))
      router.refresh()
    }
    setDeleting(false)
    setDeleteTarget(null)
  }

  function handleSlugChange(groupId: string, value: string) {
    setSlugValues(previous => ({ ...previous, [groupId]: value.toLowerCase() }))
    setSlugErrors(previous => ({ ...previous, [groupId]: null }))
  }

  async function handleSaveSlug(group: Group) {
    const value = (slugValues[group.id] ?? '').trim().toLowerCase()
    if (value) {
      const parsed = slugSchema.safeParse(value)
      if (!parsed.success) {
        setSlugErrors(previous => ({ ...previous, [group.id]: parsed.error.errors[0]?.message ?? 'Invalid slug' }))
        return
      }
    }

    setSavingSlug(group.id)
    setGroupFeedback(group.id, 'pending', 'Saving share link…')
    const result = await updateGroupShareSlug(group.id, value)
    const messages: Record<string, string> = {
      slug_taken: 'That slug is already taken.',
      slug_limit: 'You can have up to 10 share slugs.',
    }
    if (result.error) {
      const message = messages[result.error] ?? result.error
      setSlugErrors(previous => ({ ...previous, [group.id]: message }))
      setGroupFeedback(group.id, 'error', message)
    } else {
      setGroups(previous => previous.map(item => item.id === group.id ? { ...item, share_slug: value || null } : item))
      setSlugValues(previous => ({ ...previous, [group.id]: value }))
      setGroupFeedback(group.id, 'saved', value ? 'Share link saved.' : 'Share link removed.')
      router.refresh()
    }
    setSavingSlug(null)
  }

  async function copyShareLink(group: Group) {
    if (!group.share_slug) return
    try {
      await navigator.clipboard.writeText(`${siteUrl}/share/${group.share_slug}`)
      setCopiedId(group.id)
      setGroupFeedback(group.id, 'saved', 'Share link copied.')
      window.setTimeout(() => setCopiedId(current => current === group.id ? null : current), 2000)
    } catch {
      setGroupFeedback(group.id, 'error', 'Could not copy the link. Select and copy it manually.')
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreate} className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <div>
          <label htmlFor="new-group-name" className="mb-1.5 block text-sm font-medium text-ink">Group name</label>
          <input id="new-group-name" value={newName} onChange={event => setNewName(event.target.value)} placeholder="e.g. Family" className="input min-h-11 w-full" />
        </div>
        <button type="submit" disabled={creating || !newName.trim()} className="btn-primary min-h-11 self-end px-5">
          {creating ? 'Adding…' : 'Add group'}
        </button>
      </form>
      {createFeedback && <ActionFeedback {...createFeedback} className="text-sm" />}

      <div className="space-y-2">
        {groups.length === 0 && <p className="text-sm text-ink-muted">No groups yet. Create one above.</p>}
        {groups.map(group => {
          const shareUrl = group.share_slug ? `${siteUrl}/share/${group.share_slug}` : null
          return (
            <div key={group.id} className="flex flex-col gap-3 rounded-xl border border-border/60 bg-linen/60 px-4 py-3 transition-colors hover:bg-linen">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full text-white" style={{ background: 'linear-gradient(135deg, var(--periwinkle), var(--blue-slate))' }}><Users size={14} /></span>
                  <div>
                    <p className="font-serif text-base text-ink">{group.name}</p>
                    <p className="text-xs text-ink-muted">{group.contact_count} {group.contact_count === 1 ? 'contact' : 'contacts'}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex min-h-11 cursor-pointer select-none items-center gap-2 px-2 text-sm text-ink-muted">
                    <input type="checkbox" checked={group.birthday_tracking} onChange={() => void handleToggleBirthday(group)} className="h-4 w-4" />
                    Birthday tracking
                  </label>
                  <button type="button" onClick={() => setDeleteTarget(group)} aria-label={`Delete ${group.name}`} className="flex h-11 w-11 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-stamp/10 hover:text-stamp"><Trash2 size={15} /></button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 border-t border-border/50 pt-3">
                <label htmlFor={`group-slug-${group.id}`} className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted">Group share link</label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="flex min-h-11 flex-1 items-center rounded-xl border border-border/80 bg-surface-raised px-3">
                    <Link2 size={14} className="mr-2 shrink-0 text-ink-muted" />
                    <span className="shrink-0 select-none text-sm text-ink-muted">{siteUrl}/share/</span>
                    <input id={`group-slug-${group.id}`} value={slugValues[group.id] ?? ''} onChange={event => handleSlugChange(group.id, event.target.value)} placeholder={group.name.toLowerCase().replace(/\s+/g, '-')} className="min-w-0 flex-1 bg-transparent py-2 text-sm text-ink outline-none placeholder:text-ink-muted/50" minLength={3} maxLength={30} />
                  </div>
                  <button type="button" onClick={() => void handleSaveSlug(group)} disabled={savingSlug === group.id || (slugValues[group.id] ?? '') === (group.share_slug ?? '')} className="btn-primary min-h-11 px-4 text-sm">{savingSlug === group.id ? 'Saving…' : 'Save'}</button>
                  {shareUrl && <button type="button" onClick={() => void copyShareLink(group)} aria-label={`Copy ${group.name} share link`} className="btn-outline inline-flex min-h-11 items-center justify-center gap-2 px-4 text-sm">{copiedId === group.id ? <Check size={15} /> : <Copy size={15} />} Copy</button>}
                  {shareUrl && <a href={shareUrl} target="_blank" rel="noreferrer" className="btn-outline inline-flex min-h-11 items-center justify-center gap-2 px-4 text-sm"><ExternalLink size={15} /> View</a>}
                </div>
                {slugErrors[group.id] && <p className="text-sm text-stamp" role="alert">{slugErrors[group.id]}</p>}
                {group.share_slug && !slugErrors[group.id] && <p className="text-xs text-ink-muted">New submissions through this link are added to {group.name}.</p>}
                {feedback[group.id] && <ActionFeedback {...feedback[group.id]} className="text-xs" />}
              </div>
            </div>
          )
        })}
      </div>

      <ConfirmDialog open={Boolean(deleteTarget)} title={deleteTarget ? `Delete ${deleteTarget.name}?` : 'Delete group?'} description={deleteTarget ? `${deleteTarget.contact_count} ${deleteTarget.contact_count === 1 ? 'contact is' : 'contacts are'} assigned to this group. Contacts will not be deleted.` : undefined} confirmLabel="Delete group" destructive pending={deleting} onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </div>
  )
}
