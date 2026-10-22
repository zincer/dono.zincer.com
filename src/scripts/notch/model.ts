/** A calendar meeting as the notch shows it. Times are 24-hour "HH:mm", like the app. */
export interface Meeting {
  readonly title: string
  readonly start: string
  readonly end: string
  readonly service: string
  readonly calendar: string
}

/** Seconds until the start (`upcoming`) or since it (`inProgress`), as in the app's NotchState. */
export interface MeetingTimer {
  readonly phase: 'upcoming' | 'inProgress'
  readonly seconds: number
}

export type NotchContent =
  | { readonly kind: 'idle'; readonly meeting: Meeting }
  | { readonly kind: 'meeting'; readonly meeting: Meeting; readonly timer: MeetingTimer }

export type StepId = 'idle' | 'countdown' | 'card' | 'join'
export type Cursor = 'hidden' | 'approach' | 'notch' | 'join'
/** Hands-on scenarios. `skipped` is reached only through Skip, never from a chip. */
export type Scenario = 'idle' | 'countdown' | 'starting' | 'skipped'

export interface DemoState {
  /** The loop step, or null while the visitor is in control. */
  readonly step: StepId | null
  readonly content: NotchContent
  /** The card is open. Only meaningful when `content.kind === 'meeting'`. */
  readonly expanded: boolean
  readonly cursor: Cursor
  readonly joinPressed: boolean
  /** The simulated clock runs faster than real time (shows the "time-lapse" badge). */
  readonly timeLapse: boolean
}

export const DESIGN_REVIEW: Meeting = {
  title: 'Design review',
  start: '14:00',
  end: '14:30',
  service: 'Zoom',
  calendar: 'Work',
}

export const NEXT_MEETING: Meeting = {
  title: '1:1 with Sam',
  start: '16:30',
  end: '17:00',
  service: 'Google Meet',
  calendar: 'Work',
}

export const LATER_TODAY: readonly Meeting[] = [
  NEXT_MEETING,
  { title: 'Hiring sync', start: '17:15', end: '17:45', service: 'Microsoft Teams', calendar: 'Work' },
]
