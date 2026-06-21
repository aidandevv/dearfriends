import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getExportContacts } from '@/lib/export-contacts'
import { toAveryCsv, toCsv } from '@/lib/utils'
import { recordFirstSent } from '@/lib/actions/user'

export async function GET(request: Request) {
  await recordFirstSent()
  const { searchParams } = new URL(request.url)
  const method = searchParams.get('method')
  const groupId = searchParams.get('group')

  const supabase = await createClient()

  try {
    const contacts = await getExportContacts(supabase, { method, groupId })
    const useAvery = method === 'handwrite' || method === 'print'
    const csv = useAvery ? toAveryCsv(contacts) : toCsv(contacts)
    const suffix = [method || 'all', groupId ? 'group' : null].filter(Boolean).join('-')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="contacts-${suffix}.csv"`,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Export failed.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
