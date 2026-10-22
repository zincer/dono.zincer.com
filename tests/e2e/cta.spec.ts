import { expect, test } from '@playwright/test'

test('with no listing yet, the page says coming soon and offers no TestFlight link', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('[data-store-soon]')).toHaveText(Array(2).fill('Coming soon to the Mac App Store'))
  await expect(page.locator('[data-store]')).toHaveCount(0)
  await expect(page.locator('[data-testflight]')).toHaveCount(0)
})

test('the nav button goes to the call to action', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Get Ake' }).click()
  await expect(page).toHaveURL(/#get$/)
  await expect(page.locator('#get')).toBeInViewport()
})
