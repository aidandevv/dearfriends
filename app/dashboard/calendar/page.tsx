import { CalendarManager } from '@/components/calendar-manager'
import { getCalendarData } from '@/lib/actions/calendar'

export default async function CalendarPage() {
  const data = await getCalendarData()

  return (
    <div className="dashboard-page-pad space-y-5 p-6">
      <section className="surface-panel px-6 py-5">
        <p className="eyebrow">The days worth remembering</p>
        <h1 className="dash-title">Calendar</h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-ink-muted">
          Birthdays, anniversaries, and any date that matters. I&apos;ll work out roughly when each note should leave so it lands on time.
        </p>
      </section>

      <CalendarManager
        events={data.events}
        contacts={data.contacts}
        sources={data.sources}
        originState={data.originState}
      />
    </div>
  )
}
