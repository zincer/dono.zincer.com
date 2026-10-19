import { expect, test } from '@playwright/test'

test.describe('on a desktop with a mouse', () => {
  test('the loop moves from idle to the countdown', async ({ page }) => {
    await page.goto('/')
    const demo = page.locator('[data-demo]')
    await expect(demo).toHaveAttribute('data-step', 'idle')
    await expect(demo).toHaveAttribute('data-step', 'countdown', { timeout: 6000 })
    await expect(demo.locator('[data-lead-text]')).toHaveText(/^-0[0-5]:\d\d$/)
    await expect(demo.locator('[data-timelapse]')).toBeVisible()
  })

  test('hovering the notch hands control to the visitor and opens the card', async ({ page }) => {
    await page.goto('/')
    const demo = page.locator('[data-demo]')
    await demo.locator('[data-scenario="countdown"]').click()
    await expect(demo).toHaveAttribute('data-mode', 'hands')
    await expect(demo.locator('[data-scenario="countdown"]')).toHaveAttribute('aria-pressed', 'true')
    await demo.locator('[data-toggle]').hover()
    await expect(demo).toHaveAttribute('data-expanded', 'true')
    await expect(demo.locator('[data-hero]')).toHaveText(/^-04:\d\d$/)
  })

  test('Join shows a toast and does not navigate', async ({ page }) => {
    await page.goto('/')
    const demo = page.locator('[data-demo]')
    await demo.locator('[data-scenario="countdown"]').click()
    await demo.locator('[data-toggle]').hover()
    await expect(demo).toHaveAttribute('data-expanded', 'true')
    await demo.locator('[data-join]').click()
    await expect(demo.locator('[data-toast]')).toHaveText('Would open Zoom')
    await expect(demo).toHaveAttribute('data-expanded', 'false')
    expect(new URL(page.url()).pathname).toBe('/')
  })

  test('Skip shows the next meeting', async ({ page }) => {
    await page.goto('/')
    const demo = page.locator('[data-demo]')
    await demo.locator('[data-scenario="countdown"]').click()
    await demo.locator('[data-toggle]').hover()
    await expect(demo).toHaveAttribute('data-expanded', 'true')
    await demo.locator('[data-skip]').click()
    await expect(demo.locator('[data-trail]')).toHaveText('1:1 with Sam')
    await expect(demo.locator('[data-lead-text]')).toHaveText('16:30')
  })

  test('a chip switches the scenario', async ({ page }) => {
    await page.goto('/')
    const demo = page.locator('[data-demo]')
    await demo.locator('[data-scenario="focus"]').click()
    await expect(demo).toHaveAttribute('data-lead', 'focus')
    await expect(demo.locator('[data-trail]')).toHaveText('Write the brief')
    await expect(demo.locator('[data-caption]')).toHaveText("You're driving. Try Skip and Join.")
  })

  test('the loop resumes four seconds after the pointer leaves', async ({ page }) => {
    await page.goto('/')
    const demo = page.locator('[data-demo]')
    await demo.locator('[data-scenario="focus"]').click()
    await expect(demo).toHaveAttribute('data-mode', 'hands')
    await page.mouse.move(2, 2)
    await expect(demo).toHaveAttribute('data-mode', 'hands', { timeout: 1000 })
    await expect(demo).toHaveAttribute('data-mode', 'loop', { timeout: 6000 })
  })

  test('a step dot jumps the loop to that step', async ({ page }) => {
    await page.goto('/')
    const demo = page.locator('[data-demo]')
    await demo.locator('[data-dot="focus"]').click()
    await expect(demo).toHaveAttribute('data-step', 'focus')
    await expect(demo.locator('[data-dot="focus"]')).toHaveAttribute('aria-current', 'step')
  })

  test('works from the keyboard', async ({ page }) => {
    await page.goto('/')
    const demo = page.locator('[data-demo]')
    await demo.locator('[data-scenario="countdown"]').focus()
    await page.keyboard.press('Enter')
    await demo.locator('[data-toggle]').focus()
    await page.keyboard.press('Enter')
    await expect(demo).toHaveAttribute('data-expanded', 'true')
    await expect(demo.locator('[data-toggle]')).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('Tab')
    await expect(demo.locator('[data-skip]')).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(demo).toHaveAttribute('data-expanded', 'false')
  })
})

test.describe('with Reduce Motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('steps are frozen and the ghost cursor never shows', async ({ page }) => {
    await page.goto('/')
    const demo = page.locator('[data-demo]')
    await demo.locator('[data-dot="card"]').click()
    await expect(demo).toHaveAttribute('data-step', 'card')
    await expect(demo).toHaveAttribute('data-expanded', 'true')
    await expect(demo).toHaveAttribute('data-cursor', 'hidden')
    await expect(demo.locator('[data-hero]')).toHaveText('-00:55')
    await expect(demo.locator('[data-timelapse]')).toBeHidden()
  })
})

test.describe('on a touch phone', () => {
  test.use({ viewport: { width: 412, height: 915 }, hasTouch: true, isMobile: true })

  test('tapping the notch opens and closes the card', async ({ page }) => {
    await page.goto('/')
    const demo = page.locator('[data-demo]')
    await demo.locator('[data-scenario="countdown"]').tap()
    await demo.locator('[data-toggle]').tap()
    await expect(demo).toHaveAttribute('data-expanded', 'true')
    await demo.locator('[data-toggle]').tap()
    await expect(demo).toHaveAttribute('data-expanded', 'false')
  })
})
