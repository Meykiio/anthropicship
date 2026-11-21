// Reading the scenes the model writes.

import { expect, test } from 'claude-code/testing'

import { cleanText, parseScene } from '../hooks/script'

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

test('a stage cue written as a spoken line is still the cue', () => {
  expect(parseScene(['ruby: (ruby arrives)', 'ruby: hi', 'ruby: (ruby leaves)'].join(String.fromCodePoint(10)), true)).toEqual([
    { cue: 'arrive' },
    { who: 'ruby', text: 'hi' },
    { cue: 'leave' },
  ])
})

test('his answer as a bullet list stays his, and a spoken "(seen)" is the cue', () => {
  const scene = parseScene('claude: Here is a summary:\n- I was running the tests.\n- I did not reply.\nruby: (seen)', true)

  expect(scene).toEqual([
    { who: 'claude', text: 'Here is a summary:' },
    { who: 'claude', text: '- I was running the tests.' },
    { who: 'claude', text: '- I did not reply.' },
    { cue: 'seen' },
  ])
})

const EM = String.fromCodePoint(0x2014)
