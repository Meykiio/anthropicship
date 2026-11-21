import { writeFileSync } from 'node:fs'
import { svgOf } from '../hooks/paint'
import { her } from '../hooks/sprites'
// The listing icon: Ruby on the dark background. bun tools/icon.ts out/icon.html
const svg = svgOf(her('front'), 24)
writeFileSync(process.argv[2] ?? 'out/icon.html', `<!doctype html><html><body style="margin:0;background:#0b0b0d;display:grid;place-items:center;width:512px;height:512px">${svg}</body></html>`)