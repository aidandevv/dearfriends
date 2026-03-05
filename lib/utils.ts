export function interpolate(
  body: string,
  vars: { first_name: string; last_name: string }
): string {
  return body
    .replace(/\{\{first_name\}\}/g, vars.first_name)
    .replace(/\{\{last_name\}\}/g, vars.last_name)
}

type CsvContact = {
  first_name: string
  last_name: string
  address_line_1: string
  address_line_2: string | null | undefined
  city: string
  state: string
  zip: string
}

function formatCsvField(value: string | null | undefined): string {
  const str = value ?? ''
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function formatCsvRow(fields: (string | null | undefined)[]): string {
  return fields.map(formatCsvField).join(',')
}

export function toCsv(contacts: CsvContact[]): string {
  const header = formatCsvRow([
    'First Name', 'Last Name', 'Address Line 1', 'Address Line 2', 'City', 'State', 'ZIP',
  ])
  const rows = contacts.map(c =>
    formatCsvRow([c.first_name, c.last_name, c.address_line_1, c.address_line_2, c.city, c.state, c.zip])
  )
  return [header, ...rows].join('\n')
}
