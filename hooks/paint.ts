// Turns a pixel map into what a surface draws: half-block cells for a
// terminal Raster, crisp squares for an Svg everywhere else.

import type { Overlay } from './bubbles'
import { inkOf } from './sprites'
import type { Pixels } from './sprites'

const DEFAULT = 0x01000000
const UPPER = 0x2580 // ▀
const FULL = 0x2588 // █
const SPACE = 0x20

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

/** Standard padded base64, written out so it runs on any engine. */
export function toBase64(bytes: Uint8Array): string {
  let out = ''

  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] ?? 0
    const b = bytes[i + 1] ?? 0
    const c = bytes[i + 2] ?? 0
    const n = (a << 16) | (b << 8) | c

    out += B64[(n >> 18) & 63]! + B64[(n >> 12) & 63]!
    out += i + 1 < bytes.length ? B64[(n >> 6) & 63]! : '='
    out += i + 2 < bytes.length ? B64[n & 63]! : '='
  }

  return out
}

const rgb = (hex: string | null): number => (hex === null ? DEFAULT : Number.parseInt(hex.slice(1), 16))

/** A sign drawn in the top row of cells, such as a heart over a head. */
export type Mark = { column: number; char: string; color: string; row?: number }

/** A Raster of a color grid (null is the background), two pixel rows per cell. */
export function rasterOfGrid(
  grid: readonly (readonly (string | null)[])[],
  background: string,
  marks: readonly Mark[] = [],
  overlays: readonly Overlay[] = [],
): { columns: number; rows: number; cells: string } {
  const columns = grid[0]?.length ?? 0
  const rows = Math.ceil(grid.length / 2)
  const words = new Uint32Array(columns * rows * 3)
  const bg = rgb(background)

  for (let r = 0; r < rows; r += 1) {
    for (let x = 0; x < columns; x += 1) {
      const top = grid[r * 2]?.[x] ?? null
      const bottom = grid[r * 2 + 1]?.[x] ?? null
      const at = (r * columns + x) * 3

      if (top === bottom) words.set(top === null ? [SPACE, bg, bg] : [FULL, rgb(top), bg], at)
      else words.set([UPPER, top === null ? bg : rgb(top), bottom === null ? bg : rgb(bottom)], at)
    }
  }
  for (const mark of marks) {
    if (mark.column >= 0 && mark.column < columns) {
      const at = ((mark.row ?? 0) * columns + mark.column) * 3

      if (at < words.length) words.set([mark.char.codePointAt(0) ?? SPACE, rgb(mark.color), bg], at)
    }
  }

  // Bubbles go last, over everything. An empty background keeps the room's own color under the cell.
  for (const o of overlays) {
    ;[...o.text].forEach((ch, i) => {
      const x = o.col + i

      if (o.row < 0 || o.row >= rows || x < 0 || x >= columns) return
      const at = (o.row * columns + x) * 3
      const under = o.bg === '' ? (words[at + 2] ?? bg) : rgb(o.bg)

      words.set([ch.codePointAt(0) ?? SPACE, rgb(o.fg), under], at)
    })
  }

  return { columns, rows, cells: toBase64(new Uint8Array(words.buffer)) }
}

/** An Svg of a color grid: square pixels, `scale` CSS pixels each, signs as text. */
export function svgOfGrid(
  grid: readonly (readonly (string | null)[])[],
  scale: number,
  background: string,
  marks: readonly Mark[] = [],
  overlays: readonly Overlay[] = [],
): string {
  const width = (grid[0]?.length ?? 0) * scale
  const height = grid.length * scale
  const parts = [`<rect width="${width}" height="${height}" fill="${background}"/>`]

  grid.forEach((row, y) => {
    let x = 0

    while (x < row.length) {
      const ink = row[x] ?? null
      let end = x + 1

      while (end < row.length && (row[end] ?? null) === ink) end += 1
      if (ink !== null) parts.push(`<rect x="${x * scale}" y="${y * scale}" width="${(end - x) * scale}" height="${scale}" fill="${ink}"/>`)
      x = end
    }
  })
  for (const mark of marks) parts.push(markText(mark, scale))
  for (const o of overlays) parts.push(overlaySvg(o, scale))

  return svgDocument(width, height, parts)
}

function markText(mark: Mark, scale: number): string {
  const size = scale * 2.4

  return (
    `<text x="${(mark.column + 0.5) * scale}" y="${(mark.row ?? 0) * 2 * scale + size * 0.85}" font-size="${size}" text-anchor="middle" ` +
    `font-family="monospace" fill="${mark.color}">${escapeXml(mark.char)}</text>`
  )
}

/** A bubble row in SVG: its box, then its text stretched to the cells it covers. */
function overlaySvg(o: Overlay, scale: number): string {
  const x = o.col * scale
  const y = o.row * 2 * scale
  const w = [...o.text].length * scale
  const h = 2 * scale

  if (o.text === String.fromCodePoint(0x2580)) return `<rect x="${x}" y="${y}" width="${scale}" height="${scale}" fill="${o.fg}"/>`

  return (
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${o.bg}"/>` +
    `<text x="${x}" y="${y + h * 0.78}" font-size="${h * 0.8}" font-family="monospace" textLength="${w}" ` +
    `lengthAdjust="spacingAndGlyphs" fill="${o.fg}" xml:space="preserve">${escapeXml(o.text)}</text>`
  )
}

const svgDocument = (width: number, height: number, parts: readonly string[]): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" ` +
  `shape-rendering="crispEdges">${parts.join('')}</svg>`

/** An Svg of one sprite map, for the listing icon. */
export function svgOf(map: Pixels, scale: number): string {
  const grid = map.map(row => [...row].map(letter => inkOf(letter)))

  return svgOfGrid(grid, scale, '#0b0b0d')
}

function escapeXml(text: string): string {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}
