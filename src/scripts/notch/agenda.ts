import { focusElapsed, isOverEstimate } from './format'
import { DESIGN_REVIEW, LATER_TODAY, type Meeting, type NotchContent } from './model'

/** Today's meetings in the demo, in time order. */
export const AGENDA: readonly Meeting[] = [DESIGN_REVIEW, ...LATER_TODAY]

export interface FocusRow {
  readonly elapsed: string
  readonly title: string
  readonly progress: string
  readonly over: boolean
}

/** What the expanded idle notch shows (the app's AgendaContent). */
export interface AgendaView {
  /** Index in AGENDA of the first meeting still to come. */
  readonly firstRow: number
  readonly focus: FocusRow | null
  readonly focusNow: boolean
}

/** FocusFormatter.duration: "45m", "2h", "4h 10m". */
export function duration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest}m`
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`
}

/** FocusFormatter.progress: shown minutes round up. */
export function focusProgress(seconds: number, estimateMinutes: number): string {
  return `${duration(Math.ceil(Math.max(0, seconds) / 60))} of ${duration(estimateMinutes)}`
}

export function agendaView(content: NotchContent): AgendaView | null {
  switch (content.kind) {
    case 'meeting':
      return null
    case 'idle':
      return { firstRow: Math.max(0, AGENDA.findIndex((meeting) => meeting.title === content.meeting.title)), focus: null, focusNow: true }
    case 'focus':
      return {
        firstRow: 1,
        focus: {
          elapsed: focusElapsed(content.seconds),
          title: content.title,
          progress: focusProgress(content.seconds, content.estimateMinutes),
          over: isOverEstimate(content.seconds, content.estimateMinutes),
        },
        focusNow: false,
      }
  }
}
