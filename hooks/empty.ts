// The room's starting value. Every file that holds the stage atom imports it.

import type { Stage } from '../types'

export const EMPTY_STAGE: Stage = {
  isOn: true,
  move: 'away',
  moveAt: 0,
  his: 'desk',
  hisMoveAt: 0,
  bellAt: 0,
  drift: 0,
  driftFrom: 0,
  driftAt: 0,
  act: 'none',
  actAt: 0,
  typing: null,
  lines: [],
  herMood: 'none',
  hisMood: 'none',
  moodAt: 0,
}

/** How long she takes to walk from the door to his desk, or back. */
export const WALK_MS = 3_200
