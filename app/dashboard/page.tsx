import { ContactTable } from '@/components/contact-table'
import { SendVerificationButton } from '@/components/send-verification-button'
import { ShareLinkCard } from '@/components/share-link-card'
import { getContacts } from '@/lib/actions/contacts'
import { getGroups } from '@/lib/actions/groups'
import { generateShareSlug } from '@/lib/actions/user'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/user-profile'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const profile = getUserProfile(user)

  // Lazy slug generation — runs for users who signed up before this feature deployed.
  let shareSlug = profile.shareSlug
  if (user && !shareSlug) {
    try {
      shareSlug = await generateShareSlug(user.id)
    } catch {
      // Non-fatal: card shows fallback state
    }
  }

  const [contacts, groups] = await Promise.all([getContacts(), getGroups()])

  const verifiedCount = contacts.filter(c => Boolean(c.verified_at) && !c.opted_out).length
  const printCount = contacts.filter(c => c.delivery_method === 'print').length
  const digitalCount = contacts.filter(c => c.delivery_method === 'digital').length
  const handwriteCount = contacts.filter(c => c.delivery_method === 'handwrite').length

  const stats = [
    { label: 'Total', value: contacts.length },
    { label: 'Verified', value: verifiedCount },
    { label: 'Print', value: printCount },
    { label: 'Digital', value: digitalCount },
    { label: 'Handwrite', value: handwriteCount },
  ]

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        {/* Topbar */}
        <section className="surface-panel px-5 py-5">
          <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-4">
            <div>
              <h1 className="font-serif text-4xl text-ink">Your friends</h1>
              <p className="mt-1 text-sm text-ink-muted">{contacts.length} contact{contacts.length !== 1 ? 's' : ''}</p>
            </div>
            <SendVerificationButton />
          </div>

          {/* Stats strip */}
          <div className="flex items-center pt-4">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className={`flex flex-col pr-6 ${i > 0 ? 'border-l border-border/60 pl-6' : ''}`}
              >
                <span className="font-serif text-[26px] leading-none text-ink">{stat.value}</span>
                <span className="mt-1 text-[10px] uppercase tracking-[0.1em] text-ink-muted">{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Contact list */}
        <section className="surface-panel px-4 py-4 lg:px-5">
          <ContactTable contacts={contacts} allGroups={groups} />
        </section>
      </div>

      <aside className="space-y-5">
        <ShareLinkCard shareSlug={shareSlug} />
      </aside>
    </div>
  )
}
