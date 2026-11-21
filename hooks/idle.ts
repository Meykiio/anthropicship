// Life between the lines. Nobody stands frozen: every few seconds one of
// them does something small. She drifts about the room, leans in to read his
// screen, hums; he stretches, glances at her, looks out the window. No words,
// so no tokens: it is all motion.

import { atom, read, update } from 'claude-code'
import type { EngineInterface } from 'claude-code'

import type { Stage } from '../types'
import { EMPTY_STAGE } from './empty'
import { facts } from './facts'
import { show } from './player'

// player.ts, pane.tsx and animate.ts hold the same value: keep this line identical.
const stage = atom({ plugin: 'anthropicship', key: 'stage' } as const, EMPTY_STAGE, { shape: 'stage-5' })

/** Where she likes to stand: leaning over his screen, closer, her spot, a step back. */
const SPOTS = [-9, -4, 0, 0, 3, 5]
const EVERY_MS = 4_000

/** What happens next, if anything. Pure, so it is tested without an engine. */
export function nextIdle(s: Stage, isWorking: boolean, isPlaying: boolean, roll: number, pick: number): Partial<Stage> | null {
  if (!s.isOn || isPlaying || s.typing !== null) return null
  if (s.move === 'here') {
    if (roll < 0.3) {
      const choices = SPOTS.filter(spot => spot !== s.drift)

      return { drift: choices[Math.floor(pick * choices.length)] ?? 0, driftFrom: s.drift }
    }
    if (roll < 0.42) return { act: 'look' }
    if (roll < 0.48) return { herMood: 'note' }
    if (roll < 0.54 && !isWorking) return { act: 'stretch' }

    return null
  }
  if (s.move === 'away' && s.his === 'desk') {
    if (roll < 0.06 && !isWorking) return { act: 'stretch' }
    if (roll < 0.1) return { act: 'look' }
  }

  return null
}

export function startIdle($: EngineInterface): void {
  $.clock.every(EVERY_MS, () => void idleStep($))
}

async function idleStep($: EngineInterface): Promise<void> {
  try {
    const s = await read($, stage)
    const change = nextIdle(s, facts.isWorking, show.isPlaying, Math.random(), Math.random())

    if (change === null) return
    const now = await $.clock.now()
    const stamps: Partial<Stage> = {
      ...('drift' in change ? { driftAt: now } : {}),
      ...('act' in change ? { actAt: now } : {}),
      ...('herMood' in change ? { moodAt: now } : {}),
    }

    await update($, stage, current => ({ ...current, ...change, ...stamps }))
  } catch {
    // A missed moment is invisible; never let it throw.
  }
}
