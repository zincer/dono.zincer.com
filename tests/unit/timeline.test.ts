import { describe, expect, it } from 'vitest'
import {
  advance,
  CHIP_SCENARIOS,
  isScenario,
  LOOP_MS,
  nextStepStart,
  scenarioContent,
  stateAt,
  stepAt,
  STEPS,
  takeOver,
} from '../../src/scripts/notch/timeline'
import { DESIGN_REVIEW, type DemoState, type NotchContent } from '../../src/scripts/notch/model'

const seconds = (state: DemoState): number => {
  const { content } = state
  if (content.kind === 'meeting') return content.timer.seconds
  throw new Error(`no seconds on ${content.kind}`)
}
const phase = (state: DemoState): string => (state.content.kind === 'meeting' ? state.content.timer.phase : 'none')

describe('STEPS', () => {
  it('covers the loop without gaps', () => {
    expect(STEPS[0]?.startMs).toBe(0)
    STEPS.forEach((step, index) => {
      const next = STEPS[index + 1]
      if (next) expect(next.startMs).toBe(step.endMs)
    })
    expect(STEPS.at(-1)?.endMs).toBe(LOOP_MS)
  })
})

describe('the 1.0 demo', () => {
  it('has four steps and no focus step', () => {
    expect(STEPS.map((step) => step.id)).toEqual(['idle', 'countdown', 'card', 'join'])
    expect(LOOP_MS).toBe(17_000)
  })
  it('offers no focus chip', () => {
    expect(CHIP_SCENARIOS.map((scenario) => scenario.id)).toEqual(['idle', 'countdown', 'starting'])
    expect(isScenario('focus')).toBe(false)
  })
  it('wraps from the last step straight back to idle', () => {
    expect(stepAt(16_999).id).toBe('join')
    expect(stepAt(17_000).id).toBe('idle')
    expect(stepAt(-1).id).toBe('join')
    expect(nextStepStart(15_000)).toBe(0)
  })
})

describe('stepAt', () => {
  it('finds the step at each boundary', () => {
    expect(stepAt(0).id).toBe('idle')
    expect(stepAt(2999).id).toBe('idle')
    expect(stepAt(3000).id).toBe('countdown')
    expect(stepAt(8000).id).toBe('card')
    expect(stepAt(14000).id).toBe('join')
    expect(stepAt(16999).id).toBe('join')
  })
  it('wraps outside the loop', () => {
    expect(stepAt(17000).id).toBe('idle')
    expect(stepAt(-1).id).toBe('join')
  })
})

describe('stateAt', () => {
  it('starts idle on Design review', () => {
    const state = stateAt(0)
    expect(state.content).toEqual({ kind: 'idle', meeting: DESIGN_REVIEW })
    expect(state.cursor).toBe('hidden')
    expect(state.timeLapse).toBe(false)
  })
  it('counts down from five minutes and turns red under three', () => {
    expect(seconds(stateAt(3000))).toBe(300)
    expect(stateAt(3000).timeLapse).toBe(true)
    expect(seconds(stateAt(5000))).toBe(224)
    expect(seconds(stateAt(7000))).toBe(148)
  })
  it('opens the card after the cursor reaches the notch', () => {
    expect(stateAt(8000)).toMatchObject({ step: 'card', cursor: 'approach', expanded: false })
    expect(seconds(stateAt(8000))).toBe(110)
    expect(stateAt(8600)).toMatchObject({ cursor: 'notch', expanded: false })
    expect(stateAt(8750)).toMatchObject({ cursor: 'notch', expanded: true })
    expect(stateAt(13600)).toMatchObject({ cursor: 'join', joinPressed: true, expanded: true })
    expect(seconds(stateAt(13999))).toBe(1)
    expect(phase(stateAt(13999))).toBe('upcoming')
  })
  it('flips to in progress after Join and counts up to +00:04', () => {
    expect(stateAt(14000)).toMatchObject({ step: 'join', expanded: false, cursor: 'join', joinPressed: false })
    expect(phase(stateAt(14000))).toBe('inProgress')
    expect(seconds(stateAt(14000))).toBe(0)
    expect(stateAt(14600).cursor).toBe('hidden')
    expect(seconds(stateAt(14600))).toBe(1)
    expect(seconds(stateAt(16999))).toBe(4)
  })
  it('wraps negative and overlong times', () => {
    expect(stateAt(17000).step).toBe('idle')
    expect(stateAt(-1000).step).toBe('join')
  })
  it('freezes each step and hides the cursor with Reduce Motion', () => {
    for (const step of STEPS) {
      const state = stateAt(step.startMs, true)
      expect(state).toMatchObject({ step: step.id, cursor: 'hidden', joinPressed: false, timeLapse: false })
    }
    expect(seconds(stateAt(3000, true))).toBe(262)
    expect(seconds(stateAt(7999, true))).toBe(262)
    expect(stateAt(8000, true).expanded).toBe(true)
    expect(seconds(stateAt(8000, true))).toBe(55)
  })
})

describe('advance', () => {
  it('adds the frame time and wraps', () => {
    expect(advance(0, 16)).toBe(16)
    expect(advance(16990, 16)).toBe(6)
  })
  it('clamps a long frame so a background tab cannot skip steps', () => {
    expect(advance(1000, 60_000)).toBe(1100)
  })
  it('ignores negative frame times', () => {
    expect(advance(1000, -5)).toBe(1000)
  })
})

describe('nextStepStart', () => {
  it('returns the start of the following step, wrapping to zero', () => {
    expect(nextStepStart(0)).toBe(3000)
    expect(nextStepStart(9000)).toBe(14000)
    expect(nextStepStart(15000)).toBe(0)
  })
})

describe('takeOver', () => {
  const meeting = (timerPhase: 'upcoming' | 'inProgress', value: number): NotchContent => ({
    kind: 'meeting', meeting: DESIGN_REVIEW, timer: { phase: timerPhase, seconds: value },
  })
  it('keeps the current numbers when the visitor takes control', () => {
    expect(takeOver({ kind: 'idle', meeting: DESIGN_REVIEW })).toEqual({ scenario: 'idle', startSeconds: 0 })
    expect(takeOver(meeting('upcoming', 95))).toEqual({ scenario: 'countdown', startSeconds: 95 })
    expect(takeOver(meeting('inProgress', 3))).toEqual({ scenario: 'starting', startSeconds: 3 })
  })
})

describe('scenarioContent', () => {
  it('counts down in real time and flips at zero', () => {
    expect(scenarioContent('countdown', 0)).toMatchObject({ timer: { phase: 'upcoming', seconds: 252 } })
    expect(scenarioContent('countdown', 251_999)).toMatchObject({ timer: { phase: 'upcoming', seconds: 1 } })
    expect(scenarioContent('countdown', 252_000)).toMatchObject({ timer: { phase: 'inProgress', seconds: 0 } })
    expect(scenarioContent('countdown', 260_000)).toMatchObject({ timer: { phase: 'inProgress', seconds: 8 } })
  })
  it('counts up for a meeting that has started', () => {
    expect(scenarioContent('starting', 5_000)).toMatchObject({ timer: { phase: 'inProgress', seconds: 5 } })
  })
  it('shows the next meeting after Skip', () => {
    expect(scenarioContent('skipped', 0)).toMatchObject({ kind: 'idle', meeting: { title: '1:1 with Sam' } })
    expect(scenarioContent('idle', 0)).toMatchObject({ kind: 'idle', meeting: { title: 'Design review' } })
  })
})

describe('isScenario', () => {
  it('accepts only known scenarios', () => {
    expect(isScenario('countdown')).toBe(true)
    expect(isScenario('nope')).toBe(false)
    expect(isScenario(undefined)).toBe(false)
  })
})
