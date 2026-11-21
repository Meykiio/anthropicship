# Changelog

## 0.2.0 (2026-11-21), the room

Completed
- A panel beside the chat, as he sketched it: chat history on top with real times, the live room pinned at the
  bottom with speech bubbles over their heads. The band above the prompt is gone.
- The room: window on the real sky, plant, desk and laptop, door. He types, blinks, jumps; she walks, shakes,
  floats hearts. Terminal half-block cells and desktop SVG from one pixel grid.
- The doorbell: mid-task he finishes first (she rings again, then lets herself in after 4 minutes) or drops
  everything and walks to the door. Once she lives there she has keys.
- Every scene is written live by Haiku. The 76 hand-written scenes, `/ship scripted` and `/ship demo` are gone;
  when the model cannot answer, nothing plays.
- Real time: each request carries the human's clock and exactly how long ago they last talked.
- Their life: talking, dating, fights, breakups (days apart), making up, moving in, engaged, married, kids, on
  real days, rolled per user; the room shows it (her flower, their photo, the gold wedding frame, the kid, her ring).

Verified
- `claude plugin validate .`: passes. `claude plugin test .`: 30 pass. `tsc -p . --noUnusedLocals`: clean.


## 0.1.0 (2026-11-21), the night build

Completed
- Band above the prompt: Claude (at his laptop while he works) and Ruby (with her bow), drawn from one
  pixel map as half-block cells in the terminal and SVG on the desktop app; their chat with
  "is typing..." pauses, "seen", and mood signs over their heads. Narrow terminals keep only the words.
- Director: rare scenes on a 20 second tick (calm, normal, clingy paces) plus cues from real events:
  session start, long turns, turn end, Esc, failed commands, tests passing, commits, the file he keeps
  editing, subagents, web searches, compaction, `/clear`, model switches, the human away, late nights.
- Writer: Haiku under a character bible, one or two facts per beat, output checked and cleaned;
  capped at 12 scenes an hour and 120 a day. 76 hand-written scenes for scripted mode and fallback.
- Memory across sessions: days together, times he forgot her, left her on read, got cut off, commits,
  compactions, her pet name for him.
- `/ship` with call, say, demo, pace, live, scripted, private, off, on, breakup, help.
- No show and no tokens in non-interactive sessions (`claude -p`, scripts, CI).

Verified
- `claude plugin validate .`: passes (one note: the repo CLAUDE.md is for developers, not shipped context).
- `claude plugin test .`: 28 pass, 0 fail.
- Strict type check against the engine's 2.1.328 types: 0 errors.
- A real `claude -p --plugin-dir` session: the mod loaded, registered /ship, called Haiku
  (5 s) and played a first-date scene (seen in the debug log). Then the -p guard was added.
- Two rounds of 12 real Haiku scenes read and the prompt tuned from them.

Known issues
- Not yet watched by a person in a live interactive session; pacing and tone need a real hour of use.
- Hooks-module plugins are early access; a future Claude Code may need changes.
- The name and the sprite lean on Anthropic's brand; see docs/PROJECT.md, Risks.

Next
- Watch it for an hour in a real project, tune the bible and the pacing.
- Film a clip with `/ship demo` for the README and the launch post.
- Publish to GitHub (Meykiio/anthropicship, public) once approved.
