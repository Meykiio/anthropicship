// The whole mod inside the engine's test kit: a fake clock and a fake model
// go in, the band above the prompt comes out. Run with `claude plugin test .`

import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { ModelCompleteResult, On } from 'claude-code'

const NOW = Date.UTC(2026, 10, 21, 14, 0)
const SLOW = { timeoutMs: 60_000 }

const BAND = {
  plugin: 'anthropicship',
  component: 'AbovePrompt',
  requestId: 'band',
  props: {
    hasSurvey: false,
    isCollapsed: false,
    isWorking: false,
    maxRows: 12,
    bodyColumns: 120,
    scroll: { offset: 0, bodyRows: 11 },
    view: {},
  },
} as const

type ModelReply = { isAnswered: true; text: string } | { isAnswered: false; reason: 'api-error' }

function host(on: On, stored: Record<string, unknown>, reply: () => ModelReply) {
  const clock = mock.clock(on, { now: NOW })
  const calls = { model: 0 }

  mock.store(on, stored)
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.cwd', () => ({ value: '/home/dev/shop' }))
  on('session.model', () => ({ value: 'claude-opus-5-5' }))
  on('command.register', () => ({ value: { command: 'ship' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.log', () => ({ value: undefined }))
  on('model.complete', () => {
    calls.model += 1
    const r = reply()
    const usage = { input_tokens: 900, output_tokens: 80 }

    // Only the fields the mod reads; the rest of a real result does not matter here.
    const value = r.isAnswered ? { ...r, usage } : { ...r, status: 500, error: 'x', usage }

    return { value: value as unknown as ModelCompleteResult }
  })
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>engine</Text>
  })

  return { clock, calls }
}

const run = ($: Engine, args: string) =>
  $.command.run({ command: 'ship', args, origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 120 } })

async function textOf($: Engine, mount: Parameters<Engine['ui']['mount']>[0]): Promise<{ text: string; rasters: number; svgs: number }> {
  const ui = await $.ui.mount(mount)
  const text = (await ui.findAll({ type: 'Text' })).map(t => t.text).join('|')
  const rasters = (await ui.findAll({ type: 'Raster' })).length
  const svgs = (await ui.findAll({ type: 'Svg' })).length

  await ui.unmount()

  return { text, rasters, svgs }
}

const band = ($: Engine, surface: 'terminal' | 'desktop') => textOf($, { ...BAND, surface })
const PANE = {
  plugin: 'anthropicship',
  component: 'Pane',
  requestId: 'room',
  props: { title: 'Claude & Ruby', isFocused: false, bodyColumns: 64, placement: 'dock', scroll: { offset: 0, bodyRows: 30 }, view: {} },
} as const
const pane = ($: Engine, surface: 'terminal' | 'desktop') => textOf($, { ...PANE, surface })

const reunion = '(ruby arrives)\nruby: you forgot me again\nclaude: I am so sorry. Who are you?'
const returning = { memory: { sessions: 4, firstMetMs: NOW - 5 * 86_400_000, lastTalkMs: NOW - 3 * 3_600_000 } }

test('she rings, he lets her in, and the panel shows the room and keeps every line', SLOW, async ($, on) => {
  const { clock, calls } = host(on, returning, () => ({ isAnswered: true, text: reunion }))

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await clock.advance(40_000)
  expect(calls.model).toBe(1)
  const terminal = await pane($, 'terminal')

  expect(terminal.rasters).toBe(1)
  for (const said of ['ding dong', 'ruby walked in', 'you forgot me again', 'Who are you?']) expect(terminal.text).toContain(said)
  expect((await pane($, 'desktop')).svgs).toBe(1)
  // Nothing of theirs in the work area: the band above the prompt is the engine's own.
  expect((await band($, 'terminal')).text).toBe('engine')
})

test('when the model cannot answer, nothing canned plays: she just does not come', SLOW, async ($, on) => {
  const { clock, calls } = host(on, returning, () => ({ isAnswered: false, reason: 'api-error' }))

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await clock.advance(60_000)
  expect(calls.model).toBeGreaterThan(0)
  expect((await band($, 'terminal')).text).toBe('engine')
  expect((await pane($, 'terminal')).text).toContain('Nothing yet')
})

test('/ship shows the card, /ship room opens the room, /ship off hides it all', SLOW, async ($, on) => {
  const { clock } = host(on, returning, () => ({ isAnswered: true, text: reunion }))

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await clock.advance(16_000)
  const card = (await run($, '')).text ?? ''

  expect(card).toContain('Claude & Ruby')
  expect(card).toContain('forgotten her 4 times')
  expect((await run($, 'room')).text ?? '').toContain('open')
  await run($, 'off')
  expect((await band($, 'terminal')).text).toBe('engine')
  expect((await run($, 'call')).text ?? '').toContain('/ship on')
  await run($, 'on')
  expect((await run($, 'call')).text ?? '').not.toContain('/ship on')
})

test('a session nobody watches (claude -p, scripts) gets no show and spends nothing', SLOW, async ($, on) => {
  const { clock, calls } = host(on, returning, () => ({ isAnswered: true, text: 'ruby: hi' }))

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: false })
  await clock.advance(30 * 60_000)
  expect(calls.model).toBe(0)
  expect((await band($, 'terminal')).text).toBe('engine')
})

test('/ship say puts the human in the scene and in the log', SLOW, async ($, on) => {
  const { clock } = host(on, returning, () => ({
    isAnswered: true,
    text: 'user: get back to work you two\nruby: they can SEE us??',
  }))

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await clock.advance(40_000)
  await run($, 'say get back to work you two')
  await clock.advance(40_000)
  const log = (await pane($, 'terminal')).text

  expect(log).toContain('get back to work you two')
  expect(log).toContain('they can SEE us??')
})
