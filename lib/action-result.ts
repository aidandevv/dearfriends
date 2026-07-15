export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string }

export type ActionState = 'idle' | 'dirty' | 'pending' | 'saved' | 'error'

export function resultError(result: { error?: unknown }): string | null {
  if (typeof result.error === 'string') return result.error
  if (result.error) return 'Something went wrong. Please try again.'
  return null
}
