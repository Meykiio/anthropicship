// Picks a hand-written scene: used when the model is off, out of budget or
// fails, and for /ship demo, which never spends a token.

import type { Beat } from '../beats'
import { fill, parseScene } from '../script'
import type { Scene } from '../script'
import { ARRIVALS } from './arrivals'
import { LIFE } from './life'
import { WORK } from './work'

const ALL: Partial<Record<Beat, readonly string[]>> = { ...ARRIVALS, ...WORK, ...LIFE }

// Played in this order by /ship demo: the best of the show, made to be filmed.
const DEMO: readonly (readonly [Beat, number])[] = [
  ['reunion', 0],
  ['distract', 3],
  ['late_reply', 0],
  ['commit', 0],
  ['rival_file', 1],
  ['subagents', 0],
  ['small_talk', 5],
  ['amnesia', 1],
  ['interrupted', 2],
  ['leave', 2],
]

/** Recently played scripts, so the same one does not come back soon. */
const recent: string[] = []

/** A scripted scene for this beat, filled from the facts. Never null. */
export function scriptedScene(beat: Beat, values: Readonly<Record<string, string>>, random: () => number): Scene {
  const pool = ALL[beat] ?? ALL.small_talk ?? []
  const fresh = pool.filter(text => !recent.includes(text))
  const choices = fresh.length > 0 ? fresh : pool
  const text = choices[Math.floor(random() * choices.length)] ?? 'ruby: hi'

  recent.push(text)
  if (recent.length > 24) recent.shift()

  return parseScene(fill(text, values), false) ?? [{ who: 'ruby', text: 'hi' }]
}

/** The demo scene at a position in the reel, and which beat it is. */
export function demoScene(index: number, values: Readonly<Record<string, string>>): { beat: Beat; scene: Scene } {
  const [beat, pick] = DEMO[index % DEMO.length] ?? ['small_talk', 0]
  const text = ALL[beat]?.[pick] ?? ALL[beat]?.[0] ?? 'ruby: hi'

  return { beat, scene: parseScene(fill(text, values), false) ?? [{ who: 'ruby', text: 'hi' }] }
}

/** Every hand-written scene, for the tests. */
export function everyScript(): readonly (readonly [Beat, string])[] {
  return Object.entries(ALL).flatMap(([beat, texts]) => (texts ?? []).map(text => [beat as Beat, text] as const))
}
