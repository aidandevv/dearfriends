'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { contactSchema } from '@/lib/schemas'
import { revalidatePath } from 'next/cache'
import { getUserProfile } from '@/lib/user-profile'
import { getResend, buildNoteNotificationEmail } from '@/lib/resend'

export async function upsertContact(adminId: string, formData: unknown) {
  const parsed = contactSchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('contacts')
    .upsert({ ...parsed.data, admin_id: adminId }, { onConflict: 'admin_id,email' })
    .select('id')
    .single()

  if (error) return { error: error.message }
  return { success: true, contactId: data.id }
}

export async function submitNote(contactId: string, note: string) {
  if (!note.trim()) return { success: true }
  const supabase = await createServiceClient()
  const { error } = await supabase
    .from('contacts')
    .update({ note: note.slice(0, 280) })
    .eq('id', contactId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function notifyAdminOfNote(opts: {
  adminId: string
  recipientFirstName: string
  note: string
}) {
  const supabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.admin.getUserById(opts.adminId)
  if (!user?.email) return

  const profile = getUserProfile(user)
  const { subject, html } = buildNoteNotificationEmail({
    recipientFirstName: opts.recipientFirstName,
    note: opts.note,
    adminName: profile.firstName,
  })

  const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: user.email,
    subject,
    html,
  })
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
