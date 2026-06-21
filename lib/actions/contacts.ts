'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { contactEditSchema, contactSchema } from '@/lib/schemas'
import { revalidatePath } from 'next/cache'
import { getUserProfile } from '@/lib/user-profile'
import { randomUUID } from 'crypto'
import { getResend, buildNoteNotificationEmail, buildAddressRefreshEmail } from '@/lib/resend'
import { geocodeAddress } from '@/lib/geocode'
import { verifyShareCapability } from '@/lib/share-capability'
import type { Contact } from '@/lib/database.types'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

async function notifyAdminOfNote(opts: {
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

export async function submitPublicContact(shareCapability: string, formData: unknown, note?: string) {
  const capability = verifyShareCapability(shareCapability)
  if (!capability) return { error: 'This share link has expired. Please reload the page and try again.' }

  const parsed = contactSchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const supabase = await createServiceClient()

  const { data: existing } = await supabase
    .from('contacts')
    .select('id')
    .eq('admin_id', capability.adminId)
    .eq('email', parsed.data.email)
    .maybeSingle()

  if (existing) {
    return { success: true, alreadyExists: true }
  }

  const publicContact = {
    first_name: parsed.data.first_name,
    last_name: parsed.data.last_name,
    email: parsed.data.email,
    address_line_1: parsed.data.address_line_1,
    address_line_2: parsed.data.address_line_2,
    city: parsed.data.city,
    state: parsed.data.state,
    zip: parsed.data.zip,
    is_international: parsed.data.is_international,
    country: parsed.data.country,
    delivery_method: 'print',
    tags: [],
    admin_id: capability.adminId,
    ...(note?.trim() ? { note: note.trim().slice(0, 280) } : {}),
  }

  const { data, error } = await supabase
    .from('contacts')
    .insert(publicContact)
    .select('id')
    .single()

  if (error) return { error: error.message }

  if (capability.groupId) {
    const { data: group } = await supabase
      .from('groups')
      .select('id')
      .eq('id', capability.groupId)
      .eq('admin_id', capability.adminId)
      .maybeSingle()

    if (group) {
      const { error: groupInsertError } = await supabase
        .from('contact_groups')
        .upsert(
          { contact_id: data.id, group_id: group.id },
          { onConflict: 'contact_id,group_id' },
        )
      if (groupInsertError) return { error: groupInsertError.message }
    }
  }

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

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/map')
  if (capability.groupId) revalidatePath('/dashboard/groups')

  if (note?.trim()) {
    await notifyAdminOfNote({
      adminId: capability.adminId,
      recipientFirstName: parsed.data.first_name,
      note: note.trim().slice(0, 280),
    })
  }

  return { success: true }
}

export async function getContacts(): Promise<Contact[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function updateContact(id: string, updates: Partial<{
  delivery_method: 'handwrite' | 'print' | 'digital'
  tags: string[]
  opted_out: boolean
  birthday: string | null
}>) {
  const supabase = await createClient()
  const { error } = await supabase.from('contacts').update(updates).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/map')
}

export async function updateContactDetails(id: string, formData: unknown) {
  const parsed = contactEditSchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { data: existing, error: existingError } = await supabase
    .from('contacts')
    .select('id, email')
    .eq('id', id)
    .maybeSingle()

  if (existingError) return { error: existingError.message }
  if (!existing) return { error: 'Contact not found.' }

  const tags = (parsed.data.tags ?? '')
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean)

  if (parsed.data.email !== existing.email) {
    const { data: duplicate } = await supabase
      .from('contacts')
      .select('id')
      .eq('email', parsed.data.email)
      .neq('id', id)
      .maybeSingle()

    if (duplicate) return { error: 'Another contact already uses that email.' }
  }

  const coords = await geocodeAddress(
    parsed.data.address_line_1,
    parsed.data.city,
    parsed.data.state,
    parsed.data.zip,
    parsed.data.is_international ? parsed.data.country ?? null : null,
  )

  const { error } = await supabase
    .from('contacts')
    .update({
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      email: parsed.data.email,
      address_line_1: parsed.data.address_line_1,
      address_line_2: parsed.data.address_line_2?.trim() || null,
      city: parsed.data.city,
      state: parsed.data.state,
      zip: parsed.data.zip,
      is_international: parsed.data.is_international,
      country: parsed.data.is_international ? parsed.data.country?.trim() ?? null : null,
      tags,
      ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/map')
  revalidatePath('/dashboard/export')
  return { success: true }
}

export async function deleteContact(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('contacts').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/map')
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
  revalidatePath('/dashboard/map')
  return { success: true }
}

export async function backfillContactGeocodes() {
  const supabase = await createServiceClient()
  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('id, address_line_1, city, state, zip, country, is_international, lat, lng')
    .or('lat.is.null,lng.is.null')

  if (error) return { error: error.message }

  let updated = 0
  for (const contact of contacts ?? []) {
    if (contact.lat != null && contact.lng != null) continue
    const coords = await geocodeAddress(
      contact.address_line_1,
      contact.city,
      contact.state,
      contact.zip,
      contact.is_international ? contact.country : null,
    )
    if (!coords) continue
    const { error: updateError } = await supabase
      .from('contacts')
      .update({ lat: coords.lat, lng: coords.lng })
      .eq('id', contact.id)
    if (!updateError) updated++
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/map')
  return { success: true, updated }
}
