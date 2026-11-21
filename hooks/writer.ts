// Writes a scene: the small model when allowed and within budget, the
// hand-written scenes otherwise. It never throws and never returns nothing.

import type { EngineInterface } from 'claude-code'

import type { Beat } from './beats'
import { BIBLE } from './bible'
import { clip, facts, rivalOf } from './facts'
import { askFor } from './prompt'
import { dayCount } from './memory'
import type { Memory } from './memory'
import { scriptedScene } from './scenes'
import { parseScene } from './script'
import type { Scene } from './script'
import { SETTINGS } from './settings'
import { localTime } from './time'

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
