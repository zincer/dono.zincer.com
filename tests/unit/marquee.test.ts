import { describe, expect, it } from 'vitest'
import { MARQUEE_GAP, marqueeKeyframes, marqueePlan } from '../../src/scripts/notch/marquee'

describe('marqueePlan', () => {
  it('does not scroll a title that fits', () => {
    expect(marqueePlan(40, 50)).toBeNull()
    expect(marqueePlan(50, 50)).toBeNull()
    expect(marqueePlan(80, 0)).toBeNull()
  })

  it('scrolls one full pass (text + gap) at 30 px/s after a 2 s rest, like the app', () => {
    const plan = marqueePlan(84, 50)
    expect(plan?.distance).toBe(84 + MARQUEE_GAP)
    expect(plan?.durationMs).toBeCloseTo(2000 + (120 / 30) * 1000)
    expect(plan?.holdFraction).toBeCloseTo(2000 / 6000)
  })
})

describe('marqueeKeyframes', () => {
  it('rests at the start, then moves left only, never back', () => {
    const plan = marqueePlan(84, 50)
    if (!plan) throw new Error('expected a plan')
    expect(marqueeKeyframes(plan)).toEqual([
      { transform: 'translateX(0px)', offset: 0 },
      { transform: 'translateX(0px)', offset: plan.holdFraction },
      { transform: 'translateX(-120px)', offset: 1 },
    ])
  })
})
