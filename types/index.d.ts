// What the mod keeps for the session. Every value is plain JSON.

/** Who a line belongs to. `stage` is a quiet direction such as "seen". */
export type Speaker = 'ruby' | 'claude' | 'user' | 'stage'

/** One line of their chat, shown in a speech bubble over the speaker. */
export type ChatLine = { id: number; who: Speaker; text: string }

/** One line of the chat log in the panel: who, what, and when (epoch ms). */
export type LogLine = { id: number; who: Speaker; text: string; at: number }

/** A small sign over a head: love, alarm, a question, silence, sleep, music, anger. */
export type Mood = 'none' | 'heart' | 'alarm' | 'ask' | 'dots' | 'sleep' | 'note' | 'mad'

/** Where she is: out, walking in through the door, in the room, walking out. */
export type HerMove = 'away' | 'entering' | 'here' | 'leaving'

/** Where he is: at his desk, walking to the door, at the door, walking back. */
export type HisMove = 'desk' | 'to-door' | 'door' | 'to-desk'

/** Everything the room draws besides the clock. */
export type Stage = {
  /** False hides the whole room (the /ship off switch). */
  isOn: boolean
  move: HerMove
  /** When the current move began (epoch ms): the room walks her by it. */
  moveAt: number
  his: HisMove
  hisMoveAt: number
  /** When the doorbell last rang (epoch ms), 0 for never: the door shakes for a moment after. */
  bellAt: number
  /** Between lines she moves about: an offset from her spot (pixels), easing from `driftFrom` since `driftAt`. */
  drift: number
  driftFrom: number
  driftAt: number
  /** A small thing he does between lines, since `actAt`. */
  act: 'none' | 'stretch' | 'look'
  actAt: number
  /** Who is typing right now, if anyone. */
  typing: Speaker | null
  /** The last few lines, oldest first. Empty between scenes. */
  lines: ChatLine[]
  herMood: Mood
  hisMood: Mood
  /** When a mood last changed (epoch ms): a jump or a shake plays for a moment after. */
  moodAt: number
}

declare module 'claude-code' {
  interface PluginState {
    anthropicship: { stage: Shaped<Stage>; frame: Shaped<number>; log: Shaped<LogLine[]> }
  }
}
