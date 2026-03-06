import type { User } from '@supabase/supabase-js'

export type UserProfile = {
  fullName: string | null
  firstName: string | null
  hasCompletedOnboarding: boolean
  hasSeenTour: boolean
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
    hasCompletedOnboarding: Boolean(fullName),
    hasSeenTour: metadata.has_seen_tour === true,
  }
}
