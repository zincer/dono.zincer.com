import { describe, expect, it } from 'vitest'
import { AGENDA, agendaView, duration, focusProgress } from '../../src/scripts/notch/agenda'
import { DESIGN_REVIEW, NEXT_MEETING } from '../../src/scripts/notch/model'

describe('duration', () => {
  it('formats minutes like FocusFormatter.duration', () => {
    expect(duration(45)).toBe('45m')
    expect(duration(120)).toBe('2h')
    expect(duration(250)).toBe('4h 10m')
  })
})

describe('focusProgress', () => {
  it('rounds elapsed minutes up, like the app', () => {
    expect(focusProgress(1, 30)).toBe('1m of 30m')
    expect(focusProgress(1862, 30)).toBe('32m of 30m')
  })
})

describe('agendaView', () => {
  it('lists today from the idle meeting on, with Focus now', () => {
    expect(agendaView({ kind: 'idle', meeting: DESIGN_REVIEW })).toEqual({ firstRow: 0, focus: null, focusNow: true })
    expect(agendaView({ kind: 'idle', meeting: NEXT_MEETING })).toEqual({ firstRow: 1, focus: null, focusNow: true })
  })
  it('shows the focus row after the meeting, without Focus now', () => {
    expect(agendaView({ kind: 'focus', title: 'Write the brief', seconds: 1862, estimateMinutes: 30 })).toEqual({
      firstRow: 1,
      focus: { elapsed: '31:02', title: 'Write the brief', progress: '32m of 30m', over: true },
      focusNow: false,
    })
  })
  it('has no agenda for a meeting countdown (the meeting card shows instead)', () => {
    expect(agendaView({ kind: 'meeting', meeting: DESIGN_REVIEW, timer: { phase: 'upcoming', seconds: 90 } })).toBeNull()
  })
  it('lists the meetings in time order', () => {
    expect(AGENDA.map((meeting) => meeting.start)).toEqual(['14:00', '16:30', '17:15'])
  })
})
