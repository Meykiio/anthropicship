// What the writer is told: few facts, the right ones, the scene last.

import { expect, test } from 'claude-code/testing'

import { facts } from '../hooks/facts'
import { FRESH } from '../hooks/memory'
import { askFor } from '../hooks/prompt'

const NOW = Date.UTC(2026, 10, 21, 0, 40)

function setUp(): void {
  Object.assign(facts, {
    project: 'pz-web',
    task: 'fix the empty cart crash',
    isWorking: true,
    turnStartedMs: NOW - 9 * 60_000,
    doing: 'editing CheckoutPage.tsx',
    edits: { 'CheckoutPage.tsx': 7 },
    lastActivityMs: 0,
  })
}

const memory = { ...FRESH, sessions: 23, firstMetMs: NOW - 11 * 86_400_000, commits: 37, petName: 'bug' }

test('a jealousy scene gets the file and nothing about the clock', () => {
  setUp()
  const ask = askFor('rival_file', memory, NOW, false, '')

  expect(ask).toContain('CheckoutPage.tsx 7 times')
  expect(ask.includes('local time')).toBe(false)
  expect(ask.trim().endsWith('Do not quote his work back to him.')).toBe(true)
})

test('only the late-night scene hears the time', () => {
  setUp()
  expect(askFor('late_night', memory, NOW, true, '')).toContain('local time')
  expect(askFor('late_night', memory, NOW, true, '')).toContain('(ruby arrives)')
})

test('private mode keeps the prompt out', () => {
  setUp()
  expect(askFor('spell', memory, NOW, false, '')).toContain('fix the empty cart crash')
  const quiet = askFor('spell', { ...memory, prefs: { ...memory.prefs, isPrivate: true } }, NOW, false, '')

  expect(quiet.includes('fix the empty cart crash')).toBe(false)
})

test('an unknown start time never turns into a giant number', () => {
  setUp()
  facts.isWorking = false
  facts.turnStartedMs = 0
  expect(askFor('late_reply', memory, NOW, false, '')).toContain('for 1 minutes')
  expect(askFor('human_away', memory, NOW, false, '')).toContain('for 1 minutes')
})
