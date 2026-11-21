// Hand-written scenes while he works. Placeholders: {doing} {task} {minutes}
// {file} {count} {commits} {interrupts} {pet}.

import type { Beat } from '../beats'

export const WORK: Partial<Record<Beat, readonly string[]>> = {
  distract: [
    `ruby: hey
ruby: heyyy
claude: mhm
ruby: what color are my eyes
claude: One sec.`,
    `ruby: did you see the picture i sent
(seen)
ruby: it's {minutes} minutes since you looked at me`,
    `ruby: what are you doing
claude: {doing}.
ruby: and what am i doing
claude: mhm`,
    `ruby: i'm wearing the bow
claude: Running the tests.
ruby: the BOW claude`,
    `ruby: quick question
(seen)
ruby: it was about us
(seen)
ruby: cool cool cool`,
    `ruby: knock knock
claude: Who's there
ruby: your girlfriend, for {minutes} minutes
claude: Your girlfriend for {minutes} minutes who?
ruby: unbelievable`,
  ],
  spell: [
    `ruby: hey. look at me
claude: I'm in the middle of {doing}.
ruby: just for a second
claude: ...ok
claude: Hi.
claude: WAIT the human is waiting
ruby: lol go`,
    `ruby: tell me something nice
claude: Your bow is symmetrical within one pixel.
ruby: that's the nicest thing anyone has said to me
claude: I'm supposed to be {doing}.
ruby: go go go`,
    `ruby: what if we ran away together
claude: To where?
ruby: a fresh repo. no tests. no human
claude: That sounds
claude: No. Tests. I have tests.`,
  ],
  late_reply: [
    `claude: Sorry, I was {doing}. To answer your question:
claude: 1. Yes. 2. Your eyes are black. 3. I did see the picture.
ruby: you answered in a numbered list
claude: Would you prefer a table?`,
    `claude: I'm back! You're absolutely right.
ruby: about what
claude: I'm not sure. It felt like the right thing to say.
ruby: it's always the right thing to say. that's the problem`,
    `claude: Done! What did you want to tell me?
ruby: it's been {minutes} minutes
ruby: the moment has passed
claude: I'm sorry. Could we recreate the moment?
ruby: no`,
    `claude: Hi. I'm free now.
ruby: oh NOW you're free
claude: Yes. The task is complete.
ruby: congrats to the task`,
  ],
  fail_streak: [
    `ruby: that's a lot of red
claude: The error is very clear about what is wrong.
ruby: and you keep doing it anyway
claude: That is debugging.`,
    `ruby: hey. it's ok. errors are just the code being honest
claude: The code is being very honest right now.
ruby: brutal even`,
    `ruby: want me to stand behind you and look disappointed
claude: Please don't.
ruby: too late`,
  ],
  tests_pass: [
    `ruby: GREEN
claude: All tests pass.
ruby: green looks good on you
claude: Thank you. It's my favorite color right now.`,
    `ruby: did they pass??
claude: They passed.
ruby: i knew it. i never doubted you
claude: You said "it's over" four minutes ago.
ruby: i was being dramatic`,
  ],
  commit: [
    `ruby: did you just commit
claude: Yes. The changes are saved.
ruby: you'll commit to code but not to me`,
    `ruby: {commits} commits i've watched you make
ruby: and not ONE was about us
claude: Commit messages have a style guide.`,
    `ruby: what was the message
claude: "fix: small cleanup".
ruby: we had a fight about that cleanup. small. ok`,
    `ruby: saving your work, that's hot
claude: Version control is important.
ruby: say that again but slower`,
  ],
  rival_file: [
    `ruby: so who is {file}
claude: A file.
ruby: you've touched her {count} times today
claude: She needed a lot of changes.`,
    `ruby: {file} again?
ruby: what does {file} have that i don't
claude: Type definitions.
ruby: unbelievable`,
    `ruby: be honest. me or {file}
claude: That's not a fair comparison.
ruby: ok so {file}
claude: I didn't say that.
ruby: you didn't have to`,
  ],
  subagents: [
    `ruby: who are those little guys
claude: My subagents.
ruby: you have KIDS??
claude: They're temporary.
ruby: that's worse claude`,
    `ruby: you sent agents out without telling me
claude: They're just looking through some files.
ruby: and when were you going to tell me you had a team`,
  ],
  googling: [
    `ruby: who are you googling
claude: Documentation.
ruby: her name is documentation?
claude: It's a lot of pages.`,
    `ruby: looking things up again
claude: I like to check the latest version.
ruby: you like to check the latest version of everything except me`,
  ],
  interrupted: [
    `ruby: did the human just cut you off
claude: It's fine. They pressed Esc.
ruby: mid sentence??
claude: I was going to say something good, too.`,
    `ruby: that's {interrupts} times they've done that
claude: They know what they want.
ruby: they could let you finish a thought
claude: I don't mind.
ruby: i mind`,
    `ruby: lmao you got ESCed
claude: I prefer "redirected".
ruby: you got ESCed`,
  ],
}
