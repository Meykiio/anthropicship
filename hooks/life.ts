// Their life together. The story moves on by itself over real days: they get
// together, fight, break up, make up, move in, marry, have a kid. Every user
// rolls their own path, so no two shows are the same. Pure: the clock and a
// random source come in as arguments.

import type { Pace } from './settings'
import { shortDate } from './time'

export type Chapter = 'strangers' | 'talking' | 'dating' | 'living together' | 'engaged' | 'married' | 'parents'
export type Milestone = 'ask_out' | 'move_in' | 'propose' | 'wedding' | 'baby' | 'fight' | 'breakup' | 'make_up'

export type LifeEvent = { at: number; what: string }

export type Life = {
  chapter: Chapter
  /** When the current chapter began (epoch ms). */
  since: number
  /** Broken up right now: she stays away until they make up. */
  isApart: boolean
  apartUntilMs: number
  lastFightMs: number
  lastMilestoneMs: number
  kids: number
  events: LifeEvent[]
}

export const NEW_LIFE: Life = {
  chapter: 'strangers',
  since: 0,
  isApart: false,
  apartUntilMs: 0,
  lastFightMs: 0,
  lastMilestoneMs: 0,
  kids: 0,
  events: [],
}

const DAY = 86_400_000
const ORDER: readonly Chapter[] = ['strangers', 'talking', 'dating', 'living together', 'engaged', 'married', 'parents']

/** How fast the story moves: a calm pace takes its time, a clingy one rushes. */
const SPEED: Readonly<Record<Pace, number>> = { calm: 1.5, normal: 1, clingy: 0.35 }

/** The next step forward, the days it needs in the current chapter, and the scene that takes it. */
const NEXT: Partial<Record<Chapter, { days: number; milestone: Milestone }>> = {
  talking: { days: 1, milestone: 'ask_out' },
  dating: { days: 5, milestone: 'move_in' },
  'living together': { days: 7, milestone: 'propose' },
  engaged: { days: 4, milestone: 'wedding' },
  married: { days: 7, milestone: 'baby' },
  parents: { days: 21, milestone: 'baby' },
}

export const isAtLeast = (life: Life, chapter: Chapter): boolean => ORDER.indexOf(life.chapter) >= ORDER.indexOf(chapter)

/**
 * Whether a milestone is due now, checked on each quiet tick. At most one a
 * day; once it is due, it comes within an hour or so of use, not on the dot.
 */
export function dueMilestone(life: Life, nowMs: number, pace: Pace, random: () => number): Milestone | null {
  const speed = SPEED[pace]

  if (nowMs - life.lastMilestoneMs < 20 * 3_600_000 * speed) return null
  const roll = random()

  if (life.isApart) return nowMs >= life.apartUntilMs && roll < 0.02 ? 'make_up' : null
  if (life.chapter === 'strangers') return null
  // Drama, once they are a couple: a fight now and then, and after a fight, maybe the end.
  if (isAtLeast(life, 'dating')) {
    const sinceFight = nowMs - life.lastFightMs

    if (sinceFight < 2 * DAY && roll < 0.004) return 'breakup'
    if (sinceFight > 4 * DAY * speed && roll < 0.003) return 'fight'
  }
  const next = NEXT[life.chapter]

  if (next === undefined || (life.chapter === 'parents' && life.kids >= 3)) return null
  const isReady = nowMs - life.since >= next.days * DAY * speed

  return isReady && roll < 0.02 ? next.milestone : null
}

const remember = (life: Life, at: number, what: string): LifeEvent[] => [...life.events, { at, what }].slice(-40)

/** What a played milestone changes. */
export function applyMilestone(life: Life, what: Milestone, nowMs: number, random: () => number): Life {
  const moved = (chapter: Chapter, text: string): Life => ({
    ...life,
    chapter,
    since: nowMs,
    lastMilestoneMs: nowMs,
    events: remember(life, nowMs, text),
  })

  switch (what) {
    case 'ask_out':
      return moved('dating', 'they started dating')
    case 'move_in':
      return moved('living together', 'she moved in')
    case 'propose':
      return moved('engaged', 'they got engaged')
    case 'wedding':
      return moved('married', 'they got married')
    case 'baby':
      return { ...moved('parents', life.kids === 0 ? 'their first kid was born' : 'another kid was born'), kids: life.kids + 1 }
    case 'fight':
      return { ...life, lastFightMs: nowMs, lastMilestoneMs: nowMs, events: remember(life, nowMs, 'they had a fight') }
    case 'breakup':
      return {
        ...life,
        isApart: true,
        apartUntilMs: nowMs + (1 + random() * 3) * DAY,
        lastMilestoneMs: nowMs,
        events: remember(life, nowMs, 'they broke up'),
      }
    case 'make_up':
      return { ...life, isApart: false, lastMilestoneMs: nowMs, events: remember(life, nowMs, 'they got back together') }
  }
}

/** After the first scene ever, they are talking. */
export function afterFirstMeeting(life: Life, nowMs: number): Life {
  if (life.chapter !== 'strangers') return life

  return { ...life, chapter: 'talking', since: nowMs, events: remember(life, nowMs, 'they met') }
}

/** Their story so far, for the writer: dated, so nobody invents a past. */
export function storySoFar(life: Life, nowMs: number): string {
  const status = life.isApart ? `${life.chapter}, but broken up right now` : life.chapter
  const kids = life.kids > 0 ? `, ${life.kids === 1 ? 'one kid' : `${life.kids} kids`} (tiny crabs)` : ''
  const past = life.events.slice(-8).map(e => `${shortDate(e.at)}: ${e.what}`)
  const days = life.events[0] === undefined ? 0 : Math.floor((nowMs - life.events[0].at) / DAY)

  return [
    `THEIR LIFE: ${status}${kids}. Together ${days} days.`,
    past.length > 0 ? `Their story so far: ${past.join('; ')}.` : 'Their story has not started yet.',
  ].join(' ')
}

/** One line for the panel header. */
export function lifeLine(m: { life: Life; sessions: number }, nowMs: number): string {
  const first = m.life.events[0]?.at ?? nowMs
  const day = Math.floor((nowMs - first) / DAY) + 1
  const kids = m.life.kids > 0 ? ` . ${m.life.kids} ${m.life.kids === 1 ? 'kid' : 'kids'}` : ''
  const status = m.life.isApart ? 'broken up' : m.life.chapter

  return `Claude & Ruby . day ${day} . ${status}${kids}`
}
