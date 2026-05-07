'use client'

import { useState, useTransition } from 'react'
import { CalendarPlus, Link as LinkIcon, MapPin, Send } from 'lucide-react'
import {
  createCalendarEvent,
  importCalendarSubscription,
  updateMailingOrigin,
  type CalendarEventView,
} from '@/lib/actions/calendar'

type ContactOption = {
  id: string
  first_name: string
  last_name: string
  state?: string | null
  is_international?: boolean | null
}

type Source = {
  id: string
  name: string
  provider: string
  imported_at?: string | null
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(`${date}T00:00:00`))
}

export function CalendarManager({
  events,
  contacts,
  sources,
  originState,
}: {
  events: CalendarEventView[]
  contacts: ContactOption[]
  sources: Source[]
  originState: string | null
}) {
  const [status, setStatus] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function run(action: (formData: FormData) => Promise<{ error?: string; success?: boolean; count?: number }>) {
    return (formData: FormData) => {
      setStatus(null)
      startTransition(async () => {
        const result = await action(formData)
        setStatus(result.error ? `Error: ${result.error}` : result.count != null ? `Imported ${result.count} events.` : 'Saved.')
      })
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="surface-panel px-5 py-5">
        <div className="flex items-center justify-between gap-4 border-b border-border/80 pb-4">
          <div>
            <p className="eyebrow">Upcoming mail dates</p>
            <h2 className="section-title">Calendar</h2>
          </div>
          <div className="info-chip">{events.length} dates</div>
        </div>

        <div className="mt-4 grid gap-3">
          {events.length === 0 && (
            <p className="text-sm text-ink-muted">No dates yet. Add one manually or import a calendar subscription.</p>
          )}
          {events.map(event => (
            <article
              key={event.id}
              className="grid gap-3 rounded-lg border border-border/70 bg-linen/70 px-4 py-4 md:grid-cols-[96px_minmax(0,1fr)_150px]"
            >
              <div className="flex flex-col">
                <span className="font-serif text-2xl text-blue-ink">{formatDate(event.occurrenceDate)}</span>
                <span className="text-xs uppercase tracking-[0.18em] text-ink-muted">{event.event_type}</span>
              </div>
              <div>
                <h3 className="font-serif text-xl text-ink">{event.title}</h3>
                <p className="mt-1 text-sm text-ink-muted">
                  {event.contactName ? `${event.contactName} · ` : ''}{event.offsetLabel} · {event.offsetDays} days
                </p>
              </div>
              <div className="rounded-lg border border-stamp/20 bg-stamp/10 px-3 py-2 text-sm text-stamp">
                <span className="flex items-center gap-1.5 text-xs uppercase tracking-[0.16em]">
                  <Send size={12} />
                  Mail by
                </span>
                <strong className="mt-1 block">{formatDate(event.mailByDate)}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className="grid gap-5">
        <section className="surface-panel px-5 py-5">
          <div className="mb-4 flex items-center gap-3">
            <MapPin size={18} className="text-blue-ink" />
            <div>
              <p className="section-title">Mailing origin</p>
              <p className="text-sm text-ink-muted">Used for same-state, nearby, and far-state estimates.</p>
            </div>
          </div>
          <form action={run(updateMailingOrigin)} className="flex gap-2">
            <input name="mailing_state" defaultValue={originState ?? ''} maxLength={2} placeholder="CA" className="input min-h-11 uppercase" />
            <button disabled={pending} className="btn-primary min-h-11 px-4">Save</button>
          </form>
        </section>

        <section className="surface-panel px-5 py-5">
          <div className="mb-4 flex items-center gap-3">
            <CalendarPlus size={18} className="text-blue-ink" />
            <div>
              <p className="section-title">Add a date</p>
              <p className="text-sm text-ink-muted">Birthdays, anniversaries, holidays, and custom dates.</p>
            </div>
          </div>
          <form action={run(createCalendarEvent)} className="grid gap-3">
            <input name="title" placeholder="Mira's birthday" className="input min-h-11" required />
            <div className="grid grid-cols-2 gap-2">
              <select name="event_type" className="input min-h-11" defaultValue="birthday">
                <option value="birthday">Birthday</option>
                <option value="anniversary">Anniversary</option>
                <option value="holiday">Holiday</option>
                <option value="custom">Custom</option>
              </select>
              <select name="recurrence" className="input min-h-11" defaultValue="yearly">
                <option value="yearly">Yearly</option>
                <option value="none">One time</option>
              </select>
            </div>
            <input name="event_date" type="date" className="input min-h-11" required />
            <select name="contact_id" className="input min-h-11" defaultValue="">
              <option value="">No linked contact</option>
              {contacts.map(contact => (
                <option key={contact.id} value={contact.id}>
                  {contact.first_name} {contact.last_name}{contact.is_international ? ' · International' : contact.state ? ` · ${contact.state}` : ''}
                </option>
              ))}
            </select>
            <button disabled={pending} className="btn-primary min-h-11">Add date</button>
          </form>
        </section>

        <section className="surface-panel px-5 py-5">
          <div className="mb-4 flex items-center gap-3">
            <LinkIcon size={18} className="text-blue-ink" />
            <div>
              <p className="section-title">Import calendar</p>
              <p className="text-sm text-ink-muted">Paste a Google, Outlook, or ICS subscription URL.</p>
            </div>
          </div>
          <form action={run(importCalendarSubscription)} className="grid gap-3">
            <select name="provider" className="input min-h-11" defaultValue="google">
              <option value="google">Google Calendar</option>
              <option value="outlook">Outlook</option>
              <option value="ics">ICS URL</option>
            </select>
            <input name="name" placeholder="Family birthdays" className="input min-h-11" required />
            <input name="subscription_url" type="url" placeholder="https://..." className="input min-h-11" required />
            <button disabled={pending} className="btn-outline min-h-11">Import dates</button>
          </form>
          {sources.length > 0 && (
            <div className="mt-4 border-t border-border/70 pt-3 text-xs text-ink-muted">
              {sources.slice(0, 3).map(source => (
                <p key={source.id}>{source.name} · {source.provider}</p>
              ))}
            </div>
          )}
        </section>

        {status && <p className="text-sm text-ink-muted">{status}</p>}
      </aside>
    </div>
  )
}
