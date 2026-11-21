// What the mod keeps for the session. Every value is plain JSON.

/** Who a line belongs to. `stage` is a quiet direction such as "seen". */
export type Speaker = 'ruby' | 'claude' | 'user' | 'stage'

/** One line of their chat, as drawn above the prompt. */
export type ChatLine = { id: number; who: Speaker; text: string }

/** A small sign over a head: love, alarm, a question, silence, sleep, music, anger. */
export type Mood = 'none' | 'heart' | 'alarm' | 'ask' | 'dots' | 'sleep' | 'note' | 'mad'

/** Everything the band draws. */
export type Stage = {
  /** False hides the whole band (the /ship off switch). */
  isOn: boolean
  /** Ruby is in the room. */
  isHere: boolean
  /** Who is typing right now, if anyone. */
  typing: Speaker | null
  /** The last few lines, oldest first. Empty between scenes. */
  lines: ChatLine[]
  herMood: Mood
  hisMood: Mood
  /** Which way their eyes look: at each other while they talk. */
  isFacing: boolean
}

declare module 'claude-code' {
  interface PluginState {
    anthropicship: { stage: Shaped<Stage> }
  }
}
