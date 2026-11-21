// The band above the prompt: him on the left (at his laptop while he works),
// their chat in the middle, her on the right when she is in the room.

import { atom, read } from 'claude-code'
import type { On, RenderElement } from 'claude-code'

import type { ChatLine, Mood, Stage } from '../types'
import { EMPTY_STAGE } from './empty'
import { rasterCells, svgOf } from './paint'
import type { Mark } from './paint'
import { INKS, LAPTOP, beside, her, him } from './sprites'
import type { Pixels } from './sprites'

// player.ts writes the same value: keep the two lines identical.
const stage = atom({ plugin: 'anthropicship', key: 'stage' } as const, EMPTY_STAGE, { shape: 'stage-1' })

const SIGNS: Readonly<Record<Mood, { char: string; color: string } | null>> = {
  none: null,
  heart: { char: String.fromCodePoint(0x2665), color: '#E5536F' },
  alarm: { char: '!', color: '#F2C14E' },
  ask: { char: '?', color: '#B9C4D0' },
  dots: { char: String.fromCodePoint(0x2026), color: '#B9C4D0' },
  sleep: { char: 'z', color: '#B9C4D0' },
  note: { char: String.fromCodePoint(0x266a), color: '#F2C14E' },
  mad: { char: String.fromCodePoint(0xd7), color: '#E5536F' },
}

const NAME_COLOR = { ruby: INKS.b ?? '#E8607A', claude: INKS.his ?? '#D97757', user: '#9AA4AF' } as const
const NAMES = { ruby: 'ruby', claude: 'Claude', user: 'you' } as const

/** Narrower than this, the band drops the sprites and keeps the words. */
const SPRITE_MIN_COLUMNS = 64

const markFor = (mood: Mood, column: number): Mark[] => {
  const sign = SIGNS[mood]

  return sign === null ? [] : [{ column, char: sign.char, color: sign.color }]
}

export function registerStage(on: On): void {
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const s: Stage = await read($, stage)

    if (e.props.hasSurvey || !s.isOn) return next(e)
    const isQuiet = s.lines.length === 0 && s.typing === null

    if (isQuiet && !s.isHere) return next(e)
    const ui = $.ui.resolve(e)
    const { Box, Text } = ui

    if (isQuiet) {
      return (
        <Text dimColor>
          <Text color={NAME_COLOR.ruby}>{`${String.fromCodePoint(0x2665)} ruby`}</Text>
          {' is hanging out. /ship to see how they are doing'}
        </Text>
      )
    }

    const lineOf = (line: ChatLine): RenderElement =>
      line.who === 'stage' ? (
        <Text dimColor italic>{`  ${line.text}`}</Text>
      ) : (
        <Text wrap="truncate-end">
          <Text bold color={NAME_COLOR[line.who]}>{NAMES[line.who]}</Text>
          {`  ${line.text}`}
        </Text>
      )
    const chat = (
      <Box flexDirection="column" flexGrow={1} flexShrink={1} paddingX={1} justifyContent="flex-end">
        {s.lines.map(lineOf)}
        {s.typing === null || s.typing === 'stage' ? null : (
          <Text dimColor italic wrap="truncate-end">{`${NAMES[s.typing]} is typing...`}</Text>
        )}
      </Box>
    )

    if (e.props.bodyColumns < SPRITE_MIN_COLUMNS) return chat

    const hisMap: Pixels = e.props.isWorking ? beside(him('squint'), LAPTOP, 1) : him(s.isFacing ? 'right' : 'front')
    const herMap: Pixels = her(s.isFacing ? 'left' : 'front')
    const hisMarks = markFor(e.props.isWorking && s.hisMood === 'none' ? 'none' : s.hisMood, 7)
    const herMarks = markFor(s.herMood, 4)

    if (e.surface === 'terminal') {
      const { Raster } = $.ui.resolve(e)
      const sprite = (key: string, map: Pixels, marks: Mark[]): RenderElement => {
        const cells = rasterCells(map, marks)

        return <Raster key={key} columns={cells.columns} rows={cells.rows} cells={cells.cells} />
      }

      return (
        <Box flexDirection="row" alignItems="flex-end">
          {sprite('him', hisMap, hisMarks)}
          {chat}
          {s.isHere ? sprite('her', herMap, herMarks) : <Box width={16} />}
        </Box>
      )
    }

    if (!('Svg' in ui)) return chat
    const { Svg } = ui
    const SCALE = 3

    return (
      <Box flexDirection="row" alignItems="flex-end">
        <Svg source={svgOf(hisMap, SCALE, hisMarks)} alt={e.props.isWorking ? 'Claude at his laptop' : 'Claude'} />
        {chat}
        {s.isHere ? <Svg source={svgOf(herMap, SCALE, herMarks)} alt="Ruby, with her bow" /> : <Box width={16 * SCALE} />}
      </Box>
    )
  })
}
