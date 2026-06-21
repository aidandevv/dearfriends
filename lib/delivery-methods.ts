export const DELIVERY_METHODS = ['handwrite', 'print', 'digital'] as const
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number]

export const PHYSICAL_MAIL_METHODS = ['handwrite', 'print'] as const

export const DELIVERY_LABELS: Record<DeliveryMethod, string> = {
  handwrite: 'Write by hand',
  print: 'Print at home',
  digital: 'Digital',
}

export const DELIVERY_HINTS: Record<DeliveryMethod, string> = {
  handwrite: 'you pen & mail it',
  print: 'you print & mail it',
  digital: 'app sends email',
}

export function isDeliveryMethod(value: string): value is DeliveryMethod {
  return (DELIVERY_METHODS as readonly string[]).includes(value)
}

export function isPhysicalMailMethod(method: string): method is (typeof PHYSICAL_MAIL_METHODS)[number] {
  return (PHYSICAL_MAIL_METHODS as readonly string[]).includes(method)
}

export function usesAveryLabels(method: string | null | undefined): boolean {
  return method === 'handwrite' || method === 'print'
}
