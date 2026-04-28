import { expect, test } from '@playwright/test'

test.describe('marketing pages', () => {
  test('landing page links into about and login flows', async ({ page }) => {
    await page.goto('/')

    await expect(
      page.getByRole('heading', { name: /your people deserve more than/i }),
    ).toBeVisible()
    await expect(
      page.getByText(/No credit card. No fuss. Just your address book./i),
    ).toBeVisible()

    await page.getByRole('link', { name: /see how it works/i }).click()
    await expect(page).toHaveURL(/\/about$/)
    await expect(
      page.getByRole('heading', { name: /a warmer home for mailing lists and meaningful updates/i }),
    ).toBeVisible()

    await page.getByRole('link', { name: /go to dashboard/i }).first().click()
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
  })
})
