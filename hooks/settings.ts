// Every number that sets the pace of the show, in one place.

export type Pace = 'calm' | 'normal' | 'clingy'

export const PACES: Readonly<Record<Pace, { visitEveryMin: number; chatEveryMin: number; stayMin: number }>> = {
  // How long she is away on average, how often they talk while she is here,
  // and how long a visit lasts on average.
  calm: { visitEveryMin: 30, chatEveryMin: 6, stayMin: 6 },
  normal: { visitEveryMin: 14, chatEveryMin: 3.5, stayMin: 8 },
  clingy: { visitEveryMin: 5, chatEveryMin: 2, stayMin: 14 },
}

export const SETTINGS = {
  /** The director looks at the room this often. */
  tickMs: 20_000,
  /** No two scenes closer than this, except the ones the person asks for. */
  sceneGapMs: 45_000,
  /** A turn running this long counts as him being locked in. */
  lockedInMs: 75_000,
  /** No prompt, no tool, nothing typed for this long: the human is away. */
  idleMs: 6 * 60_000,
  /** Lines stay on screen this long after a scene ends, then the band empties. */
  lingerMs: 30_000,
  /** How many lines the band shows at once. */
  visibleLines: 3,

  /** Model scenes: the model, its cap and its patience. */
  model: 'haiku',
  maxTokens: 220,
  modelTimeoutMs: 20_000,
  /** At most this many model scenes an hour and a day; past that, she stays away. */
  liveScenesPerHour: 12,
  liveScenesPerDay: 120,

  /** Reading speed: a line stays this long plus a little per character. */
  lineBaseMs: 2_600,
  lineMsPerChar: 55,
  /** "is typing..." shows this long before a line, at most. */
  typingMaxMs: 2_400,
} as const

export const DEFAULTS = { pace: 'normal' as Pace, isPrivate: false, isOn: true }
