import {
  DESIGN_REVIEW,
  NEXT_MEETING,
  type Cursor,
  type DemoState,
  type NotchContent,
  type Scenario,
  type StepId,
} from './model'

export interface Step {
  readonly id: StepId
  readonly startMs: number
  readonly endMs: number
  readonly label: string
  readonly caption: string
}

export const STEPS: readonly Step[] = [
  { id: 'idle', startMs: 0, endMs: 3000, label: 'Idle', caption: 'Your next meeting, always in view.' },
  { id: 'countdown', startMs: 3000, endMs: 8000, label: 'Countdown', caption: 'A countdown, not a pop-up.' },
  { id: 'card', startMs: 8000, endMs: 14000, label: 'Card', caption: 'Everything you need, one hover away.' },
  { id: 'join', startMs: 14000, endMs: 17000, label: 'Join', caption: 'One click into Zoom, Meet or Teams.' },
]

export const LOOP_MS = 17_000
export const MAX_FRAME_MS = 100
/** AkeDesign.Motion.expandDelay / collapseDelay. */
export const OPEN_DELAY_MS = 150
export const CLOSE_DELAY_MS = 400
export const RESUME_AFTER_MS = 4000

const CURSOR_ON_NOTCH_MS = 8600
const JOIN_PRESS_MS = 13_600
const CURSOR_LEAVES_MS = 14_600
const REDUCED_MOTION_MS: Record<StepId, number> = { idle: 1500, countdown: 4000, card: 11000, join: 16000 }

export const CHIP_SCENARIOS: readonly { readonly id: Scenario; readonly label: string }[] = [
  { id: 'idle', label: 'Idle' },
  { id: 'countdown', label: 'Countdown' },
  { id: 'starting', label: 'Starting now' },
]

export const DEFAULT_START_SECONDS: Record<Scenario, number> = {
  idle: 0,
  countdown: 252,
  starting: 0,
  skipped: 0,
}

const SCENARIOS: readonly Scenario[] = ['idle', 'countdown', 'starting', 'skipped']

const wrap = (ms: number): number => ((ms % LOOP_MS) + LOOP_MS) % LOOP_MS
const progress = (t: number, step: Step): number => (t - step.startMs) / (step.endMs - step.startMs)

const upcoming = (seconds: number): NotchContent => ({
  kind: 'meeting', meeting: DESIGN_REVIEW, timer: { phase: 'upcoming', seconds },
})
const inProgress = (seconds: number): NotchContent => ({
  kind: 'meeting', meeting: DESIGN_REVIEW, timer: { phase: 'inProgress', seconds },
})

export function stepAt(ms: number): Step {
  const t = wrap(ms)
  const step = STEPS.find((candidate) => t >= candidate.startMs && t < candidate.endMs)
  if (!step) throw new Error(`No demo step covers ${t} ms`)
  return step
}

function cardCursor(t: number): Cursor {
  if (t >= JOIN_PRESS_MS) return 'join'
  if (t >= CURSOR_ON_NOTCH_MS) return 'notch'
  return 'approach'
}

export function stateAt(ms: number, reducedMotion = false): DemoState {
  const step = stepAt(ms)
  const t = reducedMotion ? REDUCED_MOTION_MS[step.id] : wrap(ms)
  const p = progress(t, step)
  const base = { step: step.id, expanded: false, cursor: 'hidden' as Cursor, joinPressed: false, timeLapse: false }

  switch (step.id) {
    case 'idle':
      return { ...base, content: { kind: 'idle', meeting: DESIGN_REVIEW } }
    case 'countdown':
      return { ...base, timeLapse: !reducedMotion, content: upcoming(Math.round(300 - p * 190)) }
    case 'card':
      return {
        ...base,
        timeLapse: !reducedMotion,
        content: upcoming(Math.ceil(110 * (1 - p))),
        expanded: reducedMotion || t >= CURSOR_ON_NOTCH_MS + OPEN_DELAY_MS,
        cursor: reducedMotion ? 'hidden' : cardCursor(t),
        joinPressed: !reducedMotion && t >= JOIN_PRESS_MS,
      }
    case 'join':
      return {
        ...base,
        content: inProgress(Math.min(4, Math.floor((t - step.startMs) / 600))),
        cursor: reducedMotion || t >= CURSOR_LEAVES_MS ? 'hidden' : 'join',
      }
  }
}

/** Moves the loop on by one frame. A long frame (sleep, hidden tab) counts as MAX_FRAME_MS. */
export function advance(elapsedMs: number, dtMs: number): number {
  const dt = Math.min(Math.max(0, dtMs), MAX_FRAME_MS)
  return wrap(elapsedMs + dt)
}

export function nextStepStart(ms: number): number {
  return stepAt(ms).endMs % LOOP_MS
}

export function takeOver(content: NotchContent): { readonly scenario: Scenario; readonly startSeconds: number } {
  switch (content.kind) {
    case 'idle':
      return { scenario: 'idle', startSeconds: 0 }
    case 'meeting':
      return content.timer.phase === 'upcoming'
        ? { scenario: 'countdown', startSeconds: content.timer.seconds }
        : { scenario: 'starting', startSeconds: content.timer.seconds }
  }
}

/** Hands-on content: real-time seconds from `startSeconds`. */
export function scenarioContent(
  scenario: Scenario,
  elapsedMs: number,
  startSeconds: number = DEFAULT_START_SECONDS[scenario],
): NotchContent {
  const s = Math.floor(Math.max(0, elapsedMs) / 1000)
  switch (scenario) {
    case 'idle':
      return { kind: 'idle', meeting: DESIGN_REVIEW }
    case 'skipped':
      return { kind: 'idle', meeting: NEXT_MEETING }
    case 'countdown': {
      const remaining = startSeconds - s
      return remaining > 0 ? upcoming(remaining) : inProgress(s - startSeconds)
    }
    case 'starting':
      return inProgress(startSeconds + s)
  }
}

export function isScenario(value: unknown): value is Scenario {
  return typeof value === 'string' && (SCENARIOS as readonly string[]).includes(value)
}
