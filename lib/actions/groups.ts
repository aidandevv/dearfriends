'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { slugSchema } from '@/lib/schemas'
import { countShareSlugsForAdmin, isShareSlugTaken } from '@/lib/share-slugs'

export async function getGroups() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getGroupsWithCounts() {
  const [groups, memberships] = await Promise.all([
    getGroups(),
    (async () => {
      const supabase = await createClient()
      const { data, error } = await supabase.from('contact_groups').select('group_id')
      if (error) throw new Error(error.message)
      return data ?? []
    })(),
  ])
  const counts = memberships.reduce<Record<string, number>>((acc, membership) => {
    acc[membership.group_id] = (acc[membership.group_id] ?? 0) + 1
    return acc
  }, {})
  return groups.map(group => ({ ...group, contact_count: counts[group.id] ?? 0 }))
}

export async function createGroup(name: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('groups')
    .insert({ name: name.trim() })
    .select('*')
    .single()
  if (error) return { error: error.message }
  revalidatePath('/dashboard/groups')
  return { success: true, group: data }
}

export async function updateGroup(id: string, updates: { name?: string; birthday_tracking?: boolean }) {
  const supabase = await createClient()
  const { error } = await supabase.from('groups').update(updates).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/groups')
  return { success: true }
}

export async function updateGroupShareSlug(id: string, slug: string): Promise<{ error?: string; success?: boolean }> {
  const normalised = slug.trim().toLowerCase()
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('id, admin_id, share_slug')
    .eq('id', id)
    .single()

  if (groupError || !group) return { error: 'Group not found.' }

  if (!normalised) {
    const { error } = await supabase.from('groups').update({ share_slug: null }).eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/dashboard/groups')
    return { success: true }
  }

  const parsed = slugSchema.safeParse(normalised)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid slug' }

  const conflict = await isShareSlugTaken(normalised, { excludingGroupId: id })
  if (conflict) return { error: 'slug_taken' }

  const currentlyHasSlug = typeof group.share_slug === 'string' && group.share_slug.length > 0
  if (!currentlyHasSlug) {
    const slugCount = await countShareSlugsForAdmin(user.id)
    if (slugCount >= 10) return { error: 'slug_limit' }
  }

  const { error } = await supabase.from('groups').update({ share_slug: normalised }).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/groups')
  return { success: true }
}

export async function deleteGroup(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('groups').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/groups')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function getContactGroups(contactId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('contact_groups')
    .select('group_id')
    .eq('contact_id', contactId)
  if (error) return []
  return data.map(r => r.group_id)
}

export async function getContactGroupMemberships(): Promise<Record<string, string[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('contact_groups')
    .select('contact_id, group_id')
  if (error) throw new Error(error.message)
  return (data ?? []).reduce<Record<string, string[]>>((acc, row) => {
    acc[row.contact_id] = [...(acc[row.contact_id] ?? []), row.group_id]
    return acc
  }, {})
}

export async function setContactGroups(contactId: string, groupIds: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .select('id')
    .eq('id', contactId)
    .maybeSingle()
  if (contactError || !contact) return { error: 'Contact not found.' }

  const uniqueGroupIds = [...new Set(groupIds)]
  if (uniqueGroupIds.length > 0) {
    const { data: ownedGroups, error: groupError } = await supabase
      .from('groups')
      .select('id')
      .in('id', uniqueGroupIds)
    if (groupError) return { error: groupError.message }
    if ((ownedGroups ?? []).length !== uniqueGroupIds.length) {
      return { error: 'One or more groups were not found.' }
    }
  }

  const { data: existingRows, error: existingError } = await supabase
    .from('contact_groups')
    .select('group_id')
    .eq('contact_id', contactId)
  if (existingError) return { error: existingError.message }
  const existingIds = new Set((existingRows ?? []).map(row => row.group_id))
  const toAdd = uniqueGroupIds.filter(groupId => !existingIds.has(groupId))
  const toRemove = [...existingIds].filter(groupId => !uniqueGroupIds.includes(groupId))

  if (toAdd.length > 0) {
    const rows = toAdd.map(group_id => ({ contact_id: contactId, group_id }))
    const { error } = await supabase.from('contact_groups').insert(rows)
    if (error) return { error: error.message }
  }
  if (toRemove.length > 0) {
    const { error } = await supabase.from('contact_groups').delete().eq('contact_id', contactId).in('group_id', toRemove)
    if (error) return { error: error.message }
  }
  revalidatePath('/dashboard')
  return { success: true }
}

export async function getContactsByGroup(groupId: string | null) {
  const supabase = await createClient()
  if (!groupId) {
    // return all contacts
    const { data } = await supabase.from('contacts').select('*').order('created_at', { ascending: false })
    return data ?? []
  }
  const { data } = await supabase
    .from('contact_groups')
    .select('contacts(*)')
    .eq('group_id', groupId)
  return (data ?? []).flatMap(r => (r.contacts ? [r.contacts] : []))
}

export async function getBirthdayEditableContactIds(): Promise<string[]> {
  const supabase = await createClient()
  const { data: groups } = await supabase
    .from('groups')
    .select('id')
    .eq('birthday_tracking', true)

  if (!groups?.length) return []

  const { data } = await supabase
    .from('contact_groups')
    .select('contact_id')
    .in('group_id', groups.map(group => group.id))

  return [...new Set((data ?? []).map(row => row.contact_id))]
}
