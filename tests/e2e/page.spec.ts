import { expect, test } from '@playwright/test'
import { TESTFLIGHT_URL } from '../../src/config'

// TestFlight stays off the home page unless TESTFLIGHT_URL is set.
const forbidden = new RegExp(
  `planner|focus|\\btasks?\\b|plan my day|beta|iphone${TESTFLIGHT_URL.trim() === '' ? '|testflight' : ''}`,
  'i',
)

test('every section is on the page in order', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 2 })).toHaveText([
    'Never miss the start.',
    'Your calendar stays yours.',
    'Questions',
    'Get Ake.',
  ])
})

test('the home page sells only what Ake 1.0 does', async ({ page }) => {
  await page.goto('/')
  const text = await page.evaluate(() => {
    const body = document.body.cloneNode(true) as HTMLElement
    body.querySelectorAll('script, style').forEach((element) => element.remove())
    return body.textContent ?? ''
  })
  expect(text).not.toMatch(forbidden)
})

test('every nav link lands on a home section', async ({ page }) => {
  await page.goto('/')
  const hrefs = await page.locator('header nav a[href^="/#"]').evaluateAll((links) => links.map((link) => link.getAttribute('href')))
  expect(hrefs.length).toBeGreaterThan(0)
  for (const href of hrefs) await expect(page.locator((href ?? '/#missing').slice(1))).toHaveCount(1)
})

test('the FAQ states the requirements, the calendars and the price', async ({ page }) => {
  await page.goto('/')
  const faq = page.locator('#faq')
  await faq.getByText('Which Macs?').click()
  await expect(faq).toContainText('Any Mac on macOS 26 or later.')
  await faq.getByText('Which calendars work?').click()
  await expect(faq).toContainText('System Settings › Internet Accounts')
  await faq.getByText('What does it cost?').click()
  await expect(faq).toContainText('Ake is free.')
})

test('the privacy section says no data is collected', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#privacy')).toContainText('Data Not Collected')
})

test('the footer links the contact address and the launch pages', async ({ page }) => {
  await page.goto('/')
  const footer = page.locator('footer')
  await expect(footer.getByRole('link', { name: 'hi@zincer.com' })).toHaveAttribute('href', 'mailto:hi@zincer.com')
  await expect(footer.getByRole('link', { name: 'What’s next' })).toHaveAttribute('href', '/next')
  await expect(footer.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy')
  await expect(footer.getByRole('link', { name: 'Support' })).toHaveAttribute('href', '/support')
})

for (const width of [320, 375, 768, 1280]) {
  test(`no horizontal scroll at ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })
}
