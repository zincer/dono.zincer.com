import { expect, test } from '@playwright/test'

for (const javaScriptEnabled of [true, false]) {
  test.describe(`signup with JavaScript ${javaScriptEnabled ? 'on' : 'off'}`, () => {
    test.use({ javaScriptEnabled })

    test('is disabled and says when it opens while no endpoint is set', async ({ page }) => {
      await page.goto('/')
      const form = page.locator('form[data-signup]').first()
      await expect(form.getByRole('textbox', { name: 'Email address' })).toBeDisabled()
      await expect(form.getByRole('button', { name: 'Join the beta' })).toBeDisabled()
      await expect(form.locator('[data-status]')).toHaveText('Beta signups open soon. Write to hi@zincer.com.')
      await expect(form.getByRole('link', { name: 'hi@zincer.com' })).toHaveAttribute('href', 'mailto:hi@zincer.com')
    })
  })
}
