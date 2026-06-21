import { expect, test } from '@playwright/test'

test.describe('marketing pages', () => {
  test('landing page links into login and avoids removed footer pages', async ({ page }) => {
    await page.goto('/')

    await expect(
      page.getByRole('heading', { name: /real mail, for the people you'd miss/i }),
    ).toBeVisible()
    await expect(
      page.getByText(/dearfriends collects your friends' addresses, remembers their birthdays/i),
    ).toBeVisible()

    await page.getByRole('link', { name: /see how it works/i }).click()
    await expect(page).toHaveURL(/#how$/)
    await expect(
      page.getByRole('heading', { name: /three small habits/i }),
    ).toBeVisible()

    await page.goto('/')
    await page.locator('header').getByRole('link', { name: /start your list/i }).click()
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()

    await page.goto('/')
    await expect(page.getByRole('link', { name: /^about$/i })).toHaveCount(0)
    await expect(page.getByRole('link', { name: /^privacy$/i })).toHaveCount(0)
    await expect(page.getByRole('link', { name: /^changelog$/i })).toHaveCount(0)
    await expect(page.getByRole('link', { name: /hi@dearfriends.co/i })).toBeVisible()
  })
})
