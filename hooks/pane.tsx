// The panel beside the chat, as one screen made to be filmed: on top, the
// history of everything they said with the real time; at the bottom, the
// room, live and pinned, with speech bubbles over their heads. The wheel and
// the arrow keys scroll the history; the room never moves.

import { atom, read, update } from 'claude-code'
import type { EngineInterface, On, RenderElement } from 'claude-code'

import type { LogLine } from '../types'
import { EMPTY_STAGE } from './empty'
import { facts } from './facts'
import { lifeLine } from './life'
import { COLOR, WALL, bubbles } from './look'
import { mind } from './memory'
import { rasterOfGrid, svgOfGrid } from './paint'
import { ROOM_MAX, ROOM_MIN, drawRoom } from './room'
import { localTime } from './time'

// player.ts, animate.ts and idle.ts hold the same values: keep these lines identical.
const stage = atom({ plugin: 'anthropicship', key: 'stage' } as const, EMPTY_STAGE, { shape: 'stage-5' })
const frame = atom({ plugin: 'anthropicship', key: 'frame' } as const, 0, { shape: 'frame-1' })
const log = atom({ plugin: 'anthropicship', key: 'log' } as const, [], { shape: 'log-1' })
const back = atom({ plugin: 'anthropicship', key: 'back' } as const, 0, { shape: 'back-1' })

export const PANE = 'room'
const TITLE = 'Claude & Ruby'
const ROOM_ROWS = 14
const NAMES = { ruby: 'ruby', claude: 'Claude', user: 'you' } as const

/** Opens the panel. Resolves whether a surface shows it now. */
export async function openRoom($: EngineInterface): Promise<boolean> {
  const opened = await $.ui.open({ id: PANE, title: TITLE, columns: 92 })

  return opened.isPlaced
}

/** The log lines that fit in `rows`, ending `skip` lines before the newest. A long line takes the rows it wraps to. */
export function fitWindow(lines: readonly LogLine[], rows: number, columns: number, skip: number): LogLine[] {
  const out: LogLine[] = []
  let used = 0

  for (let i = lines.length - 1 - skip; i >= 0; i -= 1) {
    const line = lines[i]

    if (line === undefined) break
    const need = Math.max(1, Math.ceil((line.text.length + 16) / Math.max(20, columns)))

    if (used + need > rows) break
    used += need
    out.unshift(line)
  }

  return out
}

export function registerPane(on: On): void {
  // The wheel and arrows move through the history; the panel itself stays put, so the room never scrolls away.
  on('ui.scroll', { component: 'Pane', requestId: PANE }, async ($, e, next) => {
    const lines: LogLine[] = await read($, log)

    await update($, back, n => Math.max(0, Math.min(Math.max(0, lines.length - 1), n - e.by)))

    return next({ ...e, offset: 0 })
  }).catch((_$, e, next) => next(e))

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const s = await read($, stage)
    const tick = await read($, frame)
    const lines: LogLine[] = await read($, log)
    const skip = Math.min(await read($, back), Math.max(0, lines.length - 1))
    const ui = $.ui.resolve(e)
    const { Box, Text } = ui
    const nowMs = await $.clock.now()
    const columns = e.props.bodyColumns
    const height = e.props.scroll.bodyRows
    const said = bubbles(s)

    const entry = (line: LogLine): RenderElement => {
      const time = localTime(line.at).text

      if (line.who === 'stage') return <Text dimColor italic wrap="truncate-end">{`${time}  ${line.text}`}</Text>

      return (
        <Text wrap="wrap">
          <Text dimColor>{`${time}  `}</Text>
          <Text bold color={COLOR[line.who]}>{NAMES[line.who]}</Text>
          {line.isAside === true ? <Text dimColor italic>{' (to you)'}</Text> : null}
          {`  ${line.text}`}
        </Text>
      )
    }

    // Too narrow or too short for the room: the history alone, which is still the whole story.
    const hasRoom = columns >= ROOM_MIN && height >= ROOM_ROWS + 2
    const historyRows = Math.max(1, height - (hasRoom ? ROOM_ROWS + 3 : 2))
    const shown = fitWindow(lines, historyRows, columns, skip)
    const marker =
      skip > 0 ? `${skip} newer below, scroll down` : lines.length > shown.length ? 'scroll up for older' : ' '
    const history = (
      <Box flexDirection="column" flexGrow={1} flexShrink={1} justifyContent="flex-end" overflow="hidden">
        {lines.length === 0 ? <Text dimColor>Nothing yet. She comes by on her own; /ship call rings the bell now.</Text> : shown.map(entry)}
      </Box>
    )
    const header = (
      <Box flexDirection="row" justifyContent="space-between">
        <Text dimColor wrap="truncate-end">{lifeLine(mind.memory, nowMs)}</Text>
        <Text dimColor italic wrap="truncate-end">{marker}</Text>
      </Box>
    )

    // One row more than the window, left blank, so the wheel always reaches the scroll hook above.
    if (!hasRoom) {
      return (
        <Box flexDirection="column" height={height + 1}>
          {header}
          {history}
          <Text> </Text>
        </Box>
      )
    }
    const width = Math.max(ROOM_MIN, Math.min(ROOM_MAX, columns))
    const speech = { his: said.his, hers: said.hers, last: said.last, typing: s.typing, aside: said.aside }
    const room = drawRoom({
      stage: s,
      nowMs,
      frame: tick,
      width,
      hour: localTime(nowMs).hour,
      isWorking: facts.isWorking,
      life: mind.memory.life,
      things: mind.memory.things,
      speech,
    })
    let picture: RenderElement

    if (e.surface === 'terminal') {
      const { Raster } = $.ui.resolve(e)
      const cells = rasterOfGrid(room.grid, WALL, room.marks, room.overlays)

      picture = <Raster key="room" columns={cells.columns} rows={cells.rows} cells={cells.cells} />
    } else if ('Svg' in ui) {
      const { Svg } = ui

      picture = <Svg source={svgOfGrid(room.grid, 8, WALL, room.marks, room.overlays)} alt={s.move === 'away' ? 'Claude at his desk.' : 'Claude and Ruby in their room.'} />
    } else {
      picture = <Text dimColor>{s.move === 'away' ? 'Claude is at his desk.' : 'Ruby is here.'}</Text>
    }

    return (
      <Box flexDirection="column" height={height + 1}>
        {header}
        {history}
        <Box flexDirection="column" flexShrink={0} marginTop={1}>
          {picture}
        </Box>
        <Text> </Text>
      </Box>
    )
  })
}
