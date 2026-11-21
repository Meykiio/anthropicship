// Their life together moves on by itself, over real days.

import { expect, test } from 'claude-code/testing'

import { NEW_LIFE, afterFirstMeeting, applyMilestone, dueMilestone, lifeLine, storySoFar } from '../hooks/life'
import type { Life } from '../hooks/life'

const DAY = 86_400_000
const NOW = Date.UTC(2026, 10, 21, 20, 0)
const yes = () => 0
const no = () => 0.999

const met = afterFirstMeeting(NEW_LIFE, NOW - 2 * DAY)

test('the first meeting starts the story', () => {
  expect(met.chapter).toBe('talking')
  expect(met.events.map(e => e.what)).toEqual(['they met'])
})

test('nothing happens before its time, and a due step needs a lucky roll', () => {
  expect(dueMilestone({ ...met, since: NOW - 3_600_000 }, NOW, 'normal', yes)).toBeNull()
  expect(dueMilestone(met, NOW, 'normal', no)).toBeNull()
  expect(dueMilestone(met, NOW, 'normal', yes)).toBe('ask_out')
})

test('the whole road: dating, moving in, engaged, married, a kid', () => {
  let life: Life = met

  for (const [step, chapter] of [
    ['ask_out', 'dating'],
    ['move_in', 'living together'],
    ['propose', 'engaged'],
    ['wedding', 'married'],
    ['baby', 'parents'],
  ] as const) {
    life = applyMilestone(life, step, NOW, yes)
    expect(life.chapter).toBe(chapter)
  }
  expect(life.kids).toBe(1)
  expect(lifeLine({ life, sessions: 9 }, NOW)).toContain('parents . 1 kid')
})

test('a breakup keeps her away until they make up, days later', () => {
  const dating = applyMilestone(met, 'ask_out', NOW - 5 * DAY, yes)
  const apart = applyMilestone(dating, 'breakup', NOW - 2 * DAY, yes)

  expect(apart.isApart).toBe(true)
  expect(dueMilestone(apart, NOW - 2 * DAY + 3_600_000, 'normal', yes)).toBeNull()
  expect(dueMilestone(apart, NOW + 3 * DAY, 'normal', yes)).toBe('make_up')
  expect(applyMilestone(apart, 'make_up', NOW, yes).isApart).toBe(false)
})

test('at most one step a day', () => {
  const justMoved = { ...applyMilestone(met, 'ask_out', NOW - 2 * 3_600_000, yes), since: NOW - 30 * DAY }

  expect(dueMilestone(justMoved, NOW, 'normal', yes)).toBeNull()
})

test('the writer gets the story with real dates', () => {
  const life = applyMilestone(met, 'ask_out', NOW - DAY, yes)
  const story = storySoFar(life, NOW)

  expect(story).toContain('THEIR LIFE: dating')
  expect(story).toContain('they met')
  expect(story).toContain('they started dating')
  expect(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Nov|Dec) \d+/.test(story)).toBe(true)
})
