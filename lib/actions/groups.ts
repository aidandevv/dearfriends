'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function getGroups() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createGroup(name: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('groups').insert({ name: name.trim() })
  if (error) return { error: error.message }
  revalidatePath('/dashboard/groups')
  return { success: true }
}

export async function updateGroup(id: string, updates: { name?: string; birthday_tracking?: boolean }) {
  const supabase = await createClient()
  const { error } = await supabase.from('groups').update(updates).eq('id', id)
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

export async function setContactGroups(contactId: string, groupIds: string[]) {
  const supabase = await createClient()
  // Delete all existing, then insert new
  await supabase.from('contact_groups').delete().eq('contact_id', contactId)
  if (groupIds.length > 0) {
    const rows = groupIds.map(group_id => ({ contact_id: contactId, group_id }))
    const { error } = await supabase.from('contact_groups').insert(rows)
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
