// Decides when a scene happens and what kind. Pure: everything it needs comes
// in as arguments, so it is tested without an engine. Silence is the default:
// most calls return null, so the moments that do come land.

import type { Beat } from './beats'
import type { Milestone } from './life'
import { PACES, SETTINGS } from './settings'
import type { Pace } from './settings'

export type Cue =
  | 'start'
  | 'tick'
  | 'turn_done'
  | 'abort'
  | 'fail_streak'
  | 'tests_pass'
  | 'commit'
  | 'compact'
  | 'subagent'
  | 'search'
  | 'cleared'
  | 'model_switch'
  | 'rival'
  | 'say'
  | 'summon'

export type Room = {
  nowMs: number
  isHere: boolean
  /** When she will leave, if here. */
  leaveAtMs: number
  lastSceneMs: number
  isPlaying: boolean
  pace: Pace
  isWorking: boolean
  turnRunningMs: number
  isWaitingOnHim: boolean
  idleMs: number
  /** The human's local hour, 0 to 23. */
  hour: number
  sessionMs: number
  /** Is this their first session ever? */
  isFirstSession: boolean
  /** Broken up: she stays away unless asked, or until they make up. */
  isApart: boolean
  /** A step in their life that is due now, if any. */
  due: Milestone | null
  /** Beats already played this session, with counts. */
  played: Readonly<Record<string, number>>
}

const MIN = 60_000

/** The chance that something which happens on average every `everyMs` happens within one tick. */
const perTick = (everyMs: number): number => 1 - Math.exp(-SETTINGS.tickMs / everyMs)

const isLate = (hour: number): boolean => hour >= 1 && hour < 5

/** Picks the beat for a cue, or null for silence. */
export function decide(cue: Cue, room: Room, random: () => number): Beat | null {
  // Asked for by the human: always, even mid-scene (the player queues it).
  if (cue === 'say') return 'user_says'
  if (cue === 'summon') return 'summon'
  if (cue === 'start') return room.isApart ? null : room.isFirstSession ? 'first_date' : 'reunion'
  if (cue === 'cleared') return 'cleared'
  if (cue === 'compact') return 'amnesia'

  if (room.isPlaying || room.nowMs - room.lastSceneMs < SETTINGS.sceneGapMs) return null
  // Their life comes first: a milestone that is due plays at the next quiet moment.
  if (cue === 'tick' && room.due !== null && !(room.isWorking && room.due !== 'fight')) return room.due
  if (room.isApart) return null

  const chance = (p: number): boolean => random() < p
  const once = (beat: Beat): boolean => (room.played[beat] ?? 0) === 0

  switch (cue) {
    case 'abort':
      return chance(room.isHere ? 0.85 : 0.55) ? 'interrupted' : null
    case 'commit':
      return chance(room.isHere ? 0.9 : 0.5) ? 'commit' : null
    case 'fail_streak':
      return chance(0.6) ? 'fail_streak' : null
    case 'tests_pass':
      return chance(room.isHere ? 0.7 : 0.35) ? 'tests_pass' : null
    case 'subagent':
      return chance(once('subagents') ? 0.8 : 0.2) ? 'subagents' : null
    case 'search':
      return room.isHere && chance(0.35) ? 'googling' : null
    case 'rival':
      return chance(0.75) ? 'rival_file' : null
    case 'model_switch':
      return 'model_switch'
    case 'turn_done':
      if (room.isWaitingOnHim) return chance(0.85) ? 'late_reply' : null

      return room.isHere && chance(0.2) ? 'small_talk' : null
    case 'tick':
      return tick(room, chance, once)
  }

  return null
}

function tick(room: Room, chance: (p: number) => boolean, once: (beat: Beat) => boolean): Beat | null {
  const pace = PACES[room.pace]
  const lockedIn = room.isWorking && room.turnRunningMs >= SETTINGS.lockedInMs
  const isAway = !room.isWorking && room.idleMs >= SETTINGS.idleMs

  if (room.isHere) {
    // While he is mid-task she stays until he surfaces: leaving mid-scene
    // would waste the best bits.
    if (room.nowMs >= room.leaveAtMs && !lockedIn) return 'leave'
    if (!chance(perTick(pace.chatEveryMin * MIN))) return null
    if (lockedIn) return chance(0.45) ? 'spell' : 'distract'
    if (isAway) return 'human_away'
    if (isLate(room.hour) && once('late_night')) return 'late_night'
    if (room.sessionMs >= 2.5 * 60 * MIN && once('long_session')) return 'long_session'

    return 'small_talk'
  }

  if (!chance(perTick(pace.visitEveryMin * MIN))) return null
  if (lockedIn) return 'distract'
  if (isAway) return 'human_away'
  if (isLate(room.hour) && once('late_night')) return 'late_night'

  return 'drop_by'
}

/** How long a visit lasts: around the pace's average, never under two minutes. */
export function stayMs(pace: Pace, random: () => number): number {
  return Math.max(2 * MIN, PACES[pace].stayMin * MIN * (0.5 + random()))
}
