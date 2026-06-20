import { NextResponse } from 'next/server'
import { isCronAuthorized } from '@/lib/cron-auth'
import { sendAnniversaryReminders } from '@/lib/actions/reminders'

export async function GET(request: Request) {
  if (!isCronAuthorized(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await sendAnniversaryReminders()
  if ('error' in result && result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ ok: true, sent: result.sent ?? 0 })
}
