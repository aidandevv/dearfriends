import { NextResponse } from 'next/server'
import { sendDueCalendarReminders } from '@/lib/actions/calendar'
import { isCronAuthorized } from '@/lib/cron-auth'

export async function GET(request: Request) {
  if (!isCronAuthorized(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await sendDueCalendarReminders()
  if (result.error) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json({ ok: true, sent: result.sent })
}
