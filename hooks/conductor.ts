// Runs the show: turns what happened into a cue, asks the director for a
// beat, gets it written within budget, and plays it.

import type { EngineInterface } from 'claude-code'

import type { Beat } from './beats'
import { decide, stayMs } from './director'
import type { Cue, Room } from './director'
import { facts } from './facts'
import { isAtLeast } from './life'
import { countSeen, mind, remember } from './memory'
import { note, play, setStage, show } from './player'
import { afterScene, dueStory, extraFor, isMilestone, nextThing, pickRare, roomEventOf, toneOf } from './story'
import type { Rare } from './story'
import type { Scene } from './script'
import { SETTINGS } from './settings'
import { dayKey, localTime } from './time'
import { write } from './writer'

const HOUR_MS = 3_600_000

/** This session's own counts: scenes played by beat, and model scenes in the last hour. */
export const session = { played: {} as Record<string, number>, liveTimes: [] as number[] }

/** Something the human asked for while a scene played: it plays next. */
let waiting: { beat: Beat; said: string } | null = null

export function liveThisHour(nowMs: number): number {
  session.liveTimes = session.liveTimes.filter(at => nowMs - at < HOUR_MS)

  return session.liveTimes.length
}

/** May one more scene be written? Under the hourly and daily caps. */
function mayGoLive(nowMs: number): boolean {
  const m = mind.memory
  const today = m.liveDay === dayKey(nowMs) ? m.liveCount : 0

  return today < SETTINGS.liveScenesPerDay && liveThisHour(nowMs) < SETTINGS.liveScenesPerHour
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
    isApart: m.life.isApart,
    due: dueStory(m, nowMs, m.prefs.pace, Math.random),
    played: session.played,
  }
}

/** Something happened. Most of the time nothing follows. Never rejects: the show must not break the session. */
export async function cue($: EngineInterface, what: Cue, said = ''): Promise<void> {
  try {
    await react($, what, said)
  } catch (error) {
    show.isPlaying = false
    try {
      $.ui.log(`anthropicship: a scene stopped: ${String(error)}`, { to: 'debug' })
    } catch {
      // The session is ending; nothing to tell.
    }
  }
}

async function react($: EngineInterface, what: Cue, said: string): Promise<void> {
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
  const rare = pickRare(Math.random)
  const extra = extraFor(beat, mind.memory, rare)
  // Past the caps, or when the model cannot answer, she simply does not come by.
  const scene = mayGoLive(nowMs) ? await write($, beat, mind.memory, nowMs, { isArriving, said, extra }) : null

  if (scene === null) {
    show.isPlaying = false
    await playWaiting($)

    return
  }
  session.liveTimes.push(nowMs)
  remember($, m => {
    const isToday = m.liveDay === dayKey(nowMs)

    return { ...m, liveDay: dayKey(nowMs), liveCount: (isToday ? m.liveCount : 0) + 1 }
  })
  await perform($, beat, scene, isArriving, rare)
}

/** Plays a scene and keeps the books: what was said, when, who got ignored. */
async function perform($: EngineInterface, beat: Beat, scene: Scene, isArriving: boolean, rare: Rare): Promise<void> {
  const nowMs = await $.clock.now()

  session.played[beat] = (session.played[beat] ?? 0) + 1
  if (facts.firstTalkMs === 0) facts.firstTalkMs = nowMs
  const life = mind.memory.life
  const hasKeys = isAtLeast(life, 'living together') && !life.isApart

  // Once she lives here, visits last twice as long.
  if (isArriving || beat === 'reunion' || beat === 'first_date') {
    show.leaveAtMs = nowMs + stayMs(mind.memory.prefs.pace, Math.random) * (hasKeys ? 2 : 1)
  }
  if (beat === 'late_reply') facts.isWaitingOnHim = false
  const lines = scene.flatMap(step =>
    'note' in step ? [] : ['cue' in step ? `(${step.cue === 'seen' ? 'seen' : `ruby ${step.cue}s`})` : `${step.who}: ${step.text}`],
  )
  const thing = beat === 'gift' ? nextThing(mind.memory) : null

  // The light of the scene, and anything rare that shows in the room.
  await setStage($, s => ({
    ...s,
    tone: toneOf(beat),
    ...(beat === 'rare' && roomEventOf(rare) !== 'none' ? { event: roomEventOf(rare), eventAt: nowMs } : {}),
  }))

  // One line per scene in the debug log (`claude --debug`): how to see the show without a screen.
  $.ui.log(`anthropicship: scene ${beat}: ${lines.join(' | ')}`, { to: 'debug' })
  const { wasIgnored } = await play($, scene, { isArriving, isSpell: beat === 'spell', hasKeys })
  const endedMs = await $.clock.now()

  remember($, m => countSeen({ ...afterScene(m, beat, scene, endedMs, Math.random), lastScene: lines.slice(-8), lastTalkMs: endedMs }, beat))
  // Big moments get a title card in the history, like an episode.
  if (isMilestone(beat)) {
    const latest = mind.memory.life.events.at(-1)

    if (latest !== undefined && latest.at === endedMs) await note($, 'stage', `.: ${latest.what} :.`)
  }
  if (thing !== null && mind.memory.things.includes(thing)) await note($, 'stage', `ruby left her ${thing} here`)
  if (wasIgnored) remember($, m => ({ ...m, ignored: m.ignored + 1 }))
  await playWaiting($)
}

/** Plays what the human asked for while a scene was on. */
async function playWaiting($: EngineInterface): Promise<void> {
  const next = waiting

  waiting = null
  if (next !== null) await stageBeat($, next.beat, next.said)
}
