// Comic speech bubbles inside the room: a cream box of text above the
// speaker, with a tail pointing down at them. Pure layout: the painter turns
// these into terminal cells or SVG.

/** Text laid over the room in cell coordinates (a cell is 1 pixel wide, 2 tall). */
export type Overlay = { row: number; col: number; text: string; fg: string; bg: string }

const BUBBLE = { fg: '#17151b', bg: '#f4eee2' }
const FADED = { fg: '#4a4650', bg: '#b9b2a7' }
const MAX_LINES = 3

/** Breaks text into at most three lines of at most `width` characters. */
export function wrapLines(text: string, width: number): string[] {
  const lines: string[] = []
  let line = ''

  for (const word of text.split(' ')) {
    const next = line === '' ? word : `${line} ${word}`

    if (next.length <= width) {
      line = next
      continue
    }
    if (line !== '') lines.push(line)
    line = word.length > width ? `${word.slice(0, width - 1)}-` : word
  }
  if (line !== '') lines.push(line)
  if (lines.length > MAX_LINES) {
    const kept = lines.slice(0, MAX_LINES)
    const last = kept[MAX_LINES - 1] ?? ''

    kept[MAX_LINES - 1] = `${last.slice(0, width - 3)}...`

    return kept
  }

  return lines
}

/**
 * One bubble: centered over `centerX`, kept inside [minX, maxX), its tail on
 * `tailRow` and its text on the rows just above. Faded when it is the older line.
 */
export function bubble(
  text: string,
  at: { centerX: number; minX: number; maxX: number; tailRow: number; isFaded: boolean },
): { overlays: Overlay[]; left: number; right: number } {
  const room = Math.max(8, at.maxX - at.minX)
  const lines = wrapLines(text, Math.min(30, room - 2))
  const width = Math.max(...lines.map(line => line.length)) + 2
  const left = Math.max(at.minX, Math.min(at.centerX - Math.floor(width / 2), at.maxX - width))
  const ink = at.isFaded ? FADED : BUBBLE
  const top = at.tailRow - lines.length
  const overlays: Overlay[] = lines.map((line, i) => ({
    row: top + i,
    col: left,
    text: ` ${line.padEnd(width - 2)} `,
    fg: ink.fg,
    bg: ink.bg,
  }))
  // The tail: an upper half block in the bubble's color, under it, above the speaker.
  const tailX = Math.max(left + 1, Math.min(at.centerX, left + width - 2))

  overlays.push({ row: at.tailRow, col: tailX, text: String.fromCodePoint(0x2580), fg: ink.bg, bg: '' })

  return { overlays, left, right: left + width }
}

/** "..." that grows and shrinks while someone types. */
export const typingDots = (frame: number): string => '.'.repeat((frame % 3) + 1).padEnd(3)
