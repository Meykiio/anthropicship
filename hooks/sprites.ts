// The two of them, drawn pixel by pixel. Each map is 16 pixels wide and 12
// tall. Letters pick a color from INKS: `H`/`R` his or her body, `h`/`r` the
// light catching their top edge, `d`/`e` the shade underneath and on the
// legs, `o` an eye, `p` her blush, `b` the bow, `k` the bow's knot.

export type Pixels = readonly string[]

export const INKS: Readonly<Record<string, string>> = {
  his: '#D97757',
  hers: '#E98A6B',
  h: '#EC9273',
  d: '#B35F42',
  r: '#F6A88C',
  e: '#C66F55',
  o: '#141414',
  p: '#F2738C',
  b: '#E8607A',
  k: '#9E2F4A',
  l: '#8F949C',
  s: '#F2EFEA',
}

/** Which way the eyes look, or `squint` (eyes half shut: focused, or a blink). */
export type Gaze = 'front' | 'left' | 'right' | 'squint'

const TOP = ['................', '................']
const LIT = '..############..'
const BODY = '..############..'
const ARMS = ['################', '################', '..############..']
const UNDER = '..############..'
const LEGS = ['...#.#....#.#...', '...#.#....#.#...']

const EYES: Readonly<Record<Gaze, readonly [string, string]>> = {
  front: ['..##o######o##..', '..##o######o##..'],
  left: ['..#o######o###..', '..#o######o###..'],
  right: ['..###o######o#..', '..###o######o#..'],
  squint: ['..############..', '..##o######o##..'],
}

// Her lashes sit at the outer top corner of each eye; her blush just under them.
const LASHES: Readonly<Record<Gaze, string>> = {
  front: '..#o########o#..',
  left: '..#########o##..',
  right: '..##o########o..',
  squint: '..#o########o#..',
}
const BLUSH: Readonly<Record<Gaze, readonly [number, number]>> = { front: [4, 11], left: [3, 10], right: [5, 12], squint: [4, 11] }

const BOW = ['.........bb.bb..', '.........bbkbb..']

/** One body: lit on top, shaded below, legs in shade. */
function shade(rows: string[], body: string, light: string, dark: string): string[] {
  return rows.map((row, y) => {
    const ink = y === 2 ? light : y >= 9 ? dark : body

    return row.replaceAll('#', ink)
  })
}

/** Him, in his own coral. */
export function him(gaze: Gaze): Pixels {
  return shade([...TOP, LIT, BODY, ...EYES[gaze], ...ARMS, UNDER, ...LEGS], 'H', 'h', 'd')
}

/** Her: the same build, lashes, blush, and a bow on the right ear. */
export function her(gaze: Gaze): Pixels {
  const rows = shade([...BOW, '..#######bb#bb..', LASHES[gaze], ...EYES[gaze], ...ARMS, UNDER, ...LEGS], 'R', 'r', 'e')
  const [left, right] = BLUSH[gaze]
  const cheeks = rows[6] ?? ''

  rows[6] = [...cheeks].map((ch, x) => (x === left || x === right ? 'p' : ch)).join('')

  return rows
}

/** The color of one pixel letter, or null for empty. */
export function inkOf(letter: string): string | null {
  if (letter === 'H') return INKS.his ?? null
  if (letter === 'R') return INKS.hers ?? null
  if (letter === '.' || letter === ' ') return null

  return INKS[letter] ?? null
}
