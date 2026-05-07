import { expect, test } from '@playwright/test'

test.describe('marketing pages', () => {
  test('landing page links into about and login flows', async ({ page }) => {
    await page.goto('/')

    await expect(
      page.getByRole('heading', { name: /keep up with the people you love/i }),
    ).toBeVisible()
    await expect(
      page.getByText(/collect your friends' addresses, remember birthdays/i),
    ).toBeVisible()

    await page.getByRole('link', { name: /see how it works/i }).click()
    await expect(page).toHaveURL(/#how$/)
    await expect(
      page.getByRole('heading', { name: /three small rituals/i }),
    ).toBeVisible()

    await page.goto('/about')
    await expect(
      page.getByRole('heading', { name: /a warmer home for mailing lists and meaningful updates/i }),
    ).toBeVisible()

    await page.goto('/')
    await page.getByRole('link', { name: /start writing/i }).click()
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
  })
})
