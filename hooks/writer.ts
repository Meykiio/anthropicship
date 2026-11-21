// Writes a scene with the small model. Every scene is written fresh from
// what is happening; when the model cannot answer, nothing plays.

import type { EngineInterface } from 'claude-code'

import type { Beat } from './beats'
import { BIBLE } from './bible'
import { MUST } from './life'
import type { Milestone } from './life'
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
  opts: { isArriving: boolean; said: string; extra?: string },
): Promise<Scene | null> {
  const must = beat in MUST ? MUST[beat as Milestone] : undefined
  const request = askFor(beat, m, nowMs, opts.isArriving, opts.said, opts.extra ?? '')
  const first = await ask($, request)

  // A milestone changes their life for good, so the scene must show it happen.
  if (first === null || must === undefined || happened(first, must.proof)) return first
  $.ui.log(`anthropicship: the ${beat} scene did not happen on the page; asking once more`, { to: 'debug' })
  const again = await ask($, `${request}\n\nThe last draft never got there. ${must.outcome}: say it outright.`)

  return again !== null && happened(again, must.proof) ? again : null
}

function happened(scene: Scene, proof: RegExp): boolean {
  return proof.test(scene.map(step => ('who' in step ? step.text : '')).join(' '))
}

async function ask($: EngineInterface, prompt: string): Promise<Scene | null> {
  try {
    const reply = await $.model.complete({
      model: SETTINGS.model,
      system: [{ text: BIBLE, cache: true }],
      prompt,
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
