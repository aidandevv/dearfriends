import { DELIVERY_LABELS, type DeliveryMethod } from '@/lib/delivery-methods'

const styles: Record<DeliveryMethod, string> = {
  digital: 'bg-periwinkle text-white',
  print: 'bg-ink text-white',
  handwrite: 'bg-sage text-white',
}

export function PillBadge({ method }: { method: string }) {
  const key = method as DeliveryMethod
  const label = DELIVERY_LABELS[key] ?? method

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${styles[key] ?? 'bg-border text-ink'}`}>
      {label}
    </span>
  )
}
