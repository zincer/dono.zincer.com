import { DESIGN_REVIEW, LATER_TODAY, type Meeting, type NotchContent } from './model'

/** Today's meetings in the demo, in time order. */
export const AGENDA: readonly Meeting[] = [DESIGN_REVIEW, ...LATER_TODAY]

/** What the expanded idle notch shows (the app's AgendaContent in 1.0: meetings only). */
export interface AgendaView {
  /** Index in AGENDA of the first meeting still to come. */
  readonly firstRow: number
}

export function agendaView(content: NotchContent): AgendaView | null {
  switch (content.kind) {
    case 'meeting':
      return null
    case 'idle':
      return { firstRow: Math.max(0, AGENDA.findIndex((meeting) => meeting.title === content.meeting.title)) }
  }
}
