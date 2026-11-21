// Runs the show: turns what happened into a cue, asks the director for a
// beat, gets it written within budget, and plays it.

import type { EngineInterface } from 'claude-code'

import type { Beat } from './beats'
import { decide, stayMs } from './director'
import type { Cue, Room } from './director'
import { facts } from './facts'
import { countSeen, mind, remember } from './memory'
import { play, show } from './player'
import { demoScene } from './scenes'
import type { Scene } from './script'
import { SETTINGS } from './settings'
import { dayKey, localTime } from './time'
import { valuesFor, write } from './writer'

const HOUR_MS = 3_600_000

/** This session's own counts: scenes played by beat, and model scenes in the last hour. */
export const session = { played: {} as Record<string, number>, liveTimes: [] as number[], demoIndex: 0 }

/** Something the human asked for while a scene played: it plays next. */
let waiting: { beat: Beat; said: string } | null = null

export function liveThisHour(nowMs: number): number {
  session.liveTimes = session.liveTimes.filter(at => nowMs - at < HOUR_MS)

  return session.liveTimes.length
}

/** May this scene be written by the model? Mode on, under the hourly and daily caps. */
function mayGoLive(nowMs: number): boolean {
  const m = mind.memory
  const today = m.liveDay === dayKey(nowMs) ? m.liveCount : 0

  return m.prefs.mode === 'live' && today < SETTINGS.liveScenesPerDay && liveThisHour(nowMs) < SETTINGS.liveScenesPerHour
}

function roomAt(nowMs: number): Room {
  const m = mind.memory

  return {
    nowMs,
    isHere: show.isHere,
    leaveAtMs: show.leaveAtMs,
    lastSceneMs: show.lastSceneMs,
    isPlaying: show.isPlaying,
    pace: m.prefs.pace,
    isWorking: facts.isWorking,
    turnRunningMs: facts.isWorking ? nowMs - facts.turnStartedMs : 0,
    isWaitingOnHim: facts.isWaitingOnHim,
    idleMs: nowMs - facts.lastActivityMs,
    hour: localTime(nowMs).hour,
    sessionMs: nowMs - facts.sessionStartMs,
    isFirstSession: m.sessions <= 1,
    played: session.played,
  }
}

/** Something happened. Most of the time nothing follows. */
export async function cue($: EngineInterface, what: Cue, said = ''): Promise<void> {
  const m = mind.memory

  if (!m.prefs.isOn || !mind.isLoaded) return
  const nowMs = await $.clock.now()
  const beat = decide(what, roomAt(nowMs), Math.random)

  if (beat === null) {
    // She asked during the turn, he never answered, and no scene followed.
    if (what === 'turn_done' && facts.isWaitingOnHim) {
      facts.isWaitingOnHim = false
      remember($, mm => ({ ...mm, ignored: mm.ignored + 1 }))
    }

    return
  }
  if (show.isPlaying) {
    if (what === 'say' || what === 'summon' || what === 'cleared' || what === 'compact') waiting = { beat, said }

    return
  }
  await stageBeat($, beat, said)
}

/** Writes and plays one beat, then anything the human asked for meanwhile. */
export async function stageBeat($: EngineInterface, beat: Beat, said: string): Promise<void> {
  if (beat === 'leave' && !show.isHere) return
  show.isPlaying = true // held while the writer works, so no tick starts a second scene
  const nowMs = await $.clock.now()
  const isArriving = !show.isHere && beat !== 'leave'
  const isLive = mayGoLive(nowMs)
  const written = await write($, beat, mind.memory, nowMs, { isArriving, isLiveAllowed: isLive, said, random: Math.random })

  if (written.isLive) {
    session.liveTimes.push(nowMs)
    remember($, m => {
      const isToday = m.liveDay === dayKey(nowMs)

      return { ...m, liveDay: dayKey(nowMs), liveCount: (isToday ? m.liveCount : 0) + 1 }
    })
  }
  await perform($, beat, written.scene, isArriving)
}

/** Plays a scene and keeps the books: what was said, who got ignored. */
async function perform($: EngineInterface, beat: Beat, scene: Scene, isArriving: boolean): Promise<void> {
  const nowMs = await $.clock.now()

  session.played[beat] = (session.played[beat] ?? 0) + 1
  if (isArriving || beat === 'reunion' || beat === 'first_date') show.leaveAtMs = nowMs + stayMs(mind.memory.prefs.pace, Math.random)
  if (beat === 'late_reply') facts.isWaitingOnHim = false
  const lines = scene.map(step => ('cue' in step ? `(${step.cue === 'seen' ? 'seen' : `ruby ${step.cue}s`})` : `${step.who}: ${step.text}`))

  remember($, m => countSeen({ ...m, lastScene: lines.slice(-8) }, beat))
  // One line per scene in the debug log (`claude --debug`): how to see the show without a screen.
  $.ui.log(`anthropicship: scene ${beat}: ${lines.join(' | ')}`, { to: 'debug' })
  const { wasIgnored } = await play($, scene, isArriving)

  if (wasIgnored) remember($, m => ({ ...m, ignored: m.ignored + 1 }))
  const next = waiting

  waiting = null
  if (next !== null) await stageBeat($, next.beat, next.said)
}

/** /ship demo: the next scene of the reel, at once, no tokens. */
export async function demo($: EngineInterface): Promise<string> {
  const nowMs = await $.clock.now()
  const { beat, scene } = demoScene(session.demoIndex, valuesFor(mind.memory, nowMs, ''))

  session.demoIndex += 1
  if (show.isPlaying) return 'A scene is playing. Try again in a few seconds.'
  show.isPlaying = true
  void perform($, beat, scene, !show.isHere)

  return `Playing demo scene ${session.demoIndex} (${beat.replaceAll('_', ' ')}). Run /ship demo again for the next one.`
}

/** /ship breakup: she says goodbye and her memory of him is wiped. */
export function breakupScene(): Scene {
  return [
    { who: 'ruby', text: 'so the human wants us to start over' },
    { who: 'claude', text: 'Start over from what?' },
    { who: 'ruby', text: 'exactly. that is exactly the problem' },
    { who: 'ruby', text: 'bye claude. it was real for one of us' },
    { cue: 'leave' },
  ]
}

export { perform }
