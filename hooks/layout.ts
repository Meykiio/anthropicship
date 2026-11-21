// Where everything stands in their room, for any width. Measured back from
// the door on the right: the door, her spot, his laptop, his desk, then the
// bed in whatever room is left. A narrow panel loses the bed and the lamp
// first; the two of them always fit.

import type { Stage } from '../types'
import { WALK_MS } from './empty'

export type Layout = {
  doorX: number
  herX: number
  laptopX: number
  hisX: number
  deskX: number
  bed: { x: number; width: number } | null
  lampX: number | null
  window: { x: number } | null
  hasPlant: boolean
}

export function layout(width: number): Layout {
  const doorX = width - 11
  const herX = doorX - 19
  const laptopX = herX - 9
  const hisX = laptopX - 16
  const deskX = hisX - 4
  const bedWidth = Math.min(22, deskX - 4)
  const bed = bedWidth >= 12 ? { x: 1, width: bedWidth } : null
  const lampX = bed !== null && deskX - (bed.x + bed.width) >= 3 ? bed.x + bed.width + 1 : null
  const window =
    bed !== null ? { x: bed.x + Math.floor(bed.width / 2) - 5 } : hisX >= 16 ? { x: hisX - 13 } : null

  return { doorX, herX, laptopX, hisX, deskX, bed, lampX, window, hasPlant: bed === null && deskX >= 5 }
}

export const ease = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t))

/** How long a small move between lines takes: longer for a longer way. */
export const driftMs = (from: number, to: number): number => Math.max(1_200, Math.abs(to - from) * 70)

/** Her x, and whether the door stands open, at this moment. */
export function herPlace(s: Stage, nowMs: number, width: number): { x: number | null; isDoorOpen: boolean; isWalking: boolean } {
  const { herX, doorX } = layout(width)
  const t = (nowMs - s.moveAt) / WALK_MS

  if (s.move === 'away') return { x: null, isDoorOpen: false, isWalking: false }
  if (s.move === 'here') {
    const span = driftMs(s.driftFrom, s.drift)
    const d = ease((nowMs - s.driftAt) / span)

    return { x: Math.round(herX + s.driftFrom + (s.drift - s.driftFrom) * d), isDoorOpen: false, isWalking: nowMs - s.driftAt < span }
  }
  if (s.move === 'entering') {
    return { x: Math.round(doorX - 2 + (herX - doorX + 2) * ease(t)), isDoorOpen: t < 0.55, isWalking: t < 1 }
  }

  return { x: Math.round(herX + (doorX - 2 - herX) * ease(t)), isDoorOpen: t > 0.45, isWalking: t < 1 }
}

/** His x, and whether he is walking, at this moment. */
export function hisPlace(s: Stage, nowMs: number, width: number): { x: number; isWalking: boolean; isAtDesk: boolean } {
  const { hisX, doorX } = layout(width)
  const doorSide = doorX - 17
  const t = ease((nowMs - s.hisMoveAt) / WALK_MS)
  const walking = nowMs - s.hisMoveAt < WALK_MS

  if (s.his === 'desk') return { x: hisX, isWalking: false, isAtDesk: true }
  if (s.his === 'door') return { x: doorSide, isWalking: false, isAtDesk: false }
  if (s.his === 'to-door') return { x: Math.round(hisX + (doorSide - hisX) * t), isWalking: walking, isAtDesk: false }

  return { x: Math.round(doorSide + (hisX - doorSide) * t), isWalking: walking, isAtDesk: !walking }
}
