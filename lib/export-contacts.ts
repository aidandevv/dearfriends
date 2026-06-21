import type { SupabaseClient } from '@supabase/supabase-js'
import type { Contact } from '@/lib/database.types'
import { isPhysicalMailMethod } from '@/lib/delivery-methods'

type ExportContact = Pick<
  Contact,
  'first_name' | 'last_name' | 'address_line_1' | 'address_line_2' | 'city' | 'state' | 'zip' | 'delivery_method'
>

type ExportRow = ExportContact & { opted_out?: boolean }

const EXPORT_FIELDS =
  'first_name, last_name, address_line_1, address_line_2, city, state, zip, delivery_method, opted_out' as const

export async function getExportContacts(
  supabase: SupabaseClient,
  opts: { method?: string | null; groupId?: string | null },
): Promise<ExportContact[]> {
  const { method, groupId } = opts

  if (groupId) {
    const { data, error } = await supabase
      .from('contact_groups')
      .select(`contacts(${EXPORT_FIELDS})`)
      .eq('group_id', groupId)

    if (error) throw new Error(error.message)

    let contacts = (data ?? []).flatMap(row => {
      const contact = row.contacts as ExportRow | ExportRow[] | null
      if (!contact) return []
      return Array.isArray(contact) ? contact : [contact]
    })

    contacts = contacts.filter(contact => !contact.opted_out)
    if (method === 'physical') {
      contacts = contacts.filter(contact => isPhysicalMailMethod(contact.delivery_method))
    } else if (method && method !== 'all') {
      contacts = contacts.filter(contact => contact.delivery_method === method)
    }

    return contacts.map(stripExportFields)
  }

  let query = supabase
    .from('contacts')
    .select(EXPORT_FIELDS)
    .eq('opted_out', false)

  if (method === 'physical') {
    query = query.in('delivery_method', ['handwrite', 'print'])
  } else if (method && method !== 'all') {
    query = query.eq('delivery_method', method)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  return (data ?? []).map(stripExportFields)
}

export async function getLetterPdfContacts(
  supabase: SupabaseClient,
  groupId?: string | null,
): Promise<Array<Pick<Contact, 'first_name' | 'last_name'>>> {
  const contacts = await getExportContacts(supabase, { method: 'physical', groupId })
  return contacts.map(({ first_name, last_name }) => ({ first_name, last_name }))
}

function stripExportFields(contact: ExportRow): ExportContact {
  return {
    first_name: contact.first_name,
    last_name: contact.last_name,
    address_line_1: contact.address_line_1,
    address_line_2: contact.address_line_2,
    city: contact.city,
    state: contact.state,
    zip: contact.zip,
    delivery_method: contact.delivery_method,
  }
}
