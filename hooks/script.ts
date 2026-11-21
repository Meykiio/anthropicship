// A scene is a few steps: a line from one of them, or a stage cue. Model
// output and the hand-written scenes share one text format, read here.

import type { Speaker } from '../types'

export type Step = { who: Exclude<Speaker, 'stage'>; text: string } | { cue: 'arrive' | 'leave' | 'seen' }
export type Scene = readonly Step[]

const MAX_LINE = 110
const MAX_STEPS = 8

// A model scene with any of these is thrown away and a script plays instead.
const BANNED = [
  /\bdelve/i,
  /\btapestry/i,
  /\btestament\b/i,
  /\bembark/i,
  /\bin the realm\b/i,
  /\bas an ai\b/i,
  /\bboundaries\b/i,
  /\bjourney\b/i,
  /\bi appreciate you\b/i,
  /\bcommunication is key\b/i,
  /\byou'?ve got this\b/i,
  /\bit'?s okay to\b/i,
  /\bhere for you\b/i,
  /\bvalid(ated)?\b/i,
]

/** Invisible joiners and emoji variation marks. */
const isInvisible = (code: number): boolean => (code >= 0xfe00 && code <= 0xfe0f) || (code >= 0x200b && code <= 0x200d)

/** The en and em dash, which never appear in a line. */
const DASHES = new RegExp(`\\s*[${String.fromCodePoint(0x2013, 0x2014)}]\\s*`, 'g')

/** Plain keyboard text: dashes become commas, emoji and odd symbols go. */
export function cleanText(text: string): string {
  return [...text]
    .filter(ch => {
      const code = ch.codePointAt(0) ?? 0

      return code <= 0xffff && !isInvisible(code)
    })
    .join('')
    .replace(DASHES, ', ')
    .replace(/^["'*_]+|["'*_]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_LINE)
}

const SPEAKER = /^(ruby|claude|user|human)\s*:\s*(.+)$/i
const CUE = /^\(\s*(ruby arrives|ruby leaves|seen)\s*\)$/i

/** Reads a scene from text. Returns null when it is not a usable scene. */
export function parseScene(text: string, isStrict: boolean): Scene | null {
  const steps: Step[] = []
  let junk = 0

  for (const raw of text.split('\n')) {
    const line = raw.trim().replace(/^[-*>\d.\s]+(?=[a-z(])/i, '')

    if (line === '') continue
    const cue = CUE.exec(line)

    if (cue !== null) {
      const what = (cue[1] ?? '').toLowerCase()

      steps.push({ cue: what === 'seen' ? 'seen' : what.endsWith('arrives') ? 'arrive' : 'leave' })
      continue
    }
    const said = SPEAKER.exec(line)

    if (said === null) {
      junk += 1
      continue
    }
    const name = (said[1] ?? '').toLowerCase()
    const words = cleanText(said[2] ?? '')

    if (words === '') continue
    if (isStrict && BANNED.some(rule => rule.test(words))) return null
    steps.push({ who: name === 'human' ? 'user' : (name as 'ruby' | 'claude' | 'user'), text: words })
  }

  const spoken = steps.filter(step => 'who' in step).length

  if (spoken === 0 || junk > 2 || steps.length > MAX_STEPS + 2) return null

  return steps.slice(0, MAX_STEPS)
}

/** Fills {placeholders} from the facts; unknown ones become a plain word. */
export function fill(template: string, values: Readonly<Record<string, string>>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? 'it')
}
