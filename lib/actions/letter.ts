'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { letterDraftSchema } from '@/lib/schemas'
import { resend, buildLetterEmail } from '@/lib/resend'
import { interpolate } from '@/lib/utils'
import { recordFirstSent } from '@/lib/actions/user'
import type { ActionResult } from '@/lib/action-result'

export async function getDraft() {
  const supabase = await createClient()
  const { data } = await supabase.from('letter_drafts').select('*').maybeSingle()
  return data ?? { subject: '', body: '' }
}

export async function saveDraft(formData: { subject: string; body: string }): Promise<ActionResult> {
  const parsed = letterDraftSchema.safeParse(formData)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? 'Invalid draft.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Not authenticated.' }

  const { error } = await supabase
    .from('letter_drafts')
    .upsert({ admin_id: user.id, ...parsed.data }, { onConflict: 'admin_id' })

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/compose')
  return { success: true }
}

type DigitalContact = { first_name: string; last_name: string; email: string }

type AudienceContact = DigitalContact & {
  delivery_method: string
  opted_out: boolean
}

export type DeliverySummary = {
  audienceLabel: string
  total: number
  handwrite: number
  print: number
  digital: number
  eligibleDigital: number
  draftSubject: string | null
  hasDraft: boolean
}

async function getAudience(groupId: string | null): Promise<{ contacts: AudienceContact[]; label: string }> {
  const supabase = await createClient()
  if (!groupId) {
    const { data, error } = await supabase
      .from('contacts')
      .select('first_name, last_name, email, delivery_method, opted_out')
    if (error) throw new Error(error.message)
    return { contacts: data ?? [], label: 'All contacts' }
  }

  const [{ data: memberships, error }, { data: group }] = await Promise.all([
    supabase
      .from('contact_groups')
      .select('contacts(first_name, last_name, email, delivery_method, opted_out)')
      .eq('group_id', groupId),
    supabase.from('groups').select('name').eq('id', groupId).maybeSingle(),
  ])
  if (error) throw new Error(error.message)
  const contacts = (memberships ?? []).flatMap(row => row.contacts ? [row.contacts as unknown as AudienceContact] : [])
  return { contacts, label: group?.name ?? 'Selected group' }
}

export async function getDeliverySummary(groupId: string | null = null): Promise<DeliverySummary> {
  const supabase = await createClient()
  const [{ contacts, label }, { data: draft }] = await Promise.all([
    getAudience(groupId),
    supabase.from('letter_drafts').select('subject, body').maybeSingle(),
  ])
  return {
    audienceLabel: label,
    total: contacts.length,
    handwrite: contacts.filter(contact => contact.delivery_method === 'handwrite').length,
    print: contacts.filter(contact => contact.delivery_method === 'print').length,
    digital: contacts.filter(contact => contact.delivery_method === 'digital').length,
    eligibleDigital: contacts.filter(contact => contact.delivery_method === 'digital' && !contact.opted_out && Boolean(contact.email)).length,
    draftSubject: draft?.subject || null,
    hasDraft: Boolean(draft?.subject && draft?.body),
  }
}

export async function sendDigitalLetters(groupId: string | null = null, onlyEmails: string[] | null = null) {
  const supabase = await createClient()

  const { data: draft } = await supabase.from('letter_drafts').select('*').maybeSingle()
  if (!draft?.subject || !draft?.body) return { error: 'No draft saved.' }

  const audience = await getAudience(groupId)
  let contacts: DigitalContact[] = audience.contacts.filter(contact => contact.delivery_method === 'digital' && !contact.opted_out)
  if (onlyEmails?.length) {
    const retrySet = new Set(onlyEmails)
    contacts = contacts.filter(contact => retrySet.has(contact.email))
  }

  if (!contacts.length) return { error: 'No digital contacts.' }

  await recordFirstSent()

  const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

  let sent = 0
  let failed = 0
  const failures: string[] = []

  for (const contact of contacts) {
    const body = interpolate(draft.body, { first_name: contact.first_name, last_name: contact.last_name })
    const subject = interpolate(draft.subject, { first_name: contact.first_name, last_name: contact.last_name })
    const { html } = buildLetterEmail({ subject, body })

    const result = await resend.emails.send({ from: FROM_EMAIL, to: contact.email, subject, html })
    if (result.error) {
      failed++
      failures.push(contact.email)
      continue
    }
    sent++
  }

  if (!sent && failed) return { error: `Failed to send ${failed} email(s).` }

  return {
    success: true,
    count: sent,
    ...(failed ? { failed, failures } : {}),
  }
}

export async function getRandomContact() {
  const supabase = await createClient()
  const { data } = await supabase.from('contacts').select('first_name, last_name').limit(10)

  if (!data?.length) return { first_name: 'Jane', last_name: 'Smith' }

  return data[Math.floor(Math.random() * data.length)]
}
