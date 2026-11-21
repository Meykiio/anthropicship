// The room: bubbles over the right heads, and nobody standing frozen.

import { expect, test } from 'claude-code/testing'

import { bubble, wrapLines } from '../hooks/bubbles'
import { EMPTY_STAGE } from '../hooks/empty'
import { nextIdle } from '../hooks/idle'
import { drawRoom, layout } from '../hooks/room'

const NOW = Date.UTC(2026, 10, 21, 13, 0)
const here = { ...EMPTY_STAGE, move: 'here' as const, moveAt: NOW - 60_000 }
const life = { chapter: 'dating', isApart: false, kids: 0 }
const quiet = { his: null, hers: null, last: null, typing: null }

test('long lines wrap into at most three lines and never lose the end silently', () => {
  expect(wrapLines('you made me wait outside for two minutes', 16)).toEqual(['you made me wait', 'outside for two', 'minutes'])
  const long = wrapLines('one two three four five six seven eight nine ten eleven twelve', 10)

  expect(long.length).toBe(3)
  expect(long[2]?.endsWith('...')).toBe(true)
})

test('a bubble stays inside its half of the room, its tail under it', () => {
  const b = bubble('hi', { centerX: 70, minX: 40, maxX: 76, tailRow: 4, isFaded: false })

  expect(b.left).toBeGreaterThanOrEqual(40)
  expect(b.right).toBeLessThanOrEqual(76)
  expect(b.overlays.at(-1)?.row).toBe(4)
})

test('both talking: his bubble over him, hers over her, not overlapping', () => {
  const room = drawRoom({
    stage: here,
    nowMs: NOW,
    frame: 1,
    width: 78,
    hour: 13,
    isWorking: false,
    life,
    speech: { his: 'two minutes', hers: 'you said that an hour ago', last: 'ruby', typing: null },
  })
  const { hisX, herX } = layout(78)
  const rows = room.overlays.filter(o => o.text.length > 1)
  const his = rows.filter(o => o.text.includes('two minutes'))
  const hers = rows.filter(o => o.text.includes('you said'))

  expect(his.length).toBe(1)
  expect(hers.length).toBe(1)
  expect(Math.abs((his[0]?.col ?? 0) + (his[0]?.text.length ?? 0) / 2 - (hisX + 8))).toBeLessThan(10)
  expect((hers[0]?.col ?? 0) >= (his[0]?.col ?? 0) + (his[0]?.text.length ?? 0)).toBe(true)
  expect(herX).toBeGreaterThan(hisX)
})

test('no bubbles when nobody talks, and typing shows dots', () => {
  const still = drawRoom({ stage: here, nowMs: NOW, frame: 1, width: 78, hour: 13, isWorking: true, life, speech: quiet })

  expect(still.overlays.length).toBe(0)
  const typing = drawRoom({ stage: here, nowMs: NOW, frame: 1, width: 78, hour: 13, isWorking: true, life, speech: { ...quiet, typing: 'ruby' } })

  expect(typing.overlays.some(o => o.text.includes('..'))).toBe(true)
})

test('between lines she moves and he reacts; never during a scene', () => {
  expect(nextIdle(here, false, false, 0.1, 0)).toHaveProperty('drift')
  expect(nextIdle(here, false, false, 0.35, 0)).toEqual({ act: 'look' })
  expect(nextIdle(here, false, true, 0.1, 0)).toBeNull()
  expect(nextIdle({ ...here, typing: 'ruby' }, false, false, 0.1, 0)).toBeNull()
})
