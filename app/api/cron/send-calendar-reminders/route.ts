import { NextResponse } from 'next/server'
import { sendDueCalendarReminders } from '@/lib/actions/calendar'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await sendDueCalendarReminders()
  if (result.error) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json({ ok: true, sent: result.sent })
}
