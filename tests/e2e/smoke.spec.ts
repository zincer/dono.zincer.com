import { expect, test } from '@playwright/test'

test('home page loads without console errors', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto('/')

  await expect(page).toHaveTitle('Ake · Your day, in the notch')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your day, in the notch.')
  expect(errors).toEqual([])
})
