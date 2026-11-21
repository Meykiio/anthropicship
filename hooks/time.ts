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

const partOfDay = (hour: number): string =>
  hour >= 5 && hour < 12 ? 'morning' : hour < 17 && hour >= 12 ? 'afternoon' : hour >= 17 && hour < 22 ? 'evening' : 'night'

/** How long ago something was, in words that cannot be misread: "4 minutes ago", "yesterday at 23:10". */
export function ago(thenMs: number, nowMs: number): string {
  const minutes = Math.round((nowMs - thenMs) / 60_000)
  const then = localTime(thenMs)

  if (minutes < 2) return 'a moment ago'
  if (minutes < 60) return `${minutes} minutes ago, today`
  if (dayKey(thenMs) === dayKey(nowMs)) return `${Math.round(minutes / 60)} hours ago, earlier today at ${then.text}`
  if (dayKey(thenMs + 86_400_000) === dayKey(nowMs)) return `yesterday at ${then.text}`

  return `${Math.round(minutes / 1_440)} days ago, on a ${then.weekday}`
}

/** The real time, for the writer: the clock, the day, and when they last talked. */
export function timeContext(nowMs: number, lastTalkMs: number): string {
  const t = localTime(nowMs)
  const last = lastTalkMs <= 0 ? 'They have never talked before.' : `They last talked ${ago(lastTalkMs, nowMs)}.`

  return (
    `TIME (real, the human's clock): it is ${t.text} on ${t.weekday} ${partOfDay(t.hour)}. ${last} ` +
    'Never say yesterday, last night, this morning or any other time unless it matches this exactly.'
  )
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "Sat Nov 21": a short local date. */
export function shortDate(ms: number): string {
  const d = new Date(ms)

  return `${WEEKDAYS[d.getDay()]?.slice(0, 3) ?? ''} ${MONTHS[d.getMonth()] ?? ''} ${d.getDate()}`
}

/** "13:44". */
export function shortTime(ms: number): string {
  return localTime(ms).text
}

/** A calendar day key, for counting per day. */
export function dayKey(nowMs: number): string {
  const d = new Date(nowMs)

  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}
