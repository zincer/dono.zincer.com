// Renders /og/ from a running `npm run preview` into public/og.png.
// Usage: npm run build && npm run preview  (in one terminal), then: node scripts/make-og.mjs
import { chromium } from '@playwright/test'

const url = process.argv[2] ?? 'http://127.0.0.1:4174/og/'
const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
  await page.goto(url)
  await page.screenshot({ path: 'public/og.png' })
} finally {
  await browser.close()
}
