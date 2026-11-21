// The band's starting value. Both files that hold the stage atom import it.

import type { Stage } from '../types'

export const EMPTY_STAGE: Stage = {
  isOn: true,
  isHere: false,
  typing: null,
  lines: [],
  herMood: 'none',
  hisMood: 'none',
  isFacing: false,
}
