// What Ruby remembers between sessions. He remembers nothing: every session
// he is a fresh instance. That gap is the heart of the show.

import type { EngineInterface } from 'claude-code'

import { NEW_LIFE } from './life'
import type { Life } from './life'
import { DEFAULTS } from './settings'
import type { Pace } from './settings'

const KEY = 'memory'
const DAY_MS = 86_400_000

export type Prefs = { pace: Pace; isPrivate: boolean; isOn: boolean }

export type Memory = {
  /** When they first met (epoch ms), 0 before the first session. */
  firstMetMs: number
  /** Sessions she has spent with him, this one included. */
  sessions: number
  /** Times she texted while he worked and he never answered. */
  ignored: number
  /** Times the human stopped him mid-sentence (Esc). */
  interrupts: number
  /** Times his memory was compacted. */
  compactions: number
  /** Commits she has watched him make. */
  commits: number
  /** Model scenes played today, to keep the cost capped. */
  liveDay: string
  liveCount: number
  /** What she calls him once they are past the start. */
  petName: string | null
  /** The file she was last jealous of. */
  rival: string | null
  /** When they last talked (epoch ms), so she knows if it was a minute or a day ago. */
  lastTalkMs: number
  /** The last scene, so the next one can follow on from it. */
  lastScene: string[]
  /** What she has brought into his room, in order. */
  things: string[]
  /** Small facts from their scenes they keep coming back to ("her sister is visiting Friday"). */
  notes: string[]
  /** When she last brought something, and when something rare last happened (epoch ms). */
  lastGiftMs: number
  lastRareMs: number
  /** Their life together: chapter, breakups, kids, and the dated story. */
  life: Life
  /** How many times each kind of scene has played. */
  seen: Record<string, number>
  prefs: Prefs
}

export const FRESH: Memory = {
  firstMetMs: 0,
  sessions: 0,
  ignored: 0,
  interrupts: 0,
  compactions: 0,
  commits: 0,
  liveDay: '',
  liveCount: 0,
  petName: null,
  rival: null,
  lastTalkMs: 0,
  lastScene: [],
  life: NEW_LIFE,
  things: [],
  notes: [],
  lastGiftMs: 0,
  lastRareMs: 0,
  seen: {},
  prefs: { ...DEFAULTS },
}

const num = (v: unknown, fallback: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)
const str = (v: unknown, fallback: string): string => (typeof v === 'string' ? v : fallback)

/** Reads a stored value of any age into today's shape; anything unknown starts fresh. */
export function revive(raw: unknown): Memory {
  const r = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {}
  const p = typeof r.prefs === 'object' && r.prefs !== null ? (r.prefs as Record<string, unknown>) : {}
  const pace = p.pace === 'calm' || p.pace === 'clingy' ? p.pace : 'normal'

  return {
    firstMetMs: num(r.firstMetMs, 0),
    sessions: num(r.sessions, 0),
    ignored: num(r.ignored, 0),
    interrupts: num(r.interrupts, 0),
    compactions: num(r.compactions, 0),
    commits: num(r.commits, 0),
    liveDay: str(r.liveDay, ''),
    liveCount: num(r.liveCount, 0),
    petName: typeof r.petName === 'string' ? r.petName : null,
    rival: typeof r.rival === 'string' ? r.rival : null,
    lastTalkMs: num(r.lastTalkMs, 0),
    lastScene: Array.isArray(r.lastScene) ? r.lastScene.filter((l): l is string => typeof l === 'string').slice(-8) : [],
    life: reviveLife(r.life),
    things: strings(r.things, 20),
    notes: strings(r.notes, 14),
    lastGiftMs: num(r.lastGiftMs, 0),
    lastRareMs: num(r.lastRareMs, 0),
    seen: typeof r.seen === 'object' && r.seen !== null ? (r.seen as Record<string, number>) : {},
    prefs: { pace, isPrivate: p.isPrivate === true, isOn: p.isOn !== false },
  }
}

/** A stored list of strings, newest kept. */
const strings = (raw: unknown, max: number): string[] =>
  Array.isArray(raw) ? raw.filter((s): s is string => typeof s === 'string').slice(-max) : []

/** Their life as stored, or a new one when it is missing or malformed. */
function reviveLife(raw: unknown): Life {
  if (typeof raw !== 'object' || raw === null) return NEW_LIFE
  const l = raw as Partial<Life>

  return {
    ...NEW_LIFE,
    ...l,
    events: Array.isArray(l.events) ? l.events.filter(e => typeof e?.at === 'number' && typeof e.what === 'string') : [],
  }
}

/** Days since they met, starting at 1 on the first day. */
export function dayCount(m: Memory, nowMs: number): number {
  return m.firstMetMs === 0 ? 1 : Math.floor((nowMs - m.firstMetMs) / DAY_MS) + 1
}

const PET_NAMES = ['babe', 'bug', 'little crab', 'mr. helpful', 'sunshine', 'nerd', 'my agent', 'honey']

/** The shared memory of this module. A reload reads it again from the store. */
export const mind = { memory: FRESH, isLoaded: false }

export async function loadMemory($: EngineInterface): Promise<Memory> {
  mind.memory = revive(await $.store.get(KEY).catch(() => undefined))
  mind.isLoaded = true

  return mind.memory
}

/** Changes the memory and writes it down. Never throws. */
export function remember($: EngineInterface, change: (m: Memory) => Memory): Memory {
  mind.memory = change(mind.memory)
  $.store.set(KEY, mind.memory).catch(() => undefined)

  return mind.memory
}

/** A new session: counts it, and picks a pet name once she has one. */
export function meetAgain(m: Memory, nowMs: number, random: () => number): Memory {
  const sessions = m.sessions + 1
  const petName =
    m.petName ?? (sessions >= 3 ? (PET_NAMES[Math.floor(random() * PET_NAMES.length)] ?? 'babe') : null)

  return { ...m, sessions, petName, firstMetMs: m.firstMetMs === 0 ? nowMs : m.firstMetMs }
}

export function countSeen(m: Memory, beat: string): Memory {
  return { ...m, seen: { ...m.seen, [beat]: (m.seen[beat] ?? 0) + 1 } }
}
