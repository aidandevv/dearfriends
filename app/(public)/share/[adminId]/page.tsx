import { ShareForm } from '@/components/share-form'
import { createServiceClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/user-profile'

export default async function SharePage({ params }: { params: Promise<{ adminId: string }> }) {
  const { adminId } = await params
  const supabase = await createServiceClient()

  const { data } = await supabase.auth.admin.getUserById(adminId)
  const senderProfile = getUserProfile(data.user)

  return <ShareForm adminId={adminId} senderName={senderProfile.fullName} />
}
