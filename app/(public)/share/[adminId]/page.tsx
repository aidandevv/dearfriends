import type { Metadata } from 'next'
import { ShareForm } from '@/components/share-form'
import { createServiceClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/user-profile'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ adminId: string }>
}): Promise<Metadata> {
  const { adminId } = await params
  const supabase = await createServiceClient()
  const { data } = await supabase.auth.admin.getUserById(adminId)
  const profile = getUserProfile(data.user)

  const name = profile.firstName ?? profile.fullName ?? 'Someone'
  const title = `${name} wants to send you something`
  const description =
    profile.bio ??
    `${name} is putting together something special and would love to send it your way. Share your address to receive real mail.`

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${siteUrl}/share/${adminId}`,
      siteName: 'Dear Friends',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    other: {
      'mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'default',
    },
  }
}

export default async function SharePage({ params }: { params: Promise<{ adminId: string }> }) {
  const { adminId } = await params
  const supabase = await createServiceClient()

  const { data } = await supabase.auth.admin.getUserById(adminId)
  const senderProfile = getUserProfile(data.user)

  return (
    <ShareForm
      adminId={adminId}
      senderName={senderProfile.fullName}
      senderBio={senderProfile.bio}
    />
  )
}
