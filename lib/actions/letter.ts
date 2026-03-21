'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { letterDraftSchema, letterStyleSchema } from '@/lib/schemas'
import { DEFAULT_STYLE, type LetterStyle, type ComposerTemplate } from '@/lib/letter-templates'
import { resend, buildLetterEmail } from '@/lib/resend'
import { interpolate } from '@/lib/utils'
import { recordFirstSent } from '@/lib/actions/user'

export async function getDraft() {
  const supabase = await createClient()
  const { data } = await supabase.from('letter_drafts').select('*').maybeSingle()
  // Cast style from Supabase Json type to LetterStyle — the DB column is validated on write
  if (data) return { ...data, style: (data.style ?? DEFAULT_STYLE) as LetterStyle }
  return { subject: '', body: '', style: DEFAULT_STYLE }
}

export async function saveDraft(formData: { subject: string; body: string; style?: LetterStyle }) {
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
  const style = (draft.style ?? DEFAULT_STYLE) as LetterStyle

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

  await recordFirstSent()

  const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

  for (const contact of contacts) {
    const body = interpolate(draft.body, { first_name: contact.first_name, last_name: contact.last_name })
    const subject = interpolate(draft.subject, { first_name: contact.first_name, last_name: contact.last_name })
    const { html } = buildLetterEmail({ subject, body, style })

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

export async function listTemplates(): Promise<ComposerTemplate[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('letter_templates')
    .select('*')
    .order('created_at', { ascending: true })

  return (data ?? []).map(t => ({
    id: t.id,
    name: t.name,
    body: t.body,
    style: t.style as LetterStyle,
    source: 'user' as const,
  }))
}

export async function saveTemplate(input: {
  name: string
  body: string
  style: LetterStyle
}): Promise<{ success?: true; template?: ComposerTemplate; error?: string }> {
  if (!input.name.trim()) return { error: 'Template name is required' }

  const styleResult = letterStyleSchema.safeParse(input.style)
  if (!styleResult.success) return { error: 'Invalid style' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('letter_templates')
    .insert({ admin_id: user.id, name: input.name.trim(), body: input.body, style: styleResult.data })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard/compose')
  return {
    success: true,
    template: {
      id: data.id,
      name: data.name,
      body: data.body,
      style: data.style as LetterStyle,
      source: 'user',
    },
  }
}

export async function deleteTemplate(id: string): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('letter_templates').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/compose')
  return { success: true }
}
