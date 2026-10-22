import type { MeetingTimer, NotchContent } from './model'

/** NotchTimeFormatter.imminentSeconds: red with this many seconds or fewer left. */
export const IMMINENT_SECONDS = 180
/** RingProgress.pulseThresholdSeconds. */
export const PULSE_SECONDS = 60
/** Demo values for the app's lead and auto-hide settings. */
export const RING_LEAD_SECONDS = 600
export const RING_AUTO_HIDE_SECONDS = 600

export type TimerTone = 'upcoming' | 'imminent' | 'started'
export type LeadTone = 'none' | TimerTone

export interface LeadView {
  readonly kind: 'dot' | 'timer'
  readonly tone: LeadTone
  readonly text: string
  readonly trail: string
  readonly pulsing: boolean
}

const pad = (value: number): string => String(value).padStart(2, '0')
const clamp01 = (value: number): number => Math.min(1, Math.max(0, value))
const plural = (count: number, word: string): string => `${count} ${word}${count === 1 ? '' : 's'}`

function clock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`
}

export function timerText(timer: MeetingTimer): string {
  return (timer.phase === 'upcoming' ? '-' : '+') + clock(timer.seconds)
}

export function timerTone(timer: MeetingTimer): TimerTone {
  if (timer.phase === 'inProgress') return 'started'
  return timer.seconds <= IMMINENT_SECONDS ? 'imminent' : 'upcoming'
}

export function isPulsing(timer: MeetingTimer): boolean {
  return timer.phase === 'upcoming' && timer.seconds <= PULSE_SECONDS
}

export function ringFraction(timer: MeetingTimer): number {
  const span = timer.phase === 'upcoming' ? RING_LEAD_SECONDS : RING_AUTO_HIDE_SECONDS
  return clamp01(1 - timer.seconds / span)
}

/** The notch's accessibility label, phrased like the app's. */
export function describe(content: NotchContent): string {
  switch (content.kind) {
    case 'idle':
      return `Next: ${content.meeting.title} at ${content.meeting.start}`
    case 'meeting': {
      const { title } = content.meeting
      const { phase, seconds } = content.timer
      if (phase === 'upcoming') return `${title}, starts in ${plural(Math.ceil(seconds / 60), 'minute')}`
      const minutes = Math.floor(seconds / 60)
      return minutes === 0 ? `${title}, started just now` : `${title}, started ${plural(minutes, 'minute')} ago`
    }
  }
}

/** What the left wing and the title wing show. */
export function leadView(content: NotchContent): LeadView {
  switch (content.kind) {
    case 'idle':
      return { kind: 'dot', tone: 'none', text: content.meeting.start, trail: content.meeting.title, pulsing: false }
    case 'meeting':
      return {
        kind: 'timer',
        tone: timerTone(content.timer),
        text: timerText(content.timer),
        trail: content.meeting.title,
        pulsing: isPulsing(content.timer),
      }
  }
}
