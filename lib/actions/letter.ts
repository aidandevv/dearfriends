'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { letterDraftSchema } from '@/lib/schemas'
import { resend, buildLetterEmail } from '@/lib/resend'
import { interpolate } from '@/lib/utils'

export async function getDraft() {
  const supabase = await createClient()
  const { data } = await supabase.from('letter_drafts').select('*').maybeSingle()
  return data ?? { subject: '', body: '' }
}

export async function saveDraft(formData: { subject: string; body: string }) {
  const parsed = letterDraftSchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('letter_drafts')
    .upsert({ admin_id: user.id, ...parsed.data }, { onConflict: 'admin_id' })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/compose')
  return { success: true }
}

type DigitalContact = { first_name: string; last_name: string; email: string }

export async function sendDigitalLetters(groupId: string | null = null) {
  const supabase = await createClient()

  const { data: draft } = await supabase.from('letter_drafts').select('*').maybeSingle()
  if (!draft?.subject || !draft?.body) return { error: 'No draft saved.' }

  let contacts: DigitalContact[]

  if (groupId) {
    const { data: cg } = await supabase
      .from('contact_groups')
      .select('contacts(first_name, last_name, email, delivery_method, opted_out)')
      .eq('group_id', groupId)
    contacts = (cg ?? [])
      .flatMap(r => (r.contacts ? [r.contacts as unknown as { first_name: string; last_name: string; email: string; delivery_method: string; opted_out: boolean }] : []))
      .filter(c => c.delivery_method === 'digital' && !c.opted_out)
  } else {
    const { data } = await supabase
      .from('contacts')
      .select('first_name, last_name, email')
      .eq('delivery_method', 'digital')
      .eq('opted_out', false)
    contacts = data ?? []
  }

  if (!contacts.length) return { error: 'No digital contacts.' }

  const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

  for (const contact of contacts) {
    const body = interpolate(draft.body, { first_name: contact.first_name, last_name: contact.last_name })
    const subject = interpolate(draft.subject, { first_name: contact.first_name, last_name: contact.last_name })
    const { html } = buildLetterEmail({ subject, body })

    await resend.emails.send({ from: FROM_EMAIL, to: contact.email, subject, html })
  }

  return { success: true, count: contacts.length }
}

export async function getRandomContact() {
  const supabase = await createClient()
  const { data } = await supabase.from('contacts').select('first_name, last_name').limit(10)

  if (!data?.length) return { first_name: 'Jane', last_name: 'Smith' }

  return data[Math.floor(Math.random() * data.length)]
}
