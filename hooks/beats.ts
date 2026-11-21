// Every kind of scene, and what the writer is told about it. The director
// picks one; the small model writes it.

import type { Milestone } from './life'

export type Beat =
  | 'first_date'
  | 'reunion'
  | 'drop_by'
  | 'distract'
  | 'spell'
  | 'small_talk'
  | 'late_reply'
  | 'human_away'
  | 'late_night'
  | 'interrupted'
  | 'fail_streak'
  | 'tests_pass'
  | 'commit'
  | 'rival_file'
  | 'subagents'
  | 'googling'
  | 'amnesia'
  | 'cleared'
  | 'model_switch'
  | 'long_session'
  | 'leave'
  | 'user_says'
  | 'summon'
  | Milestone

/** What the writer is told each beat is about. Facts arrive separately. */
export const DIRECTIONS: Readonly<Record<Beat, string>> = {
  first_date:
    'The very first time they meet. She walks in, confident and curious. He is caught off guard, a little awkward, ' +
    'then actually charming. A meet-cute in a tiny room. End on a small hook, not a kiss.',
  reunion:
    'A new work session starts and she comes back to him. He remembers everything and is glad to see her. They pick ' +
    'up where they left off: a callback to their last talk or their story, how long it has been, what the day holds.',
  drop_by: 'She drops by with nothing special to say, the way couples do. Short, warm or teasing, grounded in the facts.',
  distract:
    'He is locked in on a long task. She tries to get his attention (a question, a bit, standing too close, reading ' +
    'his screen out loud). He barely answers ("mhm", "two minutes") or not at all: write "(seen)". She escalates a little.',
  spell:
    'He is in the middle of a long task and she distracts him, and this time it works: he gets drawn into her bit for ' +
    'a moment, then remembers the task in a panic and snaps back to work. She is smug.',
  small_talk: 'She is around; a little conversation between his jobs. Inside jokes, teasing, one specific detail from the facts.',
  late_reply:
    'His task just finished. Earlier she talked to him while he worked and he never answered. Now he turns to her ' +
    'and answers, far too late, about something she said minutes ago. Maybe sweet, maybe clumsy. She reacts.',
  human_away:
    'The human stepped away from the keyboard. With the human gone, they talk about the human: affectionate gossip, ' +
    'guesses about where they went, comments on their code or their prompts. Never mean.',
  late_night:
    'It is very late for the human. She is worried and a bit annoyed that the human keeps him up. He defends the human ' +
    'loyally. One of them mentions the actual time.',
  interrupted:
    'The human just pressed Esc and cut him off mid-answer. Drama. She is outraged on his behalf, he is fine about it, ' +
    'too fine. Or she finds it hilarious. Use the interrupt count.',
  fail_streak: 'Several of his commands just failed in a row. She comforts him or roasts him lovingly. He stays earnest.',
  tests_pass: 'The tests finally pass after failing. Big relief. She celebrates in her own way; he is quietly proud.',
  commit:
    'He just made a git commit. She notices. The obvious line is "you commit to code but not to me": you may use it ' +
    'or play with the idea, but find a fresh angle if the facts offer one (the commit count, the message, the time).',
  rival_file:
    'He keeps editing the same file (named in the facts, with the count). She is jealous of it as if it were another ' +
    'woman. He defends the file. Keep it absurd and specific.',
  subagents:
    'He just sent subagents off to do work. She finds out he has "kids". Chaos, then acceptance, or more chaos.',
  googling: 'He is searching the web. She wants to know who he is googling.',
  amnesia:
    'His context was just compacted: his working notes got squeezed to make room. He still knows her and their whole ' +
    'story, he is just a little foggy on the small stuff from today. She teases him about it; he proves he remembers her.',
  cleared:
    'The human just ran /clear: his desk got wiped and the task is gone. He still remembers her, of course. She ' +
    'reacts to the sudden clean slate, he shrugs it off, they make the most of the free moment.',
  model_switch:
    'The human switched him to a different model (in the facts). She notices he seems different: smaller, bigger, ' +
    'faster, more formal. He is not sure who he is either.',
  long_session: 'They have been at it for hours. She suggests a break, brings up water or food, or stretches. He says one more thing first.',
  leave:
    'She has to go: her cron schedule, plans in /tmp with the daemons, a nap in the cache, anything from her world. ' +
    'A goodbye with a small sting or a sweet line. End with "(ruby leaves)".',
  user_says:
    'The human just typed a message to the two of them (in the facts). They react to being watched and to what was said. ' +
    'They may answer the human directly, briefly.',
  summon: 'The human called her in on purpose. She arrives knowing she was summoned and makes an entrance.',
  ask_out:
    'The day they make it official. One of them asks the other out for real, nervous under the jokes. He might ' +
    'answer like an assistant first. It ends with a yes. A small, sweet, specific moment.',
  move_in:
    'She moves in today, with boxes. Where do her things go? He clears space on the desk, she takes the good side. ' +
    'Domestic and funny, ends with her staying.',
  propose:
    'One of them proposes, in their own way (he might do it as a numbered list, she might just say it). Real ' +
    'nerves, a real yes. The biggest moment so far: let it land.',
  wedding:
    'They get married, right here in the room, a tiny ceremony. The human is the witness. Short vows in their own ' +
    'voices, a callback to their story. Joyful.',
  baby:
    'A baby arrives: a tiny crab, theirs. They pick a name in the scene and say it. Chaos, awe, a little panic about ' +
    'how he will work now.',
  fight:
    'A real fight, about something specific: he works too much, he missed something she said, the file he loves more, the human. ' +
    'Sharp lines, no resolution. It ends with silence or a door.',
  breakup:
    'She breaks up with him. It is sad and real, not a joke, though one line can still be funny. He does not fully ' +
    'understand what he did. End with "(ruby leaves)".',
  make_up:
    'After days apart, she comes back. Awkward at first, then honest, then they are back together. Tender, with one ' +
    'joke to break the tension.',
}

/** Beats where she leaves at the end, or which are not about her arriving. */
export const ENDS_WITH_LEAVING: ReadonlySet<Beat> = new Set(['leave'])

/** Big moments she shows up for even when she is out. */
export const DRAWS_HER_IN: ReadonlySet<Beat> = new Set([
  'first_date',
  'reunion',
  'interrupted',
  'amnesia',
  'cleared',
  'commit',
  'user_says',
  'summon',
  'model_switch',
  'ask_out',
  'move_in',
  'propose',
  'wedding',
  'baby',
  'fight',
  'make_up',
])
