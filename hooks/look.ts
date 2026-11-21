// How the two of them look in words: their colors, and what each is saying now.

import type { ChatLine, Speaker, Stage } from '../types'
import { INKS } from './sprites'

export const WALL = '#19171e'
export const COLOR = { ruby: INKS.b ?? '#E8607A', claude: INKS.his ?? '#D97757', user: '#9AA4AF' } as const

/** What each of them is saying right now, and who spoke last. */
export function bubbles(s: Stage): { his: string | null; hers: string | null; user: string | null; last: Speaker | null; aside: Speaker | null } {
  const latest = (who: Speaker): ChatLine | undefined => [...s.lines].reverse().find(line => line.who === who)
  const newest = s.lines.at(-1)
  const seen = newest?.who === 'stage' ? newest.text : null
  const dots = String.fromCodePoint(0x2026)

  return {
    his: s.typing === 'claude' ? dots : seen ?? latest('claude')?.text ?? null,
    hers: s.typing === 'ruby' ? dots : latest('ruby')?.text ?? null,
    user: latest('user')?.text ?? null,
    last: s.typing ?? (seen === null ? newest?.who ?? null : 'claude'),
    aside: newest?.isAside === true ? newest.who : null,
  }
}
