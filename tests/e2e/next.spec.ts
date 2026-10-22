import { expect, test } from '@playwright/test'

test('/next shows every planned feature as in the works', async ({ page }) => {
  await page.goto('/next')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('What\'s coming.')
  await expect(page.getByRole('heading', { level: 2 })).toHaveText([
    'Tasks that know about your meetings.',
    'One task. One timer.',
    'Plan my day.',
    'The countdown on your iPhone.',
    'Hear when it ships.',
  ])
  await expect(page.locator('.badge')).toHaveCount(4)
  await expect(page.locator('.badge')).toHaveText(Array(4).fill('In the works'))
  await expect(page.locator('main')).toContainText('None of it is in the app yet.')
})
