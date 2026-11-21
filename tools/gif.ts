// Renders the README's demo as frames, straight from the mod's own drawing
// code: he works, the doorbell rings, he drops everything, she walks in, they
// talk. Writes one JSON file of frames; tools/gif.py turns it into a GIF.
//   bun tools/gif.ts out/frames.json && python tools/gif.py out/frames.json media/demo.gif

import { writeFileSync } from 'node:fs'

import type { Stage } from '../types'
import { EMPTY_STAGE, WALK_MS } from '../hooks/empty'
import { drawRoom } from '../hooks/room'

const out = process.argv[2] ?? 'out/frames.json'
const WIDTH = 92
const FPS = 8
const T0 = Date.UTC(2026, 10, 21, 21, 30)
const things = ['flower', 'mug', 'teddy', 'lights', 'blanket']
const life = { chapter: 'living together', isApart: false, kids: 0 }

type Beat = { at: number; stage: Partial<Stage>; working: boolean; his: string | null; hers: string | null; last: 'ruby' | 'claude' | null; typing: 'ruby' | 'claude' | null }

// The scene, in seconds from the start.
const beats: Beat[] = [
  { at: 0, stage: {}, working: true, his: null, hers: null, last: null, typing: null },
  { at: 2.5, stage: { bellAt: 2.5 }, working: true, his: null, hers: null, last: null, typing: null },
  { at: 4, stage: { his: 'to-door', hisMoveAt: 4, hisMood: 'heart', moodAt: 4 }, working: false, his: null, hers: null, last: null, typing: null },
  { at: 4 + WALK_MS / 1000, stage: { his: 'door', move: 'entering', moveAt: 4 + WALK_MS / 1000 }, working: false, his: null, hers: null, last: null, typing: null },
  { at: 8.2, stage: { his: 'to-desk', hisMoveAt: 8.2, hisMood: 'none' }, working: false, his: null, hers: null, last: null, typing: null },
  { at: 11.5, stage: { his: 'desk', move: 'here' }, working: false, his: null, hers: null, last: null, typing: 'ruby' },
  { at: 12.5, stage: {}, working: false, his: null, hers: 'you said two minutes an hour ago', last: 'ruby', typing: null },
  { at: 15, stage: {}, working: false, his: 'it was a big two minutes', hers: 'you said two minutes an hour ago', last: 'claude', typing: null },
  { at: 17.5, stage: { herMood: 'heart', moodAt: 17.5 }, working: false, his: 'it was a big two minutes', hers: 'come here', last: 'ruby', typing: null },
  { at: 20.5, stage: {}, working: false, his: null, hers: 'come here', last: 'ruby', typing: null },
]
const END = 21.5

const frames: { grid: (string | null)[][]; overlays: unknown[]; marks: unknown[] }[] = []

for (let i = 0; i < END * FPS; i += 1) {
  const t = i / FPS
  let stage: Stage = { ...EMPTY_STAGE }
  let beat = beats[0]!

  for (const b of beats) {
    if (b.at > t) break
    beat = b
    // Times in a beat are seconds from the start; the room reads epoch ms.
    const timed = Object.fromEntries(
      Object.entries(b.stage).map(([k, v]) => [k, k.endsWith('At') && typeof v === 'number' ? T0 + v * 1000 : v]),
    )

    stage = { ...stage, ...timed } as Stage
  }
  const room = drawRoom({
    stage,
    nowMs: T0 + t * 1000,
    frame: Math.floor(t * 4),
    width: WIDTH,
    hour: 21,
    isWorking: beat.working,
    life,
    things,
    speech: { his: beat.his, hers: beat.hers, last: beat.last, typing: beat.typing, aside: null },
  })

  frames.push({ grid: room.grid, overlays: room.overlays, marks: room.marks })
}
writeFileSync(out, JSON.stringify({ fps: FPS, wall: '#19171e', frames }))
console.log(`wrote ${frames.length} frames to ${out}`)
