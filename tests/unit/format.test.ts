import { describe as group, expect, it } from 'vitest'
import {
  describe,
  isPulsing,
  leadView,
  ringFraction,
  timerText,
  timerTone,
} from '../../src/scripts/notch/format'
import { DESIGN_REVIEW, type NotchContent } from '../../src/scripts/notch/model'

const upcoming = (seconds: number) => ({ phase: 'upcoming', seconds }) as const
const inProgress = (seconds: number) => ({ phase: 'inProgress', seconds }) as const
const meeting = (timer: ReturnType<typeof upcoming> | ReturnType<typeof inProgress>): NotchContent => ({
  kind: 'meeting',
  meeting: DESIGN_REVIEW,
  timer,
})

group('timerText', () => {
  it('uses -MM:SS before the start and +MM:SS after it', () => {
    expect(timerText(upcoming(300))).toBe('-05:00')
    expect(timerText(upcoming(181))).toBe('-03:01')
    expect(timerText(inProgress(4))).toBe('+00:04')
  })
  it('clamps negatives to zero and lets minutes pass 99', () => {
    expect(timerText(upcoming(-3))).toBe('-00:00')
    expect(timerText(upcoming(6000))).toBe('-100:00')
  })
})

group('timerTone', () => {
  it('turns imminent at 180 seconds or fewer', () => {
    expect(timerTone(upcoming(181))).toBe('upcoming')
    expect(timerTone(upcoming(180))).toBe('imminent')
    expect(timerTone(upcoming(0))).toBe('imminent')
  })
  it('is started once the meeting is in progress', () => {
    expect(timerTone(inProgress(0))).toBe('started')
  })
})

group('isPulsing', () => {
  it('pulses in the last minute before the start only', () => {
    expect(isPulsing(upcoming(61))).toBe(false)
    expect(isPulsing(upcoming(60))).toBe(true)
    expect(isPulsing(inProgress(10))).toBe(false)
  })
})

group('ringFraction', () => {
  it('fills over the 10-minute lead time', () => {
    expect(ringFraction(upcoming(600))).toBe(0)
    expect(ringFraction(upcoming(300))).toBe(0.5)
    expect(ringFraction(upcoming(0))).toBe(1)
    expect(ringFraction(upcoming(900))).toBe(0)
  })
  it('empties over the 10-minute auto-hide time', () => {
    expect(ringFraction(inProgress(0))).toBe(1)
    expect(ringFraction(inProgress(300))).toBe(0.5)
    expect(ringFraction(inProgress(900))).toBe(0)
  })
})

group('describe', () => {
  it('reads the idle notch', () => {
    expect(describe({ kind: 'idle', meeting: DESIGN_REVIEW })).toBe('Next: Design review at 14:00')
  })
  it('rounds minutes up before the start', () => {
    expect(describe(meeting(upcoming(61)))).toBe('Design review, starts in 2 minutes')
    expect(describe(meeting(upcoming(60)))).toBe('Design review, starts in 1 minute')
  })
  it('says "just now" in the first minute after the start', () => {
    expect(describe(meeting(inProgress(59)))).toBe('Design review, started just now')
    expect(describe(meeting(inProgress(60)))).toBe('Design review, started 1 minute ago')
    expect(describe(meeting(inProgress(125)))).toBe('Design review, started 2 minutes ago')
  })
})

group('leadView', () => {
  it('shows the dot and start time when idle', () => {
    expect(leadView({ kind: 'idle', meeting: DESIGN_REVIEW })).toEqual({
      kind: 'dot', tone: 'none', text: '14:00', trail: 'Design review', pulsing: false,
    })
  })
  it('shows the coloured timer for a meeting', () => {
    expect(leadView(meeting(upcoming(45)))).toEqual({
      kind: 'timer', tone: 'imminent', text: '-00:45', trail: 'Design review', pulsing: true,
    })
  })
})
