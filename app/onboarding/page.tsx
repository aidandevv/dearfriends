import { redirect } from 'next/navigation'
import { OnboardingForm } from '@/components/onboarding-form'
import { Postmark } from '@/components/ui/postmark'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/user-profile'

const newsreader = "var(--font-ppwriter), Georgia, serif"

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const profile = getUserProfile(user)
  if (profile.hasCompletedOnboarding) redirect('/dashboard')

  return (
    <main className="min-h-screen bg-linen flex items-center justify-center p-6">
      <div className="w-full max-w-lg animate-fade-up">
        <div className="mb-8 flex flex-col items-center text-center">
          <Postmark />
          <p style={{ fontFamily: newsreader, fontStyle: 'italic', fontSize: 16 }} className="text-blue-slate mt-2">
            One quick thing before you head in
          </p>
          <h1 style={{ fontFamily: newsreader, fontWeight: 400, fontSize: 36, marginTop: 16, color: '#1d2442' }}>
            What should your friends call you?
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-ink-muted">
            I&apos;ll sign your address requests with this, so it sounds like it&apos;s coming from you and not from some app.
          </p>
        </div>

        <OnboardingForm email={user.email ?? ''} />
      </div>
    </main>
  )
}
