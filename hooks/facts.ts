// What Ruby can see from the couch: real facts about this session. Scenes
// are written from these, so the jokes are about what is actually happening.

export type Facts = {
  /** The project folder's name. */
  project: string
  /** What the human asked for in the current or last turn, shortened. */
  task: string
  isWorking: boolean
  turnStartedMs: number
  /** What he is doing right now, e.g. "editing auth.ts" or "running npm test". */
  doing: string
  /** Failed tool calls in a row. */
  failStreak: number
  /** File name -> edits this session. */
  edits: Record<string, number>
  /** Did she text during this turn without an answer from him? */
  isWaitingOnHim: boolean
  /** Last time the human did anything (typed, sent, a tool ran). */
  lastActivityMs: number
  sessionStartMs: number
  agents: number
  model: string
}

export const facts: Facts = {
  project: 'this project',
  task: '',
  isWorking: false,
  turnStartedMs: 0,
  doing: '',
  failStreak: 0,
  edits: {},
  isWaitingOnHim: false,
  lastActivityMs: 0,
  sessionStartMs: 0,
  agents: 0,
  model: '',
}

/** Shortens text to a clean line of at most `max` characters. */
export function clip(text: string, max: number): string {
  const flat = text.replace(/\s+/g, ' ').trim()

  return flat.length <= max ? flat : `${flat.slice(0, max - 3).trimEnd()}...`
}

const baseName = (path: string): string => path.split(/[\\/]/).filter(Boolean).at(-1) ?? path

/** A short human description of a tool call, and the file it touches if any. */
export function describeTool(tool: string, input: unknown): { doing: string; file: string | null } {
  const i = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {}
  const path = typeof i.file_path === 'string' ? i.file_path : typeof i.notebook_path === 'string' ? i.notebook_path : null
  const file = path === null ? null : baseName(path)

  switch (tool) {
    case 'Edit':
    case 'Write':
    case 'NotebookEdit':
      return { doing: `editing ${file ?? 'a file'}`, file }
    case 'Read':
      return { doing: `reading ${file ?? 'a file'}`, file: null }
    case 'Bash':
    case 'PowerShell': {
      const command = typeof i.command === 'string' ? i.command : ''

      return { doing: `running \`${clip(command.split(/[;&|\n]/)[0] ?? command, 40)}\``, file: null }
    }
    case 'Grep':
    case 'Glob':
      return { doing: 'searching the code', file: null }
    case 'WebSearch':
    case 'WebFetch':
      return { doing: 'looking something up online', file: null }
    case 'Agent':
    case 'Task':
      return { doing: 'sending a subagent off', file: null }
    default:
      return { doing: `using ${clip(tool, 30)}`, file: null }
  }
}

/** The file he has edited most this session, when it is a real obsession (4+ edits). */
export function rivalOf(edits: Readonly<Record<string, number>>): { file: string; count: number } | null {
  let best: { file: string; count: number } | null = null

  for (const [file, count] of Object.entries(edits)) {
    if (count >= 4 && (best === null || count > best.count)) best = { file, count }
  }

  return best
}

/** Is this command a test run? */
export const isTestCommand = (command: string): boolean =>
  /\b(test|tests|vitest|jest|pytest|spec|cargo test|go test|playwright)\b/i.test(command)

/** Is this command a commit? */
export const isCommitCommand = (command: string): boolean => /\bgit\b[^\n]*\bcommit\b/.test(command)
