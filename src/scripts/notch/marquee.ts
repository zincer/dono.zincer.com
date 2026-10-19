/** MarqueeTimeline in the app: scroll speed, gap between the two copies, rest at the start. */
export const MARQUEE_SPEED = 30
export const MARQUEE_GAP = 36
export const MARQUEE_REST_MS = 2000

export interface MarqueePlan {
  /** One full pass: the text plus the gap, so the second copy lands where the first started. */
  readonly distance: number
  readonly durationMs: number
  /** Share of each cycle spent resting at the start. */
  readonly holdFraction: number
}

/** How a title scrolls, or null when it fits its wing. */
export function marqueePlan(textWidth: number, containerWidth: number): MarqueePlan | null {
  if (containerWidth <= 0 || textWidth <= containerWidth) return null
  const distance = textWidth + MARQUEE_GAP
  const durationMs = MARQUEE_REST_MS + (distance / MARQUEE_SPEED) * 1000
  return { distance, durationMs, holdFraction: MARQUEE_REST_MS / durationMs }
}

/** One cycle: rest at the start, then slide left one pass; the loop restarts on the matching copy. */
export function marqueeKeyframes(plan: MarqueePlan): Keyframe[] {
  return [
    { transform: 'translateX(0px)', offset: 0 },
    { transform: 'translateX(0px)', offset: plan.holdFraction },
    { transform: `translateX(-${plan.distance}px)`, offset: 1 },
  ]
}
