import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { resend, buildVerificationEmail } from '@/lib/resend'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServiceClient()

  const { data: schedules } = await supabase
    .from('scheduled_verifications')
    .select('id, admin_id')
    .lte('send_at', new Date().toISOString())
    .eq('sent', false)

  if (!schedules?.length) return NextResponse.json({ ok: true, sent: 0 })

  let totalSent = 0

  for (const schedule of schedules) {
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, email, first_name')
      .eq('admin_id', schedule.admin_id)
      .eq('opted_out', false)

    if (!contacts?.length) continue

    for (const contact of contacts) {
      const token = randomUUID()

      await supabase
        .from('contacts')
        .update({ verification_token: token, verification_sent_at: new Date().toISOString() })
        .eq('id', contact.id)

      const { subject, html } = buildVerificationEmail({
        firstName: contact.first_name,
        verifyUrl: `${SITE_URL}/verify/${token}`,
      })

      await resend.emails.send({ from: FROM_EMAIL, to: contact.email, subject, html })
      totalSent++
    }

    await supabase.from('scheduled_verifications').update({ sent: true }).eq('id', schedule.id)
  }

  return NextResponse.json({ ok: true, sent: totalSent })
}
