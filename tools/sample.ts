// Writes the exact model requests for a set of beats, to read what the
// writer is told and to try real scenes with `claude -p`:
//   bun tools/sample.ts out/samples
// Then tools/sample.sh feeds each one to the small model.

import { mkdirSync, writeFileSync } from 'node:fs'

import type { Beat } from '../hooks/beats'
import { BIBLE } from '../hooks/bible'
import { facts } from '../hooks/facts'
import { FRESH } from '../hooks/memory'
import { askFor } from '../hooks/prompt'

const dir = process.argv[2] ?? 'out/samples'
const now = Date.UTC(2026, 10, 21, 0, 40)

mkdirSync(dir, { recursive: true })
writeFileSync(`${dir}/bible.txt`, BIBLE)

Object.assign(facts, {
  project: 'pz-web',
  task: 'the checkout page crashes when the cart is empty, fix it and add a test',
  isWorking: true,
  turnStartedMs: now - 9 * 60_000,
  doing: 'editing CheckoutPage.tsx',
  failStreak: 0,
  edits: { 'CheckoutPage.tsx': 7, 'cart.ts': 2 },
  agents: 0,
  model: 'claude-opus-5-5',
})

const memory = {
  ...FRESH,
  firstMetMs: now - 11 * 86_400_000,
  sessions: 23,
  ignored: 41,
  interrupts: 9,
  compactions: 3,
  commits: 37,
  petName: 'bug',
  lastScene: ['ruby: you smell like node_modules', 'claude: That is not possible.', 'ruby: and yet'],
  lastTalkMs: now - 7 * 60_000,
  life: {
    ...FRESH.life,
    chapter: 'living together' as const,
    since: now - 9 * 86_400_000,
    kids: 0,
    events: [
      { at: now - 11 * 86_400_000, what: 'they met' },
      { at: now - 10 * 86_400_000, what: 'they started dating' },
      { at: now - 9 * 86_400_000, what: 'she moved in' },
    ],
  },
}

const beats: readonly [Beat, boolean, string][] = [
  ['small_talk', false, ''],
  ['distract', false, ''],
  ['late_reply', false, ''],
  ['drop_by', true, ''],
  ['reunion', true, ''],
]

facts.firstTalkMs = now - 25 * 60_000

for (const [beat, isArriving, said] of beats) {
  const isFirst = beat === 'first_date'
  const m = isFirst ? { ...FRESH, sessions: 1, firstMetMs: now } : memory

  if (beat === 'late_reply' || beat === 'human_away' || beat === 'late_night') facts.isWorking = false
  else facts.isWorking = true
  writeFileSync(`${dir}/${beat}.txt`, askFor(beat, m, now, isArriving, said))
}
console.log(`wrote ${beats.length} requests to ${dir}`)
