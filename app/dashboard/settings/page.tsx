import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/user-profile'
import { ProfileForm } from '@/components/profile-form'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = getUserProfile(user)

  return (
    <div className="space-y-5">
      <section className="surface-panel px-6 py-5">
        <p className="eyebrow">Account</p>
        <h1 className="dash-title">Your profile</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-muted">
          This name and bio appear on your address request page and in emails you send.
        </p>
      </section>

      <ProfileForm profile={profile} />
    </div>
  )
}
