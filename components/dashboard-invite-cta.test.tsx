// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DashboardInviteCta } from './dashboard-invite-cta'

describe('DashboardInviteCta', () => {
  it('reports a successful clipboard copy', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    render(<DashboardInviteCta url="https://dearfriends.test/share/ada" />)

    fireEvent.click(screen.getByRole('button', { name: /copy invite link/i }))

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('https://dearfriends.test/share/ada'))
    expect(screen.getByRole('button', { name: /invite link copied/i })).toBeVisible()
  })

  it('gives an accessible fallback when clipboard access is rejected', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
      configurable: true,
    })
    render(<DashboardInviteCta url="https://dearfriends.test/share/ada" />)

    fireEvent.click(screen.getByRole('button', { name: /copy invite link/i }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/copy failed/i))
  })
})
