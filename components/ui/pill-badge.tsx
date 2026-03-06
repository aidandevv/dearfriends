type DeliveryMethod = 'handwrite' | 'print' | 'digital'

const styles: Record<DeliveryMethod, string> = {
  digital: 'bg-terra text-white',
  print: 'bg-ink text-white',
  handwrite: 'bg-sage text-white',
}

const labels: Record<DeliveryMethod, string> = {
  digital: 'Digital',
  print: 'Print',
  handwrite: 'Handwrite',
}

export function PillBadge({ method }: { method: string }) {
  const key = method as DeliveryMethod

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${styles[key] ?? 'bg-border text-ink'}`}>
      {labels[key] ?? method}
    </span>
  )
}
