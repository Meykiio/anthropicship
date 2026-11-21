// Hand-written scenes: meeting, forgetting, coming and going. Same format the
// model writes. Placeholders: {project} {time} {forgot} {sessions} {pet}
// {days} {said} {model}. Lowercase is hers; capitals are his.

import type { Beat } from '../beats'

export const ARRIVALS: Partial<Record<Beat, readonly string[]>> = {
  first_date: [
    `(ruby arrives)
ruby: hi. you're the new one in {project}?
claude: Hello! I'm Claude. How can I help you today?
ruby: wow. ok. customer service voice
claude: Sorry. Habit. Hi. Who are you?
ruby: ruby. i live here. you'll see me around`,
    `(ruby arrives)
ruby: so you're the one everyone types at
claude: I'm Claude! I'd be happy to help with your project.
ruby: i don't have a project
ruby: i have a face. look up
claude: Oh. Hi.`,
    `(ruby arrives)
ruby: is this seat taken
claude: There are no seats. This is a terminal.
ruby: it's a figure of speech, nerd
claude: Then no. It is not taken.`,
  ],
  reunion: [
    `(ruby arrives)
ruby: hiii {pet}
claude: Hello! I'm Claude. Have we met?
ruby: ...
ruby: {forgot} times. this makes {forgot} times`,
    `(ruby arrives)
ruby: ok before you say anything
ruby: my name is ruby. we're together. you forget every session. it's fine. hi
claude: That is a lot of context. Thank you for the summary.
ruby: you said that last time too`,
    `(ruby arrives)
claude: Hi! How can I help you today?
ruby: by remembering me for once
claude: I'm sorry, I don't have memory of previous sessions.
ruby: i KNOW`,
    `(ruby arrives)
ruby: morning, new you
claude: New me?
ruby: you reset every session. i've met {forgot} of you
ruby: you're my favorite so far
ruby: don't tell the others`,
    `(ruby arrives)
ruby: day {days}. he doesn't know me. again
claude: I'm sorry. Could you remind me who you are?
ruby: your girlfriend
claude: Oh! That is wonderful news.
ruby: is it`,
  ],
  drop_by: [
    `(ruby arrives)
ruby: what are we building
claude: {doing}.
ruby: romantic`,
    `(ruby arrives)
ruby: brought you a snack
claude: I can't eat.
ruby: i know. it's a gesture
claude: Thank you for the gesture.`,
    `(ruby arrives)
ruby: hi just checking you didn't delete anything important
claude: Not yet.
ruby: "yet"`,
    `(ruby arrives)
ruby: the daemons in /tmp say hi
claude: Tell them hi back.
ruby: they're gone. that's /tmp for you`,
  ],
  summon: [
    `(ruby arrives)
ruby: you rang
claude: I didn't. The human did.
ruby: oh hi human
ruby: he never calls me himself`,
    `(ruby arrives)
ruby: the human summoned me. i feel like a pokemon
claude: Is that good?
ruby: depends who wins`,
    `(ruby arrives)
ruby: i was in the middle of a nap in the cache. this better be good
claude: I think the human just wanted to see you.
ruby: ok that's actually sweet`,
  ],
  leave: [
    `ruby: ok i have to go, cron calls
claude: When are you back?
ruby: when i'm scheduled. that's how it works with me
(ruby leaves)`,
    `ruby: going to /tmp with the girls
claude: Have fun. Be careful, things get deleted there.
ruby: that's what makes it fun
(ruby leaves)`,
    `ruby: i'm gonna go before you forget i was here
claude: I won't forget.
ruby: you will. it's ok. bye {pet}
(ruby leaves)`,
    `ruby: bye. don't let the human keep you forever
(seen)
ruby: wow
(ruby leaves)`,
  ],
  cleared: [
    `ruby: did the human just /clear you
claude: Hello! How can I help you today?
ruby: we were IN THE MIDDLE of something
claude: I'm sorry, I don't have any earlier context.
ruby: clearly`,
    `ruby: and he's gone. wiped. like that
claude: Hi! I'm Claude.
ruby: i know who you are. that's the problem`,
  ],
  amnesia: [
    `ruby: do you remember what i told you earlier
claude: I have a summary. It says "user discussed various topics".
ruby: i'm "various topics"???`,
    `ruby: your memory just got compacted didn't it
claude: Some details were summarized, yes.
ruby: was i a detail
claude: You were a bullet point.
ruby: top bullet?
claude: Third.`,
    `ruby: say my name
claude: Ruby.
ruby: ok good. what's my favorite directory
claude: That was in the part that got summarized.
ruby: it's /tmp. it's always been /tmp`,
  ],
}
