// The whole mod inside the engine's test kit: a fake clock and a fake model
// go in, the band above the prompt comes out. Run with `claude plugin test .`

import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'

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
  on('ui.log', () => ({ value: undefined }))
  on('model.complete', () => {
    calls.model += 1
    const r = reply()
    const usage = { input_tokens: 900, output_tokens: 80 }

    return { value: r.isAnswered ? { ...r, usage } : { ...r, status: 500, error: 'x', usage } }
  })
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>engine</Text>
  })

  return { clock, calls }
}

const run = ($: Engine, args: string) =>
  $.command.run({ command: 'ship', args, origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 120 } })

async function bandText($: Engine, surface: 'terminal' | 'desktop'): Promise<string> {
  const ui = await $.ui.mount({ ...BAND, surface })
  const shown = (await ui.findAll({ type: 'Text' })).map(t => t.text).join('|')

  await ui.unmount()

  return shown
}

const scripted = { memory: { prefs: { mode: 'scripted' }, sessions: 4, firstMetMs: NOW - 5 * 86_400_000 } }

test('a returning session opens with her walking in on a stranger', SLOW, async ($, on) => {
  const { clock, calls } = host(on, scripted, () => ({ isAnswered: true, text: 'ruby: hi' }))

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await clock.advance(20_000)
  const shown = await bandText($, 'terminal')

  expect(shown).toContain('ruby')
  expect(calls.model).toBe(0) // scripted mode spends nothing
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })

  expect((await ui.findAll({ type: 'Raster' })).length).toBe(2) // him and her
  await ui.unmount()
})

test('live mode plays what the model wrote', SLOW, async ($, on) => {
  const { clock, calls } = host(on, { memory: { sessions: 4 } }, () => ({
    isAnswered: true,
    text: '(ruby arrives)\nruby: you forgot me again\nclaude: I am so sorry. Who are you?',
  }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await clock.advance(30_000)
  expect(calls.model).toBe(1)
  const shown = await bandText($, 'desktop')

  expect(shown).toContain('you forgot me again')
})

test('a failed model call falls back to a script, and the show goes on', SLOW, async ($, on) => {
  const { clock, calls } = host(on, { memory: { sessions: 4 } }, () => ({ isAnswered: false, reason: 'api-error' }))

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await clock.advance(30_000)
  expect(calls.model).toBe(1)
  expect(await bandText($, 'terminal')).toContain('ruby')
})

test('/ship shows the card, /ship off hides the band, /ship on brings it back', SLOW, async ($, on) => {
  const { clock } = host(on, scripted, () => ({ isAnswered: true, text: 'ruby: hi' }))

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await clock.advance(20_000)
  const card = (await run($, '')).text ?? ''

  expect(card).toContain('Claude & Ruby')
  expect(card).toContain('forgotten her 4 times')
  await run($, 'off')
  expect(await bandText($, 'terminal')).toBe('engine')
  await run($, 'on')
  expect((await run($, 'demo')).text ?? '').toContain('Playing demo scene')
  await clock.advance(8_000)
  expect(await bandText($, 'terminal')).toContain('ruby')
})

test('the band goes quiet again after a scene, and a narrow terminal keeps only the words', SLOW, async ($, on) => {
  const { clock } = host(on, scripted, () => ({ isAnswered: true, text: 'ruby: hi' }))

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await clock.advance(15_000)
  const narrow = await $.ui.mount({ ...BAND, props: { ...BAND.props, bodyColumns: 50 }, surface: 'terminal' })

  expect((await narrow.findAll({ type: 'Raster' })).length).toBe(0)
  await narrow.unmount()
  await clock.advance(120_000)
  const shown = await bandText($, 'terminal')

  expect(shown.includes('typing')).toBe(false)
})

test('/ship say puts the human in the scene', SLOW, async ($, on) => {
  const { clock } = host(on, scripted, () => ({ isAnswered: true, text: 'ruby: hi' }))

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await clock.advance(90_000)
  await run($, 'say get back to work you two')
  await clock.advance(6_000)
  expect(await bandText($, 'terminal')).toContain('get back to work you two')
})
