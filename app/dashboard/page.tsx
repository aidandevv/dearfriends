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
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-5">
        {/* Topbar */}
        <section className="surface-panel px-6 py-5">
          <div className="flex items-start justify-between gap-4 border-b border-border/50 pb-5">
            <div>
              <p className="eyebrow">Your book</p>
              <h1 className="dash-title">Your friends</h1>
              <p className="text-sm text-ink-muted mt-0.5">
                {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
              </p>
            </div>
            <SendVerificationButton />
          </div>

          {/* Stats strip */}
          <div className="flex items-center pt-5 gap-0">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className={`flex flex-col pr-7 ${i > 0 ? 'border-l border-border/50 pl-7' : ''}`}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-ppwriter), Georgia, serif',
                    fontSize: 28,
                    fontWeight: 400,
                    lineHeight: 1,
                    color: 'var(--ink)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {stat.value}
                </span>
                <span className="mt-1.5 text-[10px] uppercase tracking-[0.14em] text-ink-muted font-medium">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Contact list */}
        <section className="surface-panel px-5 py-5">
          <ContactTable contacts={contacts} allGroups={groups} />
        </section>
      </div>

      <aside className="space-y-5">
        <ShareLinkCard shareSlug={shareSlug} />
      </aside>
    </div>
  )
}
