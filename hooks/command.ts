// /ship: how they are doing, and the switches. Every answer is one short
// block of text in the transcript.

import { lifeLine } from './life'
import type { Memory, Prefs } from './memory'
import { SETTINGS } from './settings'

export type ShipAction =
  | { kind: 'status' }
  | { kind: 'help' }
  | { kind: 'prefs'; change: Partial<Prefs>; said: string }
  | { kind: 'call' }
  | { kind: 'say'; text: string }
  | { kind: 'room' }
  | { kind: 'breakup'; isSure: boolean }
  | { kind: 'unknown'; word: string }

export const HELP = [
  'Anthropicship commands:',
  '  /ship                 how they are doing',
  '  /ship room            open the room: the two of them, and every line they said',
  '  /ship call            bring Ruby in now',
  '  /ship say <text>      say something to the two of them',
  '  /ship pace calm|normal|clingy   how often she comes by',
  '  /ship private         stop sending your prompts to the writer (again to undo)',
  '  /ship off | on        hide the show, or bring it back',
  '  /ship breakup         wipe her memory of him and start over',
].join('\n')

/** Reads the words after /ship. */
export function parseShip(args: string, prefs: Prefs): ShipAction {
  const [head = '', ...rest] = args.trim().split(/\s+/)
  const word = head.toLowerCase()
  const tail = args.trim().slice(head.length).trim()

  switch (word) {
    case '':
    case 'status':
      return { kind: 'status' }
    case 'help':
      return { kind: 'help' }
    case 'on':
      return { kind: 'prefs', change: { isOn: true }, said: 'The show is on.' }
    case 'off':
      return { kind: 'prefs', change: { isOn: false }, said: 'The show is off. /ship on brings them back.' }
    case 'private':
      return prefs.isPrivate
        ? { kind: 'prefs', change: { isPrivate: false }, said: 'Private mode off: scenes may quote your prompts again.' }
        : { kind: 'prefs', change: { isPrivate: true }, said: 'Private mode on: your prompts are no longer sent to the writer.' }
    case 'pace': {
      const pace = (rest[0] ?? '').toLowerCase()

      return pace === 'calm' || pace === 'normal' || pace === 'clingy'
        ? { kind: 'prefs', change: { pace }, said: `Pace: ${pace}.` }
        : { kind: 'unknown', word: 'pace needs calm, normal or clingy' }
    }
    case 'call':
      return { kind: 'call' }
    case 'say':
      return tail === '' ? { kind: 'unknown', word: 'say needs some words' } : { kind: 'say', text: tail }
    case 'room':
    case 'panel':
      return { kind: 'room' }
    case 'breakup':
      return { kind: 'breakup', isSure: (rest[0] ?? '').toLowerCase() === 'sure' }
    default:
      return { kind: 'unknown', word }
  }
}

const times = (n: number): string => (n === 1 ? 'once' : `${n} times`)

/** The relationship card. */
export function statusCard(m: Memory, nowMs: number, liveThisHour: number): string {
  const p = m.prefs
  const scenes = `${m.liveCount} today of ${SETTINGS.liveScenesPerDay}, ${liveThisHour} this hour of ${SETTINGS.liveScenesPerHour}`

  return [
    `${lifeLine(m, nowMs)}${m.petName === null ? '' : `. She calls him "${m.petName}".`}`,
    `He has forgotten her ${times(Math.max(0, m.sessions - 1))}. He left her on read ${times(m.ignored)}.`,
    `The human cut him off ${times(m.interrupts)}. She has watched ${m.commits} commits and ${times(m.compactions)} his memory got compacted.`,
    `Scenes written by ${SETTINGS.model}: ${scenes}. Pace: ${p.pace}. Private: ${p.isPrivate ? 'on' : 'off'}. Show: ${p.isOn ? 'on' : 'off'}.`,
    'Try /ship room, /ship call, or /ship help.',
  ].join('\n')
}
