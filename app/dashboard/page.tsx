import { getContacts } from '@/lib/actions/contacts'
import { ContactTable } from '@/components/contact-table'
import { SendVerificationButton } from '@/components/send-verification-button'
import { ScheduleVerificationForm } from '@/components/schedule-verification-form'

export default async function DashboardPage() {
  const contacts = await getContacts()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl text-ink">Contacts</h1>
        <div className="flex gap-2">
          <SendVerificationButton />
        </div>
      </div>
      <ContactTable contacts={contacts} />
      <div className="mt-8 border-t pt-6">
        <h2 className="font-serif text-lg text-ink mb-3">Schedule Verification</h2>
        <ScheduleVerificationForm />
      </div>
    </div>
  )
}
