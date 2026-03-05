import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { toCsv } from '@/lib/utils'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const method = searchParams.get('method')

  const supabase = await createClient()
  let query = supabase
    .from('contacts')
    .select('first_name, last_name, address_line_1, address_line_2, city, state, zip, delivery_method')
    .eq('opted_out', false)

  if (method && method !== 'all') {
    query = query.eq('delivery_method', method)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const csv = toCsv(data ?? [])
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="contacts-${method || 'all'}.csv"`,
    },
  })
}
