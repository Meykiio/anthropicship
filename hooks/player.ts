// Plays a scene into the room, one message at a time: she walks in, "...",
// the line in a bubble and in the log, a pause to read it. Runs on the
// clock, never inside a hook's budget.

import { atom, update } from 'claude-code'
import type { EngineInterface } from 'claude-code'

import type { ChatLine, HerMove, HisMove, LogLine, Mood, Speaker, Stage } from '../types'
import { EMPTY_STAGE, WALK_MS } from './empty'
import { facts } from './facts'
import type { Scene } from './script'
import { SETTINGS } from './settings'

// stage.tsx, pane.tsx and animate.ts hold the same values: keep these lines identical.
const stage = atom({ plugin: 'anthropicship', key: 'stage' } as const, EMPTY_STAGE, { shape: 'stage-4' })
const log = atom({ plugin: 'anthropicship', key: 'log' } as const, [], { shape: 'log-1' })

const LOG_LIMIT = 120

/** The player's own bookkeeping. A reload starts it over, which is fine. */
export const show = { isPlaying: false, isHere: false, leaveAtMs: 0, lastSceneMs: 0, nextId: 1, run: 0 }

function wait($: EngineInterface, ms: number): Promise<void> {
  return new Promise(done => void $.clock.after(ms, () => done()))
}

export async function setStage($: EngineInterface, change: (s: Stage) => Stage): Promise<void> {
  await update($, stage, current => change(current))
}

/** Adds a line to the panel's log, stamped with the real time. */
async function note($: EngineInterface, who: Speaker, text: string): Promise<void> {
  const at = await $.clock.now()
  const line: LogLine = { id: show.nextId++, who, text, at }

  await update($, log, lines => [...lines, line].slice(-LOG_LIMIT))
}

/** A small sign over the speaker's head, read off the words. */
export function moodOf(text: string): Mood {
  if (/<3|\blove\b|\bcute\b|\bmiss(ed)? you\b|\bfavou?rite\b|\bsweet\b/i.test(text)) return 'heart'
  // She texts in lowercase, so capitals are shouting.
  if (/\bunbelievable\b|\bseriously\b|^wow\.?$/i.test(text) || /\b[A-Z]{3,}\b/.test(text)) return 'mad'
  if (/!!|\?\?|\bomg\b|\bwait\b/i.test(text)) return 'alarm'
  if (/^\.{2,}$|\.\.\.$/.test(text)) return 'dots'
  if (/\b(lol|lmao|haha)\b/i.test(text)) return 'note'
  if (/\?$/.test(text)) return 'ask'

  return 'none'
}

const append = (lines: readonly ChatLine[], who: Speaker, text: string): ChatLine[] =>
  [...lines, { id: show.nextId++, who, text }].slice(-SETTINGS.visibleLines)

const readingMs = (text: string): number => SETTINGS.lineBaseMs + text.length * SETTINGS.lineMsPerChar

async function moveHer($: EngineInterface, move: HerMove, moodOfHim: Mood): Promise<void> {
  const now = await $.clock.now()

  await setStage($, s => ({ ...s, move, moveAt: now, hisMood: moodOfHim === 'none' ? s.hisMood : moodOfHim, moodAt: now }))
}

async function moveHim($: EngineInterface, his: HisMove): Promise<void> {
  const now = await $.clock.now()

  await setStage($, s => ({ ...s, his, hisMoveAt: now }))
}

async function ring($: EngineInterface, text: string): Promise<void> {
  const now = await $.clock.now()

  await setStage($, s => ({ ...s, bellAt: now }))
  await note($, 'stage', text)
}

/** How long she waits outside, ringing, before she lets herself in. */
const PATIENCE_MS = 4 * 60_000
const RING_AGAIN_MS = 25_000

/**
 * The doorbell. Mid-task, he either finishes first while she rings again, or
 * drops everything and goes to the door. Then she walks in and he goes back.
 */
async function enter($: EngineInterface, hasKeys: boolean): Promise<void> {
  show.isHere = true
  if (hasKeys) {
    // She lives here now: no bell, she lets herself in.
    await moveHer($, 'entering', 'none')
    await note($, 'stage', 'ruby came home')
    await wait($, WALK_MS)
    await moveHer($, 'here', 'none')

    return
  }
  let opensHimself = true

  await ring($, 'ding dong')
  await wait($, 1_800)
  if (facts.isWorking && Math.random() < 0.55) {
    await note($, 'stage', 'Claude keeps working. She waits at the door.')
    const start = await $.clock.now()
    let lastRing = start

    while (facts.isWorking && (await $.clock.now()) - start < PATIENCE_MS) {
      await wait($, 1_500)
      const now = await $.clock.now()

      if (now - lastRing > RING_AGAIN_MS && facts.isWorking) {
        lastRing = now
        await ring($, 'ding dong ding dong')
      }
    }
    opensHimself = !facts.isWorking
    await note($, 'stage', opensHimself ? 'Claude finishes and gets the door' : 'she gives up waiting and lets herself in')
  } else if (facts.isWorking) {
    await note($, 'stage', 'Claude stops mid-task to get the door')
    await setStage($, s => ({ ...s, hisMood: 'heart' }))
  }
  if (opensHimself) {
    await moveHim($, 'to-door')
    await wait($, WALK_MS)
    await moveHim($, 'door')
  }
  await setStage($, s => ({ ...s, drift: 0, driftFrom: 0 }))
  await moveHer($, 'entering', opensHimself ? 'none' : 'alarm')
  await note($, 'stage', 'ruby walked in')
  await wait($, 900)
  if (opensHimself) await moveHim($, 'to-desk')
  await wait($, WALK_MS)
  await moveHer($, 'here', 'none')
  await setStage($, s => ({ ...s, his: 'desk', hisMood: s.hisMood === 'heart' ? 'none' : s.hisMood }))
}

/** She walks back out through the door. */
async function leave($: EngineInterface): Promise<void> {
  show.isHere = false
  // Back to her spot first, so the walk out starts from where she stands.
  const now = await $.clock.now()

  await setStage($, s => ({ ...s, drift: 0, driftFrom: s.drift, driftAt: now }))
  await wait($, 1_200)
  await moveHer($, 'leaving', 'none')
  await note($, 'stage', 'ruby left')
  await wait($, WALK_MS)
  await moveHer($, 'away', 'none')
}

/**
 * Plays the scene. `isArriving` brings her in first. `isSpell` means she wins:
 * he turns to her, hearts and all, until he remembers the task.
 */
export async function play(
  $: EngineInterface,
  scene: Scene,
  opts: { isArriving: boolean; isSpell: boolean; hasKeys: boolean },
): Promise<{ wasIgnored: boolean }> {
  const run = ++show.run
  let lastRubyUnanswered = false
  let wasIgnored = false

  show.isPlaying = true
  if (opts.isArriving && !show.isHere && !scene.some(step => 'cue' in step && step.cue === 'arrive')) await enter($, opts.hasKeys)
  for (const step of scene) {
    if (run !== show.run) break // a newer scene took over
    if ('cue' in step) {
      if (step.cue === 'arrive' && !show.isHere) await enter($, opts.hasKeys)
      if (step.cue === 'leave' && show.isHere) await leave($)
      if (step.cue === 'seen') {
        wasIgnored = true
        const now = await $.clock.now()

        await setStage($, s => ({ ...s, lines: append(s.lines, 'stage', 'seen'), hisMood: 'none', herMood: 'mad', moodAt: now }))
        await note($, 'stage', 'seen')
        await wait($, 2_200)
      }
      continue
    }
    if (step.who === 'ruby' && !show.isHere) await enter($, opts.hasKeys)
    await setStage($, s => ({ ...s, typing: step.who }))
    await wait($, Math.min(SETTINGS.typingMaxMs, 600 + step.text.length * 30))
    const mood = moodOf(step.text)
    const now = await $.clock.now()
    const hisMood: Mood = opts.isSpell && step.who === 'claude' ? 'heart' : mood

    await setStage($, s => ({
      ...s,
      typing: null,
      lines: append(s.lines, step.who, step.text),
      herMood: step.who === 'ruby' ? mood : s.herMood,
      hisMood: step.who === 'claude' ? hisMood : s.hisMood,
      moodAt: now,
    }))
    await note($, step.who, step.text)
    if (step.who === 'ruby') lastRubyUnanswered = true
    if (step.who === 'claude') lastRubyUnanswered = false
    await wait($, readingMs(step.text))
  }
  if (run === show.run) {
    show.isPlaying = false
    show.lastSceneMs = await $.clock.now()
    // She asked and he was busy: he owes her an answer when the turn ends.
    if (facts.isWorking && (lastRubyUnanswered || wasIgnored)) facts.isWaitingOnHim = true
    linger($, run).catch(() => undefined)
  }

  return { wasIgnored }
}

/** After a quiet spell the bubbles fade; she stays in the room if she is here. */
async function linger($: EngineInterface, run: number): Promise<void> {
  await wait($, SETTINGS.lingerMs)
  if (run !== show.run || show.isPlaying) return
  await setStage($, s => ({ ...s, lines: [], typing: null, herMood: 'none', hisMood: 'none' }))
}

/** Stops whatever is playing and empties the room (the /ship off switch). */
export async function hush($: EngineInterface, isOn: boolean): Promise<void> {
  show.run += 1
  show.isPlaying = false
  show.isHere = false
  await setStage($, () => ({ ...EMPTY_STAGE, isOn }))
}
