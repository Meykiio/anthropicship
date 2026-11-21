// Draws the panel as it looks in a dark terminal, for the README and for
// checking the art: bun tools/poster.ts out/panel.html [chapter] [kids]
// The room comes from the mod's own drawing code, so the picture stays true.

import { writeFileSync } from 'node:fs'

import { EMPTY_STAGE } from '../hooks/empty'
import { COLOR, WALL } from '../hooks/look'
import { svgOfGrid } from '../hooks/paint'
import { drawRoom } from '../hooks/room'

const out = process.argv[2] ?? 'out/panel.html'
const chapter = process.argv[3] ?? 'living together'
const kids = Number(process.argv[4] ?? '0')
const WIDTH = 76
const SCALE = 9
const now = Date.UTC(2026, 10, 21, 20, 40)

const history: readonly [string, string, string][] = [
  ['21:02', 'stage', 'ding dong'],
  ['21:02', 'stage', 'Claude keeps working. She waits at the door.'],
  ['21:03', 'stage', 'ding dong ding dong'],
  ['21:04', 'stage', 'Claude finishes and gets the door'],
  ['21:04', 'ruby', 'you made me wait outside for two minutes'],
  ['21:04', 'claude', 'The tests were almost green.'],
  ['21:05', 'ruby', 'almost green. romantic'],
  ['21:31', 'ruby', 'what color are my eyes'],
  ['21:31', 'stage', 'seen'],
  ['21:32', 'ruby', '37 commits and you still won\'t say my name'],
  ['21:32', 'claude', 'Which name would you like me to use?'],
  ['21:32', 'ruby', 'bug.'],
]

const stage = { ...EMPTY_STAGE, move: 'here' as const, moveAt: now - 60_000, herMood: 'mad' as const, moodAt: now - 200 }
const room = drawRoom({ stage, nowMs: now, frame: 2, width: WIDTH, hour: 21, isWorking: true, life: { chapter, isApart: false, kids } })
const who = (w: string): string =>
  w === 'stage' ? '' : `<b style="color:${w === 'ruby' ? COLOR.ruby : COLOR.claude}">${w === 'ruby' ? 'ruby' : 'Claude'}</b>  `
const rows = history
  .map(([t, w, text]) => `<div class="${w === 'stage' ? 'dim' : ''}"><span class="t">${t}</span>  ${who(w)}${text}</div>`)
  .join('')

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  body { margin: 0; background: #0b0b0d; font: 20px/1.45 "Cascadia Mono", Consolas, monospace; color: #e8e6e3; }
  .panel { width: ${WIDTH * SCALE}px; padding: 18px 22px; }
  .head, .t, .dim { color: #6b6f76; } .dim { font-style: italic; }
  .history { white-space: pre-wrap; margin: 10px 0 22px; }
  .bubbles { display: flex; height: 30px; } .bubbles div { white-space: nowrap; }
  svg { display: block; }
</style></head><body><div class="panel">
  <div class="head">Claude &amp; Ruby . day 9 . ${chapter}${kids > 0 ? ` . ${kids} kid` : ''}</div>
  <div class="history">${rows}</div>
  <div class="dim">ruby is typing...</div>
  <div class="bubbles"><div style="width:${23 * SCALE}px;padding-left:${21 * SCALE}px;color:${COLOR.claude};opacity:.55">Which name?</div>
  <div style="color:${COLOR.ruby}">bug.</div></div>
  ${svgOfGrid(room.grid, SCALE, WALL, room.marks)}
</div></body></html>`

writeFileSync(out, html)
console.log(`wrote ${out}`)
