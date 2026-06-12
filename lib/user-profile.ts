import type { User } from '@supabase/supabase-js'

export type UserProfile = {
  fullName: string | null
  firstName: string | null
  bio: string | null
  senderName: string | null
  hasCompletedOnboarding: boolean
  hasSeenTour: boolean
  anniversaryRemindersEnabled: boolean
  birthdayRemindersEnabled: boolean
  shareSlug: string | null
  shareMessage: string | null
}

function readString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function getFirstName(fullName: string | null): string | null {
  if (!fullName) return null
  return fullName.split(/\s+/)[0] ?? null
}

export function getUserProfile(user: Pick<User, 'user_metadata'> | null | undefined): UserProfile {
  const metadata = user?.user_metadata ?? {}
  const fullName = readString(metadata.full_name)

  return {
    fullName,
    firstName: getFirstName(fullName),
    bio: readString(metadata.bio),
    senderName: readString(metadata.sender_name) ?? readString(metadata.full_name),
    hasCompletedOnboarding: Boolean(fullName),
    hasSeenTour: metadata.has_seen_tour === true,
    anniversaryRemindersEnabled: metadata.anniversary_reminders_enabled !== false,
    birthdayRemindersEnabled: metadata.birthday_reminders_enabled !== false,
    shareSlug: readString(metadata.share_slug),
    shareMessage: readString(metadata.share_message),
  }
}
