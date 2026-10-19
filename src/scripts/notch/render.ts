import { agendaView } from './agenda'
import { describe, leadView, ringFraction, timerText } from './format'
import { marqueeKeyframes, marqueePlan } from './marquee'
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
  readonly trailTrack: HTMLElement
  readonly trail: HTMLElement
  readonly trailCopy: HTMLElement
  readonly card: HTMLElement
  readonly agenda: HTMLElement
  readonly agendaRows: readonly HTMLElement[]
  readonly focusRow: HTMLElement
  readonly focusElapsed: HTMLElement
  readonly focusTitle: HTMLElement
  readonly focusProgress: HTMLElement
  readonly focusNow: HTMLButtonElement
  readonly openPlanner: HTMLButtonElement
  readonly rowJoins: readonly HTMLButtonElement[]
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
    trailTrack: need(root, '[data-trail-track]'),
    trail: need(root, '[data-trail]'),
    trailCopy: need(root, '[data-trail-copy]'),
    card: need(root, '[data-card]'),
    agenda: need(root, '[data-agenda]'),
    agendaRows: [...root.querySelectorAll<HTMLElement>('[data-agenda-row]')],
    focusRow: need(root, '[data-focus-row]'),
    focusElapsed: need(root, '[data-focus-elapsed]'),
    focusTitle: need(root, '[data-focus-title]'),
    focusProgress: need(root, '[data-focus-progress]'),
    focusNow: need(root, '[data-focus-now]'),
    openPlanner: need(root, '[data-open-planner]'),
    rowJoins: [...root.querySelectorAll<HTMLButtonElement>('[data-row-join]')],
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

/**
 * Scrolls a long title like the app's MarqueeText: rest at the start, slide left one pass onto a
 * second copy, repeat. Measured only when the title changes; still under Reduce Motion.
 */
function setTrail(refs: DemoRefs, text: string): void {
  if (refs.trail.textContent === text && refs.trailWing.dataset.marquee !== undefined) return
  refs.trail.textContent = text
  refs.trailCopy.textContent = text
  refs.trailTrack.getAnimations().forEach((animation) => animation.cancel())
  const plan = marqueePlan(refs.trail.offsetWidth, refs.trailWing.clientWidth - 10)
  refs.trailWing.dataset.marquee = String(plan !== null)
  if (plan && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    refs.trailTrack.animate(marqueeKeyframes(plan), { duration: plan.durationMs, iterations: Infinity, easing: 'linear' })
  }
}

export function render(refs: DemoRefs, state: DemoState, context: RenderContext): void {
  const { content } = state
  const lead = leadView(content)
  const agenda = agendaView(content)
  const expanded = state.expanded
  const data = refs.root.dataset

  data.mode = context.mode
  data.step = state.step ?? 'none'
  data.lead = lead.kind
  data.tone = lead.tone
  data.expanded = String(expanded)
  data.cardKind = agenda ? 'agenda' : 'meeting'
  data.cursor = state.cursor
  data.pulsing = String(lead.pulsing)
  data.joinPressed = String(state.joinPressed)

  setText(refs.leadText, lead.text)
  setTrail(refs, lead.trail)
  setAttr(refs.toggle, 'aria-label', describe(content))
  setAttr(refs.toggle, 'aria-expanded', String(expanded))
  refs.card.inert = !(expanded && !agenda)
  refs.agenda.inert = !(expanded && agenda)

  if (agenda) {
    refs.agendaRows.forEach((row, index) => { row.hidden = index < agenda.firstRow })
    refs.focusRow.hidden = agenda.focus === null
    refs.focusNow.hidden = !agenda.focusNow
    if (agenda.focus) {
      setText(refs.focusElapsed, agenda.focus.elapsed)
      setText(refs.focusTitle, agenda.focus.title)
      setText(refs.focusProgress, agenda.focus.progress)
      refs.focusRow.dataset.over = String(agenda.focus.over)
    }
  }

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
