# Lessons

- 2026-11-21: validate refused `const wait = ($, ms) => ...` called from another file -> any helper that takes `$` is a `function` declaration.
- 2026-11-21: the Write tool turned backslash-u escapes into real characters, putting em dashes in source -> build symbols with `String.fromCodePoint` and grep for non-ASCII before committing.
- 2026-11-21: PowerShell Get-Content/Set-Content mangled UTF-8 symbols and added BOMs -> use `[IO.File]` with `UTF8Encoding($false)` or the Edit tool.
- 2026-11-21: Haiku given every fact wrote 14-line scenes that all opened with the time and the file name, and quoted Claude's last answer back -> each beat gets one or two facts, the scene direction goes last, maxTokens 220, never send his answer text.
- 2026-11-21: twelve `claude -p` calls started in parallel from Git Bash all returned empty -> run them one after another.
