// The light in the room: the wall and floor follow the human's clock (bright
// by day, dusky at evening, dark at night with his lamp on) and the mood of
// the scene (warm for tender moments, a cold red for fights). A power cut
// drops everything to the laptop's glow.

export type Tone = 'calm' | 'warm' | 'tense'

type Light = { wall: string; trim: string; floor: string; isLampOn: boolean; isDark: boolean }

const BY_HOUR: readonly [number, Light][] = [
  [7, { wall: '#272432', trim: '#302c3b', floor: '#3a3443', isLampOn: false, isDark: false }],
  [17, { wall: '#2a2230', trim: '#33293a', floor: '#3b3140', isLampOn: false, isDark: false }],
  [20, { wall: '#1c1a26', trim: '#25222f', floor: '#2e2a37', isLampOn: true, isDark: false }],
]
const NIGHT: Light = { wall: '#15131d', trim: '#1d1a26', floor: '#25212d', isLampOn: true, isDark: false }

/** The light at this hour. */
function byHour(hour: number): Light {
  if (hour < 6 || hour >= 22) return NIGHT
  let light = BY_HOUR[0]![1]

  for (const [from, l] of BY_HOUR) if (hour >= from) light = l

  return hour < 7 ? { ...light, isLampOn: true } : light
}

const TINT: Readonly<Record<Tone, string | null>> = { calm: null, warm: '#3a1f2c', tense: '#3a1418' }

/** Mixes two hex colors: `amount` of `b` into `a`. */
export function mix(a: string, b: string, amount: number): string {
  const pa = Number.parseInt(a.slice(1), 16)
  const pb = Number.parseInt(b.slice(1), 16)
  const ch = (shift: number): number => {
    const x = (pa >> shift) & 255
    const y = (pb >> shift) & 255

    return Math.round(x + (y - x) * amount)
  }

  return `#${[16, 8, 0].map(s => ch(s).toString(16).padStart(2, '0')).join('')}`
}

/** The room's light now. */
export function lightAt(hour: number, tone: Tone, isBlackout: boolean): Light {
  const base = byHour(hour)
  const tint = TINT[tone]
  const tinted = tint === null ? base : { ...base, wall: mix(base.wall, tint, 0.55), trim: mix(base.trim, tint, 0.4) }

  if (!isBlackout) return tinted

  return { wall: '#08070b', trim: '#0c0b10', floor: '#100e14', isLampOn: false, isDark: true }
}

/** The warm pool of light his lamp throws on the wall around it. */
export function lampGlow(wall: string, dx: number, dy: number): string {
  const d = Math.sqrt(dx * dx + dy * dy * 2.2)

  return d > 9 ? wall : mix(wall, '#6b4a2f', 0.42 * (1 - d / 9))
}
