import type { ActionState } from '@/lib/action-result'

export function ActionFeedback({
  state,
  message,
  className = '',
}: {
  state: ActionState
  message?: string | null
  className?: string
}) {
  if (!message) return null

  const isError = state === 'error'

  return (
    <p
      className={`${isError ? 'text-stamp' : state === 'saved' ? 'text-sage' : 'text-ink-muted'} ${className}`}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
    >
      {message}
    </p>
  )
}
