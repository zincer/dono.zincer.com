import { describe, expect, it } from 'vitest'
import { AGENDA, agendaView } from '../../src/scripts/notch/agenda'
import { DESIGN_REVIEW, NEXT_MEETING } from '../../src/scripts/notch/model'

describe('agendaView', () => {
  it('lists today from the idle meeting on, with nothing but meetings', () => {
    expect(agendaView({ kind: 'idle', meeting: DESIGN_REVIEW })).toEqual({ firstRow: 0 })
    expect(agendaView({ kind: 'idle', meeting: NEXT_MEETING })).toEqual({ firstRow: 1 })
  })
  it('has no agenda for a meeting countdown (the meeting card shows instead)', () => {
    expect(agendaView({ kind: 'meeting', meeting: DESIGN_REVIEW, timer: { phase: 'upcoming', seconds: 90 } })).toBeNull()
  })
  it('lists the meetings in time order', () => {
    expect(AGENDA.map((meeting) => meeting.start)).toEqual(['14:00', '16:30', '17:15'])
  })
})
