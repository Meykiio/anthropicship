// The /ship command, wired to the engine. Parsing and the card are in command.ts.

import type { EngineInterface, On } from 'claude-code'

import { HELP, parseShip, statusCard } from './command'
import { cue, liveThisHour, stageBeat } from './conductor'
import { FRESH, mind, remember } from './memory'
import { openRoom } from './pane'
import { hush, show } from './player'

export async function registerCommand($: EngineInterface): Promise<void> {
  await $.command.register({
    name: 'ship',
    description: 'Anthropicship: open the room, call Ruby, say something to them, or see how they are doing',
    argumentHint: '[room|call|say <text>|pace|private|off|on|breakup|help]',
  })
}

async function answer($: EngineInterface, args: string): Promise<string> {
  const action = parseShip(args, mind.memory.prefs)
  const nowMs = await $.clock.now()
  const isOff = !mind.memory.prefs.isOn

  switch (action.kind) {
    case 'status':
      return statusCard(mind.memory, nowMs, liveThisHour(nowMs))
    case 'help':
      return HELP
    case 'room':
      if (isOff) return 'The show is off. /ship on first.'

      return (await openRoom($))
        ? 'The room is open beside the chat.'
        : 'This screen has no room for a panel. In the terminal, fullscreen mode docks it; the desktop app shows it beside the chat.'
    case 'prefs': {
      remember($, m => ({ ...m, prefs: { ...m.prefs, ...action.change } }))
      if (action.change.isOn === false) await hush($, false)
      if (action.change.isOn === true && isOff) await hush($, true)

      return action.said
    }
    case 'call':
      if (isOff) return 'The show is off. /ship on first.'
      void cue($, 'summon')

      return show.isHere ? 'She is already here. She heard you anyway.' : 'Ruby is on her way.'
    case 'say':
      if (isOff) return 'The show is off. /ship on first.'
      void cue($, 'say', action.text)

      return 'They heard you.'
    case 'breakup':
      if (!action.isSure) {
        return 'This wipes everything she remembers: days together, every count, her pet name. /ship breakup sure to do it.'
      }
      // She says goodbye while she still remembers him; the next session is a first date again.
      if (show.isHere && !show.isPlaying && !isOff) {
        void stageBeat($, 'leave', '').finally(() => forget($))
      } else {
        forget($)
      }

      return 'Done. Her memory of him is gone. His was gone already.'
    case 'unknown':
      return `/ship: ${action.word === '' ? 'unknown command' : `"${action.word}" is not something I know`}.\n\n${HELP}`
  }
}

/** Wipes her memory of him, keeping the switches. */
function forget($: EngineInterface): void {
  remember($, m => ({ ...FRESH, prefs: m.prefs }))
}

export function registerShip(on: On): void {
  on('command.run', { command: 'ship' }, async ($, e) => ({
    text: await answer($, e.args),
    isTextDisplayOnly: true,
  }))
}
