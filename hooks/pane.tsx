// The panel beside the chat, as one screen made to be filmed: on top, the
// history of everything they said with the real time; at the bottom, the
// room, live, with speech bubbles over their heads.

import { atom, read } from 'claude-code'
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

// player.ts and animate.ts hold the same values: keep these lines identical.
const stage = atom({ plugin: 'anthropicship', key: 'stage' } as const, EMPTY_STAGE, { shape: 'stage-4' })
const frame = atom({ plugin: 'anthropicship', key: 'frame' } as const, 0, { shape: 'frame-1' })
const log = atom({ plugin: 'anthropicship', key: 'log' } as const, [], { shape: 'log-1' })

export const PANE = 'room'
const TITLE = 'Claude & Ruby'
/** Rows the bottom part always keeps: the room (bubbles included) and a margin. */
const SCENE_ROWS = 14 + 1
const NAMES = { ruby: 'ruby', claude: 'Claude', user: 'you' } as const

/** Opens the panel. Resolves whether a surface shows it now. */
export async function openRoom($: EngineInterface): Promise<boolean> {
  const opened = await $.ui.open({ id: PANE, title: TITLE, columns: 78 })

  return opened.isPlaced
}

export function registerPane(on: On): void {
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const s = await read($, stage)
    const tick = await read($, frame)
    const lines: LogLine[] = await read($, log)
    const ui = $.ui.resolve(e)
    const { Box, Text } = ui
    const nowMs = await $.clock.now()
    const width = Math.max(ROOM_MIN, Math.min(ROOM_MAX, e.props.bodyColumns))
    const life = mind.memory.life
    const said = bubbles(s)
    const speech = { his: said.his, hers: said.hers, last: said.last, typing: s.typing }
    const room = drawRoom({ stage: s, nowMs, frame: tick, width, hour: localTime(nowMs).hour, isWorking: facts.isWorking, life, speech })

    // The history: the newest lines that fit above the scene, counting the rows a long line wraps to.
    const budget = Math.max(2, (e.viewport?.rows ?? 34) - SCENE_ROWS - 2)
    const shown = fitNewest(lines, budget, e.props.bodyColumns)
    const entry = (line: LogLine): RenderElement => {
      const time = localTime(line.at).text

      if (line.who === 'stage') return <Text dimColor italic wrap="truncate-end">{`${time}  ${line.text}`}</Text>

      return (
        <Text wrap="wrap">
          <Text dimColor>{`${time}  `}</Text>
          <Text bold color={COLOR[line.who]}>{NAMES[line.who]}</Text>
          {`  ${line.text}`}
        </Text>
      )
    }
    const history = (
      <Box flexDirection="column" flexGrow={1} flexShrink={1} justifyContent="flex-end" overflow="hidden">
        {lines.length === 0 ? (
          <Text dimColor>Nothing yet. She comes by on her own; /ship call rings the bell now.</Text>
        ) : (
          shown.map(entry)
        )}
      </Box>
    )

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
      <Box flexDirection="column" height={e.viewport?.rows}>
        <Text dimColor wrap="truncate-end">{lifeLine(mind.memory, nowMs)}</Text>
        {history}
        <Box flexDirection="column" flexShrink={0} marginTop={1}>
          {picture}
        </Box>
      </Box>
    )
  })
}

/** The newest log lines that fit in `rows`, a long line taking as many rows as it wraps to. */
export function fitNewest(lines: readonly LogLine[], rows: number, columns: number): LogLine[] {
  const out: LogLine[] = []
  let used = 0

  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i]

    if (line === undefined) break
    const need = Math.max(1, Math.ceil((line.text.length + 16) / Math.max(20, columns)))

    if (used + need > rows) break
    used += need
    out.unshift(line)
  }

  return out
}
