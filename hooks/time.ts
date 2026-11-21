// The human's local clock, as the engine's runtime knows it.

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function localTime(nowMs: number): { hour: number; text: string; weekday: string } {
  const at = new Date(nowMs)
  const hour = at.getHours()

  return {
    hour,
    text: `${String(hour).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`,
    weekday: WEEKDAYS[at.getDay()] ?? 'today',
  }
}

/** A calendar day key, for counting per day. */
export function dayKey(nowMs: number): string {
  const d = new Date(nowMs)

  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}
