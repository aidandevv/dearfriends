import { ContactTable } from '@/components/contact-table'
import { ScheduleVerificationForm } from '@/components/schedule-verification-form'
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
  // generateShareSlug returns the new slug directly (avoids stale session cache).
  let shareSlug = profile.shareSlug
  if (user && !shareSlug) {
    try {
      shareSlug = await generateShareSlug(user.id)
    } catch {
      // Non-fatal: card shows fallback state
    }
  }

  const [contacts, groups] = await Promise.all([getContacts(), getGroups()])

  const verifiedCount = contacts.filter(contact => Boolean(contact.verified_at) && !contact.opted_out).length
  const printCount = contacts.filter(contact => contact.delivery_method === 'print').length
  const digitalCount = contacts.filter(contact => contact.delivery_method === 'digital').length

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_360px]">
      <div className="space-y-5">
        <section className="surface-panel px-5 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-ink-muted">Dashboard</p>
              <h1 className="mt-2 font-serif text-4xl text-ink">Contacts</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">
                Keep your list tidy, choose the right delivery method, and make sure each letter lands where it should.
              </p>
            </div>
            <SendVerificationButton />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.2rem] border border-border/80 bg-surface-raised px-4 py-4">
              <p className="text-xs uppercase tracking-[0.22em] text-ink-muted">Total</p>
              <p className="mt-2 font-serif text-3xl text-ink">{contacts.length}</p>
            </div>
            <div className="rounded-[1.2rem] border border-border/80 bg-surface-raised px-4 py-4">
              <p className="text-xs uppercase tracking-[0.22em] text-ink-muted">Verified</p>
              <p className="mt-2 font-serif text-3xl text-ink">{verifiedCount}</p>
            </div>
            <div className="rounded-[1.2rem] border border-border/80 bg-surface-raised px-4 py-4">
              <p className="text-xs uppercase tracking-[0.22em] text-ink-muted">Ready to send</p>
              <p className="mt-2 font-serif text-3xl text-ink">{printCount + digitalCount}</p>
            </div>
          </div>
        </section>

        <section className="surface-panel px-4 py-4 lg:px-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl text-ink">Your address book</h2>
              <p className="text-sm text-ink-muted">Delivery options are bigger here so it is easier to sort the list quickly.</p>
            </div>
          </div>
          <ContactTable contacts={contacts} allGroups={groups} />
        </section>
      </div>

      <aside className="space-y-5">
        <ShareLinkCard shareSlug={shareSlug} />

        <section className="surface-panel px-5 py-5">
          <p className="text-xs uppercase tracking-[0.22em] text-ink-muted">Delivery mix</p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-[1rem] border border-border/80 bg-surface-raised px-4 py-3">
              <span className="font-medium text-ink">Print</span>
              <span className="font-serif text-2xl text-ink">{printCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-[1rem] border border-border/80 bg-surface-raised px-4 py-3">
              <span className="font-medium text-ink">Digital</span>
              <span className="font-serif text-2xl text-ink">{digitalCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-[1rem] border border-border/80 bg-surface-raised px-4 py-3">
              <span className="font-medium text-ink">Handwrite</span>
              <span className="font-serif text-2xl text-ink">{contacts.filter(contact => contact.delivery_method === 'handwrite').length}</span>
            </div>
          </div>
        </section>

        <section className="surface-panel px-5 py-5">
          <h2 className="font-serif text-2xl text-ink">Schedule verification</h2>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            Send a check-in before your next mailing so the address book stays current.
          </p>
          <div className="mt-4">
            <ScheduleVerificationForm />
          </div>
        </section>
      </aside>
    </div>
  )
}
