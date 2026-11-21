// Plays a scene into the band, one message at a time: "is typing...", the
// line, a pause to read it. Runs on the clock, never inside a hook's budget.

import { atom, update } from 'claude-code'
import type { EngineInterface } from 'claude-code'

import type { ChatLine, Mood, Speaker, Stage } from '../types'
import { EMPTY_STAGE } from './empty'
import { facts } from './facts'
import type { Scene } from './script'
import { SETTINGS } from './settings'

// stage.tsx reads the same value: keep the two lines identical.
const stage = atom({ plugin: 'anthropicship', key: 'stage' } as const, EMPTY_STAGE, { shape: 'stage-1' })

export const EMPTY: Stage = EMPTY_STAGE

/** The player's own bookkeeping. A reload starts it over, which is fine. */
export const show = { isPlaying: false, isHere: false, leaveAtMs: 0, lastSceneMs: 0, nextId: 1, run: 0 }

function wait($: EngineInterface, ms: number): Promise<void> {
  return new Promise(done => void $.clock.after(ms, () => done()))
}

/** Writes the stage, starting from an empty one if nothing is stored yet. */
export async function setStage($: EngineInterface, change: (s: Stage) => Stage): Promise<void> {
  await update($, stage, current => change(current))
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

/**
 * Plays the scene. `isArriving` brings her in first. Resolves once the last
 * line has been read; the band then empties by itself a little later.
 */
export async function play($: EngineInterface, scene: Scene, isArriving: boolean): Promise<{ wasIgnored: boolean }> {
  const run = ++show.run
  let lastRubyUnanswered = false
  let wasIgnored = false

  show.isPlaying = true
  if (isArriving && !show.isHere && !scene.some(step => 'cue' in step && step.cue === 'arrive')) await enter($)
  for (const step of scene) {
    if (run !== show.run) break // a newer scene took over
    if ('cue' in step) {
      if (step.cue === 'arrive' && !show.isHere) await enter($)
      if (step.cue === 'leave') {
        show.isHere = false
        await setStage($, s => ({ ...s, isHere: false, isFacing: false, typing: null }))
      }
      if (step.cue === 'seen') {
        wasIgnored = true
        await setStage($, s => ({ ...s, lines: append(s.lines, 'stage', 'seen'), hisMood: 'none', herMood: 'dots' }))
        await wait($, 1_800)
      }
      continue
    }
    if (step.who === 'ruby' && !show.isHere) await enter($)
    const typing = Math.min(SETTINGS.typingMaxMs, 600 + step.text.length * 30)

    await setStage($, s => ({ ...s, typing: step.who }))
    await wait($, typing)
    const mood = moodOf(step.text)

    await setStage($, s => ({
      ...s,
      typing: null,
      lines: append(s.lines, step.who, step.text),
      isFacing: show.isHere,
      herMood: step.who === 'ruby' ? mood : s.herMood,
      hisMood: step.who === 'claude' ? mood : s.hisMood,
    }))
    if (step.who === 'ruby') lastRubyUnanswered = true
    if (step.who === 'claude') lastRubyUnanswered = false
    await wait($, readingMs(step.text))
  }
  if (run === show.run) {
    show.isPlaying = false
    show.lastSceneMs = await $.clock.now()
    // She asked and he was busy: he owes her an answer when the turn ends.
    if (facts.isWorking && (lastRubyUnanswered || wasIgnored)) facts.isWaitingOnHim = true
    void linger($, run)
  }

  return { wasIgnored }
}

/** She walks in. */
async function enter($: EngineInterface): Promise<void> {
  show.isHere = true
  await setStage($, s => ({ ...s, isHere: true, herMood: 'none' }))
  await wait($, 1_200)
}

/** After a quiet spell the lines fade out; she stays in the room if she is here. */
async function linger($: EngineInterface, run: number): Promise<void> {
  await wait($, SETTINGS.lingerMs)
  if (run !== show.run || show.isPlaying) return
  await setStage($, s => ({ ...s, lines: [], typing: null, herMood: 'none', hisMood: 'none', isFacing: false }))
}

/** Stops whatever is playing and clears the band (the /ship off switch). */
export async function hush($: EngineInterface, isOn: boolean): Promise<void> {
  show.run += 1
  show.isPlaying = false
  show.isHere = false
  await setStage($, () => ({ ...EMPTY, isOn }))
}
