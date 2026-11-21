// The room's clock. It ticks fast only while something moves (her walking,
// a jump, a shake), at a typing pace while he works, and barely otherwise:
// a still room costs nothing to draw.

import { atom, read, update } from 'claude-code'
import type { EngineInterface } from 'claude-code'

import { EMPTY_STAGE, WALK_MS } from './empty'
import { facts } from './facts'

// stage.tsx, pane.tsx and player.ts hold the same values: keep these lines identical.
const stage = atom({ plugin: 'anthropicship', key: 'stage' } as const, EMPTY_STAGE, { shape: 'stage-3' })
const frame = atom({ plugin: 'anthropicship', key: 'frame' } as const, 0, { shape: 'frame-1' })

const BEAT_MS = 250

let beats = 0

/** How many beats to wait before the next frame, given what is happening. */
export function beatsPerFrame(isWalking: boolean, isReacting: boolean, isWorking: boolean): number {
  if (isWalking || isReacting) return 1 // 4 frames a second
  if (isWorking) return 2 // his hands, twice a second

  return 12 // a blink every few seconds
}

/** Starts the clock once per session. */
export function startAnimation($: EngineInterface): void {
  $.clock.every(BEAT_MS, () => void step($))
}

async function step($: EngineInterface): Promise<void> {
  beats += 1
  try {
    const s = await read($, stage)

    if (!s.isOn) return
    const now = await $.clock.now()
    const isWalking =
      ((s.move === 'entering' || s.move === 'leaving') && now - s.moveAt < WALK_MS + 300) ||
      (s.his !== 'desk' && now - s.hisMoveAt < WALK_MS + 300) ||
      now - s.bellAt < 1_800
    const isReacting = now - s.moodAt < 1_800 || s.hisMood === 'heart' || s.herMood === 'heart'

    if (beats % beatsPerFrame(isWalking, isReacting, facts.isWorking) !== 0) return
    await update($, frame, n => (n + 1) % 1_000_000)
  } catch {
    // A missed frame is invisible; never let the clock throw.
  }
}
