// What moves their story beyond single scenes: life milestones, the things
// she brings, rare events (rain, a pigeon, a power cut, a call from her mom),
// the light of each scene, and the small facts they remember. Pure: the clock
// and a random source come in as arguments.

import type { Beat } from './beats'
import { applyMilestone, afterFirstMeeting, dueMilestone } from './life'
import type { Milestone } from './life'
import type { Memory } from './memory'
import type { Scene } from './script'
import type { Pace } from './settings'
import { THINGS, THING_WORDS } from './things'
import type { Thing } from './things'

export type Rare = 'rain' | 'pigeon' | 'blackout' | 'her mom calls' | 'a package arrives' | 'she finds an old photo'

const RARE: readonly Rare[] = ['rain', 'pigeon', 'blackout', 'her mom calls', 'a package arrives', 'she finds an old photo']
const HOUR = 3_600_000
const SPEED: Readonly<Record<Pace, number>> = { calm: 1.5, normal: 1, clingy: 0.4 }

const MILESTONES: ReadonlySet<string> = new Set<Milestone>(['ask_out', 'move_in', 'propose', 'wedding', 'baby', 'fight', 'breakup', 'make_up'])

export const isMilestone = (beat: Beat): beat is Milestone => MILESTONES.has(beat)

/** The next thing she would bring, or null when she has brought everything. */
export function nextThing(m: Memory): Thing | null {
  return THINGS.find(thing => !m.things.includes(thing)) ?? null
}

/**
 * What is due in their story at this quiet moment: a milestone first, then a
 * thing she brings (about one a day once they are dating), then, rarely,
 * something unexpected (about one a day).
 */
export function dueStory(m: Memory, nowMs: number, pace: Pace, random: () => number): Beat | null {
  const milestone = dueMilestone(m.life, nowMs, pace, random)

  if (milestone !== null) return milestone
  if (m.life.isApart || m.life.chapter === 'strangers') return null
  const speed = SPEED[pace]

  if (nextThing(m) !== null && nowMs - m.lastGiftMs > 20 * HOUR * speed && random() < 0.02) return 'gift'
  if (nowMs - m.lastRareMs > 18 * HOUR * speed && random() < 0.01) return 'rare'

  return null
}

export const pickRare = (random: () => number): Rare => RARE[Math.floor(random() * RARE.length)] ?? 'rain'

/** The room's event for a rare beat, if it shows. */
export const roomEventOf = (rare: Rare): 'rain' | 'pigeon' | 'blackout' | 'none' =>
  rare === 'rain' || rare === 'pigeon' || rare === 'blackout' ? rare : 'none'

/** The light of a scene. */
export function toneOf(beat: Beat): 'calm' | 'warm' | 'tense' {
  if (beat === 'fight' || beat === 'breakup' || beat === 'interrupted') return 'tense'
  if (['spell', 'propose', 'wedding', 'make_up', 'baby', 'ask_out', 'move_in', 'gift'].includes(beat)) return 'warm'

  return 'calm'
}

/** What the writer is told about a gift or a rare event. */
export function extraFor(beat: Beat, m: Memory, rare: Rare): string {
  if (beat === 'gift') {
    const thing = nextThing(m)

    return thing === null ? '' : `What she brings today: ${THING_WORDS[thing]}.`
  }

  return beat === 'rare' ? `What happens: ${rare}.` : ''
}

/** Their memory after a scene: their life, her things, the facts they keep, the clocks. */
export function afterScene(m: Memory, beat: Beat, scene: Scene, nowMs: number, random: () => number): Memory {
  const met = afterFirstMeeting(m.life, nowMs)
  const life = isMilestone(beat) ? applyMilestone(met, beat, nowMs, random) : met
  const brought = beat === 'gift' ? nextThing(m) : null
  const moving = beat === 'move_in' ? (['mug', 'slippers', 'blanket'] as const).filter(t => !m.things.includes(t)) : []
  const things = [...m.things, ...(brought === null ? [] : [brought]), ...moving]
  const notes = [...m.notes, ...scene.flatMap(step => ('note' in step ? [step.note] : []))].slice(-14)

  return {
    ...m,
    life,
    things,
    notes,
    lastGiftMs: beat === 'gift' ? nowMs : m.lastGiftMs,
    lastRareMs: beat === 'rare' ? nowMs : m.lastRareMs,
  }
}
