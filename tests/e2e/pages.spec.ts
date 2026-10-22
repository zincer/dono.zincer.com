import { expect, test } from '@playwright/test'

const PAGES = [
  { path: '/next', title: 'What’s coming · Ake' },
  { path: '/privacy', title: 'Privacy · Ake' },
  { path: '/support', title: 'Support · Ake' },
] as const

for (const { path, title } of PAGES) {
  test(`${path} loads cleanly with its own title and canonical`, async ({ page, baseURL }) => {
    const errors: string[] = []
    const hosts = new Set<string>()
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
    page.on('request', (request) => hosts.add(new URL(request.url()).host))
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveTitle(title)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`^https://ake\\.to${path}/?$`))
    expect(errors).toEqual([])
    expect([...hosts]).toEqual([new URL(baseURL ?? '').host])
  })

  for (const width of [320, 1280]) {
    test(`${path} has no horizontal scroll at ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(path)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow).toBeLessThanOrEqual(0)
    })
  }

  test(`${path} nav links land on home sections`, async ({ page }) => {
    await page.goto(path)
    const hrefs = await page.locator('header nav a[href^="/#"]').evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''))
    expect(hrefs).toEqual(['/#privacy', '/#faq', '/#get'])
    for (const href of hrefs) {
      await page.goto(href)
      await expect(page.locator(href.slice(1))).toHaveCount(1)
    }
  })
}

test('the privacy policy is dated and names the contact', async ({ page }) => {
  await page.goto('/privacy')
  await expect(page.locator('main')).toContainText('Last updated 22 October 2026.')
  await expect(page.locator('main')).toContainText('Ake collects no data.')
  await expect(page.locator('main').getByRole('link', { name: 'hi@zincer.com' })).toHaveAttribute('href', 'mailto:hi@zincer.com')
})

test('support explains how to start fresh', async ({ page }) => {
  await page.goto('/support')
  await expect(page.locator('main')).toContainText('~/Library/Containers/com.zincer.ake')
  await expect(page.locator('main').getByRole('link', { name: 'FAQ' })).toHaveAttribute('href', '/#faq')
})
