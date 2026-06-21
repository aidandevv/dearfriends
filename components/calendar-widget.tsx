import Link from 'next/link'
import { CalendarDays, Send } from 'lucide-react'
import type { CalendarEventView } from '@/lib/actions/calendar'

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(`${date}T00:00:00`))
}

export function CalendarWidget({ events }: { events: CalendarEventView[] }) {
  return (
    <section className="surface-panel px-5 py-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Calendar</p>
          <h3 className="section-title">Mail-by dates</h3>
        </div>
        <CalendarDays size={18} className="text-periwinkle" />
      </div>
      <div className="grid gap-2">
        {events.length === 0 && (
          <p className="text-sm text-ink-muted">Add birthdays and anniversaries to see mailing nudges here.</p>
        )}
        {events.map(event => (
          <div key={event.id} className="rounded-lg border border-border/60 bg-linen/70 px-3 py-3">
            <p className="text-sm font-medium text-ink">{event.title}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted">
              <Send size={12} className="text-stamp" />
              Mail by <span className="font-semibold text-stamp">{formatDate(event.mailByDate)}</span> for {formatDate(event.occurrenceDate)}
            </p>
          </div>
        ))}
      </div>
      <Link href="/dashboard/calendar" className="mt-4 inline-flex text-sm font-medium text-periwinkle hover:underline">
        Open calendar →
      </Link>
    </section>
  )
}
