import { ContactTable } from '@/components/contact-table'
import { SendVerificationButton } from '@/components/send-verification-button'
import { ShareLinkActions } from '@/components/share-link-actions'
import { getContacts } from '@/lib/actions/contacts'
import { getGroups } from '@/lib/actions/groups'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  // Note: layout.tsx already enforces auth + redirect. We fetch the user here
  // only to build the share URL. getContacts/getGroups use the session cookie directly.
  const [contacts, groups, supabase] = await Promise.all([
    getContacts(),
    getGroups(),
    createClient(),
  ])
  const { data: { user } } = await supabase.auth.getUser()

  const verifiedCount = contacts.filter(c => Boolean(c.verified_at) && !c.opted_out).length
  const printCount = contacts.filter(c => c.delivery_method === 'print').length
  const digitalCount = contacts.filter(c => c.delivery_method === 'digital').length
  const handwriteCount = contacts.filter(c => c.delivery_method === 'handwrite').length

  const shareUrl = user
    ? `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/share/${user.id}`
    : null

  return (
    <div className="flex flex-col">
      {/* Top bar */}
      <div className="flex items-end justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <h1 className="font-serif text-2xl text-ink">Your friends</h1>
          <p className="text-sm text-ink-muted mt-0.5">{contacts.length} contact{contacts.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {shareUrl && (
            <div className="flex items-center gap-2 rounded-full border border-border/80 bg-surface px-3 py-1.5 text-xs text-ink-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-sage" />
              <span className="hidden sm:inline">Share link</span>
              <ShareLinkActions url={shareUrl} compact />
            </div>
          )}
          <SendVerificationButton />
        </div>
      </div>

      {/* Stats strip */}
      <div className="flex border-b border-border/60 mb-5">
        {[
          { label: 'Total', value: contacts.length },
          { label: 'Verified', value: verifiedCount },
          { label: 'Print', value: printCount },
          { label: 'Digital', value: digitalCount },
          { label: 'Handwrite', value: handwriteCount },
        ].map((stat, i) => (
          <div key={stat.label} className={`py-3 pr-6 ${i > 0 ? 'pl-6 border-l border-border/60' : ''}`}>
            <p className="font-serif text-2xl text-ink leading-none">{stat.value}</p>
            <p className="text-[10px] text-ink-muted mt-1 uppercase tracking-[0.08em]">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Contact list */}
      <ContactTable contacts={contacts} allGroups={groups} />
    </div>
  )
}
