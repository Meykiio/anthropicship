// The room, drawn pixel by pixel: a window on the real sky, a plant, his
// desk and laptop, and the door she comes through. Pure: every frame is a
// function of the clock and the stage, so a reload or a slow surface never
// leaves it in a strange state.

import type { Speaker, Stage } from '../types'
import { bubble, typingDots } from './bubbles'
import type { Overlay } from './bubbles'
import { WALK_MS } from './empty'
import type { Mark } from './paint'
import { her, him } from './sprites'
import { ROOM as C } from './colors'
import { addMark, drawLaptop, drawLife, drawMug, drawPlant, drawWindow, stamp, stretching, typing, walking } from './room-parts'
import type { Gaze } from './sprites'

/** Wall above the scene and floor below it, in pixels: room to breathe on screen. */
const CEILING = 10
const FLOOR_BELOW = 4
export const ROOM_HEIGHT = 14 + CEILING + FLOOR_BELOW // pixels: 12 terminal rows
/** The cell row the signs over their heads sit in: just above them. */
const MARK_ROW = CEILING / 2 - 1
/** How long a small move between lines takes. */
export const DRIFT_MS = 1_200
export const ROOM_MIN = 56
export const ROOM_MAX = 84

export type Grid = (string | null)[][]

/** Where things stand, measured back from the door on the right. */
export function layout(width: number): { hisX: number; laptopX: number; herX: number; doorX: number; hasWindow: boolean; hasPlant: boolean } {
  const doorX = width - 11
  const herX = doorX - 19
  const laptopX = herX - 9
  const hisX = laptopX - 16

  return { hisX, laptopX, herX, doorX, hasWindow: hisX >= 16, hasPlant: hisX >= 5 }
}

function sky(hour: number): { glass: string; light: string | null; isNight: boolean } {
  if (hour >= 7 && hour < 17) return { glass: '#5a8fc4', light: '#f2c14e', isNight: false }
  if (hour === 6 || hour === 17 || hour === 18) return { glass: '#c9785a', light: '#f2a65a', isNight: false }

  return { glass: '#141d33', light: '#efe6c8', isNight: true }
}

const ease = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t))

/** Her x, and whether the door stands open, at this moment. */
export function herPlace(s: Stage, nowMs: number, width: number): { x: number | null; isDoorOpen: boolean; isWalking: boolean } {
  const { herX, doorX } = layout(width)
  const t = (nowMs - s.moveAt) / WALK_MS

  if (s.move === 'away') return { x: null, isDoorOpen: false, isWalking: false }
  if (s.move === 'here') {
    const d = ease((nowMs - s.driftAt) / DRIFT_MS)

    return { x: Math.round(herX + s.driftFrom + (s.drift - s.driftFrom) * d), isDoorOpen: false, isWalking: nowMs - s.driftAt < DRIFT_MS }
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

export type RoomView = {
  stage: Stage
  nowMs: number
  frame: number
  width: number
  hour: number
  isWorking: boolean
  life: { chapter: string; isApart: boolean; kids: number }
  /** What each says now, who spoke last, and who is typing. */
  speech: { his: string | null; hers: string | null; last: Speaker | null; typing: Speaker | null }
}

/** The room at one moment: a grid of colors (null is wall), the signs over heads, and the speech bubbles. */
export function drawRoom(v: RoomView): { grid: Grid; marks: Mark[]; overlays: Overlay[] } {
  const w = v.width
  const grid: Grid = Array.from({ length: ROOM_HEIGHT }, () => Array.from({ length: w }, () => null))
  // Everything below is drawn in scene coordinates (0 to 13) and shifted down under the ceiling.
  const put = (x: number, sceneY: number, c: string | null): void => {
    const y = sceneY + CEILING

    if (c !== null && y >= 0 && y < ROOM_HEIGHT && x >= 0 && x < w) grid[y]![x] = c
  }
  const rect = (x: number, y: number, rw: number, rh: number, c: string): void => {
    for (let yy = y; yy < y + rh; yy += 1) for (let xx = x; xx < x + rw; xx += 1) put(xx, yy, c)
  }
  const { hisX, laptopX, doorX, hasWindow, hasPlant } = layout(w)
  const s = v.stage
  const marks: Mark[] = []

  // Walls, baseboard, floor.
  rect(0, 12, w, 1, C.trim)
  rect(0, 13, w, 1 + FLOOR_BELOW, C.floor)

  // The window shows the human's real sky.
  const out = sky(v.hour)

  if (hasWindow) drawWindow(rect, put, out, hisX - 13)

  if (hasPlant) drawPlant(rect, put)
  drawLife(put, rect, v.life, { doorX, hisX, frame: v.frame })

  // The door. Open while she passes through it.
  const place = herPlace(s, v.nowMs, w)

  const isRinging = s.bellAt > 0 && v.nowMs - s.bellAt < 1_600
  const rattle = isRinging && !place.isDoorOpen ? (v.frame % 2 === 0 ? -1 : 0) : 0

  rect(doorX - 1, 1, 10, 11, C.frame)
  if (place.isDoorOpen) {
    rect(doorX, 2, 8, 10, C.opening)
    rect(doorX + 7, 2, 1, 10, C.doorDark)
  } else {
    rect(doorX + rattle, 2, 8, 10, C.door)
    rect(doorX + 1 + rattle, 3, 6, 3, C.doorDark)
    rect(doorX + 1 + rattle, 7, 6, 4, C.doorDark)
    put(doorX + 1 + rattle, 7, C.knob)
  }
  if (isRinging) marks.push({ column: doorX + 3 + (v.frame % 2), char: String.fromCodePoint(0x266a), color: '#f2c14e' })

  // Him, behind his desk. He jumps when startled or smitten.
  const sinceMood = v.nowMs - s.moodAt
  const isBlink = v.frame % 9 === 0
  const isHeadOverHeels = s.hisMood === 'heart'
  const jump = (s.hisMood === 'alarm' && sinceMood < 900) || (isHeadOverHeels && v.frame % 2 === 0) ? -1 : 0
  const he = hisPlace(s, v.nowMs, w)
  const isTyping = v.isWorking && !isHeadOverHeels && he.isAtDesk
  const acting = v.nowMs - s.actAt < 1_800 ? s.act : 'none'
  const isTypingNow = isTyping && acting === 'none'
  const looksAtHer = acting === 'look' && place.x !== null
  const hisGaze: Gaze =
    s.his === 'to-desk' && he.isWalking ? 'left' : looksAtHer ? 'right' : acting === 'look' ? 'left' : isBlink ? 'squint' : isTypingNow ? 'squint' : 'right'
  let body = [...him(hisGaze)]

  if (acting === 'stretch' && he.isAtDesk) body = stretching(body)

  if (isTypingNow) body = typing(body, v.frame)
  if (he.isWalking) body = walking(body, v.frame, 'H')
  // At the desk he sits behind it; away from it he is drawn after it, in front.
  if (he.isAtDesk) stamp(put, body, hisX, 1 + jump)
  addMark(marks, s.hisMood, he.x + 3, sinceMood)

  // The desk hides his legs; on it, his laptop and his coffee.
  rect(hisX - 4, 9, 28, 1, C.deskTop)
  rect(hisX - 3, 10, 26, 2, C.desk)
  rect(hisX - 3, 12, 1, 1, C.deskLeg)
  rect(hisX + 22, 12, 1, 1, C.deskLeg)
  drawLaptop(put, rect, laptopX, isTypingNow, v.frame)
  drawMug(put, hisX - 3, v.frame)
  if (!he.isAtDesk) stamp(put, body, he.x, 1 + (he.isWalking && v.frame % 2 === 1 ? 1 : 0))

  // Her, walking or standing by the desk.
  if (place.x !== null) {
    const isMad = s.herMood === 'mad' && sinceMood < 1_600
    const shake = isMad ? (v.frame % 2 === 0 ? -1 : 1) : 0
    const gaze: Gaze = s.move === 'leaving' ? 'right' : isBlink && !place.isWalking ? 'squint' : 'left'
    let map = [...her(gaze)]

    if (place.isWalking) map = walking(map, v.frame, 'R')
    const bob = place.isWalking && v.frame % 2 === 1 ? 1 : 0

    stamp(put, map, place.x + shake, 1 + bob - (s.herMood === 'heart' && v.frame % 2 === 0 ? 1 : 0))
    addMark(marks, s.herMood, place.x + 3, sinceMood)
    // Her ring, from the proposal on.
    if (!v.life.isApart && ['engaged', 'married', 'parents'].includes(v.life.chapter)) put(place.x + shake + 1, 8 + bob, '#ffe08a')
  }

  const overlays = speechOf(v, he.x + 8, place.x === null ? null : place.x + 8)

  return { grid, marks: marks.map(mark => ({ ...mark, row: MARK_ROW })), overlays }
}


/** Their bubbles: his over him, hers over her, splitting the width between them when both talk. */
function speechOf(v: RoomView, hisCenter: number, herCenter: number | null): Overlay[] {
  const sp = v.speech
  const hisText = sp.typing === 'claude' ? typingDots(v.frame) : sp.his
  const herText = herCenter === null ? null : sp.typing === 'ruby' ? typingDots(v.frame) : sp.hers
  const mid = herCenter === null ? v.width : Math.floor((hisCenter + herCenter) / 2) + 1
  const tailRow = MARK_ROW
  const out: Overlay[] = []

  if (hisText !== null) {
    const isFaded = sp.typing !== 'claude' && sp.last !== 'claude'

    out.push(...bubble(hisText, { centerX: hisCenter, minX: 0, maxX: herText === null ? v.width : mid - 1, tailRow, isFaded }).overlays)
  }
  if (herText !== null && herCenter !== null) {
    const isFaded = sp.typing !== 'ruby' && sp.last !== 'ruby'

    out.push(...bubble(herText, { centerX: herCenter, minX: hisText === null ? 0 : mid + 1, maxX: v.width, tailRow, isFaded }).overlays)
  }

  return out
}
