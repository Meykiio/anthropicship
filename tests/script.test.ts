// Reading scenes, from the model and from the hand-written pool.

import { expect, test } from 'claude-code/testing'

import { DIRECTIONS } from '../hooks/beats'
import type { Beat } from '../hooks/beats'
import { everyScript } from '../hooks/scenes'
import { cleanText, fill, parseScene } from '../hooks/script'

test('a model scene is read line by line, cues included', () => {
  const scene = parseScene('(ruby arrives)\nruby: hey\nclaude: One sec.\n(seen)\nruby: wow', true)

  expect(scene).toEqual([
    { cue: 'arrive' },
    { who: 'ruby', text: 'hey' },
    { who: 'claude', text: 'One sec.' },
    { cue: 'seen' },
    { who: 'ruby', text: 'wow' },
  ])
})

test('dashes become commas and emoji go', () => {
  expect(cleanText(`ok ${EM} fine ${String.fromCodePoint(0x1f600)}`)).toBe('ok, fine')
  expect(cleanText('"quoted"')).toBe('quoted')
})

test('a scene with AI tells or no lines is refused', () => {
  expect(parseScene('ruby: let us delve into this', true)).toBeNull()
  expect(parseScene('Here is a scene for you!\nThe end.\nThanks.', true)).toBeNull()
  expect(parseScene('', true)).toBeNull()
})

test('numbered or bulleted model lines still read', () => {
  expect(parseScene('1. ruby: hi\n- claude: Hello.', true)).toEqual([
    { who: 'ruby', text: 'hi' },
    { who: 'claude', text: 'Hello.' },
  ])
})

test('placeholders fill from the facts', () => {
  expect(fill('you touched {file} {count} times', { file: 'auth.ts', count: '9' })).toBe('you touched auth.ts 9 times')
  expect(fill('{nope}', {})).toBe('it')
})

const EM = String.fromCodePoint(0x2014)
const EN = String.fromCodePoint(0x2013)

const SAMPLE = {
  project: 'shop', task: 'fix login', doing: 'Editing auth.ts', time: '01:42', minutes: '12', file: 'auth.ts',
  count: '9', forgot: '13', sessions: '14', pet: 'bug', days: '12', commits: '30', interrupts: '7',
  model: 'claude-sonnet-5-5', said: 'hello you two',
}

test('every hand-written scene reads, fits the band and keeps the house rules', () => {
  const scripts = everyScript()

  expect(scripts.length).toBeGreaterThan(70)
  for (const [beat, text] of scripts) {
    const filled = fill(text, SAMPLE)
    const scene = parseScene(filled, true)

    if (scene === null) throw new Error(`unreadable ${beat} scene: ${text}`)
    expect(scene.length).toBeLessThanOrEqual(8)
    expect(text.includes(EM) || text.includes(EN)).toBe(false)
    for (const step of scene) {
      if ('who' in step) expect(step.text.length).toBeLessThanOrEqual(100)
    }
  }
})

test('every beat but the model-only ones has hand-written scenes', () => {
  const covered = new Set(everyScript().map(([beat]) => beat))

  for (const beat of Object.keys(DIRECTIONS) as Beat[]) {
    expect([beat, covered.has(beat)]).toEqual([beat, true])
  }
})
