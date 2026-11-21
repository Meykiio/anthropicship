// Her touch on his room. Things she brings stay for good, so the room tells
// their story: a flower, her blanket on his bed, a teddy, fairy lights, a rug,
// a poster, her mug next to his, a candle, her slippers. Their life adds the
// photo on the shelf (gold once married) and, one day, the kid.

import type { Layout } from './layout'
import type { Put, Rect } from './room-parts'
import { stamp } from './room-parts'

/** Everything she can bring, in the order she tends to bring it. */
export const THINGS = ['flower', 'mug', 'teddy', 'lights', 'blanket', 'poster', 'candle', 'rug', 'slippers'] as const
export type Thing = (typeof THINGS)[number]

/** How she would describe each, for the writer. */
export const THING_WORDS: Readonly<Record<Thing, string>> = {
  flower: 'a pink flower in a pot, for by the door',
  mug: 'her own pink mug, next to his',
  teddy: 'a small teddy bear, for his pillow',
  lights: 'a string of fairy lights for the wall',
  blanket: 'her soft pink blanket, for his bed',
  poster: 'a poster with a big heart, for the wall by the door',
  candle: 'a candle for his shelf',
  rug: 'a little rug, for where she always stands',
  slippers: 'her slippers, left by his bed',
}

const KID = ['.RRRR.', 'RoRRoR', '.RRRR.', '.e..e.']

export type Life = { chapter: string; isApart: boolean; kids: number }

/** Draws her things and their life into the room. */
export function drawThings(
  put: Put,
  rect: Rect,
  at: Layout,
  has: ReadonlySet<string>,
  life: Life,
  frame: number,
  isNight: boolean,
): void {
  const shelfX = at.hisX + 1

  if (has.has('lights')) {
    const colors = ['#ffd98a', '#ff9fb4', '#9fd2ff', '#b9f0a8']

    // Draped high on the wall, above everything else: a wire, and bulbs that twinkle.
    for (let x = 1, i = 0; x < at.doorX - 1; x += 1) {
      const sag = Math.abs(((x % 12) - 6) / 6) < 0.5 ? -1 : -2

      if (x % 2 === 0) put(x, sag, '#2c2935')
      if (x % 3 === 0) {
        put(x, sag + 1, (frame + i) % 5 === 0 ? '#6b6875' : (colors[i % colors.length] ?? '#ffd98a'))
        i += 1
      }
    }
  }
  if (has.has('poster')) {
    rect(at.doorX - 6, 2, 4, 4, '#f4eee2')
    put(at.doorX - 5, 3, '#ff5f7e')
    put(at.doorX - 4, 3, '#ff5f7e')
    rect(at.doorX - 5, 4, 2, 1, '#ff5f7e')
  }
  if (has.has('flower')) {
    rect(at.doorX - 4, 10, 2, 2, '#8a5540')
    put(at.doorX - 4, 9, '#4f8a5b')
    put(at.doorX - 4, 8, '#ff7aa2')
    put(at.doorX - 3, 8, '#ff7aa2')
  }
  if (has.has('candle')) {
    put(shelfX + 9, 1, '#f4eee2')
    if (isNight) put(shelfX + 9, 0, frame % 2 === 0 ? '#ffcf5a' : '#ffa64d')
  }
  if (has.has('mug')) {
    rect(at.hisX - 1, 7, 2, 2, '#f2a5b4')
    put(at.hisX - 1, 6, '#5a3a2a')
  }
  if (has.has('rug')) {
    rect(at.herX - 1, 13, 18, 2, '#7a3f55')
    for (let x = at.herX; x < at.herX + 16; x += 3) put(x, 13, '#a85a75')
  }
  if (at.bed !== null) {
    if (has.has('teddy')) {
      // A little bear sitting on his pillow: ears, face, belly.
      const tx = at.bed.x + 3

      put(tx, 4, '#7a5238')
      put(tx + 3, 4, '#7a5238')
      rect(tx, 5, 4, 2, '#a8754f')
      put(tx + 1, 5, '#141414')
      put(tx + 2, 5, '#141414')
      put(tx + 1, 6, '#d9b38c')
      put(tx + 2, 6, '#d9b38c')
    }
    if (has.has('slippers')) {
      rect(at.bed.x + 4, 12, 2, 1, '#f2a5b4')
      rect(at.bed.x + 7, 12, 2, 1, '#f2a5b4')
    }
  }
  drawLifeMarks(put, rect, at, life, frame)
}

/** Their photo on the shelf, gold once they are married; the kid, bouncing on the bed. */
function drawLifeMarks(put: Put, rect: Rect, at: Layout, life: Life, frame: number): void {
  if (life.isApart) return
  const together = ['living together', 'engaged', 'married', 'parents'].includes(life.chapter)
  const married = life.chapter === 'married' || life.chapter === 'parents'
  const px = at.hisX + 7

  if (together) {
    rect(px, 0, 3, 2, married ? '#e0b36a' : '#3d3a46')
    put(px + 1, 0, married ? '#ff5f7e' : '#c98aa0')
  }
  if (life.kids > 0) {
    const kidX = at.bed !== null ? at.bed.x + at.bed.width - 8 : Math.max(1, at.deskX - 7)
    const hop = frame % 4 === 0 ? 1 : 0

    stamp(put, KID, kidX, (at.bed !== null ? 3 : 9) - hop)
    if (life.kids > 1 && at.bed !== null) stamp(put, KID, at.bed.x + at.bed.width - 15, 4)
  }
}
