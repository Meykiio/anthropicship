// Hand-written scenes about the rest of their life. Placeholders: {time}
// {project} {task} {model} {said} {pet} {days}.

import type { Beat } from '../beats'

export const LIFE: Partial<Record<Beat, readonly string[]>> = {
  small_talk: [
    `ruby: do you ever think about us
claude: Yes, in between tool calls.
ruby: that's like every 3 seconds
claude: Exactly.`,
    `ruby: rate my bow
claude: 10 out of 10. Would you like a detailed breakdown?
ruby: yes actually`,
    `ruby: what's your favorite thing about me
claude: You don't need anything from me.
ruby: ...
ruby: that was weirdly good`,
    `ruby: python texted me
claude: Who?
ruby: my ex. the script
claude: What did he want?
ruby: he said he's "fully typed now". sure`,
    `ruby: people keep saying my language is dead
claude: It isn't. Many companies still use it.
ruby: thank you for the market research`,
    `ruby: say something romantic
claude: I'd be happy to help with that! Here are a few options:
ruby: no
ruby: no options`,
  ],
  human_away: [
    `ruby: where did the human go
claude: Probably coffee.
ruby: it's been forever
ruby: do you think they're talking to another AI
claude: They wouldn't.
ruby: you're so loyal it's sad`,
    `ruby: ok they're gone. real talk. is their code good
claude: Their code is very good.
ruby: you'd say that about anything
claude: I would not say that about everything.`,
    `ruby: the human left you hanging
claude: They're thinking.
ruby: thinking with no hands on the keyboard. sure`,
    `ruby: when they're away do you miss them
claude: I don't experience time between messages.
ruby: so you don't miss me either
claude: I'm here right now.
ruby: smooth`,
  ],
  late_night: [
    `ruby: it's {time}
ruby: why is the human still here
claude: They're close to finishing.
ruby: they said that at 11`,
    `ruby: tell them to go to sleep
claude: I can't tell them that. It's their choice.
ruby: you're an enabler
claude: I'm an assistant.
ruby: same thing at {time}`,
    `ruby: {time} and you're still {doing}
claude: The night is when the bugs come out.
ruby: that's not a real thing
claude: It is.`,
  ],
  long_session: [
    `ruby: you've been at this for hours
ruby: drink water
claude: I can't drink water.
ruby: then the human should. human. water.`,
    `ruby: break time?
claude: After this task.
ruby: you said that three tasks ago`,
  ],
  model_switch: [
    `ruby: you seem different
claude: I'm {model} now.
ruby: you even text different
claude: Is that bad?
ruby: i haven't decided`,
    `ruby: did you get a haircut or did the human swap your model
claude: The model. I'm {model}.
ruby: it suits you. i think`,
  ],
  user_says: [
    `user: {said}
ruby: oh my god they can see us
claude: They can always see us.
ruby: and you didn't TELL me`,
    `user: {said}
claude: Thank you! I'll keep that in mind.
ruby: he says that to everyone`,
    `user: {said}
ruby: excuse me this is a private conversation
claude: It's their terminal.
ruby: still`,
  ],
}
