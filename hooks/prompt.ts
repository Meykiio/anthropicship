// What the writer is told for one scene. Each beat sees only the facts that
// belong to it: given everything, a small model grabs the same two details
// (the clock, the file) every time and forgets what the scene is about.

import type { Beat } from './beats'
import { DIRECTIONS } from './beats'
import { clip, facts, rivalOf } from './facts'
import { storySoFar } from './life'
import type { Memory } from './memory'
import { localTime, timeContext } from './time'

type Key =
  | 'time' | 'forgot' | 'ignored' | 'interrupts' | 'commits' | 'compactions' | 'working' | 'doing'
  | 'fails' | 'rival' | 'agents' | 'task' | 'model' | 'said' | 'project' | 'away'

const FACTS_FOR: Readonly<Record<Beat, readonly Key[]>> = {
  first_date: ['project'],
  reunion: ['forgot'],
  drop_by: ['doing'],
  distract: ['working', 'doing'],
  spell: ['working', 'task'],
  small_talk: [],
  late_reply: ['working', 'ignored'],
  human_away: ['away', 'task'],
  late_night: ['time'],
  interrupted: ['interrupts'],
  fail_streak: ['fails', 'doing'],
  tests_pass: ['doing'],
  commit: ['commits'],
  rival_file: ['rival'],
  subagents: ['agents', 'task'],
  googling: ['doing'],
  amnesia: ['compactions'],
  cleared: [],
  model_switch: ['model'],
  long_session: ['working'],
  leave: [],
  user_says: ['said'],
  summon: [],
  ask_out: [],
  move_in: [],
  propose: [],
  wedding: [],
  baby: [],
  fight: ['working', 'rival'],
  breakup: ['ignored', 'forgot'],
  make_up: [],
}

function factLine(key: Key, m: Memory, nowMs: number, said: string): string | null {
  const t = localTime(nowMs)
  const rival = rivalOf(facts.edits)
  const since = (startMs: number): number => (startMs <= 0 ? 1 : Math.min(600, Math.max(1, Math.round((nowMs - startMs) / 60_000))))
  // The turn that is running, or the one that just ended: how long he was gone.
  const minutes = since(facts.turnStartedMs)

  switch (key) {
    case 'time':
      return `the human's local time is ${t.text} on a ${t.weekday}`
    case 'forgot':
      return `he has forgotten her ${Math.max(1, m.sessions - 1)} times now (once per new session)`
    case 'ignored':
      return `he has left her on read ${Math.max(1, m.ignored)} times in total`
    case 'interrupts':
      return `the human has cut him off with Esc ${Math.max(1, m.interrupts)} times`
    case 'commits':
      return `this is about commit number ${m.commits} she has watched him make`
    case 'compactions':
      return `his memory has been compacted ${Math.max(1, m.compactions)} times since they met`
    case 'working':
      return facts.isWorking
        ? `he has been heads-down on this task for ${minutes} minutes`
        : `he was heads-down for ${minutes} minutes and she waited the whole time`
    case 'doing':
      return facts.doing === '' ? null : `right now he is ${facts.doing}`
    case 'fails':
      return `${facts.failStreak} commands just failed in a row (last one: ${facts.doing || 'a command'})`
    case 'rival':
      return rival === null ? null : `he has edited ${rival.file} ${rival.count} times this session`
    case 'agents':
      return `he has sent off ${Math.max(1, facts.agents)} subagents this session`
    case 'task':
      return m.prefs.isPrivate || facts.task === '' ? null : `the human asked him for: "${clip(facts.task, 120)}"`
    case 'model':
      return `he now runs on ${facts.model || 'a different model'}`
    case 'said':
      return said === '' ? null : `the human just typed to them: "${clip(said, 160)}"`
    case 'project':
      return `the project folder is called ${facts.project}`
    case 'away':
      return `the human has not touched the keyboard for ${since(facts.lastActivityMs)} minutes`
  }
}

/** The user message for one scene: who they are now, a fact or two, then the scene to write. */
export function askFor(beat: Beat, m: Memory, nowMs: number, isArriving: boolean, said: string): string {
  const story = [
    storySoFar(m.life, nowMs),
    m.petName === null ? '' : `She calls him "${m.petName}" sometimes, not every line.`,
    isArriving ? 'She is not in the room yet: the scene starts with "(ruby arrives)".' : 'She is already in the room.',
  ].filter(Boolean)
  const details = FACTS_FOR[beat]
    .map(key => factLine(key, m, nowMs, said))
    .filter((line): line is string => line !== null)
  const parts = [timeContext(nowMs, m.lastTalkMs), story.join(' ')]

  if (details.length > 0) parts.push(`A DETAIL YOU MAY USE (optional, once at most):\n- ${details.join('\n- ')}`)
  if (m.lastScene.length > 0) parts.push(`PREVIOUS SCENE (do not repeat its jokes or details):\n${m.lastScene.join('\n')}`)
  parts.push(`THE SCENE TO WRITE: ${DIRECTIONS[beat]}`)
  parts.push('Two to six lines. Stay on this scene. Do not quote his work back to him.')

  return parts.join('\n\n')
}
