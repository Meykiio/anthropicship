# Anthropicship

## Current State

- Version 0.3.0 (2026-11-21). Public on GitHub: Meykiio/anthropicship. Shared on social media.
- Layout he asked for: a panel beside the chat, history on top (real times), the live room pinned at the
  bottom with speech bubbles over their heads. Nothing in his work area.
- Works: the room (window on the real sky, desk and laptop, door, plant), the doorbell (he finishes first or
  drops everything), walks, reactions (jump, shake, hearts), live Haiku scenes only (no canned scenes), real
  time in every request, the life arc (talking, dating, fights, breakups, moving in, engaged, married, kids)
  with the room changing to match, cross-session memory, `/ship`.
- Verified: `claude plugin validate .` passes; `claude plugin test .` 30/30; `tsc -p .` clean.
- Next: watch it live for an hour, tune pacing and the bible from real scenes, film a clip, publish.

## What it is

A comedy that runs beside real work. Ruby, an AI who lives in the same machine, texts Claude while
he works. He is locked in, forgets her every session, gets cut off by the human. The jokes come from
what really happens in the session, so every user's show is different.

Visual direction: one coherent pixel world in Claude's coral, a dusky room (`hooks/colors.ts`). Him `#D97757`, her a warmer coral with
a rose bow `#E8607A`, eyes near black. No other accents except the small mood signs.

## Design decisions

- **A mod, not a page.** It has to live where the work happens, above the prompt, on every surface
  that draws a band (terminal, desktop app). A hooks module can watch turns, tools, Esc, compaction
  and `/clear`, which is where every joke comes from.
- **Silence is the default.** A director rolls for scenes on a 20 second tick with rare odds
  (about one visit per 14 minutes at normal pace) plus event cues. Rare moments land; constant
  chatter gets uninstalled.
- **He remembers her.** Across sessions, /clear and compaction. The forgetting gag was dropped on request.
- **The real Claude never talks to her.** Scenes are written by Haiku through `$.model.complete`, a
  separate small call. Forking the main transcript would cost far more per scene and could leak into
  the real work. His "voice" is written as a character.
- **Cost is capped and visible.** About 1.5k tokens in and 150 out per scene, at most 24 an hour
  and 200 a day; past that, she stays away. Idle motion between lines costs nothing.
- **Few facts per beat.** Given everything, Haiku repeats the clock and file name in every scene and
  ignores the beat. `hooks/prompt.ts` hands each beat one or two facts and puts the scene last.
- **Model output is checked.** `parseScene` keeps only `ruby:`, `claude:`, `user:` lines and three
  stage cues, strips dashes and emoji, and throws away scenes with AI tells or too many lines; a
  script plays instead.
- **Memory lives in `$.store`** (across sessions), the band in `$.state` (`anthropicship.stage`).

## Files

`hooks/register.tsx` listens; `conductor.ts` runs scenes; `director.ts` decides (pure);
`prompt.ts` + `bible.ts` + `writer.ts` write; `player.ts` plays; `stage.tsx` draws; `sprites.ts` +
`paint.ts` are the pixel art; `scenes/` holds the scripts; `memory.ts`, `facts.ts`, `time.ts` keep
state; `command.ts` + `commands.ts` are `/ship`.

## Risks

- The name uses Anthropic's trademark and the sprite is a fan version of their mascot. The README
  says unofficial and not endorsed. A takedown request is possible; the fallback is a rename.
- Hooks-module plugins are early access: the API may change between Claude Code releases.
