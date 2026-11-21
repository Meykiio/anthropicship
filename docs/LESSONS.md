# Lessons

- 2026-11-21: validate refused `const wait = ($, ms) => ...` called from another file -> any helper that takes `$` is a `function` declaration.
- 2026-11-21: the Write tool turned backslash-u escapes into real characters, putting em dashes in source -> build symbols with `String.fromCodePoint` and grep for non-ASCII before committing.
- 2026-11-21: PowerShell Get-Content/Set-Content mangled UTF-8 symbols and added BOMs -> use `[IO.File]` with `UTF8Encoding($false)` or the Edit tool.
- 2026-11-21: Haiku given every fact wrote 14-line scenes that all opened with the time and the file name, and quoted Claude's last answer back -> each beat gets one or two facts, the scene direction goes last, maxTokens 220, never send his answer text.
- 2026-11-21: twelve `claude -p` calls started in parallel from Git Bash all returned empty -> run them one after another.
- 2026-11-21: he rejected the chat band above the prompt ("I don't want the left side, where I work, spammed") -> everything of the show lives in the side panel: history on top, the live room pinned at the bottom.
- 2026-11-21: he did not want hand-written scenes ("there shouldn't be written scenes") -> every scene is written live; when the model cannot answer, nothing plays.
- 2026-11-21: Ruby said "yesterday" about a talk minutes earlier -> every request carries the real clock and exactly how long ago they last talked, and the bible forbids invented times.
- 2026-11-21: he edited the mod while it hot-reloaded and saw "reload failed: Export named X not found" -> multi-file refactors break a live reload mid-way; it recovers on the next save, but finish a refactor in one pass when he is watching.
