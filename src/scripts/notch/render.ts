import { describe, leadView, ringFraction, timerText } from './format'
import type { DemoState, Scenario } from './model'
import { STEPS } from './timeline'

export const RING_CIRCUMFERENCE = 2 * Math.PI * 15.25
export const HANDS_CAPTION = "You're driving. Try Skip and Join."

export interface DemoRefs {
  readonly root: HTMLElement
  readonly frame: HTMLElement
  readonly screen: HTMLElement
  readonly notch: HTMLElement
  readonly toggle: HTMLButtonElement
  readonly leadText: HTMLElement
  readonly trailWing: HTMLElement
  readonly trail: HTMLElement
  readonly card: HTMLElement
  readonly eyebrow: HTMLElement
  readonly hero: HTMLElement
  readonly ring: SVGCircleElement
  readonly skip: HTMLButtonElement
  readonly join: HTMLButtonElement
  readonly toast: HTMLElement
  readonly caption: HTMLElement
  readonly timeLapse: HTMLElement
  readonly dots: readonly HTMLButtonElement[]
  readonly chips: readonly HTMLButtonElement[]
}

export interface RenderContext {
  readonly mode: 'loop' | 'hands'
  readonly chip: Scenario | null
}

function need<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector)
  if (!element) throw new Error(`Notch demo markup is missing ${selector}`)
  return element
}

export function collectRefs(root: HTMLElement): DemoRefs {
  return {
    root,
    frame: need(root, '[data-frame]'),
    screen: need(root, '[data-screen]'),
    notch: need(root, '[data-notch]'),
    toggle: need(root, '[data-toggle]'),
    leadText: need(root, '[data-lead-text]'),
    trailWing: need(root, '[data-trail-wing]'),
    trail: need(root, '[data-trail]'),
    card: need(root, '[data-card]'),
    eyebrow: need(root, '[data-eyebrow]'),
    hero: need(root, '[data-hero]'),
    ring: need(root, '[data-ring]'),
    skip: need(root, '[data-skip]'),
    join: need(root, '[data-join]'),
    toast: need(root, '[data-toast]'),
    caption: need(root, '[data-caption]'),
    timeLapse: need(root, '[data-timelapse]'),
    dots: [...root.querySelectorAll<HTMLButtonElement>('[data-dot]')],
    chips: [...root.querySelectorAll<HTMLButtonElement>('[data-scenario]')],
  }
}

const setText = (element: Element, text: string): void => {
  if (element.textContent !== text) element.textContent = text
}
const setAttr = (element: Element, name: string, value: string): void => {
  if (element.getAttribute(name) !== value) element.setAttribute(name, value)
}

/** Scrolls a long title like the app's MarqueeText, measured only when the title changes. */
function setTrail(refs: DemoRefs, text: string): void {
  if (refs.trail.textContent === text && refs.trailWing.dataset.marquee !== undefined) return
  refs.trail.textContent = text
  const room = refs.trailWing.clientWidth - 10
  const overflow = refs.trail.scrollWidth - room
  refs.trailWing.dataset.marquee = String(overflow > 0)
  refs.trailWing.style.setProperty('--marquee-distance', `${Math.max(0, overflow)}px`)
}

export function render(refs: DemoRefs, state: DemoState, context: RenderContext): void {
  const { content } = state
  const lead = leadView(content)
  const expanded = state.expanded && content.kind === 'meeting'
  const data = refs.root.dataset

  data.mode = context.mode
  data.step = state.step ?? 'none'
  data.lead = lead.kind
  data.tone = lead.tone
  data.expanded = String(expanded)
  data.cursor = state.cursor
  data.pulsing = String(lead.pulsing)
  data.joinPressed = String(state.joinPressed)

  setText(refs.leadText, lead.text)
  setTrail(refs, lead.trail)
  setAttr(refs.toggle, 'aria-label', describe(content))
  setAttr(refs.toggle, 'aria-expanded', String(expanded))
  refs.card.inert = !expanded

  if (content.kind === 'meeting') {
    setText(refs.hero, timerText(content.timer))
    setText(refs.eyebrow, content.timer.phase === 'inProgress' ? 'Now' : 'Starts in')
    setAttr(refs.ring, 'stroke-dashoffset', (RING_CIRCUMFERENCE * (1 - ringFraction(content.timer))).toFixed(2))
  }

  const step = STEPS.find((candidate) => candidate.id === state.step)
  setText(refs.caption, context.mode === 'loop' && step ? step.caption : HANDS_CAPTION)
  refs.timeLapse.hidden = !state.timeLapse

  refs.dots.forEach((dot) => {
    if (dot.dataset.dot === state.step) setAttr(dot, 'aria-current', 'step')
    else dot.removeAttribute('aria-current')
  })
  refs.chips.forEach((chip) => setAttr(chip, 'aria-pressed', String(chip.dataset.scenario === context.chip)))
}
