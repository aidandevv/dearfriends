import { expect, test } from '@playwright/test'

test.describe('public flows', () => {
  test('share page rejects legacy user-id links', async ({ page }) => {
    await page.goto('/share/11111111-1111-4111-8111-111111111111')
    await expect(page.getByRole('heading', { name: /lost in the mail/i })).toBeVisible()
  })

  test('verification page surfaces invalid token errors', async ({ page }) => {
    await page.goto('/verify/not-a-valid-token')
    await expect(page.getByRole('heading', { name: /link is no longer available/i })).toBeVisible()
    await expect(page.getByText(/invalid or has expired/i)).toBeVisible()
    await expect(page.getByRole('heading', { name: /all confirmed/i })).toHaveCount(0)
  })

  test('dashboard redirects unauthenticated visitors to login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
  })

  test('onboarding redirects unauthenticated visitors to login', async ({ page }) => {
    await page.goto('/onboarding')
    await expect(page).toHaveURL(/\/login$/)
  })
})
