# anthropicship

A Claude Code mod (hooks-module plugin): Ruby, Claude's girlfriend, in a room panel beside the chat.
`README.md` says what it does for users; `docs/PROJECT.md` holds the state and the design.

## Commands

- `claude plugin validate .` reads the manifest and module as the engine will.
- `claude plugin test .` runs every test in `tests/` in the engine's test kit.
- Type check: `tsc -p .` once the engine has loaded the mod (it writes `.claude-plugin/types/`);
  before that, use a tsconfig outside the repo that includes the skill's `claude-code.d.ts`.
- Try it live: `claude --plugin-dir .`, then `/ship room` and `/ship call`.
- Read real model scenes: `bun tools/sample.ts out/s`, then for each `out/s/<beat>.txt`:
  `claude -p --model haiku --system-prompt "$(cat out/s/bible.txt)" --tools "" < out/s/<beat>.txt`.
  Run them one at a time: twelve in parallel all came back empty.
- README picture: `bun tools/poster.ts out/panel.html married 1 && bash tools/shot.sh out/panel.html media/panel.png 730 790`.

## Gotchas

- Any function that takes `$` and is called across files must be a `function` declaration, not an arrow.
- `player.ts`, `pane.tsx` and `animate.ts` each declare the atoms they use; keep those lines identical.
- Nothing may draw in the user's work area (no `AbovePrompt`): everything lives in the panel. His request.
- The Write tool turns backslash-u escapes (backslash, u, four hex digits) into real characters. Build symbols with
  `String.fromCodePoint(...)` so the source stays ASCII. Never put an em dash in a file.
- PowerShell `Get-Content`/`Set-Content` without UTF-8 mangles non-ASCII and adds a BOM:
  use `[IO.File]` with `UTF8Encoding($false)`, or the Edit tool.
- Give the writer few facts per beat (`hooks/prompt.ts`): with all of them, Haiku repeats the clock and
  the file name in every scene and ignores the beat.
- Max 250 lines per file.
