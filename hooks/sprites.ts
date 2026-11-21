// The two of them, drawn pixel by pixel. Each map is 16 pixels wide and 12
// tall (6 terminal rows of half blocks). Letters pick a color from INKS:
// `#` his or her body, `o` an eye, `b` the bow, `k` the bow's knot,
// `l` laptop, `s` the glow on its lid. A dot is empty.

export type Pixels = readonly string[]

export const INKS: Readonly<Record<string, string>> = {
  his: '#D97757',
  hers: '#E98A6B',
  o: '#141414',
  b: '#E8607A',
  k: '#9E2F4A',
  l: '#8F949C',
  s: '#F2EFEA',
}

/** Which way the eyes look, or `squint` (eyes half shut: focused, or a blink). */
export type Gaze = 'front' | 'left' | 'right' | 'squint'

const TOP = ['................', '................']
const BODY = ['..############..', '..############..']
const ARMS = ['################', '################', '..############..', '..############..']
const LEGS = ['...#.#....#.#...', '...#.#....#.#...']

const EYES: Readonly<Record<Gaze, readonly [string, string]>> = {
  front: ['..##o######o##..', '..##o######o##..'],
  left: ['..#o######o###..', '..#o######o###..'],
  right: ['..###o######o#..', '..###o######o#..'],
  squint: ['..############..', '..##o######o##..'],
}

// Her lashes sit at the outer top corner of each eye.
const LASHES: Readonly<Record<Gaze, string>> = {
  front: '..#o########o#..',
  left: '..#########o##..',
  right: '..##o########o..',
  squint: '..#o########o#..',
}

const BOW = ['.........bb.bb..', '.........bbkbb..']

/** Him, in his own coral. */
export function him(gaze: Gaze): Pixels {
  return [...TOP, ...BODY, ...EYES[gaze], ...ARMS, ...LEGS].map(row => row.replaceAll('#', 'H'))
}

/** Her: the same build, lashes, and a bow on the right ear. */
export function her(gaze: Gaze): Pixels {
  const bowRow = '..#######bb#bb..'

  return [...BOW, bowRow, LASHES[gaze], ...EYES[gaze], ...ARMS, ...LEGS].map(row => row.replaceAll('#', 'R'))
}

/** The laptop he works on, seen from behind its lid: 8 wide, 12 tall. */
export const LAPTOP: Pixels = [
  '........',
  '........',
  '........',
  '........',
  '........',
  '.llllll.',
  '.llllll.',
  '.lllsll.',
  '.llllll.',
  '.llllll.',
  'llllllll',
  '........',
]

/** Puts maps side by side, `gap` empty columns apart. All have the same height. */
export function beside(left: Pixels, right: Pixels, gap: number): Pixels {
  return left.map((row, y) => row + '.'.repeat(gap) + (right[y] ?? ''))
}

/** The color of one pixel letter, or null for empty. */
export function inkOf(letter: string): string | null {
  if (letter === 'H') return INKS.his ?? null
  if (letter === 'R') return INKS.hers ?? null
  if (letter === '.' || letter === ' ') return null

  return INKS[letter] ?? null
}
