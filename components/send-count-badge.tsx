type SendCountBadgeProps = {
  count: number
}

export function SendCountBadge({ count }: SendCountBadgeProps) {
  if (count < 1) return null

  return (
    <section className="overflow-hidden rounded-[1.4rem] border border-border bg-[linear-gradient(135deg,rgba(250,244,228,0.98)_0%,rgba(240,227,184,0.92)_52%,rgba(255,255,255,0.96)_100%)] px-6 py-5 text-center shadow-[0_16px_38px_rgba(51,88,186,0.12)]">
      <p className="font-serif text-[1.7rem] leading-tight text-ink">
        You&apos;re sending to <strong className="font-semibold text-periwinkle">{count} friends</strong> this year!
      </p>
    </section>
  )
}
