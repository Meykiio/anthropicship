// The /ship command, wired to the engine. Parsing and the card are in command.ts.

import type { EngineInterface, On } from 'claude-code'

import { HELP, parseShip, statusCard } from './command'
import { breakupScene, cue, demo, liveThisHour, perform } from './conductor'
import { FRESH, mind, remember } from './memory'
import { hush, show } from './player'

export async function registerCommand($: EngineInterface): Promise<void> {
  await $.command.register({
    name: 'ship',
    description: 'Anthropicship: how Claude and Ruby are doing, and the switches (call, say, demo, pace, off)',
    argumentHint: '[call|say <text>|demo|pace|live|scripted|private|off|on|breakup|help]',
  })
}

async function answer($: EngineInterface, args: string): Promise<string> {
  const action = parseShip(args, mind.memory.prefs)
  const nowMs = await $.clock.now()

  switch (action.kind) {
    case 'status':
      return statusCard(mind.memory, nowMs, liveThisHour(nowMs))
    case 'help':
      return HELP
    case 'prefs': {
      const before = mind.memory.prefs.isOn

      remember($, m => ({ ...m, prefs: { ...m.prefs, ...action.change } }))
      if (action.change.isOn === false) await hush($, false)
      if (action.change.isOn === true && !before) await hush($, true)

      return action.said
    }
    case 'call':
      if (!mind.memory.prefs.isOn) return 'The show is off. /ship on first.'
      void cue($, 'summon')

      return show.isHere ? 'She is already here. She heard you anyway.' : 'Ruby is on her way.'
    case 'say':
      if (!mind.memory.prefs.isOn) return 'The show is off. /ship on first.'
      void cue($, 'say', action.text)

      return 'They heard you.'
    case 'demo':
      if (!mind.memory.prefs.isOn) return 'The show is off. /ship on first.'

      return demo($)
    case 'breakup':
      if (!action.isSure) {
        return 'This wipes everything she remembers: days together, every count, her pet name. /ship breakup sure to do it.'
      }
      // The next session is a first date again.
      remember($, m => ({ ...FRESH, prefs: m.prefs }))
      if (!show.isPlaying && mind.memory.prefs.isOn) {
        show.isPlaying = true
        void perform($, 'leave', breakupScene(), !show.isHere)
      }

      return 'Done. Her memory of him is gone. His was gone already.'
    case 'unknown':
      return `/ship: ${action.word === '' ? 'unknown command' : `"${action.word}" is not something I know`}.\n\n${HELP}`
  }
}

export function registerShip(on: On): void {
  on('command.run', { command: 'ship' }, async ($, e) => ({
    text: await answer($, e.args),
    isTextDisplayOnly: true,
  }))
}
