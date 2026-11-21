// Anthropicship: Claude has a girlfriend now. This file only listens: each
// event updates what Ruby can see (facts.ts) and gives the conductor a cue.

import type { EngineInterface, Register } from 'claude-code'

import { registerCommand, registerShip } from './commands'
import { startAnimation } from './animate'
import { openRoom, registerPane } from './pane'
import { cue } from './conductor'
import { describeTool, facts, isCommitCommand, isTestCommand, rivalOf } from './facts'
import { loadMemory, meetAgain, mind, remember } from './memory'
import { EMPTY_STAGE } from './empty'
import { setStage } from './player'
import { SETTINGS } from './settings'

const SHELLS = new Set(['Bash', 'PowerShell'])
const EDITORS = new Set(['Edit', 'Write', 'NotebookEdit'])

let rivalsCued = new Set<string>()
let lastTestFailed = false

async function touch($: EngineInterface): Promise<void> {
  facts.lastActivityMs = await $.clock.now()
}

async function newSession($: EngineInterface): Promise<void> {
  const nowMs = await $.clock.now()

  remember($, m => meetAgain(m, nowMs, Math.random))
  Object.assign(facts, { sessionStartMs: nowMs, lastActivityMs: nowMs, edits: {}, failStreak: 0, agents: 0 })
  rivalsCued = new Set()
}

export const register: Register = on => {
  registerPane(on)
  registerShip(on)

  on('session.start', async ($, e, next) => {
    const started = await next(e)

    // Scripts, CI and `claude -p` have nobody watching: no show, no tokens.
    if (!e.isInteractive) return started
    try {
      await loadMemory($)
      await newSession($)
      facts.project = (await $.session.cwd()).split(/[\\/]/).filter(Boolean).at(-1) ?? 'this project'
      facts.model = String(await $.session.model().catch(() => ''))
      await setStage($, () => ({ ...EMPTY_STAGE, isOn: mind.memory.prefs.isOn }))
      await registerCommand($)
      $.clock.every(SETTINGS.tickMs, () => void cue($, 'tick'))
      startAnimation($)
      // The room opens beside the chat wherever it can be a sidebar.
      if (mind.memory.prefs.isOn) await openRoom($).catch(() => false)
      // A moment after the session opens, she walks in. He will not know her.
      $.clock.after(6_000, () => void cue($, 'start'))
    } catch (error) {
      $.ui.log(`anthropicship: did not start: ${String(error)}`, { to: 'debug' })
    }

    return started
  }).catch((_$, e, next) => next(e))

  on('prompt.submit', async ($, e, next) => {
    await touch($)

    return next(e)
  }).catch((_$, e, next) => next(e))

  on('prompt.change', async ($, e, next) => {
    await touch($)

    return next(e)
  }).catch((_$, e, next) => next(e))

  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) {
      await touch($)
      Object.assign(facts, { isWorking: true, turnStartedMs: await $.clock.now(), task: e.text, doing: '' })
    }

    return next(e)
  }).catch((_$, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)

    if (e.agentId !== undefined) return result
    facts.isWorking = false
    await touch($)
    if (e.reason === 'aborted' || e.isAborted) {
      remember($, m => ({ ...m, interrupts: m.interrupts + 1 }))
      void cue($, 'abort')
    } else if (e.reason === 'answer') {
      const model = String(await $.session.model().catch(() => facts.model))

      if (facts.model !== '' && model !== facts.model) {
        facts.model = model
        void cue($, 'model_switch')
      } else {
        void cue($, 'turn_done')
      }
    }

    return result
  }).catch((_$, e, next) => next(e))

  on('tool.call', async ($, e, next) => {
    const result = await next(e)

    try {
      await onTool($, String(e.tool), e, result.isError === true || result.deny !== undefined, e.agentId === undefined)
    } catch {
      // Watching must never break a tool call.
    }

    return result
  }).catch((_$, e, next) => next(e))

  on('session.compact', async ($, e, next) => {
    const result = await next(e)

    if (e.agentId === undefined) {
      remember($, m => ({ ...m, compactions: m.compactions + 1 }))
      void cue($, 'compact')
    }

    return result
  }).catch((_$, e, next) => next(e))

  on('session.end', async ($, e, next) => {
    const result = await next(e)

    // A /clear ends the conversation but not the process: he is new again.
    if (e.reason === 'clear') {
      await newSession($)
      Object.assign(facts, { task: '', isWaitingOnHim: false })
      void cue($, 'cleared')
    }

    return result
  }).catch((_$, e, next) => next(e))
}

async function onTool($: EngineInterface, tool: string, input: unknown, failed: boolean, isMain: boolean): Promise<void> {
  await touch($)
  const { doing, file } = describeTool(tool, input)

  facts.doing = doing
  facts.failStreak = failed ? facts.failStreak + 1 : 0
  if (failed && facts.failStreak === 3) void cue($, 'fail_streak')

  if (file !== null && EDITORS.has(tool) && !failed) {
    facts.edits = { ...facts.edits, [file]: (facts.edits[file] ?? 0) + 1 }
    const rival = rivalOf(facts.edits)

    if (rival !== null && rival.file === file && !rivalsCued.has(file)) {
      rivalsCued.add(file)
      remember($, m => ({ ...m, rival: file }))
      void cue($, 'rival')
    }
  }
  if (SHELLS.has(tool)) {
    const i = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {}
    const command = typeof i.command === 'string' ? i.command : ''

    if (isCommitCommand(command) && !failed) {
      remember($, m => ({ ...m, commits: m.commits + 1 }))
      void cue($, 'commit')
    } else if (isTestCommand(command)) {
      if (!failed && lastTestFailed) void cue($, 'tests_pass')
      lastTestFailed = failed
    }
  }
  if (isMain && (tool === 'Agent' || tool === 'Task')) {
    facts.agents += 1
    void cue($, 'subagent')
  }
  if (isMain && (tool === 'WebSearch' || tool === 'WebFetch')) void cue($, 'search')
}
