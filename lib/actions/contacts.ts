'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { contactSchema } from '@/lib/schemas'
import { revalidatePath } from 'next/cache'

export async function upsertContact(adminId: string, formData: unknown) {
  const parsed = contactSchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const supabase = await createServiceClient()
  const { error } = await supabase
    .from('contacts')
    .upsert({ ...parsed.data, admin_id: adminId }, { onConflict: 'admin_id,email' })

  if (error) return { error: error.message }
  return { success: true }
}

export async function getContacts() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function updateContact(id: string, updates: Partial<{
  delivery_method: string
  tags: string[]
  opted_out: boolean
}>) {
  const supabase = await createClient()
  const { error } = await supabase.from('contacts').update(updates).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
}

export async function deleteContact(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('contacts').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
}
