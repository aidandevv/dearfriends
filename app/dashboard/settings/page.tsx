import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/user-profile'
import { ProfileForm } from '@/components/profile-form'
import { ScheduleVerificationForm } from '@/components/schedule-verification-form'
import { signOut } from '@/lib/actions/user'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = getUserProfile(user)

  return (
    <div className="app-page-stack">
      <section className="app-page-header">
        <p className="eyebrow">Account</p>
        <h1 className="dash-title">Your profile</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-muted">
          This name and bio appear on your address request page and in emails you send.
        </p>
      </section>

      <ProfileForm profile={profile} />

      <section className="form-panel max-w-lg flex flex-col gap-4">
        <div>
          <p className="eyebrow">Verification</p>
          <p className="mt-1 text-sm text-ink-muted">
            Schedule a one-time verification email to all contacts who haven&apos;t opted out.
          </p>
        </div>
        <ScheduleVerificationForm />
      </section>

      <section className="form-panel max-w-lg">
        <form action={signOut}>
          <button type="submit" className="btn-outline min-h-11 px-4 text-sm">
            Log out
          </button>
        </form>
      </section>
    </div>
  )
}
