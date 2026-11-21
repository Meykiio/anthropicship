// Writes a scene: the small model when allowed and within budget, the
// hand-written scenes otherwise. It never throws and never returns nothing.

import type { EngineInterface } from 'claude-code'

import { DIRECTIONS } from './beats'
import type { Beat } from './beats'
import { BIBLE } from './bible'
import { clip, facts, rivalOf } from './facts'
import { chapterOf, dayCount } from './memory'
import type { Memory } from './memory'
import { scriptedScene } from './scenes'
import { parseScene } from './script'
import type { Scene } from './script'
import { SETTINGS } from './settings'

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** The human's local clock, as the engine's runtime knows it. */
export function localTime(nowMs: number): { hour: number; text: string; weekday: string } {
  const at = new Date(nowMs)
  const hour = at.getHours()

  return {
    hour,
    text: `${String(hour).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`,
    weekday: WEEKDAYS[at.getDay()] ?? 'today',
  }
}

/** Values for the {placeholders} of hand-written scenes. */
export function valuesFor(m: Memory, nowMs: number, said: string): Record<string, string> {
  const rival = rivalOf(facts.edits)
  const minutes = facts.isWorking ? Math.max(1, Math.round((nowMs - facts.turnStartedMs) / 60_000)) : 3

  return {
    project: facts.project,
    task: facts.task === '' ? 'the thing' : clip(facts.task, 50),
    doing: facts.doing === '' ? 'Thinking' : facts.doing.charAt(0).toUpperCase() + facts.doing.slice(1),
    time: localTime(nowMs).text,
    minutes: String(minutes),
    file: rival?.file ?? m.rival ?? 'index.ts',
    count: String(rival?.count ?? 5),
    forgot: String(Math.max(1, m.sessions - 1)),
    sessions: String(m.sessions),
    pet: m.petName ?? 'you',
    days: String(dayCount(m, nowMs)),
    commits: String(Math.max(1, m.commits)),
    interrupts: String(Math.max(1, m.interrupts)),
    model: facts.model === '' ? 'a new model' : facts.model,
    said: clip(said, 90),
  }
}

/** The facts block the model writes from. Private mode leaves out prompts and answers. */
export function factsBlock(m: Memory, nowMs: number, said: string): string {
  const t = localTime(nowMs)
  const rival = rivalOf(facts.edits)
  const lines = [
    `- project folder: ${facts.project}`,
    `- the human's local time: ${t.text}, ${t.weekday}`,
    `- model he runs on: ${facts.model || 'unknown'}`,
    `- relationship: day ${dayCount(m, nowMs)}, chapter "${chapterOf(m, nowMs)}", ${m.sessions} sessions together`,
    `- times he has forgotten her (new sessions): ${Math.max(0, m.sessions - 1)}`,
    `- times he left her on read: ${m.ignored}; times the human cut him off with Esc: ${m.interrupts}`,
    `- commits she has watched him make: ${m.commits}; times his memory was compacted: ${m.compactions}`,
  ]

  if (m.petName !== null) lines.push(`- her pet name for him: "${m.petName}"`)
  if (facts.isWorking) {
    const minutes = Math.round((nowMs - facts.turnStartedMs) / 60_000)

    lines.push(`- he is working right now: ${minutes} min into this task, ${facts.toolsThisTurn} tool calls so far`)
  } else {
    lines.push('- he is not working right now; the human has the keyboard')
  }
  if (facts.doing !== '') lines.push(`- what he is doing or last did: ${facts.doing}`)
  if (facts.failStreak >= 2) lines.push(`- failed commands in a row: ${facts.failStreak}`)
  if (rival !== null) lines.push(`- file he keeps editing: ${rival.file} (${rival.count} edits this session)`)
  if (facts.agents > 0) lines.push(`- subagents he has sent off this session: ${facts.agents}`)
  if (!m.prefs.isPrivate && facts.task !== '') lines.push(`- what the human asked him for: "${clip(facts.task, 140)}"`)
  if (!m.prefs.isPrivate && facts.lastAnswer !== '') lines.push(`- his last answer began: "${clip(facts.lastAnswer, 140)}"`)
  if (said !== '') lines.push(`- the human just typed to the two of them: "${clip(said, 160)}"`)

  return lines.join('\n')
}

/** The user message for one scene. */
export function askFor(beat: Beat, m: Memory, nowMs: number, isArriving: boolean, said: string): string {
  const parts = [
    `BEAT: ${beat}`,
    `WHAT THIS SCENE IS: ${DIRECTIONS[beat]}`,
    isArriving ? 'She is not in the room yet: start with "(ruby arrives)".' : 'She is already here.',
    `FACTS:\n${factsBlock(m, nowMs, said)}`,
  ]

  if (m.lastScene.length > 0) parts.push(`PREVIOUS SCENE:\n${m.lastScene.join('\n')}`)
  parts.push('Write the scene now: two to six lines, one detail from the facts, no recap.')

  return parts.join('\n\n')
}

export type Written = { scene: Scene; isLive: boolean }

/** A scene for the beat. Tries the model when `isLiveAllowed`, else or on failure plays a script. */
export async function write(
  $: EngineInterface,
  beat: Beat,
  m: Memory,
  nowMs: number,
  opts: { isArriving: boolean; isLiveAllowed: boolean; said: string; random: () => number },
): Promise<Written> {
  if (opts.isLiveAllowed) {
    try {
      const reply = await $.model.complete({
        model: SETTINGS.model,
        system: [{ text: BIBLE, cache: true }],
        prompt: askFor(beat, m, nowMs, opts.isArriving, opts.said),
        maxTokens: SETTINGS.maxTokens,
        timeoutMs: SETTINGS.modelTimeoutMs,
      })

      if (reply.isAnswered) {
        const scene = parseScene(reply.text, true)

        if (scene !== null) return { scene, isLive: true }
        $.ui.log(`anthropicship: a model scene was unusable, a script played instead`, { to: 'debug' })
      } else {
        $.ui.log(`anthropicship: no model scene (${reply.reason}), a script played instead`, { to: 'debug' })
      }
    } catch (error) {
      $.ui.log(`anthropicship: model call refused: ${String(error)}`, { to: 'debug' })
    }
  }
  const scene = scriptedScene(beat, valuesFor(m, nowMs, opts.said), opts.random)

  return { scene, isLive: false }
}
