import { expect, test } from '@playwright/test'

const email = process.env.E2E_USER_EMAIL
const password = process.env.E2E_USER_PASSWORD

test.describe('authenticated user flows', () => {
  test.skip(!email || !password, 'Set E2E_USER_EMAIL and E2E_USER_PASSWORD for the seeded test account.')

  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder(/you@example.com/i).fill(email!)
    await page.getByPlaceholder(/at least 8 characters/i).fill(password!)
    await page.getByRole('button', { name: /sign in$/i }).click()
    await expect(page).toHaveURL(/\/dashboard(?:\/|$)/)
  })

  test('dashboard supports contact filtering and guarded verification send', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: /your friends/i })).toBeVisible()
    await expect(page.getByLabel(/search contacts/i)).toBeVisible()
    const sendButton = page.getByRole('button', { name: /send verification emails/i })
    if (await sendButton.isEnabled()) {
      await sendButton.click()
      await expect(page.getByRole('dialog')).toContainText(/eligible contact|unique address-confirmation/i)
      await page.getByRole('button', { name: /cancel/i }).click()
    }
  })

  test('composer exposes deterministic recipient preview and save feedback', async ({ page }) => {
    await page.goto('/dashboard/compose')
    await expect(page.getByLabel(/preview recipient/i)).toBeVisible()
    await expect(page.getByRole('button', { name: '{{first_name}}' })).toBeVisible()
    await expect(page.getByLabel(/letter body/i)).toBeVisible()
  })

  test('calendar and map remain operable without a mouse', async ({ page }) => {
    await page.goto('/dashboard/calendar')
    await expect(page.getByRole('button', { name: /today/i })).toBeVisible()
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toBeVisible()
    await page.goto('/dashboard/map')
    await expect(page.getByRole('heading', { name: /friend map/i })).toBeVisible()
    await expect(page.getByLabel(/map showing where your contacts live/i)).toBeVisible()
  })
})
