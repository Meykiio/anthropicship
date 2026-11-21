// His room's furniture, in scene coordinates (0 at the top of the wall, 12 the
// baseboard, 13 the floor): the bed, the window, the lamp, the shelf over his
// desk, the desk, the door.

import { ROOM as C } from './colors'
import type { Layout } from './layout'
import type { Put, Rect } from './room-parts'

export type Sky = { glass: string; light: string | null; isNight: boolean }

export function sky(hour: number): Sky {
  if (hour >= 7 && hour < 17) return { glass: '#5a8fc4', light: '#f2c14e', isNight: false }
  if (hour === 6 || hour === 17 || hour === 18) return { glass: '#c9785a', light: '#f2a65a', isNight: false }

  return { glass: '#141d33', light: '#efe6c8', isNight: true }
}

/** The window: the real sky, and now and then rain or a pigeon on the sill. */
export function drawWindow(rect: Rect, put: Put, x: number, out: Sky, event: string, frame: number): void {
  rect(x, 1, 10, 7, C.frame)
  rect(x + 1, 2, 8, 5, out.glass)
  rect(x + 4, 2, 1, 5, C.frame)
  if (out.light !== null && event !== 'rain') put(out.isNight ? x + 7 : x + 2, 3, out.light)
  if (out.isNight && event !== 'rain') {
    put(x + 2, 5, '#7f8aa8')
    put(x + 6, 2, '#7f8aa8')
  }
  if (event === 'rain') {
    for (let i = 0; i < 6; i += 1) {
      const rx = x + 1 + ((i * 3 + frame) % 8)

      if (rx !== x + 4) put(rx, 2 + ((i * 2 + frame) % 5), '#9fb7d6')
    }
  }
  rect(x - 1, 8, 12, 1, C.trim)
  if (event === 'pigeon') {
    const px = x + 6 + (frame % 6 === 0 ? 1 : 0)

    rect(px, 7, 3, 1, '#8b8f99')
    put(px + 2, 6, '#8b8f99')
    put(px + 3, 6, '#e0b36a')
  }
}

/** His bed: headboard, pillow, mattress, blanket. Her blanket once she brings it. */
export function drawBed(rect: Rect, put: Put, x: number, width: number, hasHerBlanket: boolean): void {
  const blanket = hasHerBlanket ? '#d97a8c' : '#4a5a7a'
  const fold = hasHerBlanket ? '#f0a5b4' : '#5f7096'

  rect(x, 5, 2, 7, C.deskTop)
  rect(x + 2, 9, width - 2, 3, C.desk)
  rect(x + 2, 8, width - 2, 1, '#e8e1d3')
  rect(x + 2, 7, 4, 1, '#f4eee2')
  rect(x + 6, 7, width - 6, 2, blanket)
  rect(x + 6, 7, 1, 2, fold)
  if (hasHerBlanket) for (let i = x + 9; i < x + width - 1; i += 4) put(i, 8, fold)
  put(x, 12, C.deskLeg)
  put(x + width - 1, 12, C.deskLeg)
}

/** A floor lamp; lit in the evening. */
export function drawLamp(rect: Rect, put: Put, x: number, isOn: boolean): void {
  rect(x - 1, 2, 3, 2, isOn ? '#ffd98a' : '#c9a56a')
  rect(x, 4, 1, 8, C.lidDark)
  rect(x - 1, 12, 3, 1, C.lidDark)
  if (isOn) put(x, 4, '#ffe9b5')
}

/** The shelf over his desk: books, a little cactus, and whatever she adds. */
export function drawShelf(rect: Rect, put: Put, x: number): void {
  rect(x, 2, 13, 1, C.deskTop)
  const books = ['#6b8fbf', '#c9677a', '#e0b36a', '#5c8a6b']

  books.forEach((ink, i) => rect(x + 1 + i, i % 2 === 0 ? 0 : 1, 1, i % 2 === 0 ? 2 : 1, ink))
  put(x + 11, 1, '#5c8a6b')
  put(x + 11, 0, '#6fa07c')
  put(x + 12, 1, C.pot)
}

/** His desk: it hides his legs. */
export function drawDesk(rect: Rect, at: Layout): void {
  const right = at.laptopX + 8

  rect(at.deskX, 9, right - at.deskX, 1, C.deskTop)
  rect(at.deskX + 1, 10, right - at.deskX - 2, 2, C.desk)
  rect(at.deskX + 1, 12, 1, 1, C.deskLeg)
  rect(right - 2, 12, 1, 1, C.deskLeg)
}

/** The door: open while she passes through it, rattling when the bell rings. */
export function drawDoor(rect: Rect, put: Put, x: number, isOpen: boolean, rattle: number): void {
  rect(x - 1, 1, 10, 11, C.frame)
  if (isOpen) {
    rect(x, 2, 8, 10, C.opening)
    rect(x + 7, 2, 1, 10, C.doorDark)

    return
  }
  rect(x + rattle, 2, 8, 10, C.door)
  rect(x + 1 + rattle, 3, 6, 3, C.doorDark)
  rect(x + 1 + rattle, 7, 6, 4, C.doorDark)
  put(x + 1 + rattle, 7, C.knob)
}
