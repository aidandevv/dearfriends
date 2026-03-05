'use server'

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { resend, buildVerificationEmail } from '@/lib/resend'
import { scheduleVerificationSchema, verifySchema } from '@/lib/schemas'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

export async function sendVerificationToAll() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('id, email, first_name')
    .eq('opted_out', false)

  if (error) return { error: error.message }
  if (!contacts?.length) return { error: 'No eligible contacts.' }

  let sent = 0
  let failed = 0

  for (const contact of contacts) {
    const token = randomUUID()

    const { error: tokenError } = await supabase
      .from('contacts')
      .update({ verification_token: token, verification_sent_at: new Date().toISOString() })
      .eq('id', contact.id)
    if (tokenError) {
      failed++
      continue
    }

    const { subject, html } = buildVerificationEmail({
      firstName: contact.first_name,
      verifyUrl: `${SITE_URL}/verify/${token}`,
    })

    const emailResult = await resend.emails.send({ from: FROM_EMAIL, to: contact.email, subject, html })
    if (emailResult.error) {
      failed++
      continue
    }

    sent++
  }

  if (sent === 0) return { error: `Failed to send verification emails. ${failed} failed.` }

  return { success: true, count: sent, failed }
}

export async function scheduleVerification(formData: FormData) {
  const parsed = scheduleVerificationSchema.safeParse({
    send_at: formData.get('send_at'),
  })

  if (!parsed.success) return { error: 'Invalid date.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase.from('scheduled_verifications').insert({
    admin_id: user.id,
    send_at: parsed.data.send_at,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function handleVerifyToken(
  token: string,
  action: 'confirm' | 'update' | 'optout',
  updates?: { address_line_1: string; address_line_2?: string; city: string; state: string; zip: string },
) {
  const supabase = await createClient()
  const { data: tokenContact, error: tokenError } = await supabase
    .from('contacts')
    .select('id')
    .eq('verification_token', token)
    .maybeSingle()

  if (tokenError) return { error: tokenError.message }
  if (!tokenContact) return { error: 'This verification link is invalid or has expired.' }

  if (action === 'optout') {
    const { error } = await supabase
      .from('contacts')
      .update({ opted_out: true, verification_token: null })
      .eq('id', tokenContact.id)

    return error ? { error: error.message } : { success: true }
  }

  if (action === 'confirm') {
    const { error } = await supabase
      .from('contacts')
      .update({ verified_at: new Date().toISOString(), verification_token: null })
      .eq('id', tokenContact.id)

    return error ? { error: error.message } : { success: true }
  }

  if (action === 'update' && updates) {
    const parsed = verifySchema.safeParse(updates)
    if (!parsed.success) return { error: 'Invalid address.' }

    const { error } = await supabase
      .from('contacts')
      .update({ ...parsed.data, verified_at: new Date().toISOString(), verification_token: null })
      .eq('id', tokenContact.id)

    return error ? { error: error.message } : { success: true }
  }

  return { error: 'Unknown action.' }
}
