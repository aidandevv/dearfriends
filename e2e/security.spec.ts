import { expect, test } from '@playwright/test'

test.describe('security hardening smoke', () => {
  test('legacy user-id share links are not routable', async ({ page }) => {
    await page.goto('/share/11111111-1111-4111-8111-111111111111')
    await expect(page.getByRole('heading', { name: /lost in the mail/i })).toBeVisible()
  })
})
