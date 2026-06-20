'use server'

import { createAdminClient, createServiceClient } from '@/lib/supabase/server'
import { getResend, buildAnniversaryReminderEmail, buildBirthdayDigestEmail } from '@/lib/resend'
import { getUserProfile } from '@/lib/user-profile'
import {
  anniversaryReminderYear,
  formatBirthdayLabel,
  isBirthdayWithinDays,
  isoWeekKey,
  shouldSendAnniversaryReminder,
} from '@/lib/reminders'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

export async function sendAnniversaryReminders() {
  const admin = createAdminClient()
  let page = 1
  const perPage = 1000
  let sent = 0

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error || !data) break

    for (const user of data.users) {
      const profile = getUserProfile(user)
      if (!profile.anniversaryRemindersEnabled) continue
      if (!profile.firstSentAt) continue
      if (!shouldSendAnniversaryReminder(
        profile.firstSentAt,
        user.user_metadata?.last_anniversary_reminder_year as number | undefined,
      )) continue

      const firstSentAt = new Date(profile.firstSentAt)
      const yearsSince = Math.max(
        1,
        anniversaryReminderYear(profile.firstSentAt) - firstSentAt.getFullYear(),
      )

      const { subject, html } = buildAnniversaryReminderEmail({
        adminName: profile.firstName ?? profile.fullName,
        yearsSinceFirstSend: yearsSince,
        composeUrl: `${SITE_URL}/dashboard/compose`,
      })

      const result = await getResend().emails.send({
        from: FROM_EMAIL,
        to: user.email!,
        subject,
        html,
      })
      if (result.error) continue

      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...(user.user_metadata ?? {}),
          last_anniversary_reminder_year: anniversaryReminderYear(profile.firstSentAt),
        },
      })
      sent++
    }

    if (data.users.length < perPage) break
    page++
  }

  return { sent }
}

export async function sendBirthdayReminders() {
  const supabase = await createServiceClient()
  const admin = createAdminClient()
  const weekKey = isoWeekKey()

  const { data: trackingGroups, error: groupError } = await supabase
    .from('groups')
    .select('id, admin_id')
    .eq('birthday_tracking', true)

  if (groupError) return { error: groupError.message }
  if (!trackingGroups?.length) return { sent: 0 }

  const groupsByAdmin = new Map<string, string[]>()
  for (const group of trackingGroups) {
    const existing = groupsByAdmin.get(group.admin_id) ?? []
    existing.push(group.id)
    groupsByAdmin.set(group.admin_id, existing)
  }

  let sent = 0

  for (const [adminId, groupIds] of groupsByAdmin) {
    const { data: adminData } = await admin.auth.admin.getUserById(adminId)
    const user = adminData.user
    if (!user?.email) continue

    const profile = getUserProfile(user)
    if (!profile.birthdayRemindersEnabled) continue
    if (user.user_metadata?.last_birthday_digest_week === weekKey) continue

    const { data: memberships } = await supabase
      .from('contact_groups')
      .select('contact_id, contacts(id, first_name, last_name, birthday, opted_out)')
      .in('group_id', groupIds)

    const birthdays = new Map<string, { name: string; label: string }>()
    for (const row of memberships ?? []) {
      const contact = row.contacts as unknown as {
        id: string
        first_name: string
        last_name: string
        birthday: string | null
        opted_out: boolean
      } | null
      if (!contact || contact.opted_out || !contact.birthday) continue
      if (!isBirthdayWithinDays(contact.birthday, 7)) continue
      birthdays.set(contact.id, {
        name: `${contact.first_name} ${contact.last_name}`.trim(),
        label: formatBirthdayLabel(contact.birthday),
      })
    }

    if (!birthdays.size) continue

    const { subject, html } = buildBirthdayDigestEmail({
      adminName: profile.firstName ?? profile.fullName,
      birthdays: [...birthdays.values()],
    })

    const result = await getResend().emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject,
      html,
    })
    if (result.error) continue

    await admin.auth.admin.updateUserById(adminId, {
      user_metadata: {
        ...(user.user_metadata ?? {}),
        last_birthday_digest_week: weekKey,
      },
    })
    sent++
  }

  return { sent }
}
