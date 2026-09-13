import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const wcagAaTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

test.describe('@a11y public WCAG checks', () => {
  test.setTimeout(60_000)

  for (const [name, path] of [
    ['landing page', '/'],
    ['sign-in page', '/login'],
    ['reset-password page', '/auth/reset-password'],
    ['invalid share link', '/share/11111111-1111-4111-8111-111111111111'],
    ['invalid verification link', '/verify/not-a-valid-token'],
  ] as const) {
    test(`${name} has no automatically detectable WCAG A/AA violations`, async ({ page }, testInfo) => {
      await page.goto(path)
      await expect(page.locator('body')).toBeVisible()

      const results = await new AxeBuilder({ page })
        .withTags(wcagAaTags)
        .analyze()

      await testInfo.attach('axe-results', {
        body: JSON.stringify(results, null, 2),
        contentType: 'application/json',
      })
      expect(results.violations).toEqual([])
    })
  }
})
