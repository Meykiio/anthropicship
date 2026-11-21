// Pieces of the room: the window, the plant, sprites, hands, legs, signs.

import type { Mood } from '../types'
import type { Mark } from './paint'
import { ROOM as C } from './colors'
import { INKS } from './sprites'
import type { Pixels } from './sprites'

export type Put = (x: number, y: number, c: string | null) => void
export type Rect = (x: number, y: number, rw: number, rh: number, c: string) => void

/** The window, with the sun or the moon in it. */
export function drawWindow(rect: Rect, put: Put, out: { glass: string; light: string | null; isNight: boolean }, x: number): void {
  rect(x, 1, 10, 7, C.frame)
  rect(x + 1, 2, 8, 5, out.glass)
  rect(x + 4, 2, 1, 5, C.frame)
  if (out.light !== null) put(out.isNight ? x + 7 : x + 2, 3, out.light)
  if (out.isNight) {
    put(x + 2, 5, '#7f8aa8')
    put(x + 6, 2, '#7f8aa8')
  }
}

/** A plant in the corner. */
export function drawPlant(rect: Rect, put: Put): void {
  rect(1, 10, 3, 2, C.pot)
  put(1, 8, C.leaf)
  put(2, 7, C.leafDark)
  put(3, 8, C.leaf)
  put(2, 9, C.leaf)
  put(0, 9, C.leafDark)
}

/** Copies a sprite into the grid, its top-left at (x, y). */
export function stamp(put: Put, map: Pixels, x: number, y: number): void {
  map.forEach((row, dy) => {
    for (let dx = 0; dx < row.length; dx += 1) {
      const letter = row[dx] ?? '.'

      if (letter !== '.') put(x + dx, y + dy, ink(letter))
    }
  })
}

const ink = (letter: string): string | null =>
  letter === 'H' ? (INKS.his ?? null) : letter === 'R' ? (INKS.hers ?? null) : (INKS[letter] ?? null)

/** His hands tap the keys: one arm tip lifts on each beat. */
export function typing(map: string[], frame: number): string[] {
  const side = frame % 2 === 0 ? [0, 1] : [14, 15]
  const row = map[6] ?? ''

  map[6] = [...row].map((ch, x) => (side.includes(x) ? '.' : ch)).join('')

  return map
}

/** Arms up: a big stretch at the desk. */
export function stretching(map: string[]): string[] {
  const body = map[4]?.includes('R') ? 'R' : 'H'

  for (const r of [3, 4, 5]) map[r] = `${body}${body}${(map[r] ?? '').slice(2, 14)}${body}${body}`
  for (const r of [6, 7]) map[r] = `..${(map[r] ?? '').slice(2, 14)}..`

  return map
}

/** Her legs scissor as she walks. */
export function walking(map: string[], frame: number, body: 'H' | 'R'): string[] {
  const legs = (frame % 2 === 0 ? '..#...#..#...#..' : '...#.#....#.#...').replaceAll('#', body)

  map[10] = legs
  map[11] = legs

  return map
}

const SIGN: Readonly<Record<Mood, { char: string; color: string } | null>> = {
  none: null,
  heart: { char: String.fromCodePoint(0x2665), color: '#ff5f7e' },
  alarm: { char: '!', color: '#f2c14e' },
  ask: { char: '?', color: '#c2cad6' },
  dots: { char: String.fromCodePoint(0x2026), color: '#c2cad6' },
  sleep: { char: 'z', color: '#c2cad6' },
  note: { char: String.fromCodePoint(0x266a), color: '#f2c14e' },
  mad: { char: String.fromCodePoint(0xd7), color: '#ff5f7e' },
}

/** A sign over a head, in the top row of cells. Signs fade after a few seconds, a heart lingers. */
export function addMark(marks: Mark[], mood: Mood, column: number, sinceMs: number): void {
  const sign = SIGN[mood]

  if (sign !== null && (mood === 'heart' || sinceMs < 6_000)) marks.push({ column, char: sign.char, color: sign.color })
}


/** A tiny crab: their kid. */
const KID: Pixels = ['.RRRR.', 'RoRRoR', '.RRRR.', '.R..R.']

/**
 * What their life adds to the room: her flower and their photo once she
 * lives here, the wedding photo once married, and the kid toddling about.
 */
export function drawLife(
  put: Put,
  rect: Rect,
  life: { chapter: string; isApart: boolean; kids: number },
  at: { doorX: number; hisX: number; frame: number },
): void {
  if (life.isApart) return
  const together = ['living together', 'engaged', 'married', 'parents'].includes(life.chapter)
  const married = life.chapter === 'married' || life.chapter === 'parents'
  const fx = at.doorX - 5

  if (together) {
    // Her flower by the door.
    rect(fx + 1, 10, 2, 2, C.pot)
    put(fx + 1, 9, C.leaf)
    put(fx + 2, 8, '#ff7aa2')
    put(fx + 1, 8, '#ff7aa2')
    // Their photo on the wall: a heart, framed in gold once they are married.
    rect(fx, 2, 3, 3, married ? '#e0b36a' : C.frame)
    put(fx + 1, 3, married ? '#ff5f7e' : '#c98aa0')
  }
  if (life.kids > 0 && at.hisX >= 12) {
    // The kid wanders the floor between the plant and the desk.
    const span = Math.max(1, at.hisX - 12)
    const step = at.frame % (span * 2)
    const x = 5 + (step < span ? step : span * 2 - step)

    stamp(put, KID, x, 9 - (at.frame % 4 === 0 ? 1 : 0))
    if (life.kids > 1 && at.hisX >= 16) stamp(put, KID, at.hisX - 7, 9)
  }
}

/**
 * His laptop, open and facing him: the keyboard under his hands, the screen
 * raised on the right, glowing toward him. While he types, lines of code
 * scroll down the screen.
 */
export function drawLaptop(put: Put, rect: Rect, x: number, isTyping: boolean, frame: number): void {
  rect(x - 2, 8, 8, 1, C.keys)
  put(x + 5, 8, C.lidDark)
  rect(x + 5, 2, 3, 1, C.lidDark)
  rect(x + 7, 3, 1, 5, C.lidDark)
  rect(x + 5, 7, 3, 1, C.lidDark)
  rect(x + 5, 3, 2, 4, C.glowA)
  if (isTyping) {
    // Two lines of code, scrolling.
    put(x + 5, 3 + (frame % 4), C.code)
    put(x + 6, 3 + ((frame + 2) % 4), C.code)
  } else {
    put(x + 5, 4, C.glowB)
    put(x + 6, 5, C.glowB)
  }
}

/** His coffee, steaming now and then. */
export function drawMug(put: Put, x: number, frame: number): void {
  put(x, 7, C.mug)
  put(x + 1, 7, C.mug)
  put(x, 8, C.mug)
  put(x + 1, 8, C.mug)
  put(x + 2, 7, C.mugDark)
  put(x, 6, C.coffee)
  put(x + 1, 6, C.coffee)
  if (frame % 3 !== 0) put(x + (frame % 2), 5 - (frame % 2), C.steam)
}
