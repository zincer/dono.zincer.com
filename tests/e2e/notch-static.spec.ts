import { expect, test } from '@playwright/test'

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('shows the idle notch from the server HTML', async ({ page }) => {
    await page.goto('/')
    const demo = page.locator('[data-demo]')
    await expect(demo).toHaveAttribute('data-step', 'idle')
    await expect(demo).toHaveAttribute('data-lead', 'dot')
    await expect(demo.locator('[data-lead-text]')).toHaveText('14:00')
    await expect(demo.locator('[data-trail]')).toHaveText('Design review')
    await expect(demo.locator('[data-toggle]')).toHaveAttribute('aria-label', 'Next: Design review at 14:00')
    await expect(demo.locator('[data-caption]')).toHaveText('Your next meeting, always in view.')
    await expect(demo).not.toContainText(/Focus now|Open planner|Write the brief/)
    await expect(demo.locator('[data-dot]')).toHaveCount(4)
  })
})
