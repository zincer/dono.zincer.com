import { expect, test } from '@playwright/test'

test('every section is on the page in order', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 2 })).toHaveText([
    'Never miss the start.',
    'Tasks that know about your meetings.',
    'One task. One timer.',
    'The countdown goes with you.',
    'Your calendar stays yours.',
    'Plan my day.',
    'Questions',
    'Get Dono early.',
  ])
})

test('every nav link lands on a section', async ({ page }) => {
  await page.goto('/')
  const hrefs = await page.locator('header nav a[href^="#"]').evaluateAll((links) => links.map((link) => link.getAttribute('href')))
  expect(hrefs.length).toBeGreaterThan(0)
  for (const href of hrefs) await expect(page.locator(href ?? '#missing')).toHaveCount(1)
})

test('the FAQ states the requirements and the price', async ({ page }) => {
  await page.goto('/')
  const faq = page.locator('#faq')
  await faq.getByText('Which Macs?').click()
  await expect(faq).toContainText('Macs with Apple silicon on macOS 26 or later.')
  await faq.getByText('What does it cost?').click()
  await expect(faq).toContainText('Free during the beta.')
})

test('the footer links the contact address', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('footer').getByRole('link', { name: 'hi@zincer.com' })).toHaveAttribute('href', 'mailto:hi@zincer.com')
})

for (const width of [320, 375, 768, 1280]) {
  test(`no horizontal scroll at ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })
}
