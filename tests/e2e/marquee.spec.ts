import { expect, test } from '@playwright/test'

const trackAnimation = () => {
  const track = document.querySelector('[data-trail-track]')
  const animation = track?.getAnimations()[0]
  if (!animation) return null
  const frames = (animation.effect as KeyframeEffect).getKeyframes()
  return { iterations: animation.effect?.getTiming().iterations, transforms: frames.map((frame) => frame.transform) }
}

test('a long title rests, then scrolls left only and loops onto its copy', async ({ page }) => {
  await page.goto('/')
  const demo = page.locator('[data-demo]')
  await expect(demo.locator('[data-trail-wing]')).toHaveAttribute('data-marquee', 'true')
  await expect(demo.locator('[data-trail-copy]')).toHaveText('Design review')
  const animation = await page.evaluate(trackAnimation)
  expect(animation?.iterations).toBe(Infinity)
  expect(animation?.transforms[0]).toBe('translateX(0px)')
  expect(animation?.transforms[1]).toBe('translateX(0px)')
  expect(animation?.transforms[2]).toMatch(/^translateX\(-\d+(\.\d+)?px\)$/)
})

test.describe('with Reduce Motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('a long title does not move', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-trail-wing]')).toHaveAttribute('data-marquee', 'true')
    expect(await page.evaluate(trackAnimation)).toBeNull()
  })
})
