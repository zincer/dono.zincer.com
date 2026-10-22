import { expect, test } from '@playwright/test'

test('the loop resumes after the pointer leaves the notch quickly', async ({ page }) => {
  await page.goto('/')
  const demo = page.locator('[data-demo]')
  await demo.locator('[data-toggle]').hover()
  await expect(demo).toHaveAttribute('data-mode', 'hands')
  await page.mouse.move(2, 2)
  await expect(demo).toHaveAttribute('data-mode', 'loop', { timeout: 6000 })
})

test('hovering while the loop shows the card keeps it open', async ({ page }) => {
  await page.goto('/')
  const demo = page.locator('[data-demo]')
  await demo.locator('[data-dot="card"]').click()
  await expect(demo).toHaveAttribute('data-expanded', 'true')
  await page.evaluate(() => {
    const root = document.querySelector<HTMLElement>('[data-demo]')
    const seen: string[] = []
    Object.assign(window, { expandedSeen: seen })
    new MutationObserver(() => seen.push(root?.dataset.expanded ?? '')).observe(root as Node, { attributeFilter: ['data-expanded'] })
  })
  await demo.locator('[data-toggle]').hover()
  await expect(demo).toHaveAttribute('data-mode', 'hands')
  await page.waitForTimeout(300)
  expect(await page.evaluate(() => (window as unknown as { expandedSeen: string[] }).expandedSeen)).not.toContain('false')
})

test('Skip from the keyboard keeps focus on the notch', async ({ page }) => {
  await page.goto('/')
  const demo = page.locator('[data-demo]')
  await demo.locator('[data-scenario="countdown"]').focus()
  await page.keyboard.press('Enter')
  await demo.locator('[data-toggle]').focus()
  await page.keyboard.press('Enter')
  await page.keyboard.press('Tab')
  await expect(demo.locator('[data-skip]')).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(demo.locator('[data-toggle]')).toBeFocused()
})

test('hovering an idle notch opens today’s meetings and nothing else', async ({ page }) => {
  await page.goto('/')
  const demo = page.locator('[data-demo]')
  await demo.locator('[data-toggle]').hover()
  await expect(demo).toHaveAttribute('data-expanded', 'true')
  const agenda = demo.locator('[data-agenda]')
  await expect(agenda).toBeVisible()
  await expect(agenda.locator('[data-agenda-row]:visible')).toHaveCount(3)
  await expect(agenda.locator('[data-agenda-row]').first()).toContainText('Design review')
  await expect(agenda.getByRole('button', { name: /Focus now|Open planner/ })).toHaveCount(0)
})

test('the scenario chips are the 1.0 notch states', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('[data-demo] [data-scenario]')).toHaveText(['Idle', 'Countdown', 'Starting now'])
})
