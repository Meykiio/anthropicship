// The director decides when they talk. Run with `claude plugin test .`

import { expect, test } from 'claude-code/testing'

import { decide, stayMs } from '../hooks/director'
import type { Room } from '../hooks/director'

const NOW = 10_000_000

const room = (over: Partial<Room> = {}): Room => ({
  nowMs: NOW,
  isHere: false,
  leaveAtMs: 0,
  lastSceneMs: 0,
  isPlaying: false,
  pace: 'normal',
  isWorking: false,
  turnRunningMs: 0,
  isWaitingOnHim: false,
  idleMs: 0,
  hour: 15,
  sessionMs: 60_000,
  isFirstSession: false,
  played: {},
  ...over,
})

const always = () => 0
const never = () => 0.999

test('a new session opens with a first date the first time, a reunion after', () => {
  expect(decide('start', room({ isFirstSession: true }), never)).toBe('first_date')
  expect(decide('start', room(), never)).toBe('reunion')
})

test('the human asking always wins, even mid-scene', () => {
  expect(decide('say', room({ isPlaying: true }), never)).toBe('user_says')
  expect(decide('summon', room({ isPlaying: true }), never)).toBe('summon')
})

test('no scene starts too soon after the last one', () => {
  expect(decide('commit', room({ lastSceneMs: NOW - 5_000 }), always)).toBeNull()
  expect(decide('commit', room({ lastSceneMs: NOW - 120_000 }), always)).toBe('commit')
})

test('when he is locked in on a long task she distracts him, sometimes with success', () => {
  const busy = room({ isHere: true, leaveAtMs: NOW + 60_000, isWorking: true, turnRunningMs: 300_000 })

  expect(decide('tick', busy, always)).toBe('spell')
  let n = 0
  const seq = () => [0, 0.5][n++ % 2] ?? 0

  expect(decide('tick', busy, seq)).toBe('distract')
})

test('she leaves when her visit is over, but not while he is mid-task', () => {
  expect(decide('tick', room({ isHere: true, leaveAtMs: NOW - 1 }), never)).toBe('leave')
  const busy = room({ isHere: true, leaveAtMs: NOW - 1, isWorking: true, turnRunningMs: 300_000 })

  expect(decide('tick', busy, never)).toBeNull()
})

test('a turn that ends while she waits on an answer gets a late reply', () => {
  expect(decide('turn_done', room({ isHere: true, isWaitingOnHim: true }), always)).toBe('late_reply')
})

test('the human away, or a late hour, shapes what she drops by for', () => {
  expect(decide('tick', room({ idleMs: 10 * 60_000 }), always)).toBe('human_away')
  expect(decide('tick', room({ hour: 2 }), always)).toBe('late_night')
  expect(decide('tick', room({ hour: 2, played: { late_night: 1 } }), always)).toBe('drop_by')
})

test('most ticks are silent', () => {
  let scenes = 0

  for (let i = 0; i < 1000; i += 1) {
    if (decide('tick', room(), Math.random) !== null) scenes += 1
  }
  // Normal pace: about one visit per 14 minutes, ticks every 20 seconds.
  expect(scenes).toBeLessThan(60)
})

test('a visit lasts at least two minutes', () => {
  expect(stayMs('calm', () => 0)).toBeGreaterThanOrEqual(120_000)
})
