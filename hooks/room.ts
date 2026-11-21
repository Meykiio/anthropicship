// Their room, drawn pixel by pixel: his bed, the window on the real sky, the
// lamp, the shelf, his desk and laptop, the door she comes through, and her
// things as she brings them. Pure: every frame is a function of the clock and
// the stage, so a reload or a slow surface never leaves it in a strange state.

import type { Speaker, Stage } from '../types'
import { bubble, typingDots } from './bubbles'
import type { Overlay } from './bubbles'
import { drawBed, drawDesk, drawDoor, drawLamp, drawShelf, drawWindow, sky } from './furniture'
import { herPlace, hisPlace, layout } from './layout'
import { lampGlow, lightAt } from './lighting'
import type { Mark } from './paint'
import { addMark, drawLaptop, drawMug, drawPlant, stamp, stretching, typing, walking } from './room-parts'
import { her, him } from './sprites'
import type { Gaze } from './sprites'
import { drawThings } from './things'
import type { Life } from './things'

/** Wall above the scene (room for the bubbles) and floor below it, in pixels. */
const CEILING = 10
const FLOOR_BELOW = 4
export const ROOM_HEIGHT = 14 + CEILING + FLOOR_BELOW // pixels: 14 terminal rows
/** The cell row the signs over their heads sit in: just above them. */
const MARK_ROW = CEILING / 2 - 1
export const ROOM_MIN = 56
export const ROOM_MAX = 96

export type Grid = (string | null)[][]

export type RoomView = {
  stage: Stage
  nowMs: number
  frame: number
  width: number
  hour: number
  isWorking: boolean
  life: Life
  /** What she has brought into the room. */
  things: readonly string[]
  /** What each says now, who spoke last, who is typing, and whether a line is said to the viewer. */
  speech: { his: string | null; hers: string | null; last: Speaker | null; typing: Speaker | null; aside: Speaker | null }
}

/** The room at one moment: a grid of colors, the signs over heads, and the speech bubbles. */
export function drawRoom(v: RoomView): { grid: Grid; marks: Mark[]; overlays: Overlay[] } {
  const w = v.width
  const s = v.stage
  const isBlackout = s.event === 'blackout' && v.nowMs - s.eventAt < 25_000
  const light = lightAt(v.hour, s.tone, isBlackout)
  const at = layout(w)
  const grid: Grid = Array.from({ length: ROOM_HEIGHT }, () => Array.from({ length: w }, () => light.wall))
  // Everything is drawn in scene coordinates (0 to 13) and shifted down under the ceiling.
  const put = (x: number, sceneY: number, c: string | null): void => {
    const y = sceneY + CEILING

    if (c !== null && y >= 0 && y < ROOM_HEIGHT && x >= 0 && x < w) grid[y]![x] = c
  }
  const rect = (x: number, y: number, rw: number, rh: number, c: string): void => {
    for (let yy = y; yy < y + rh; yy += 1) for (let xx = x; xx < x + rw; xx += 1) put(xx, yy, c)
  }
  const marks: Mark[] = []
  const isLampOn = light.isLampOn && at.lampX !== null

  // The light first: the lamp's warm pool on the wall, then baseboard and floor.
  if (isLampOn && at.lampX !== null) {
    for (let y = -CEILING; y < 12; y += 1) for (let x = 0; x < w; x += 1) put(x, y, lampGlow(light.wall, x - at.lampX, y - 3))
  }
  rect(0, 12, w, 1, light.trim)
  rect(0, 13, w, 1 + FLOOR_BELOW, light.floor)

  // Furniture, then her things.
  const event = v.nowMs - s.eventAt < 20 * 60_000 ? s.event : 'none'
  const out = sky(v.hour)

  if (at.window !== null) drawWindow(rect, put, at.window.x, out, event, v.frame)
  if (at.bed !== null) drawBed(rect, put, at.bed.x, at.bed.width, v.things.includes('blanket'))
  if (at.lampX !== null) drawLamp(rect, put, at.lampX, isLampOn)
  if (at.hasPlant) drawPlant(rect, put)
  drawShelf(rect, put, at.hisX + 1)
  const place = herPlace(s, v.nowMs, w)
  const isRinging = s.bellAt > 0 && v.nowMs - s.bellAt < 1_600

  drawDoor(rect, put, at.doorX, place.isDoorOpen, isRinging && !place.isDoorOpen ? (v.frame % 2 === 0 ? -1 : 0) : 0)
  if (isRinging) marks.push({ column: at.doorX + 3 + (v.frame % 2), char: String.fromCodePoint(0x266a), color: '#f2c14e' })
  drawThings(put, rect, at, new Set(v.things), v.life, v.frame, light.isLampOn)

  // Him, behind his desk. He jumps when startled or smitten.
  const sinceMood = v.nowMs - s.moodAt
  const isBlink = v.frame % 9 === 0
  const isSmitten = s.hisMood === 'heart'
  const he = hisPlace(s, v.nowMs, w)
  const acting = v.nowMs - s.actAt < 1_800 ? s.act : 'none'
  const isTyping = v.isWorking && !isSmitten && he.isAtDesk && acting === 'none'
  const jump = (s.hisMood === 'alarm' && sinceMood < 900) || (isSmitten && v.frame % 2 === 0) ? -1 : 0
  const hisGaze: Gaze =
    s.his === 'to-desk' && he.isWalking
      ? 'left'
      : acting === 'look'
        ? place.x !== null ? 'right' : 'left'
        : isBlink || isTyping ? 'squint' : 'right'
  let body = [...him(hisGaze)]

  if (acting === 'stretch' && he.isAtDesk) body = stretching(body)
  if (isTyping) body = typing(body, v.frame)
  if (he.isWalking) body = walking(body, v.frame, 'd')
  if (he.isAtDesk) stamp(put, body, at.hisX, 1 + jump)
  addMark(marks, s.hisMood, he.x + 3, sinceMood)

  // The desk hides his legs; on it, his laptop and his coffee. Away from it, he is drawn in front.
  drawDesk(rect, at)
  drawLaptop(put, rect, at.laptopX, isTyping, v.frame)
  drawMug(put, at.deskX + 1, v.frame)
  if (!he.isAtDesk) stamp(put, body, he.x, 1 + (he.isWalking && v.frame % 2 === 1 ? 1 : 0))

  // Her, walking or standing by the desk.
  if (place.x !== null) {
    const shake = s.herMood === 'mad' && sinceMood < 1_600 ? (v.frame % 2 === 0 ? -1 : 1) : 0
    const gaze: Gaze = s.move === 'leaving' ? 'right' : isBlink && !place.isWalking ? 'squint' : 'left'
    let map = [...her(gaze)]

    if (place.isWalking) map = walking(map, v.frame, 'e')
    const bob = (place.isWalking && v.frame % 2 === 1 ? 1 : 0) - (s.herMood === 'heart' && v.frame % 2 === 0 ? 1 : 0)

    stamp(put, map, place.x + shake, 1 + bob)
    addMark(marks, s.herMood, place.x + 3, sinceMood)
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
  const out: Overlay[] = []
  const style = (who: Speaker): { isFaded: boolean; isAside: boolean } => ({
    isFaded: sp.typing !== who && sp.last !== who,
    isAside: sp.aside === who && sp.typing !== who,
  })

  if (hisText !== null) {
    const maxX = herText === null ? v.width : mid - 1

    out.push(...bubble(hisText, { centerX: hisCenter, minX: 0, maxX, tailRow: MARK_ROW, ...style('claude') }).overlays)
  }
  if (herText !== null && herCenter !== null) {
    const minX = hisText === null ? 0 : mid + 1

    out.push(...bubble(herText, { centerX: herCenter, minX, maxX: v.width, tailRow: MARK_ROW, ...style('ruby') }).overlays)
  }

  return out
}
