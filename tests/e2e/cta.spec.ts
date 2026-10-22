import { expect, test } from '@playwright/test'
import { APP_STORE_URL, TESTFLIGHT_URL } from '../../src/config'
import { ctaView } from '../../src/scripts/cta'

const { store, testflight } = ctaView(APP_STORE_URL, TESTFLIGHT_URL)

test.describe('App Store link', () => {
  test.skip(store.kind !== 'soon', 'APP_STORE_URL is set')

  test('with no listing yet, the page says coming soon and offers no store link', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-store-soon]')).toHaveText(Array(2).fill('Coming soon to the Mac App Store'))
    await expect(page.locator('[data-store]')).toHaveCount(0)
  })
})

test.describe('App Store link once listed', () => {
  test.skip(store.kind !== 'store', 'APP_STORE_URL is empty')

  test('both calls to action link to the listing', async ({ page }) => {
    await page.goto('/')
    const href = store.kind === 'store' ? store.href : ''
    await expect(page.locator('[data-store]')).toHaveCount(2)
    for (const link of await page.locator('[data-store]').all()) await expect(link).toHaveAttribute('href', href)
    await expect(page.locator('[data-store-soon]')).toHaveCount(0)
  })
})

test.describe('TestFlight link', () => {
  test.skip(testflight !== null, 'TESTFLIGHT_URL is set')

  test('with no TestFlight link configured, the page offers none', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-testflight]')).toHaveCount(0)
  })
})

test.describe('TestFlight link once configured', () => {
  test.skip(testflight === null, 'TESTFLIGHT_URL is empty')

  test('both calls to action offer early builds', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-testflight]')).toHaveText(Array(2).fill('Try early builds on TestFlight'))
    for (const link of await page.locator('[data-testflight]').all()) await expect(link).toHaveAttribute('href', testflight ?? '')
  })
})

test('the nav button goes to the call to action', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Get Ake' }).click()
  await expect(page).toHaveURL(/#get$/)
  await expect(page.locator('#get')).toBeInViewport()
})
