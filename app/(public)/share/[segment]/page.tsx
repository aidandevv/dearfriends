import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ShareForm } from '@/components/share-form'
import { createAdminClient } from '@/lib/supabase/server'
import { resolveShareSlug, type ShareSlugResolution } from '@/lib/actions/user'
import { getUserProfile } from '@/lib/user-profile'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function resolveShareTarget(segment: string): Promise<ShareSlugResolution | null> {
  if (UUID_RE.test(segment)) {
    const admin = createAdminClient()
    const { data } = await admin.auth.admin.getUserById(segment)
    return data.user ? { adminId: data.user.id, groupId: null } : null
  }
  return resolveShareSlug(segment)
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ segment: string }>
}): Promise<Metadata> {
  const { segment } = await params
  const target = await resolveShareTarget(segment)
  if (!target) return { title: 'Not found' }

  const admin = createAdminClient()
  const { data } = await admin.auth.admin.getUserById(target.adminId)
  const profile = getUserProfile(data.user)

  const name = profile.firstName ?? profile.fullName ?? 'Someone'
  const title = `${name} wants to send you something`
  const description =
    profile.bio ??
    `${name} is putting together something special and would love to send it your way. Share your address to receive real mail.`

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const isSlug = !UUID_RE.test(segment)
  const canonicalUrl = isSlug
    ? `${siteUrl}/share/${segment}`
    : `${siteUrl}/share/${target.adminId}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonicalUrl,
      siteName: 'Dear Friends',
    },
    twitter: { card: 'summary', title, description },
    other: {
      'mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'default',
    },
  }
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ segment: string }>
}) {
  const { segment } = await params
  const target = await resolveShareTarget(segment)
  if (!target) notFound()

  const admin = createAdminClient()
  const { data } = await admin.auth.admin.getUserById(target.adminId)
  const senderProfile = getUserProfile(data.user)

  return (
    <ShareForm
      adminId={target.adminId}
      autoGroupId={target.groupId}
      senderName={senderProfile.fullName}
      senderBio={senderProfile.bio}
    />
  )
}
