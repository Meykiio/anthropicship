// Writes a scene with the small model. Every scene is written fresh from
// what is happening; when the model cannot answer, nothing plays.

import type { EngineInterface } from 'claude-code'

import type { Beat } from './beats'
import { BIBLE } from './bible'
import type { Memory } from './memory'
import { askFor } from './prompt'
import { parseScene } from './script'
import type { Scene } from './script'
import { SETTINGS } from './settings'

/** A scene for the beat, or null when the model could not write a usable one. */
export async function write(
  $: EngineInterface,
  beat: Beat,
  m: Memory,
  nowMs: number,
  opts: { isArriving: boolean; said: string },
): Promise<Scene | null> {
  try {
    const reply = await $.model.complete({
      model: SETTINGS.model,
      system: [{ text: BIBLE, cache: true }],
      prompt: askFor(beat, m, nowMs, opts.isArriving, opts.said),
      maxTokens: SETTINGS.maxTokens,
      timeoutMs: SETTINGS.modelTimeoutMs,
    })

    if (!reply.isAnswered) {
      $.ui.log(`anthropicship: no scene (${reply.reason})`, { to: 'debug' })

      return null
    }
    const scene = parseScene(reply.text, true)

    if (scene === null) $.ui.log('anthropicship: the model wrote an unusable scene; skipped', { to: 'debug' })

    return scene
  } catch (error) {
    $.ui.log(`anthropicship: model call refused: ${String(error)}`, { to: 'debug' })

    return null
  }
}
