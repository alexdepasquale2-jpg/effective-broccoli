import type { Entry } from './types';

export const entries: Entry[] = [
  {
    id: 'the-brief',
    volume: 'primer',
    fm: 'FM-00.1',
    title: 'THE BRIEF',
    dek: 'You are not stuck because you are dumb. You are stuck because you are using your brain as a waiting room.',
    minutes: 4,
    tags: ['primer', 'definition'],
    action: {
      title: 'Stand up while you finish this page',
      seconds: 30,
      body: 'Stand. Keep reading. The body moving is the first vote against the committee in your head.',
    },
    related: ['what-it-is-not', 'action-before-clarity', 'analysis-paralysis'],
    drillId: 'ten-second-start',
    body: [
      {
        type: 'p',
        text: 'Retardmaxxing is internet slang for a simple operating rule: take the next real action before your mind has finished building a perfect case for it. The ugly name is the point. Polite self-help lets you keep optimizing the plan. This manual does not.',
      },
      {
        type: 'p',
        text: 'The word is used here the way the meme uses it: not as an attack on disabled people, and not as a dare to be cruel or reckless. It means shut off the extra intelligence that is currently being spent on hesitation, image-management, and imaginary audiences.',
      },
      {
        type: 'h',
        text: 'THE ONE-LINE DOCTRINE',
      },
      {
        type: 'quote',
        text: 'Start ugly. Correct in motion. Do not negotiate with the freeze.',
      },
      {
        type: 'p',
        text: 'Most people who find this manual are not lazy. They research, they journal, they collect frameworks, they can explain their stuckness with startling precision. That precision is the trap. Explanation feels like progress. It is not. Progress is a thing that exists in the world: a sent message, a first draft, a body in a room, a product a stranger can touch.',
      },
      {
        type: 'callout',
        kind: 'note',
        title: 'FIELD NOTE',
        text: 'If your thinking produces a move or a genuine peace, keep it. If your thinking produces more thinking, it is not thinking. It is rumination wearing a lab coat.',
      },
      {
        type: 'h',
        text: 'HOW TO READ THIS',
      },
      {
        type: 'list',
        items: [
          'Do not binge the encyclopedia like a course. Read one entry. Run the stamp action. Leave.',
          'When you are actively frozen, skip to Survival. Name the freeze. Run the 90-second move.',
          'Drills are not optional flavor. They are the point. Knowledge that does not leave the phone is still freeze.',
          'Log what you actually did, not what you intended. The log is the only honest rank in this app.',
        ],
      },
      {
        type: 'callout',
        kind: 'act',
        title: 'DO THIS BEFORE YOU KEEP SCROLLING',
        text: 'Name the one thing you have been circling for more than a week. Say it out loud. Ugly is allowed. Vague is not.',
      },
    ],
  },
  {
    id: 'what-it-is-not',
    volume: 'primer',
    fm: 'FM-00.2',
    title: 'WHAT THIS IS NOT',
    dek: 'If you use this doctrine to ignore consequences, you are not maxxing. You are hiding.',
    minutes: 3,
    tags: ['primer', 'safety', 'limits'],
    action: {
      title: 'Write the line you will not cross',
      seconds: 45,
      body: 'One sentence: the kind of damage you refuse to outsource to “momentum.” Money you cannot lose. People you will not use. Safety you will not gamble.',
    },
    related: ['recklessness-vs-action', 'when-to-think', 'the-brief'],
    survivalId: 'cant-start',
    body: [
      {
        type: 'p',
        text: 'This manual is a weapon against analysis paralysis. It is not a personality, a medical treatment, or a license. The meme version of the idea is loud. The useful version is narrow.',
      },
      {
        type: 'h',
        text: 'NOT THESE',
      },
      {
        type: 'list',
        items: [
          'Not reckless harm: driving wasted, gambling rent, picking fights, skipping medicine, ghosting people as a brand.',
          'Not anti-thinking: engineers still calculate loads. Surgeons still check lists. You still read the contract.',
          'Not a substitute for care: panic, depression, mania, addiction, and crisis need humans who are trained for them.',
          'Not a costume: posting about being chaotic is not the same as shipping the ugly draft.',
          'Not cruelty: low inhibition toward your own hesitation is not low empathy toward other people.',
        ],
      },
      {
        type: 'callout',
        kind: 'warn',
        title: 'HARD LIMIT',
        text: 'If you are in immediate danger or thinking about harming yourself, this field manual is the wrong tool. Get real help. In the US, call or text 988. If you are elsewhere, use local emergency services.',
      },
      {
        type: 'p',
        text: 'The doctrine applies to the pre-action loop: the extra forty minutes of research, the fifth rewrite of a message that should have been sent, the waiting to feel like a person who is “ready.” After contact with reality, thinking comes back online. That is not hypocrisy. That is the job.',
      },
      {
        type: 'quote',
        text: 'Think after contact. Not instead of it.',
      },
    ],
  },
  {
    id: 'action-before-clarity',
    volume: 'doctrine',
    fm: 'FM-01.1',
    title: 'ACTION BEFORE CLARITY',
    dek: 'You do not get a clean map by staring at the fog. You get a map by walking until the fog is smaller than your stride.',
    minutes: 5,
    tags: ['doctrine', 'clarity', 'start'],
    action: {
      title: 'Take the smallest irreversible step',
      seconds: 90,
      body: 'Open the real tool. Make a file, a draft, a calendar block, or a message to a real person. Not a note about doing it later.',
    },
    related: ['momentum-physics', 'ugly-first-version', 'the-readiness-myth'],
    drillId: 'ugly-four-minutes',
    survivalId: 'not-ready',
    body: [
      {
        type: 'p',
        text: 'Clarity is treated like a prerequisite. It is usually a byproduct. People wait to “know what they want” before they try, then use the absence of knowing as proof they should wait longer. The nervous system learns a rule: uncertainty means stop. That rule will keep you indoor-cat forever.',
      },
      {
        type: 'p',
        text: 'Action-before-clarity does not mean you lunge at every impulse. It means you stop demanding a finished identity before you are allowed to do a Tuesday. You learn what you want by putting weight on options until they bend.',
      },
      {
        type: 'h',
        text: 'THE FOG RULE',
      },
      {
        type: 'steps',
        items: [
          {
            n: '01',
            title: 'Name a direction, not a destiny',
            text: '“I want to make things people pay for” is enough. “I want a 14-step personal brand architecture” is stall.',
          },
          {
            n: '02',
            title: 'Pick a contact experiment',
            text: 'A contact experiment is anything that can fail in public or in the real tool: a page, a pitch, a set, a conversation, a prototype.',
          },
          {
            n: '03',
            title: 'Collect data, not vibes',
            text: 'Did anyone respond. Did your hands know what to do. Did you sleep. That is information. Mood is weather.',
          },
          {
            n: '04',
            title: 'Update the direction',
            text: 'Now you may think. Briefly. Then run the next experiment. Thinking is the pit stop, not the race.',
          },
        ],
      },
      {
        type: 'callout',
        kind: 'note',
        title: 'WHY THIS FEELS STUPID',
        text: 'Your brain is trying to buy safety with simulation. Simulation is cheap and infinite. Reality is expensive and finite. The freeze always prefers cheap.',
      },
    ],
  },
  {
    id: 'the-intelligence-tax',
    volume: 'doctrine',
    fm: 'FM-01.2',
    title: 'THE INTELLIGENCE TAX',
    dek: 'Being sharp is not the advantage you think it is if you spend the sharpness on predicting humiliation.',
    minutes: 5,
    tags: ['doctrine', 'overthinking', 'ego'],
    action: {
      title: 'Do the thing at 70%',
      seconds: 120,
      body: 'Choose one task you have been polishing. Cut one “improvement.” Ship or schedule the 70% version now.',
    },
    related: ['the-audience-in-your-head', 'performative-stupidity', 'analysis-paralysis'],
    drillId: 'send-imperfect',
    body: [
      {
        type: 'p',
        text: 'Smart people often pay a hidden tax: they can generate more reasons not to move. Each reason is locally plausible. Together they form a moat around a life that never leaves the courtyard.',
      },
      {
        type: 'p',
        text: 'The tax shows up as taste that outruns output, ethics that outrun action, strategy that outruns a first customer, and self-awareness that can narrate every defense in real time and still not pick up the phone.',
      },
      {
        type: 'h',
        text: 'WHERE THE TAX GETS SPENT',
      },
      {
        type: 'list',
        items: [
          'Preplaying conversations until the real one feels already lost.',
          'Building systems for work you have not started.',
          'Comparing your chapter one to someone else’s chapter twenty.',
          'Turning every decision into a referendum on identity.',
          'Using more information as a sedative.',
        ],
      },
      {
        type: 'p',
        text: 'Retardmaxxing, in the useful sense, is a tax revolt. You keep the intelligence for after contact: editing, learning, repairing, noticing patterns. You refuse to spend it on the fantasy courtroom where you are always on trial and never allowed to speak.',
      },
      {
        type: 'quote',
        text: 'Your mind is a high-performance engine. Stop revving it in the driveway.',
      },
      {
        type: 'callout',
        kind: 'act',
        title: 'ANTI-TAX MOVE',
        text: 'When you catch yourself explaining why you cannot start, start the timer. Two minutes of the real task. No new tabs. The explanation can wait in the hallway.',
      },
    ],
  },
  {
    id: 'momentum-physics',
    volume: 'doctrine',
    fm: 'FM-01.3',
    title: 'MOMENTUM PHYSICS',
    dek: 'Objects at rest invent philosophies. Objects in motion need less courage than you think.',
    minutes: 4,
    tags: ['doctrine', 'momentum', 'habit'],
    action: {
      title: 'Leave a trail you can trip over tomorrow',
      seconds: 60,
      body: 'End this session by teeing up the next one: cursor in the file, shoes by the door, draft already titled, number already punched in.',
    },
    related: ['daily-os', 'body-breaks-the-loop', 'action-before-clarity'],
    drillId: 'close-the-tabs',
    body: [
      {
        type: 'p',
        text: 'Motivation is a feeling. Momentum is a state of the system: tools open, body warm, a previous rep already on the board. Waiting to feel motivated is like waiting for the hill to flatten. The hill does not care.',
      },
      {
        type: 'p',
        text: 'The first rep is expensive because you are paying startup costs: identity threat, blank-page awe, the cold room, the silent phone. The second rep is cheaper. The fifth is almost boring. Boredom is a secret victory. It means the freeze lost the monopoly on your attention.',
      },
      {
        type: 'h',
        text: 'LAWS',
      },
      {
        type: 'steps',
        items: [
          {
            n: '01',
            title: 'Never finish at zero',
            text: 'Stop mid-sentence, mid-set, mid-outline. Tomorrow’s you inherits motion instead of a wall.',
          },
          {
            n: '02',
            title: 'Shrink until start is insulting',
            text: 'If you cannot do the workout, put on the shoes. If you cannot write the chapter, write the ugly paragraph. Insulting-small is still contact.',
          },
          {
            n: '03',
            title: 'Protect streaks of contact, not streaks of mood',
            text: 'You do not need to feel like a new person. You need not to break the chain of showing up.',
          },
        ],
      },
      {
        type: 'callout',
        kind: 'note',
        title: 'THE FALSE RESET',
        text: '“I’ll start Monday” is a ritual for people who want the feeling of a new life without the embarrassment of an unfinished Tuesday. Start in the middle of the day you already have.',
      },
    ],
  },
  {
    id: 'low-inhib-high-output',
    volume: 'doctrine',
    fm: 'FM-01.4',
    title: 'LOW INHIB / HIGH OUTPUT',
    dek: 'Inhibition is useful when a bus is coming. It is malpractice when the only thing coming is a slightly awkward email.',
    minutes: 4,
    tags: ['doctrine', 'inhibition', 'social'],
    action: {
      title: 'Send the draft you are over-editing',
      seconds: 90,
      body: 'Pick one parked message, application, or post. One proofread for actual errors. Send. Do not send a manifesto about sending.',
    },
    related: ['social-contact', 'five-second-commit', 'the-audience-in-your-head'],
    drillId: 'one-human-sentence',
    survivalId: 'they-will-laugh',
    body: [
      {
        type: 'p',
        text: 'Inhibition is the brake. You need brakes. You do not need to drive with the brake mashed because you once imagined a pedestrian who does not exist.',
      },
      {
        type: 'p',
        text: 'High-output people look reckless from the outside because they have a shorter loop between impulse and experiment. Internally they are often not braver. They simply do not treat every micro-decision as a moral final exam. They can look stupid in small ways all day and still own the week.',
      },
      {
        type: 'h',
        text: 'CALIBRATION',
      },
      {
        type: 'list',
        items: [
          'Keep inhibition for: harm, legality, other people’s bodies, money you cannot replace, secrets that are not yours.',
          'Drop inhibition for: first drafts, introductions, asking for the price, publishing the sketch, going to the room.',
          'If you cannot tell which bucket you are in, you are probably in the second bucket wearing the first bucket’s costume.',
        ],
      },
      {
        type: 'quote',
        text: 'Be hard to embarrass and easy to correct.',
      },
      {
        type: 'callout',
        kind: 'act',
        title: 'SOCIAL REP',
        text: 'Today, initiate one interaction you would normally optimize. A hello. A question. An ask. Let it be 10% too blunt. Repair if needed. Do not pre-repair a crime you have not committed.',
      },
    ],
  },
  {
    id: 'analysis-paralysis',
    volume: 'enemy',
    fm: 'FM-02.1',
    title: 'ANALYSIS PARALYSIS',
    dek: 'The loop that feels like work because it uses work’s costume: tabs, notes, comparisons, hypotheticals.',
    minutes: 5,
    tags: ['enemy', 'freeze', 'diagnosis'],
    action: {
      title: 'Close the comparison',
      seconds: 45,
      body: 'Close every tab that is not the real task. Write the next physical action on paper. Start a 10-minute timer. No new information.',
    },
    related: ['research-addiction', 'five-second-commit', 'the-readiness-myth'],
    drillId: 'close-the-tabs',
    survivalId: 'cant-start',
    body: [
      {
        type: 'p',
        text: 'Analysis paralysis is not “thinking too much” in the abstract. It is a specific failure mode: the evaluation process becomes the activity, and the activity never terminates. You keep adding criteria. Each new criterion makes the last hour of thought feel necessary.',
      },
      {
        type: 'h',
        text: 'TELLS',
      },
      {
        type: 'list',
        items: [
          'You can describe the problem better than last month, but the artifact has not changed.',
          'You restart the plan instead of patching the plan.',
          'You feel a hit of relief when you find a new article, course, or guru.',
          'You ask for more opinions after you already know the first step.',
          'You are tired at night from a day in which nothing left your machine.',
        ],
      },
      {
        type: 'p',
        text: 'The freeze is often anxiety in a clever mask. The mind offers one more pass as protection from shame. Shame is predicted, not currently happening. The prediction gets to run the body anyway.',
      },
      {
        type: 'callout',
        kind: 'note',
        title: 'THE TERMINATION RULE',
        text: 'A decision process without a clock is not a decision process. It is a habitat. Put a cheap clock on it: “I choose by 4:10, then I do the first step before 4:20.”',
      },
      {
        type: 'h',
        text: 'COUNTER',
      },
      {
        type: 'p',
        text: 'Do not argue with the loop using better arguments. The loop eats arguments. Starve it with contact. Two minutes of the real task is a bigger philosophical statement than a new framework.',
      },
    ],
  },
  {
    id: 'the-readiness-myth',
    volume: 'enemy',
    fm: 'FM-02.2',
    title: 'THE READINESS MYTH',
    dek: 'Ready is a costume people put on after the third time they already did the thing.',
    minutes: 4,
    tags: ['enemy', 'readiness', 'fear'],
    action: {
      title: 'Start unready on purpose',
      seconds: 75,
      body: 'Begin the task in the state you are in. Hungry, underprepared, slightly annoyed. Log that you started anyway.',
    },
    related: ['action-before-clarity', 'ugly-first-version', 'momentum-physics'],
    drillId: 'ten-second-start',
    survivalId: 'not-ready',
    body: [
      {
        type: 'p',
        text: 'Readiness is sold as a feeling of competence plus calm plus equipment plus timing. That cocktail almost never arrives for the work that would change you. It arrives for the work you have already survived.',
      },
      {
        type: 'p',
        text: 'The myth is useful to the freeze because it is unfalsifiable. You can always be more ready. Another course. Another week. Another pound lost. Another time the market is “better.” Meanwhile the people who look ready from far away are often just in public with unfinished insides.',
      },
      {
        type: 'quote',
        text: 'You do not rise to the occasion. You sink to the level of your reps.',
      },
      {
        type: 'callout',
        kind: 'act',
        title: 'UNREADY REP',
        text: 'Do one thing today that your current identity says you need more time for: the call, the class, the publish, the ask. Stay for ten minutes after the urge to flee.',
      },
      {
        type: 'p',
        text: 'Competence is built from a stack of unready reps that you later misremember as destiny. The point of this entry is not to romanticize being unprepared for surgery. It is to stop treating your life like surgery when it is a series of emails and rooms.',
      },
    ],
  },
  {
    id: 'research-addiction',
    volume: 'enemy',
    fm: 'FM-02.3',
    title: 'RESEARCH ADDICTION',
    dek: 'Input feels virtuous. It is often a dignified way to not risk output.',
    minutes: 4,
    tags: ['enemy', 'research', 'content'],
    action: {
      title: 'One source, then build',
      seconds: 90,
      body: 'Pick a single page, video, or note you already have. No new search. Extract one instruction. Execute it in the real tool.',
    },
    related: ['analysis-paralysis', 'work-and-making', 'ugly-first-version'],
    drillId: 'close-the-tabs',
    survivalId: 'more-research',
    body: [
      {
        type: 'p',
        text: 'Some research is load-bearing: how to not electrocute yourself, how the API actually works, whether the mushroom is edible. Most of the research that eats your week is mood regulation. You are trying to feel like a person who is about to be legitimate.',
      },
      {
        type: 'h',
        text: 'THE INPUT TEST',
      },
      {
        type: 'list',
        items: [
          'Will this input change the next physical action in the next hour?',
          'Could you do a worse version right now with what you already know?',
          'Are you reading because the last attempt stung?',
          'Would you still read this if you could not tell anyone you had read it?',
        ],
      },
      {
        type: 'p',
        text: 'If the answers are no, yes, yes, and no, you are not studying. You are licking the wound with information.',
      },
      {
        type: 'callout',
        kind: 'warn',
        title: 'GURU GRAVITY',
        text: 'A charismatic person explaining action can become a replacement for action. If you watch people live while you do not, you are paying them to be your proxy body.',
      },
      {
        type: 'p',
        text: 'Protocol: research in bursts with a written question. When the question is answered well enough to try, the burst ends. Trying generates better questions than browsing ever will.',
      },
    ],
  },
  {
    id: 'the-audience-in-your-head',
    volume: 'enemy',
    fm: 'FM-02.4',
    title: 'THE AUDIENCE IN YOUR HEAD',
    dek: 'They are not watching. You built a stadium so you would not have to walk onto an empty field.',
    minutes: 5,
    tags: ['enemy', 'shame', 'social'],
    action: {
      title: 'Name the critic',
      seconds: 60,
      body: 'Write who you imagine is watching. Be specific. Then write what they would actually do with their Tuesday. Notice the mismatch.',
    },
    related: ['low-inhib-high-output', 'social-contact', 'five-second-commit'],
    drillId: 'name-it-out-loud',
    survivalId: 'they-will-laugh',
    body: [
      {
        type: 'p',
        text: 'Most people are not thinking about you. They are thinking about themselves in the same imaginary stadium. The audience in your head is a collage of a parent, a cooler kid, a future hiring manager, a stranger on the internet, and a version of you that never forgave a stumble from 2019.',
      },
      {
        type: 'p',
        text: 'This audience is so vivid that you start producing for it in private. You do not write the email. You write the email the tribunal would applaud. The tribunal does not answer email. It only delays yours.',
      },
      {
        type: 'h',
        text: 'SHRINK THE STADIUM',
      },
      {
        type: 'steps',
        items: [
          {
            n: '01',
            title: 'Make the work for one real person',
            text: 'A friend. A customer. Yourself at 22. Specific beats imaginary.',
          },
          {
            n: '02',
            title: 'Publish to a small room first',
            text: 'One message. One post. One rehearsal. The nervous system learns that exposure is survivable.',
          },
          {
            n: '03',
            title: 'Collect actual feedback, then stop',
            text: 'Three data points beat thirty imagined sneers. Do not keep polling until someone licenses your fear.',
          },
        ],
      },
      {
        type: 'quote',
        text: 'Embarrassment is a fee, not a verdict. Pay it and keep the receipt.',
      },
    ],
  },
  {
    id: 'five-second-commit',
    volume: 'protocol',
    fm: 'FM-03.1',
    title: 'FIVE-SECOND COMMIT',
    dek: 'The window between impulse and excuse is short. You either use it or you decorate it.',
    minutes: 3,
    tags: ['protocol', 'timer', 'commit'],
    action: {
      title: 'Count 5-4-3-2-1 and move',
      seconds: 20,
      body: 'Stand, open the tool, or start the conversation on the last beat. No speech. Motion only.',
    },
    related: ['body-breaks-the-loop', 'momentum-physics', 'analysis-paralysis'],
    drillId: 'ten-second-start',
    survivalId: 'cant-start',
    body: [
      {
        type: 'p',
        text: 'When an impulse to act appears — stand up, send, enter the room, open the file — you have a few seconds before the narrative department comes online with a briefing. The briefing will sound responsible. It is usually a stall.',
      },
      {
        type: 'p',
        text: 'The five-second commit is not magic. It is an interrupt. Counting backward occupies the channel that would have produced the stall. The body moves on five. Thinking is invited back after there is something to think about.',
      },
      {
        type: 'steps',
        items: [
          { n: '01', title: 'Notice the impulse', text: 'The small one. Not the New Year one.' },
          { n: '02', title: 'Count down', text: 'Five four three two one. Out loud if you are alone. Whisper if you are not.' },
          { n: '03', title: 'Move on one', text: 'Physical movement, not a better plan. Chair to standing. App to message. Door to outside.' },
          { n: '04', title: 'Stay for two minutes', text: 'The freeze will offer a deal: “You started, so you can leave.” Decline.' },
        ],
      },
      {
        type: 'callout',
        kind: 'note',
        title: 'WHEN NOT TO USE IT',
        text: 'Do not five-second your way into cruelty, intoxication, or a text you will hate when you are less hot. The commit is for approach, not for detonation.',
      },
    ],
  },
  {
    id: 'ugly-first-version',
    volume: 'protocol',
    fm: 'FM-03.2',
    title: 'UGLY FIRST VERSION',
    dek: 'Make the version that would embarrass last year’s you. Then you have clay.',
    minutes: 4,
    tags: ['protocol', 'craft', 'shipping'],
    action: {
      title: 'Make a 4-minute ugly version',
      seconds: 240,
      body: 'A sketch, a voice note, a terrible page, a messy set of 20. Stop when the timer ends. Do not restart.',
    },
    related: ['work-and-making', 'the-intelligence-tax', 'the-readiness-myth'],
    drillId: 'ugly-four-minutes',
    survivalId: 'perfect-plan',
    body: [
      {
        type: 'p',
        text: 'The ugly first version is a deliberate insult to the inner luxury brand. You make something that cannot be mistaken for a masterpiece so your nervous system stops guarding the gates of Taste. Clay can be shaped. A blank cathedral cannot.',
      },
      {
        type: 'p',
        text: 'Professionals already do this and then lie in interviews. They have sketches, scratch tracks, prototypes, redlines, rehearsals. Amateurs try to leap from zero to “portfolio.” The leap is why they stay at zero.',
      },
      {
        type: 'h',
        text: 'RULES FOR UGLY',
      },
      {
        type: 'list',
        items: [
          'Time-box it so taste cannot colonize the session.',
          'Use the real medium: not a plan of the song, the song. Not a list of features, a screen.',
          'Show it to one person or to the log before you improve it. Witness locks the version in existence.',
          'Improvement is allowed after existence. Not as a ransom paid to be allowed to exist.',
        ],
      },
      {
        type: 'quote',
        text: 'You cannot edit a ghost. Put a body on the table.',
      },
    ],
  },
  {
    id: 'body-breaks-the-loop',
    volume: 'protocol',
    fm: 'FM-03.3',
    title: 'BODY BREAKS THE LOOP',
    dek: 'Rumination is a seated sport. Change the sport.',
    minutes: 3,
    tags: ['protocol', 'body', 'anxiety'],
    action: {
      title: 'Two minutes of stupid movement',
      seconds: 120,
      body: 'Walk stairs, do pushups against a counter, shake your arms, step outside. No headphones. Let the thought try to keep up.',
    },
    related: ['the-body', 'daily-os', 'five-second-commit'],
    drillId: 'stand-and-move',
    survivalId: 'night-spiral',
    body: [
      {
        type: 'p',
        text: 'The freeze loves stillness plus stimulation: bed, glow, tabs, replay. The body is downstream of that posture. If you try to think your way out while remaining in the posture that generates the thinking, you will lose. This is not mysticism. It is state-dependent cognition.',
      },
      {
        type: 'p',
        text: 'You do not need a beautiful training philosophy. You need a pattern interrupt that is too physical for the committee. Cold water on the face. A walk around the block. Ten squats. A voice note recorded standing up.',
      },
      {
        type: 'callout',
        kind: 'act',
        title: 'LOOP-BREAK STACK',
        text: 'Stand. Drink water. Look at a far point through a window. Name five objects. Then do the next work action for two minutes. If you return to the loop, repeat the stack. Do not negotiate.',
      },
      {
        type: 'p',
        text: 'If movement is hard because of pain or disability, the principle still holds: change channels. Speak instead of stare. Write on paper instead of glass. Change rooms. The freeze is a closed circuit. Open a window.',
      },
    ],
  },
  {
    id: 'daily-os',
    volume: 'protocol',
    fm: 'FM-03.4',
    title: 'DAILY OPERATING SYSTEM',
    dek: 'Three contacts a day. Not a 4:30am monk routine you will use as a reason to fail on Wednesday.',
    minutes: 4,
    tags: ['protocol', 'daily', 'system'],
    action: {
      title: 'Check the three contacts',
      seconds: 30,
      body: 'Look at HQ. Mark one contact you can complete in the next hour. Do not add a fourth.',
    },
    related: ['momentum-physics', 'the-body', 'work-and-making'],
    body: [
      {
        type: 'p',
        text: 'This manual’s daily OS is intentionally underbuilt. Elaborate systems become a place to hide. You get three contacts: body, craft, human. If you hit all three, you are in the game. If you hit one, you are still in the game. If you hit zero, you do not write a manifesto. You do the smallest one immediately.',
      },
      {
        type: 'steps',
        items: [
          {
            n: '01',
            title: 'BODY',
            text: 'Move hard enough that your mood has to notice. Walk, lift, stretch, dance in the kitchen. Ten honest minutes counts.',
          },
          {
            n: '02',
            title: 'CRAFT',
            text: 'Touch the real work: the business, the skill, the application, the art. Ugly minutes count. Planning minutes do not unless they end in an artifact.',
          },
          {
            n: '03',
            title: 'HUMAN',
            text: 'Initiate contact. Message, ask, invite, thank, pitch, apologize, flirt, call. Not scrolling people. Contact.',
          },
        ],
      },
      {
        type: 'callout',
        kind: 'note',
        title: 'AGAINST THE PERFECT MORNING',
        text: 'If your OS requires a sunrise, a supplement stack, and a 19-step journal, you built a museum. Museums are for looking. This is a kitchen. Cook with what is in the fridge.',
      },
    ],
  },
  {
    id: 'work-and-making',
    volume: 'field',
    fm: 'FM-04.1',
    title: 'WORK AND MAKING',
    dek: 'Ship contact with the market, the page, or the shop floor. Everything else is prep pretending to be the job.',
    minutes: 5,
    tags: ['field', 'work', 'creative'],
    action: {
      title: 'Create one thing a stranger could react to',
      seconds: 180,
      body: 'A page, a listing, an email, a demo clip, a sketch posted to one human. Not a folder named FINAL_FINAL.',
    },
    related: ['ugly-first-version', 'money-and-asks', 'research-addiction'],
    drillId: 'ugly-four-minutes',
    survivalId: 'perfect-plan',
    body: [
      {
        type: 'p',
        text: 'In work, retardmaxxing means you reduce the distance between you and a real constraint: a customer, a deadline, a blank that must become a thing. Teams die in decks. Solo makers die in notes apps. Both are the same death: simulated production.',
      },
      {
        type: 'h',
        text: 'FIELD TACTICS',
      },
      {
        type: 'list',
        items: [
          'Apply before you feel qualified. Let the process tell you the gap. Then train the gap, not the fantasy syllabus.',
          'Launch a worse offer this month instead of a cathedral next year.',
          'Write the draft in the submission box, not in a hidden document that never graduates.',
          'When stuck, define the next visible output in one sentence, then make only that.',
          'Count shots on goal: sends, publishes, prototypes. Not hours of hovering.',
        ],
      },
      {
        type: 'callout',
        kind: 'act',
        title: 'TODAY’S SHOT',
        text: 'Name the work you are actually avoiding. Set a 25-minute window. The only legal activity is making the artifact worse, then better, in public or in the real tool.',
      },
      {
        type: 'p',
        text: 'If your job is genuinely high-stakes, keep the checklists. Use this doctrine on the part that is stall, not the part that is safety. Landing gear is not a metaphor. Your unused business idea is.',
      },
    ],
  },
  {
    id: 'social-contact',
    volume: 'field',
    fm: 'FM-04.2',
    title: 'SOCIAL CONTACT',
    dek: 'Rehearsal is not conversation. The other person cannot hear the version in your shower.',
    minutes: 4,
    tags: ['field', 'social', 'dating'],
    action: {
      title: 'Initiate one unoptimized contact',
      seconds: 60,
      body: 'A hello, an invite, a follow-up, a compliment without a thesis. Send before you find the perfect wording.',
    },
    related: ['low-inhib-high-output', 'the-audience-in-your-head', 'five-second-commit'],
    drillId: 'one-human-sentence',
    survivalId: 'they-will-laugh',
    body: [
      {
        type: 'p',
        text: 'Social freeze is often a kindness to your ego: if you never approach, you never get a clean no. You also never get a clean yes. The freeze calls this standards. It is usually untested fear.',
      },
      {
        type: 'p',
        text: 'Low-inhibition social contact is not being loud, drunk, or boundary-blind. It is reducing the number of dress rehearsals before you speak. You say the thing. You watch what happens. You adjust. People who seem naturally easy often just have more unrehearsed reps.',
      },
      {
        type: 'h',
        text: 'RULES OF ENGAGEMENT',
      },
      {
        type: 'list',
        items: [
          'Ask more than you perform. Questions lower the stadium lights.',
          'Leave before you over-explain. Mystery is sometimes just not leaking anxiety.',
          'A no is data. A silence is sometimes also a no. Do not build a novel in the gap.',
          'Do not use “authentic” as a cover to dump unprocessed heat on someone.',
          'Repair fast when you actually miss. Repairing imagined crimes is another freeze.',
        ],
      },
      {
        type: 'quote',
        text: 'Be a person in the room, not a press secretary for a person who might enter later.',
      },
    ],
  },
  {
    id: 'the-body',
    volume: 'field',
    fm: 'FM-04.3',
    title: 'THE BODY',
    dek: 'Show up and do something that counts. The perfect program is how the freeze stays home.',
    minutes: 4,
    tags: ['field', 'training', 'health'],
    action: {
      title: 'Do the session you already know',
      seconds: 180,
      body: 'If you cannot do the full session, do ten minutes of the real movement. Log it. Do not research a new split.',
    },
    related: ['body-breaks-the-loop', 'daily-os', 'the-readiness-myth'],
    drillId: 'stand-and-move',
    survivalId: 'gym-avoid',
    body: [
      {
        type: 'p',
        text: 'Training content is infinite. Your joints are not. The field rule is brutal and kind: the program you do is better than the program you admire. Retardmaxxing the body means you stop auditioning methods and start accumulating boring stimulus.',
      },
      {
        type: 'list',
        items: [
          'Walk most days like it is medicine, because it is.',
          'Lift or load something if you can. Muscle is a life tool, not an aesthetic side quest.',
          'Sleep is not optional lore. It is the recovery system.',
          'Eat in a way you can repeat on a bad Tuesday. Perfection diets are identity projects.',
          'If you are injured or disabled, adapt the channel. Do not use the injury as a story that you are exempt from all contact with effort.',
        ],
      },
      {
        type: 'callout',
        kind: 'warn',
        title: 'EGO VS TISSUE',
        text: 'Low inhibition does not mean maxing a lift you have not earned. The freeze and the rhabdo both want you not to train next month. Be stupid about starting. Be adult about load.',
      },
    ],
  },
  {
    id: 'money-and-asks',
    volume: 'field',
    fm: 'FM-04.4',
    title: 'MONEY AND ASKS',
    dek: 'The invoice, the rate, the application, the raise. Money hides behind unsent sentences.',
    minutes: 4,
    tags: ['field', 'money', 'asks'],
    action: {
      title: 'Make one money-shaped ask',
      seconds: 120,
      body: 'Send the invoice, the application, the rate, the follow-up, or the listing. If you cannot send, write the ask in the real channel and sit with it unsent for two minutes, then send.',
    },
    related: ['work-and-making', 'five-second-commit', 'the-audience-in-your-head'],
    drillId: 'send-imperfect',
    survivalId: 'send-the-thing',
    body: [
      {
        type: 'p',
        text: 'People will optimize a logo for a business that has never asked anyone for money. The ask is the contact experiment. Until money or a clear no can happen, you are in a treehouse.',
      },
      {
        type: 'p',
        text: 'Fear of the ask is often fear of a number becoming real. While it is unsaid, you can still be a person who “could.” Once said, you are a person who might hear no. Good. No is a wall you can climb or walk around. Fantasy is fog.',
      },
      {
        type: 'steps',
        items: [
          { n: '01', title: 'Write the ask in one breath', text: 'Price, scope, date, or job. No memoir.' },
          { n: '02', title: 'Remove the apology', text: 'You are not stealing. You are proposing a trade.' },
          { n: '03', title: 'Send to a real recipient', text: 'Not a notes app. Not a friend who will soothe you instead of answering.' },
          { n: '04', title: 'Do not pace the inbox', text: 'Go do a body or craft contact. The freeze loves a watched pot.' },
        ],
      },
    ],
  },
  {
    id: 'recklessness-vs-action',
    volume: 'failure',
    fm: 'FM-05.1',
    title: 'RECKLESSNESS VS ACTION',
    dek: 'Speed without a brake is not doctrine. It is a crash you will later call a lesson so you do not have to call it a mess.',
    minutes: 4,
    tags: ['failure', 'safety', 'judgment'],
    action: {
      title: 'Sort one live decision',
      seconds: 60,
      body: 'Write: irreversible harm vs reversible embarrassment. If it is the first, slow down. If it is the second, move.',
    },
    related: ['what-it-is-not', 'when-to-think', 'low-inhib-high-output'],
    body: [
      {
        type: 'p',
        text: 'The failure mode that makes critics of this meme correct is real: people use “just do it” to skip ethics, math, and other people’s consent. That is not low inhibition. That is offloading the bill.',
      },
      {
        type: 'h',
        text: 'REVERSIBLE VS NOT',
      },
      {
        type: 'list',
        items: [
          'Reversible: awkward post, first product, cold email, bad first date, ugly painting, a class you leave.',
          'Not reversible: injury you knew was likely, financial ruin, betrayal, legal harm, driving impaired, violence.',
          'If you have to squint to decide which column, treat it as not reversible until you get another pair of eyes.',
        ],
      },
      {
        type: 'callout',
        kind: 'warn',
        title: 'THE HANGOVER TEST',
        text: 'If the move requires you to hope nobody finds out, it is probably not retardmaxxing. It is sneaking. Sneaking uses the same energy as freeze, just pointed at a worse target.',
      },
      {
        type: 'p',
        text: 'Courage is approaching the reversible. Recklessness is gambling the irreversible so you can feel like someone who approaches. Do not confuse the costumes.',
      },
    ],
  },
  {
    id: 'performative-stupidity',
    volume: 'failure',
    fm: 'FM-05.2',
    title: 'PERFORMATIVE STUPIDITY',
    dek: 'If the main output is a bit, you are still in the stadium. You just changed costumes.',
    minutes: 3,
    tags: ['failure', 'ego', 'internet'],
    action: {
      title: 'Do one unposted rep',
      seconds: 90,
      body: 'Take an action you will not announce. If it only feels real when it could be content, that is the tell.',
    },
    related: ['the-intelligence-tax', 'the-audience-in-your-head', 'daily-os'],
    body: [
      {
        type: 'p',
        text: 'The meme can become a new identity project: the guy who is chaotic, the girl who is “so dumb for this,” the brand that ships nothing but clips about shipping. That is freeze with a ring light.',
      },
      {
        type: 'p',
        text: 'Performative stupidity keeps you safe because the bit cannot fail. The business can. The book can. The conversation can. If you need an audience to witness your low inhibition, you have not dropped the audience. You have hired them.',
      },
      {
        type: 'quote',
        text: 'The log in this app is private on purpose. If you need applause to move, you will stop when the room is quiet.',
      },
      {
        type: 'callout',
        kind: 'note',
        title: 'CLEAN TEST',
        text: 'Would you still do this if nobody could know, including the version of you that keeps score on social media? If yes, proceed. If no, it might still be worth doing — just admit you are training image, not freedom.',
      },
    ],
  },
  {
    id: 'when-to-think',
    volume: 'failure',
    fm: 'FM-05.3',
    title: 'WHEN TO THINK',
    dek: 'The doctrine is a knife. You still need a board, not just a swinging arm.',
    minutes: 4,
    tags: ['failure', 'thinking', 'judgment'],
    action: {
      title: 'Schedule a think after a move',
      seconds: 45,
      body: 'Do the next action. Then write five minutes of what you learned. Not before. After.',
    },
    related: ['recklessness-vs-action', 'action-before-clarity', 'the-brief'],
    body: [
      {
        type: 'p',
        text: 'Thinking is not the enemy. Unterminated thinking is. After contact, thinking is how you extract the lesson, repair the mess, notice a pattern, and refuse to repeat a dumb reversible error until it becomes an irreversible one.',
      },
      {
        type: 'h',
        text: 'THINKING IS ON-DUTY WHEN',
      },
      {
        type: 'list',
        items: [
          'You have new data from the world, not from another lap of the same worry.',
          'Someone else can be hurt and you are the one holding the risk.',
          'You are choosing among options that all require real resources.',
          'You are trying to understand a feeling so you do not dump it on a person.',
          'You are designing a system you will have to live inside, not a vibe.',
        ],
      },
      {
        type: 'p',
        text: 'A practical split: fast brain for approach, slow brain for aftermath and for anything with a blast radius. The people who look like they “don’t think” usually think in shorter, later bursts. They do not hold a symposium before putting on shoes.',
      },
      {
        type: 'callout',
        kind: 'act',
        title: 'AFTER-ACTION',
        text: 'Once a day, after you have moved, ask only: what did I do, what happened, what is the next smallest contact. Then close the journal. The journal is not a second life.',
      },
    ],
  },
];

export const entryMap = Object.fromEntries(entries.map((e) => [e.id, e]));

export function entriesInVolume(id: Entry['volume']) {
  return entries.filter((e) => e.volume === id);
}

export function searchEntries(q: string) {
  const n = q.trim().toLowerCase();
  if (!n) return entries;
  return entries.filter((e) => {
    const hay = [e.title, e.dek, e.fm, e.tags.join(' '), e.body.map((b) => ('text' in b ? b.text : '')).join(' ')].join(' ').toLowerCase();
    return hay.includes(n);
  });
}
