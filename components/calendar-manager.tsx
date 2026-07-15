'use client'

import { useState, useTransition } from 'react'
import { CalendarPlus, ChevronLeft, ChevronRight, Link as LinkIcon, MapPin, Send, Trash2 } from 'lucide-react'
import {
  createCalendarEvent,
  deleteCalendarEvent,
  deleteCalendarSource,
  importCalendarSubscription,
  updateMailingOrigin,
  type CalendarEventView,
} from '@/lib/actions/calendar'
import { US_STATES } from '@/lib/us-states'
import { dateKeyInTimeZone } from '@/lib/calendar-date'

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

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(date)
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function startOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
}

function addMonths(date: Date, months: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1))
}

function buildCalendarDays(month: Date) {
  const first = startOfMonth(month)
  const gridStart = new Date(first)
  gridStart.setUTCDate(1 - first.getUTCDay())

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart)
    day.setUTCDate(gridStart.getUTCDate() + index)
    return day
  })
}

type DisplayEvent = {
  id: string
  date: string
  title: string
  meta: string
  kind: 'occasion' | 'reminder'
  eventType: CalendarEventView['event_type']
}

export function CalendarManager({
  events,
  contacts,
  sources,
  originState,
  timeZone,
}: {
  events: CalendarEventView[]
  contacts: ContactOption[]
  sources: Source[]
  originState: string | null
  timeZone: string
}) {
  const [status, setStatus] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()))
  const todayKey = dateKeyInTimeZone(new Date(), timeZone)

  const calendarDays = buildCalendarDays(visibleMonth)
  const displayEvents = events.flatMap<DisplayEvent>(event => [
    {
      id: `${event.id}-mail`,
      date: event.mailByDate,
      title: `Mail ${event.title}`,
      meta: `${event.offsetLabel} · ${formatDate(event.occurrenceDate)}`,
      kind: 'reminder',
      eventType: event.event_type,
    },
    {
      id: `${event.id}-event`,
      date: event.occurrenceDate,
      title: event.title,
      meta: event.contactName ?? event.event_type,
      kind: 'occasion',
      eventType: event.event_type,
    },
  ])
  const eventsByDate = displayEvents.reduce<Record<string, DisplayEvent[]>>((acc, event) => {
    acc[event.date] = [...(acc[event.date] ?? []), event]
    return acc
  }, {})

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
            <p className="eyebrow">Mailing rhythm</p>
            <h2 className="section-title">Calendar</h2>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setVisibleMonth(startOfMonth(new Date()))} className="btn-outline min-h-11 px-3 text-xs">Today</button>
            <button
              type="button"
              onClick={() => setVisibleMonth(month => addMonths(month, -1))}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border/80 text-ink-muted transition-colors hover:bg-linen hover:text-ink"
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="min-w-[150px] text-center font-serif text-lg text-ink">{formatMonth(visibleMonth)}</div>
            <button
              type="button"
              onClick={() => setVisibleMonth(month => addMonths(month, 1))}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border/80 text-ink-muted transition-colors hover:bg-linen hover:text-ink"
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="calendar-month-grid mt-4 overflow-hidden rounded-xl border border-border/80 bg-surface-raised">
          <div className="grid grid-cols-7 border-b border-border/80 bg-linen/70">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calendarDays.map(day => {
              const key = dateKey(day)
              const dayEvents = eventsByDate[key] ?? []
              const mailByEvents = dayEvents.filter(event => event.kind === 'reminder')
              const occasionEvents = dayEvents.filter(event => event.kind === 'occasion')
              const visibleMailBy = mailByEvents.slice(0, 2)
              const visibleOccasions = occasionEvents.slice(0, Math.max(0, 3 - visibleMailBy.length))
              const hiddenCount = dayEvents.length - visibleMailBy.length - visibleOccasions.length
              const isCurrentMonth = day.getUTCMonth() === visibleMonth.getUTCMonth()
              const isToday = key === todayKey

              return (
                <div
                  key={key}
                  className={`flex min-h-[132px] flex-col border-b border-r border-border/60 p-2 ${isCurrentMonth ? 'bg-white' : 'bg-linen/30 text-ink-muted/60'}`}
                >
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium ${isToday ? 'bg-periwinkle text-white' : isCurrentMonth ? 'text-ink' : 'text-ink-muted/60'}`}>
                      {day.getUTCDate()}
                    </span>
                  </div>
                  <div className="-mx-2 flex min-h-0 flex-1 flex-col gap-px">
                    {visibleMailBy.map(event => (
                      <div
                        key={event.id}
                        className="flex h-5 w-full items-center gap-1 bg-stamp px-1.5 text-[11px] font-medium leading-none text-white"
                        title={`${event.title} · ${event.meta}`}
                      >
                        <Send size={10} className="shrink-0 opacity-90" aria-hidden />
                        <span className="min-w-0 truncate">{event.title}</span>
                      </div>
                    ))}
                    {visibleOccasions.map(event => (
                      <div
                        key={event.id}
                        className="flex h-5 w-full items-center bg-periwinkle/85 px-1.5 text-[11px] font-medium leading-none text-white"
                        title={`${event.title} · ${event.meta}`}
                      >
                        <span className="min-w-0 truncate">{event.title}</span>
                      </div>
                    ))}
                    {hiddenCount > 0 && (
                      <span className="px-2 pt-0.5 text-[11px] text-ink-muted">+{hiddenCount} more</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="calendar-agenda mt-4 hidden space-y-2">
          <p className="text-xs text-ink-muted">Dates are shown in {timeZone.replaceAll('_', ' ')}.</p>
          {displayEvents.filter(event => event.date.slice(0, 7) === dateKey(visibleMonth).slice(0, 7)).sort((a, b) => a.date.localeCompare(b.date)).map(event => (
            <article key={`agenda-${event.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-linen/60 px-4 py-3">
              <div><p className="font-medium text-ink">{event.title}</p><p className="text-xs text-ink-muted">{event.meta}</p></div><time className="shrink-0 font-serif text-lg text-periwinkle">{formatDate(event.date)}</time>
            </article>
          ))}
        </div>

        <div className="mt-4 grid gap-3">
          {events.length === 0 && (
            <p className="text-sm text-ink-muted">No dates yet. Add one manually or import a calendar subscription.</p>
          )}
          {events.map(event => (
            <article
              key={event.id}
              className="grid gap-3 rounded-lg border border-border/70 bg-linen/70 px-4 py-4 md:grid-cols-[96px_minmax(0,1fr)_150px_auto]"
            >
              <div className="flex flex-col">
                <span className="font-serif text-2xl text-periwinkle">{formatDate(event.occurrenceDate)}</span>
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
              <form action={run(deleteCalendarEvent)} className="flex items-start justify-end">
                <input type="hidden" name="event_id" value={event.id} />
                <button
                  disabled={pending}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border/80 text-ink-muted transition-colors hover:border-stamp/40 hover:bg-stamp/10 hover:text-stamp disabled:opacity-50"
                  aria-label={`Delete ${event.title}`}
                  title="Delete date"
                >
                  <Trash2 size={15} />
                </button>
              </form>
            </article>
          ))}
        </div>
      </section>

      <aside className="grid gap-5">
        <section className="surface-panel px-5 py-5">
          <div className="mb-4 flex items-center gap-3">
            <MapPin size={18} className="text-periwinkle" />
            <div>
              <p className="section-title">Mailing origin</p>
              <p className="text-sm text-ink-muted">Used for same-state, nearby, and far-state estimates.</p>
            </div>
          </div>
          <form action={run(updateMailingOrigin)} className="flex gap-2">
            <label htmlFor="mailing-origin" className="sr-only">Mailing origin state</label><select id="mailing-origin" name="mailing_state" defaultValue={originState ?? ''} className="input min-h-11">
              <option value="">State</option>
              {US_STATES.map(state => (
                <option key={state.code} value={state.code}>{state.code}</option>
              ))}
            </select>
            <button disabled={pending} className="btn-primary min-h-11 px-4">Save</button>
          </form>
        </section>

        <section className="surface-panel px-5 py-5">
          <div className="mb-4 flex items-center gap-3">
            <CalendarPlus size={18} className="text-periwinkle" />
            <div>
              <p className="section-title">Add a date</p>
              <p className="text-sm text-ink-muted">Birthdays, anniversaries, holidays, and custom dates.</p>
            </div>
          </div>
          <form action={run(createCalendarEvent)} className="grid gap-3">
            <label htmlFor="calendar-title" className="sr-only">Date title</label><input id="calendar-title" name="title" placeholder="Mira's birthday" className="input min-h-11" required />
            <div className="grid grid-cols-2 gap-2">
              <select name="event_type" aria-label="Date type" className="input min-h-11" defaultValue="birthday">
                <option value="birthday">Birthday</option>
                <option value="anniversary">Anniversary</option>
                <option value="holiday">Holiday</option>
                <option value="custom">Custom</option>
              </select>
              <select name="recurrence" aria-label="Date recurrence" className="input min-h-11" defaultValue="yearly">
                <option value="yearly">Yearly</option>
                <option value="none">One time</option>
              </select>
            </div>
            <input name="event_date" aria-label="Event date" type="date" className="input min-h-11" required />
            <select name="contact_id" aria-label="Linked contact" className="input min-h-11" defaultValue="">
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
            <LinkIcon size={18} className="text-periwinkle" />
            <div>
              <p className="section-title">Import calendar</p>
              <p className="text-sm text-ink-muted">Paste a Google, Outlook, or ICS subscription URL.</p>
            </div>
          </div>
          <form action={run(importCalendarSubscription)} className="grid gap-3">
            <select name="provider" aria-label="Calendar provider" className="input min-h-11" defaultValue="google">
              <option value="google">Google Calendar</option>
              <option value="outlook">Outlook</option>
              <option value="ics">ICS URL</option>
            </select>
            <input name="name" aria-label="Calendar name" placeholder="Family birthdays" className="input min-h-11" required />
            <input name="subscription_url" aria-label="Calendar subscription URL" type="url" placeholder="https://..." className="input min-h-11" required />
            <button disabled={pending} className="btn-outline min-h-11">Import dates</button>
          </form>
          {sources.length > 0 && (
            <div className="mt-4 grid gap-2 border-t border-border/70 pt-3 text-xs text-ink-muted">
              {sources.map(source => (
                <div key={source.id} className="flex items-center justify-between gap-3">
                  <p className="min-w-0 truncate">{source.name} · {source.provider}</p>
                  <form action={run(deleteCalendarSource)}>
                    <input type="hidden" name="source_id" value={source.id} />
                    <button
                      disabled={pending}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-border/80 text-ink-muted transition-colors hover:border-stamp/40 hover:bg-stamp/10 hover:text-stamp disabled:opacity-50"
                      aria-label={`Delete ${source.name} calendar`}
                      title="Delete calendar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </section>

        {status && <p className="text-sm text-ink-muted">{status}</p>}
      </aside>
    </div>
  )
}
