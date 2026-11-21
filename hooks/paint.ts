// Turns a pixel map into what a surface draws: half-block cells for a
// terminal Raster, crisp squares for an Svg everywhere else.

import { inkOf } from './sprites'
import type { Pixels } from './sprites'

const DEFAULT = 0x01000000
const UPPER = 0x2580 // ▀
const LOWER = 0x2584 // ▄
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

/** A mark drawn over the top row of cells, such as a heart over a head. */
export type Mark = { column: number; char: string; color: string }

/** The cells of a Raster: `[codePoint, foreground, background]` per cell. */
export function rasterCells(map: Pixels, marks: readonly Mark[] = []): { columns: number; rows: number; cells: string } {
  const columns = map[0]?.length ?? 0
  const rows = Math.ceil(map.length / 2)
  const words = new Uint32Array(columns * rows * 3)

  for (let r = 0; r < rows; r += 1) {
    for (let x = 0; x < columns; x += 1) {
      const top = inkOf(map[r * 2]?.[x] ?? '.')
      const bottom = inkOf(map[r * 2 + 1]?.[x] ?? '.')
      const at = (r * columns + x) * 3
      let cell: [number, number, number]

      if (top === null && bottom === null) cell = [SPACE, DEFAULT, DEFAULT]
      else if (bottom === null) cell = [UPPER, rgb(top), DEFAULT]
      else if (top === null) cell = [LOWER, rgb(bottom), DEFAULT]
      else if (top === bottom) cell = [FULL, rgb(top), DEFAULT]
      else cell = [UPPER, rgb(top), rgb(bottom)]
      words.set(cell, at)
    }
  }
  for (const mark of marks) {
    if (mark.column >= 0 && mark.column < columns) {
      words.set([mark.char.codePointAt(0) ?? SPACE, rgb(mark.color), DEFAULT], mark.column * 3)
    }
  }

  return { columns, rows, cells: toBase64(new Uint8Array(words.buffer)) }
}

/** An Svg of the map, `scale` CSS pixels per map pixel, with the marks as text. */
export function svgOf(map: Pixels, scale: number, marks: readonly Mark[] = []): string {
  const width = (map[0]?.length ?? 0) * scale
  const height = map.length * scale
  const parts: string[] = []

  map.forEach((row, y) => {
    let x = 0

    // One rect per run of the same color keeps the markup small.
    while (x < row.length) {
      const ink = inkOf(row[x] ?? '.')
      let end = x + 1

      while (end < row.length && inkOf(row[end] ?? '.') === ink) end += 1
      if (ink !== null) {
        parts.push(`<rect x="${x * scale}" y="${y * scale}" width="${(end - x) * scale}" height="${scale}" fill="${ink}"/>`)
      }
      x = end
    }
  })
  for (const mark of marks) {
    const size = scale * 2.4

    parts.push(
      `<text x="${(mark.column + 0.5) * scale}" y="${size * 0.85}" font-size="${size}" text-anchor="middle" ` +
        `font-family="monospace" fill="${mark.color}">${escapeXml(mark.char)}</text>`,
    )
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" ` +
    `shape-rendering="crispEdges">${parts.join('')}</svg>`
  )
}

function escapeXml(text: string): string {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}
