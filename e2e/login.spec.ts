import { expect, test } from '@playwright/test'

test.describe('login page', () => {
  test('supports switching modes and client-side validation', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
    await expect(page.getByPlaceholder(/you@example.com/i)).toBeVisible()
    await expect(page.getByPlaceholder(/at least 8 characters/i)).toBeVisible()

    await page.getByRole('button', { name: /sign up/i }).click()
    await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible()
    await expect(page.getByPlaceholder(/repeat your password/i)).toBeVisible()

    await page.getByPlaceholder(/you@example.com/i).fill('friend@example.com')
    await page.getByPlaceholder(/at least 8 characters/i).fill('short')
    await page.getByPlaceholder(/repeat your password/i).fill('short')
    await page.getByRole('button', { name: /create account/i }).click()
    await expect(page.getByText(/password must be at least 8 characters/i)).toBeVisible()

    await page.getByPlaceholder(/at least 8 characters/i).fill('longenough')
    await page.getByPlaceholder(/repeat your password/i).fill('different1')
    await page.getByRole('button', { name: /create account/i }).click()
    await expect(page.getByText(/passwords do not match/i)).toBeVisible()

    await page.getByRole('button', { name: /send magic link instead/i }).click()
    await expect(page.getByRole('heading', { name: /magic link/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /send magic link/i })).toBeVisible()
    await expect(page.getByPlaceholder(/at least 8 characters/i)).toHaveCount(0)

    await page.getByRole('button', { name: /sign in with password/i }).click()
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()

    await page.getByRole('button', { name: /forgot password\?/i }).click()
    await expect(page.getByRole('heading', { name: /reset password/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /send reset link/i })).toBeVisible()
  })
})
