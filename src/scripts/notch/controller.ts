import type { DemoState, Scenario } from './model'
import { collectRefs, render } from './render'
import {
  advance,
  CLOSE_DELAY_MS,
  DEFAULT_START_SECONDS,
  isScenario,
  MAX_FRAME_MS,
  nextStepStart,
  OPEN_DELAY_MS,
  RESUME_AFTER_MS,
  scenarioContent,
  stateAt,
  STEPS,
  takeOver,
} from './timeline'

const SCREEN_WIDTH = 720
const TOAST_MS = 1800

type LoopMode = { readonly kind: 'loop'; readonly elapsedMs: number }
type HandsMode = {
  readonly kind: 'hands'
  readonly scenario: Scenario
  readonly startSeconds: number
  readonly elapsedMs: number
  readonly expanded: boolean
  /** Where the loop was when the visitor took over, so it resumes at the next step. */
  readonly loopMs: number
  readonly chip: Scenario | null
}
type Mode = LoopMode | HandsMode

/** Starts the notch demo inside `root`. Returns a function that stops it. */
export function startDemo(root: HTMLElement): () => void {
  const refs = collectRefs(root)
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)')
  const listeners = new AbortController()
  const options = { signal: listeners.signal }

  let mode: Mode = { kind: 'loop', elapsedMs: 0 }
  let onScreen = true
  let lastFrame = performance.now()
  let frame = 0
  let openTimer = 0
  let closeTimer = 0
  let resumeTimer = 0
  let toastTimer = 0

  const state = (): DemoState =>
    mode.kind === 'loop'
      ? stateAt(mode.elapsedMs, reduced.matches)
      : {
          step: null,
          content: scenarioContent(mode.scenario, mode.elapsedMs, mode.startSeconds),
          expanded: mode.expanded,
          cursor: 'hidden',
          joinPressed: false,
          timeLapse: false,
        }

  const draw = (): void => render(refs, state(), { mode: mode.kind, chip: mode.kind === 'hands' ? mode.chip : null })

  const hands = (): HandsMode =>
    mode.kind === 'hands'
      ? mode
      : { kind: 'hands', ...takeOver(state().content), elapsedMs: 0, expanded: false, loopMs: mode.elapsedMs, chip: null }

  const takeControl = (): void => {
    window.clearTimeout(resumeTimer)
    mode = hands()
  }

  const setExpanded = (expanded: boolean): void => {
    window.clearTimeout(resumeTimer)
    mode = { ...hands(), expanded }
    draw()
  }

  const chooseScenario = (scenario: Scenario): void => {
    window.clearTimeout(resumeTimer)
    const loopMs = mode.kind === 'loop' ? mode.elapsedMs : mode.loopMs
    const chip = scenario === 'skipped' ? null : scenario
    mode = { kind: 'hands', scenario, startSeconds: DEFAULT_START_SECONDS[scenario], elapsedMs: 0, expanded: false, loopMs, chip }
    draw()
  }

  const resumeLoop = (): void => {
    if (mode.kind === 'hands') mode = { kind: 'loop', elapsedMs: nextStepStart(mode.loopMs) }
    draw()
  }

  const scheduleResume = (): void => {
    window.clearTimeout(resumeTimer)
    if (mode.kind === 'hands') resumeTimer = window.setTimeout(resumeLoop, RESUME_AFTER_MS)
  }

  const showToast = (text: string): void => {
    refs.toast.textContent = text
    refs.toast.dataset.visible = 'true'
    window.clearTimeout(toastTimer)
    toastTimer = window.setTimeout(() => { refs.toast.dataset.visible = 'false' }, TOAST_MS)
  }

  const fit = (): void => {
    refs.screen.style.setProperty('--scale', String(Math.min(1, refs.frame.clientWidth / SCREEN_WIDTH)))
  }

  const tick = (now: number): void => {
    const dt = now - lastFrame
    lastFrame = now
    if (onScreen && !document.hidden) {
      mode = mode.kind === 'loop'
        ? { ...mode, elapsedMs: advance(mode.elapsedMs, dt) }
        : { ...mode, elapsedMs: mode.elapsedMs + Math.min(Math.max(0, dt), MAX_FRAME_MS) }
      draw()
    }
    frame = requestAnimationFrame(tick)
  }

  refs.notch.addEventListener('pointerenter', () => {
    if (!canHover.matches) return
    takeControl()
    window.clearTimeout(closeTimer)
    openTimer = window.setTimeout(() => setExpanded(true), OPEN_DELAY_MS)
  }, options)

  refs.notch.addEventListener('pointerleave', () => {
    if (!canHover.matches) return
    window.clearTimeout(openTimer)
    closeTimer = window.setTimeout(() => setExpanded(false), CLOSE_DELAY_MS)
  }, options)

  refs.toggle.addEventListener('click', (event) => {
    // A mouse already opens the card on hover; only keyboard clicks (detail 0) and taps toggle.
    if (event.detail > 0 && canHover.matches) return
    setExpanded(!hands().expanded)
  }, options)

  refs.notch.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return
    setExpanded(false)
    refs.toggle.focus()
  }, options)

  refs.skip.addEventListener('click', () => chooseScenario('skipped'), options)

  refs.join.addEventListener('click', () => {
    const { content } = state()
    if (content.kind === 'meeting') showToast(`Would open ${content.meeting.service}`)
    setExpanded(false)
  }, options)

  refs.chips.forEach((chip) => chip.addEventListener('click', () => {
    const scenario = chip.dataset.scenario
    if (isScenario(scenario)) chooseScenario(scenario)
  }, options))

  refs.dots.forEach((dot) => dot.addEventListener('click', () => {
    const step = STEPS.find((candidate) => candidate.id === dot.dataset.dot)
    if (!step) return
    window.clearTimeout(resumeTimer)
    mode = { kind: 'loop', elapsedMs: step.startMs }
    draw()
  }, options))

  root.addEventListener('pointerenter', () => window.clearTimeout(resumeTimer), options)
  root.addEventListener('pointerleave', scheduleResume, options)
  root.addEventListener('focusin', () => window.clearTimeout(resumeTimer), options)
  root.addEventListener('focusout', (event) => {
    if (!(event.relatedTarget instanceof Node && root.contains(event.relatedTarget))) scheduleResume()
  }, options)

  const visibility = new IntersectionObserver(([entry]) => { onScreen = entry?.isIntersecting ?? true })
  visibility.observe(root)
  const resize = new ResizeObserver(fit)
  resize.observe(refs.frame)

  fit()
  draw()
  frame = requestAnimationFrame(tick)

  return () => {
    cancelAnimationFrame(frame)
    listeners.abort()
    visibility.disconnect()
    resize.disconnect()
    ;[openTimer, closeTimer, resumeTimer, toastTimer].forEach((timer) => window.clearTimeout(timer))
  }
}
