'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { contactSchema } from '@/lib/schemas'
import { revalidatePath } from 'next/cache'
import { getUserProfile } from '@/lib/user-profile'
import { randomUUID } from 'crypto'
import { getResend, buildNoteNotificationEmail, buildAddressRefreshEmail } from '@/lib/resend'
import { geocodeAddress } from '@/lib/geocode'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

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

  // Fire-and-forget geocoding: silently skip on failure, never blocks the user
  try {
    const coords = await geocodeAddress(
      parsed.data.address_line_1,
      parsed.data.city,
      parsed.data.state,
      parsed.data.zip,
      parsed.data.is_international ? parsed.data.country : null,
    )
    if (coords) {
      await supabase
        .from('contacts')
        .update({ lat: coords.lat, lng: coords.lng })
        .eq('id', data.id)
    }
  } catch { /* non-fatal */ }

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

export async function sendAddressRefreshNudge(contactId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .select('id, email, first_name')
    .eq('id', contactId)
    .eq('opted_out', false)
    .single()

  if (contactError || !contact) return { error: 'Contact not found.' }

  const token = randomUUID()
  const { error: tokenError } = await supabase
    .from('contacts')
    .update({ verification_token: token, verification_sent_at: new Date().toISOString() })
    .eq('id', contactId)

  if (tokenError) return { error: tokenError.message }

  const senderProfile = getUserProfile(user)

  const { subject, html } = buildAddressRefreshEmail({
    firstName: contact.first_name,
    refreshUrl: `${SITE_URL}/verify/${token}`,
    adminName: senderProfile.fullName,
  })

  const result = await getResend().emails.send({
    from: FROM_EMAIL,
    to: contact.email,
    subject,
    html,
  })

  if (result.error) return { error: result.error.message }

  revalidatePath('/dashboard')
  return { success: true }
}
