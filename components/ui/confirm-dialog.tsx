'use client'

import { useEffect, useRef, type ReactNode } from 'react'

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  pending = false,
  destructive = false,
  children,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  pending?: boolean
  destructive?: boolean
  children?: ReactNode
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    cancelRef.current?.focus()

    return () => previousFocusRef.current?.focus()
  }, [open])

  if (!open) return null

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape' && !pending) {
      event.preventDefault()
      onCancel()
      return
    }

    if (event.key !== 'Tab' || !dialogRef.current) return
    const focusable = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'),
    )
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/45 p-4 backdrop-blur-sm"
      onMouseDown={event => {
        if (event.currentTarget === event.target && !pending) onCancel()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={description ? 'confirm-dialog-description' : undefined}
        onKeyDown={handleKeyDown}
        className="surface-panel w-full max-w-md px-6 py-6 shadow-[0_24px_80px_rgba(35,18,9,0.22)]"
      >
        <h2 id="confirm-dialog-title" className="font-serif text-2xl text-ink">{title}</h2>
        {description && (
          <p id="confirm-dialog-description" className="mt-2 text-sm leading-6 text-ink-muted">
            {description}
          </p>
        )}
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-6 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="btn-outline min-h-11 px-5"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={pending}
            className={destructive
              ? 'min-h-11 rounded-full bg-stamp px-5 text-sm font-medium text-white disabled:opacity-50'
              : 'btn-primary min-h-11 px-5'}
          >
            {pending ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
