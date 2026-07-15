'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { calendarEventSchema, calendarImportSchema, mailingOriginSchema } from '@/lib/schemas'
import { buildCalendarReminderEmail, getResend } from '@/lib/resend'
import { getUserProfile } from '@/lib/user-profile'
import { fetchCalendarSubscription } from '@/lib/calendar-subscription'
import { dateKeyInTimeZone } from '@/lib/calendar-date'

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

type ContactForOffset = {
  first_name?: string | null
  last_name?: string | null
  state?: string | null
  is_international?: boolean | null
  country?: string | null
  admin_id?: string | null
}

type CalendarEventRow = {
  id: string
  title: string
  event_type: 'birthday' | 'anniversary' | 'holiday' | 'custom'
  event_date: string
  recurrence: 'none' | 'yearly'
  contact_id: string | null
  source: 'manual' | 'google' | 'outlook' | 'ics'
  reminder_enabled: boolean
  last_reminder_sent_for?: string | null
  contacts?: ContactForOffset | ContactForOffset[] | null
}

export type CalendarEventView = CalendarEventRow & {
  occurrenceDate: string
  mailByDate: string
  offsetDays: number
  offsetLabel: string
  contactName: string | null
}

const NEARBY_STATES: Record<string, string[]> = {
  CA: ['OR', 'WA', 'NV', 'AZ'],
  OR: ['WA', 'CA', 'ID', 'NV'],
  WA: ['OR', 'ID', 'CA'],
  NV: ['CA', 'OR', 'ID', 'UT', 'AZ'],
  AZ: ['CA', 'NV', 'UT', 'NM'],
  NY: ['NJ', 'CT', 'PA', 'MA', 'VT'],
  TX: ['OK', 'LA', 'AR', 'NM'],
  FL: ['GA', 'AL', 'SC'],
}

function normaliseState(state?: string | null) {
  return state?.trim().slice(0, 2).toUpperCase() ?? ''
}

function estimateMailingOffsetDays(contact: ContactForOffset | null, originState?: string | null) {
  if (contact?.is_international) return { days: 12, label: 'International mail' }

  const origin = normaliseState(originState)
  const destination = normaliseState(contact?.state)
  if (!origin || !destination) return { days: 4, label: 'Standard mail' }
  if (origin === destination) return { days: 3, label: 'Same-state mail' }
  if (NEARBY_STATES[origin]?.includes(destination)) return { days: 4, label: 'Nearby-state mail' }
  return { days: 6, label: 'Far-state mail' }
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10)
}

function parseDateOnly(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function nextOccurrence(eventDate: string, recurrence: 'none' | 'yearly', todayKey = toDateOnly(new Date())) {
  const base = parseDateOnly(eventDate)
  if (recurrence === 'none') return base

  const year = Number(todayKey.slice(0, 4))
  const candidate = new Date(Date.UTC(year, base.getUTCMonth(), base.getUTCDate()))
  if (toDateOnly(candidate) < todayKey) candidate.setUTCFullYear(candidate.getUTCFullYear() + 1)
  return candidate
}

function contactFromRow(row: CalendarEventRow): ContactForOffset | null {
  if (Array.isArray(row.contacts)) return row.contacts[0] ?? null
  return row.contacts ?? null
}

function decorateEvent(row: CalendarEventRow, originState?: string | null, todayKey?: string): CalendarEventView {
  const contact = contactFromRow(row)
  const occurrence = nextOccurrence(row.event_date, row.recurrence, todayKey)
  const offset = estimateMailingOffsetDays(contact, originState)
  const contactName = contact?.first_name
    ? `${contact.first_name}${contact.last_name ? ` ${contact.last_name}` : ''}`
    : null

  return {
    ...row,
    occurrenceDate: toDateOnly(occurrence),
    mailByDate: toDateOnly(addDays(occurrence, -offset.days)),
    offsetDays: offset.days,
    offsetLabel: offset.label,
    contactName,
  }
}

export async function getCalendarData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated.')

  const [{ data: events }, { data: contacts }, { data: sources }] = await Promise.all([
    supabase
      .from('calendar_events')
      .select('*, contacts(first_name,last_name,state,is_international,country)')
      .order('event_date', { ascending: true }),
    supabase
      .from('contacts')
      .select('id, first_name, last_name, state, is_international, country')
      .order('first_name', { ascending: true }),
    supabase
      .from('calendar_sources')
      .select('*')
      .order('created_at', { ascending: false }),
  ])

  const originState = user.user_metadata?.mailing_state ?? null
  const timeZone = getUserProfile(user).timeZone ?? 'UTC'
  const todayKey = dateKeyInTimeZone(new Date(), timeZone)
  const decorated = ((events ?? []) as CalendarEventRow[])
    .map(event => decorateEvent(event, originState, todayKey))
    .sort((a, b) => a.occurrenceDate.localeCompare(b.occurrenceDate))

  return {
    events: decorated,
    contacts: contacts ?? [],
    sources: sources ?? [],
    originState,
    timeZone,
    todayKey,
  }
}

export async function getCalendarWidget() {
  const data = await getCalendarData()
  const relevantEvents = data.events
    .filter(event => event.occurrenceDate >= data.todayKey)
    .sort((a, b) => a.mailByDate.localeCompare(b.mailByDate))

  return {
    originState: data.originState,
    events: relevantEvents.slice(0, 4),
  }
}

export async function updateMailingOrigin(formData: FormData) {
  const parsed = mailingOriginSchema.safeParse({
    mailing_state: formData.get('mailing_state'),
  })
  if (!parsed.success) return { error: 'Use a two-letter state code.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase.auth.updateUser({
    data: { ...(user.user_metadata ?? {}), mailing_state: parsed.data.mailing_state },
  })
  if (error) return { error: error.message }

  revalidatePath('/dashboard/calendar')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function createCalendarEvent(formData: FormData) {
  const parsed = calendarEventSchema.safeParse({
    title: formData.get('title'),
    event_type: formData.get('event_type'),
    event_date: formData.get('event_date'),
    recurrence: formData.get('recurrence') || 'yearly',
    contact_id: formData.get('contact_id') || '',
  })
  if (!parsed.success) return { error: 'Check the event details and try again.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const payload = {
    ...parsed.data,
    contact_id: parsed.data.contact_id || null,
    source: 'manual',
  }

  if (payload.contact_id) {
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', payload.contact_id)
      .maybeSingle()
    if (contactError || !contact) return { error: 'Contact not found.' }
  }

  const { error } = await supabase.from('calendar_events').insert(payload)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/calendar')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteCalendarEvent(formData: FormData) {
  const eventId = formData.get('event_id')
  if (typeof eventId !== 'string' || !eventId) return { error: 'Missing date.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', eventId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/calendar')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteCalendarSource(formData: FormData) {
  const sourceId = formData.get('source_id')
  if (typeof sourceId !== 'string' || !sourceId) return { error: 'Missing calendar.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error: eventError } = await supabase
    .from('calendar_events')
    .delete()
    .eq('calendar_source_id', sourceId)
  if (eventError) return { error: eventError.message }

  const { error } = await supabase
    .from('calendar_sources')
    .delete()
    .eq('id', sourceId)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/calendar')
  revalidatePath('/dashboard')
  return { success: true }
}

function unfoldIcs(text: string) {
  return text.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '').split(/\r?\n/)
}

function parseIcsDate(value: string) {
  const raw = value.trim()
  if (/^\d{8}$/.test(raw)) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
  }
  const match = raw.match(/^(\d{4})(\d{2})(\d{2})T/)
  if (match) return `${match[1]}-${match[2]}-${match[3]}`
  return null
}

function inferEventType(summary: string): 'birthday' | 'anniversary' | 'holiday' | 'custom' {
  const lower = summary.toLowerCase()
  if (lower.includes('birthday') || lower.includes('bday')) return 'birthday'
  if (lower.includes('anniversary')) return 'anniversary'
  if (lower.includes('holiday')) return 'holiday'
  return 'custom'
}

function parseIcsEvents(text: string) {
  const lines = unfoldIcs(text)
  const events: Array<Record<string, string>> = []
  let current: Record<string, string> | null = null

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { current = {}; continue }
    if (line === 'END:VEVENT') {
      if (current) events.push(current)
      current = null
      continue
    }
    if (!current) continue
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).split(';')[0]
    current[key] = line.slice(idx + 1)
  }

  return events.flatMap(event => {
    const title = event.SUMMARY?.replace(/\\,/g, ',').replace(/\\n/g, ' ').trim()
    const date = event.DTSTART ? parseIcsDate(event.DTSTART) : null
    if (!title || !date) return []
    return [{
      title,
      event_date: date,
      event_type: inferEventType(title),
      recurrence: event.RRULE?.includes('YEARLY') ? 'yearly' : 'none',
      source_event_uid: event.UID ?? `${title}-${date}`,
    }]
  })
}

export async function importCalendarSubscription(formData: FormData) {
  const parsed = calendarImportSchema.safeParse({
    provider: formData.get('provider'),
    name: formData.get('name'),
    subscription_url: formData.get('subscription_url'),
  })
  if (!parsed.success) return { error: 'Paste a valid calendar subscription URL.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const subscription = await fetchCalendarSubscription(parsed.data.subscription_url)
  if (subscription.error || !subscription.text) return { error: subscription.error ?? 'Could not read that calendar URL.' }

  const ics = subscription.text
  const parsedEvents = parseIcsEvents(ics).slice(0, 80)
  if (!parsedEvents.length) return { error: 'No events found in that calendar.' }

  const { data: source, error: sourceError } = await supabase
    .from('calendar_sources')
    .insert({ ...parsed.data, imported_at: new Date().toISOString() })
    .select('id')
    .single()
  if (sourceError || !source) return { error: sourceError?.message ?? 'Could not save calendar source.' }

  let imported = 0
  for (const event of parsedEvents) {
    const payload = {
      ...event,
      admin_id: user.id,
      calendar_source_id: source.id,
      source: parsed.data.provider,
    }
    const { data: existing } = await supabase
      .from('calendar_events')
      .select('id')
      .eq('calendar_source_id', source.id)
      .eq('source_event_uid', event.source_event_uid)
      .maybeSingle()

    const result = existing
      ? await supabase.from('calendar_events').update(payload).eq('id', existing.id)
      : await supabase.from('calendar_events').insert(payload)

    if (!result.error) imported++
  }

  revalidatePath('/dashboard/calendar')
  revalidatePath('/dashboard')
  return { success: true, count: imported }
}

export async function sendDueCalendarReminders() {
  const supabase = await createServiceClient()
  const { data: events, error } = await supabase
    .from('calendar_events')
    .select('*, contacts(admin_id,first_name,last_name,state,is_international,country)')
    .eq('reminder_enabled', true)

  if (error) return { error: error.message }
  if (!events?.length) return { sent: 0 }

  let sent = 0
  for (const event of events as CalendarEventRow[]) {
    const { data: adminData } = await supabase.auth.admin.getUserById((event as CalendarEventRow & { admin_id: string }).admin_id)
    const admin = adminData.user
    if (!admin?.email) continue

    const contact = contactFromRow(event)
    if (contact?.admin_id && contact.admin_id !== (event as CalendarEventRow & { admin_id: string }).admin_id) {
      continue
    }

    const timeZone = getUserProfile(admin).timeZone ?? 'UTC'
    const today = dateKeyInTimeZone(new Date(), timeZone)
    const decorated = decorateEvent(event, admin.user_metadata?.mailing_state, today)
    if (decorated.mailByDate > today) continue
    if (event.last_reminder_sent_for === decorated.occurrenceDate) continue

    const profile = getUserProfile(admin)
    const { subject, html } = buildCalendarReminderEmail({
      adminName: profile.firstName ?? profile.fullName,
      title: decorated.title,
      eventType: decorated.event_type,
      occurrenceDate: decorated.occurrenceDate,
      mailByDate: decorated.mailByDate,
      offsetLabel: decorated.offsetLabel,
      offsetDays: decorated.offsetDays,
      contactName: decorated.contactName,
    })

    const result = await getResend().emails.send({
      from: FROM_EMAIL,
      to: admin.email,
      subject,
      html,
    })
    if (result.error) continue

    await supabase
      .from('calendar_events')
      .update({ last_reminder_sent_for: decorated.occurrenceDate })
      .eq('id', decorated.id)
    sent++
  }

  return { sent }
}
