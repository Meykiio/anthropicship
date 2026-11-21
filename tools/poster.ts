// Draws the band as it looks in a dark terminal, for the README picture:
//   bun tools/poster.ts out/band.html && bash tools/shot.sh out/band.html media/band.png 1200 300
// The sprites come from the mod's own pixel maps, so the picture stays true.

import { writeFileSync } from 'node:fs'

import { svgOf } from '../hooks/paint'
import { INKS, LAPTOP, beside, her, him } from '../hooks/sprites'

const out = process.argv[2] ?? 'out/band.html'
const SCALE = 7

const lines: readonly [string, string][] = [
  ['ruby', 'what color are my eyes'],
  ['claude', 'One sec.'],
  ['ruby', 'it has been 12 minutes since you looked at me'],
]

const color = (who: string): string => (who === 'ruby' ? INKS.b ?? '' : INKS.his ?? '')
const name = (who: string): string => (who === 'ruby' ? 'ruby' : 'Claude')

const chat = lines
  .map(([who, text]) => `<div class="line"><b style="color:${color(who)}">${name(who)}</b>  ${text}</div>`)
  .join('')

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  body { margin: 0; background: #0b0b0d; font: 26px/1.5 "Cascadia Mono", Consolas, monospace; color: #e8e6e3; }
  .band { display: flex; align-items: flex-end; gap: 28px; padding: 34px 40px 18px; }
  .chat { flex: 1; white-space: pre; }
  .line b { font-weight: 700; }
  .typing { color: #6b6f76; font-style: italic; }
  .prompt { margin: 0 40px; border-top: 1px solid #2a2c31; padding: 14px 0; color: #6b6f76; }
</style></head><body>
<div class="band">
  ${svgOf(beside(him('squint'), LAPTOP, 1), SCALE)}
  <div class="chat">${chat}<div class="typing">ruby is typing...</div></div>
  ${svgOf(her('left'), SCALE, [{ column: 4, char: String.fromCodePoint(0xd7), color: '#E5536F' }])}
</div>
<div class="prompt">&gt; fix the checkout crash when the cart is empty</div>
</body></html>`

writeFileSync(out, html)
console.log(`wrote ${out}`)
