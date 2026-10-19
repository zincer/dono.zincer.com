import { expect, test } from '@playwright/test'

test('has canonical, Open Graph and Twitter metadata', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://dono.zincer.com/')
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://dono.zincer.com/og.png')
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image')
})

test('serves the social image, CNAME and robots.txt', async ({ request }) => {
  const og = await request.get('/og.png')
  expect(og.status()).toBe(200)
  expect(og.headers()['content-type']).toContain('image/png')
  expect((await (await request.get('/CNAME')).text()).trim()).toBe('dono.zincer.com')
  expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /og/')
})

test('makes no third-party requests', async ({ page, baseURL }) => {
  const hosts = new Set<string>()
  page.on('request', (request) => hosts.add(new URL(request.url()).host))
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  expect([...hosts]).toEqual([new URL(baseURL ?? '').host])
})
