import type { Scenario } from './types';

export const scenarios: Scenario[] = [
  {
    id: 'cant-start',
    title: 'I CANNOT START',
    freeze: 'The thing is sitting there. You orbit it.',
    signal: 'Tabs, snacks, sudden cleaning, “I’ll just set up first.”',
    diagnosis:
      'Startup cost plus identity threat. Beginning would make the gap between you and the work visible. Orbiting keeps the gap theoretical.',
    loop: 'You wait for a clean hour. The hour arrives. You use it to prepare the hour. The hour dies.',
    immediate: {
      seconds: 90,
      title: 'Open the real surface',
      body: 'Open the doc, the IDE, the shoes, the application form. Type one ugly sentence or do one ugly rep. Close everything else first.',
    },
    protocol24: [
      'Two 10-minute contacts with the real task. Phone in another room.',
      'Leave the file open or the gear out so tonight’s you cannot play hide-and-seek.',
      'Tell one person what you started. Not what you plan.',
    ],
    protocol7: [
      'Daily craft contact, even if insultingly short.',
      'Ban new tutorials until you have three artifacts.',
      'End each session mid-sentence so tomorrow inherits motion.',
    ],
    relatedEntries: ['analysis-paralysis', 'five-second-commit', 'momentum-physics'],
    drillId: 'ten-second-start',
    path: [
      {
        id: 'start',
        prompt: 'The work is two clicks away. Your brain offers a deal.',
        body: 'You have already thought about this more than you have touched it. Choose the next move.',
        choices: [
          { label: 'Watch one more explainer so I “get it”', next: 'explainer', kind: 'loop' },
          { label: 'Tidy the setup / playlist / lighting', next: 'setup', kind: 'loop' },
          { label: 'Open the real file and make a mess for 4 minutes', next: 'mess', kind: 'advance' },
        ],
      },
      {
        id: 'explainer',
        prompt: 'The explainer was good. You feel briefly legitimate.',
        body: 'You now know three more ways to start. You have still not started. The freeze got paid in the currency it likes: information.',
        choices: [
          { label: 'One more video, this one is the missing piece', next: 'deeper', kind: 'loop' },
          { label: 'Enough. Open the real surface.', next: 'mess', kind: 'advance' },
        ],
      },
      {
        id: 'setup',
        prompt: 'The desk looks like a person who works here.',
        body: 'You have built a set. The actor has not walked on. Clean environments are not contact.',
        choices: [
          { label: 'Reorganize folders. It will pay off later.', next: 'deeper', kind: 'loop' },
          { label: 'Sit in the imperfect setup and type anyway', next: 'mess', kind: 'advance' },
        ],
      },
      {
        id: 'deeper',
        prompt: 'You are now an expert on not beginning.',
        body: 'The loop will happily go all night. It does not get bored. You do. That tiredness will be used as proof you should start tomorrow.',
        choices: [
          { label: 'Keep orbiting. Tomorrow-me is more serious.', next: 'fail', kind: 'fail' },
          { label: 'Break it. Ugly four minutes. Now.', next: 'mess', kind: 'advance' },
        ],
      },
      {
        id: 'mess',
        prompt: 'The page is ugly. Good. It exists.',
        body: 'You have contact. The freeze will now offer a taste upgrade. Decline for four minutes. Then you may edit.',
        choices: [
          { label: 'Stamp this and go do the 90-second move for real', next: 'win', kind: 'win' },
        ],
      },
      {
        id: 'fail',
        prompt: 'Tomorrow-you is a fictional employee.',
        body: 'They will inherit this same loop plus shame interest. Come back when you are willing to be unimpressive on purpose.',
        choices: [{ label: 'Return to the first fork', next: 'start', kind: 'loop' }],
      },
      {
        id: 'win',
        prompt: 'Protocol complete.',
        body: 'You chose contact over costume. Run the immediate 90-second action if you have not. Then log it.',
        choices: [],
      },
    ],
  },
  {
    id: 'perfect-plan',
    title: 'I NEED THE PERFECT PLAN',
    freeze: 'You will move after the architecture is tasteful.',
    signal: 'Frameworks, whiteboards, renaming the system, never a prototype.',
    diagnosis:
      'Planning is a legal high. It uses the same brain as work and pays you in the feeling of control without the risk of a wrong line.',
    loop: 'Every new plan makes the last plan feel naive, so you restart. Restarts feel like high standards.',
    immediate: {
      seconds: 120,
      title: 'Plan on the artifact',
      body: 'Open the real output. Write a 5-bullet ugly plan at the top of it. Execute bullet one immediately. Do not open a new doc called PLAN.',
    },
    protocol24: [
      'One prototype, even if it is a paper sketch or a terrible landing sentence.',
      'Cap planning at 15 minutes, then a forced build block.',
      'Show the prototype to one person before you improve the plan.',
    ],
    protocol7: [
      'Weekly: one shipped ugly version, one paragraph of what you learned after.',
      'Kill one tool or framework you added for comfort.',
    ],
    relatedEntries: ['ugly-first-version', 'action-before-clarity', 'work-and-making'],
    drillId: 'ugly-four-minutes',
    path: [
      {
        id: 'start',
        prompt: 'The plan is almost right. That is the tell.',
        body: 'If it were a map you needed, you would already be walking and annotating. You are decorating the map.',
        choices: [
          { label: 'Add one more layer. Then it will be robust.', next: 'layer', kind: 'loop' },
          { label: 'Build a crude version of step one now', next: 'crude', kind: 'advance' },
        ],
      },
      {
        id: 'layer',
        prompt: 'Robust. Also imaginary.',
        body: 'You now have a system for a product, body, or life that still has not had a Tuesday. Complexity is not the same as strength.',
        choices: [
          { label: 'Research how other people planned this', next: 'others', kind: 'loop' },
          { label: 'Cut the plan to five bullets on the artifact', next: 'crude', kind: 'advance' },
        ],
      },
      {
        id: 'others',
        prompt: 'Other people also lie in their plans.',
        body: 'You are collecting after-action reports dressed as recipes. Their first week was also ugly. They just do not post that slide.',
        choices: [
          { label: 'Accept the costume and keep planning', next: 'fail', kind: 'fail' },
          { label: 'Make the crude thing anyway', next: 'crude', kind: 'advance' },
        ],
      },
      {
        id: 'crude',
        prompt: 'It looks like a student did it. Perfect.',
        body: 'You can now learn. A pretty plan cannot teach you. Stamp and build.',
        choices: [{ label: 'Clear the protocol', next: 'win', kind: 'win' }],
      },
      {
        id: 'fail',
        prompt: 'The architecture remains undefeated. So does the freeze.',
        body: 'Come back when you are willing to let a stupid version exist in daylight.',
        choices: [{ label: 'Try the fork again', next: 'start', kind: 'loop' }],
      },
      {
        id: 'win',
        prompt: 'Protocol complete.',
        body: 'Put the five bullets on the real artifact and execute bullet one.',
        choices: [],
      },
    ],
  },
  {
    id: 'they-will-laugh',
    title: 'THEY WILL JUDGE ME',
    freeze: 'An imaginary crowd has veto power over your mouth.',
    signal: 'Rewriting messages, not posting, not entering, replaying old cringe as prophecy.',
    diagnosis:
      'Shame prediction. The nervous system treats social death like biological death. It is wrong, but it is loud.',
    loop: 'You delay to become impressive enough that nobody could laugh. Impressive enough never arrives because the crowd is inside you.',
    immediate: {
      seconds: 60,
      title: 'Smallest public rep',
      body: 'Send or say the 80% version to one real person. Not a story about doing it. The thing itself.',
    },
    protocol24: [
      'One initiated contact.',
      'Write the imagined insult. Then ask if that person would actually spend their afternoon on it.',
      'Do not check for reactions more than once.',
    ],
    protocol7: [
      'Seven initiated contacts, not seven perfect performances.',
      'One thing published to a small room.',
    ],
    relatedEntries: ['the-audience-in-your-head', 'social-contact', 'low-inhib-high-output'],
    drillId: 'one-human-sentence',
    path: [
      {
        id: 'start',
        prompt: 'You can feel them watching. Who is “them”?',
        body: 'Be honest. A parent. A cooler peer. Strangers. A future boss. You from a worse year.',
        choices: [
          { label: 'Keep polishing until they would clap', next: 'polish', kind: 'loop' },
          { label: 'Send the 80% thing to one human', next: 'send', kind: 'advance' },
          { label: 'Decide they are right and stay home', next: 'fail', kind: 'fail' },
        ],
      },
      {
        id: 'polish',
        prompt: 'It is smoother. You are no braver.',
        body: 'Taste improved. Exposure did not happen. The stadium is still fully booked with ghosts.',
        choices: [
          { label: 'Polish again. This draft has a tone issue.', next: 'fail', kind: 'fail' },
          { label: 'Send it slightly wrong on purpose', next: 'send', kind: 'advance' },
        ],
      },
      {
        id: 'send',
        prompt: 'It is out. Your body thinks a tiger was involved.',
        body: 'That surge is not information about the quality of what you sent. It is information about how rarely you send. Stay with it without unsending.',
        choices: [{ label: 'Stamp the protocol', next: 'win', kind: 'win' }],
      },
      {
        id: 'fail',
        prompt: 'The crowd remains undefeated because it never had to show up.',
        body: 'You cannot win a game against extras you hired. Fire them by contacting a real person.',
        choices: [{ label: 'Back to the fork', next: 'start', kind: 'loop' }],
      },
      {
        id: 'win',
        prompt: 'Protocol complete.',
        body: 'Do the 60-second public rep if it is still unsent.',
        choices: [],
      },
    ],
  },
  {
    id: 'more-research',
    title: 'JUST A BIT MORE RESEARCH',
    freeze: 'One more source and you will finally be allowed.',
    signal: 'Playlists, threads, saved posts, courses in the cart, notes that never graduate.',
    diagnosis: 'Information as sedation. You are regulating anxiety with the feeling of becoming ready.',
    loop: 'Each source creates new keywords to search. The question is never declared answered.',
    immediate: {
      seconds: 90,
      title: 'Close the library',
      body: 'No new search. Take one instruction you already have. Execute it in the real tool for ten minutes.',
    },
    protocol24: [
      'Airplane mode for one work block.',
      'Write the question you were actually trying to soothe. Answer it with what you know.',
    ],
    protocol7: [
      'Research only with a written question and a 20-minute cap.',
      'Three executions per source, or the source is entertainment.',
    ],
    relatedEntries: ['research-addiction', 'analysis-paralysis', 'work-and-making'],
    drillId: 'close-the-tabs',
    path: [
      {
        id: 'start',
        prompt: 'The next article promises the missing key.',
        body: 'You have keys. You have not walked through the door.',
        choices: [
          { label: 'Open the article. It is short.', next: 'article', kind: 'loop' },
          { label: 'Execute one old note now', next: 'exec', kind: 'advance' },
        ],
      },
      {
        id: 'article',
        prompt: 'It was good. It linked to two more.',
        body: 'You are in a tunnel that generates more tunnel. This is not curiosity anymore. Curiosity would have tried something.',
        choices: [
          { label: 'Follow one link. For context.', next: 'tunnel', kind: 'loop' },
          { label: 'Stop. Build with yesterday’s notes.', next: 'exec', kind: 'advance' },
        ],
      },
      {
        id: 'tunnel',
        prompt: 'Night has a different color now.',
        body: 'You could pass a quiz. You could not show a thing. That is the addiction’s receipt.',
        choices: [
          { label: 'Admit the binge and still refuse to build', next: 'fail', kind: 'fail' },
          { label: 'Build badly with what you already stole back', next: 'exec', kind: 'advance' },
        ],
      },
      {
        id: 'exec',
        prompt: 'The tool is open. The theory has to sit in the hall.',
        body: 'This is the only research that updates. Stamp it.',
        choices: [{ label: 'Clear', next: 'win', kind: 'win' }],
      },
      {
        id: 'fail',
        prompt: 'The library will still be there at 1am.',
        body: 'So will the unlived life. Choose again when you want a thing more than a feeling of becoming.',
        choices: [{ label: 'Retry', next: 'start', kind: 'loop' }],
      },
      {
        id: 'win',
        prompt: 'Protocol complete.',
        body: 'Close new tabs. Execute one instruction you already own.',
        choices: [],
      },
    ],
  },
  {
    id: 'not-ready',
    title: 'I AM NOT READY YET',
    freeze: 'Permission has not come down from a committee that does not exist.',
    signal: '“After I…” chains. Waiting for a feeling of legitimacy.',
    diagnosis: 'Readiness is being used as a mood. Moods do not grant licenses. Reps do.',
    loop: 'You postpone until you feel like the kind of person who would already have started. That feeling is a result, not a gate.',
    immediate: {
      seconds: 75,
      title: 'Unready start',
      body: 'Begin in this exact state. Hungry, under-slept, under-qualified. Two minutes of the real thing.',
    },
    protocol24: [
      'Do the thing you were going to do when you were “more you.”',
      'Log that you were unready and it still counted.',
    ],
    protocol7: [
      'Collect seven unready reps. Review whether catastrophe arrived. It almost never does.',
    ],
    relatedEntries: ['the-readiness-myth', 'action-before-clarity', 'ugly-first-version'],
    drillId: 'ten-second-start',
    path: [
      {
        id: 'start',
        prompt: 'When will you be ready?',
        body: 'Listen to the answer. If it depends on a feeling, a number, or a perfect week, it is a myth with a calendar.',
        choices: [
          { label: 'After I get more prepared / fit / skilled / stable', next: 'after', kind: 'loop' },
          { label: 'I start unready for two minutes', next: 'go', kind: 'advance' },
        ],
      },
      {
        id: 'after',
        prompt: 'That finish line moves. That is its job.',
        body: 'Preparation is allowed. An infinite prelude is not preparation. It is a lifestyle.',
        choices: [
          { label: 'Protect the prelude. It feels responsible.', next: 'fail', kind: 'fail' },
          { label: 'Be unready in public / on the tool', next: 'go', kind: 'advance' },
        ],
      },
      {
        id: 'go',
        prompt: 'You are in it, still unqualified, still here.',
        body: 'This is what ready is made of. Stamp.',
        choices: [{ label: 'Clear', next: 'win', kind: 'win' }],
      },
      {
        id: 'fail',
        prompt: 'The license never prints.',
        body: 'You will die waiting for a font. Come back for the unready rep.',
        choices: [{ label: 'Retry', next: 'start', kind: 'loop' }],
      },
      {
        id: 'win',
        prompt: 'Protocol complete.',
        body: 'Do the unready two minutes for real.',
        choices: [],
      },
    ],
  },
  {
    id: 'already-failed',
    title: 'I ALREADY FAILED ONCE',
    freeze: 'A past miss has been promoted to a prophecy.',
    signal: '“I tried that.” One attempt, or a dramatic attempt, used as a lifetime ban.',
    diagnosis: 'You are treating a data point like a personality. Failure is tuition unless you refuse to attend class again.',
    loop: 'You replay the miss until it feels like a law. The law says you do not get another at-bat.',
    immediate: {
      seconds: 90,
      title: 'Different second shot',
      body: 'Do not recreate the whole war. Change one variable. Smaller ask, shorter session, different room, different person. Take the shot.',
    },
    protocol24: [
      'Write what actually happened vs the story you tell about it.',
      'One new contact that rhymes with the old attempt but is not a clone.',
    ],
    protocol7: [
      'Three more at-bats. Track what changed. Ban the sentence “I already tried.”',
    ],
    relatedEntries: ['momentum-physics', 'when-to-think', 'the-intelligence-tax'],
    drillId: 'coin-commit',
    path: [
      {
        id: 'start',
        prompt: 'The old miss is sitting in the chair meant for the next rep.',
        body: 'You can keep it as a god, or you can demote it to a note.',
        choices: [
          { label: 'Treat it as proof I am not that person', next: 'proof', kind: 'loop' },
          { label: 'Demote it to tuition and take a smaller shot', next: 'shot', kind: 'advance' },
        ],
      },
      {
        id: 'proof',
        prompt: 'The story is elegant. It also cancels your future.',
        body: 'Identities built from one scene are cheap novels. You are allowed sequels.',
        choices: [
          { label: 'Keep the novel. It protects me.', next: 'fail', kind: 'fail' },
          { label: 'Write a sequel that is smaller and sooner', next: 'shot', kind: 'advance' },
        ],
      },
      {
        id: 'shot',
        prompt: 'The second shot is allowed to be humble.',
        body: 'Humility is not shrinking forever. It is refusing to let one scene own the franchise.',
        choices: [{ label: 'Clear', next: 'win', kind: 'win' }],
      },
      {
        id: 'fail',
        prompt: 'The prophecy fulfills itself by banning experiments.',
        body: 'Come back when you want data more than a tragic theme.',
        choices: [{ label: 'Retry', next: 'start', kind: 'loop' }],
      },
      {
        id: 'win',
        prompt: 'Protocol complete.',
        body: 'Take the smaller second shot today.',
        choices: [],
      },
    ],
  },
  {
    id: 'too-many-options',
    title: 'TOO MANY PATHS',
    freeze: 'Choice overload dressed as high agency.',
    signal: 'Tabs of lives. Career forks. Project graveyards. Coin never flipped.',
    diagnosis: 'You want a choice that cannot be wrong. That choice does not exist, so you keep browsing maps.',
    loop: 'Each option is compared to an imaginary best option that is a collage of all options. The collage wins. You stay.',
    immediate: {
      seconds: 60,
      title: 'Coin, then honor',
      body: 'If both options are reversible, flip a coin. The flinch you feel is the information. Then do 20 minutes on the chosen path. No re-vote.',
    },
    protocol24: [
      'Pick one path for 7 days. Park the others in a list, not in your bloodstream.',
      'Define a kill-or-keep review date now.',
    ],
    protocol7: [
      'Run the chosen path daily. At day 7, think. Not at day 0.5.',
    ],
    relatedEntries: ['five-second-commit', 'action-before-clarity', 'analysis-paralysis'],
    drillId: 'coin-commit',
    path: [
      {
        id: 'start',
        prompt: 'Two lives are arguing. Maybe five.',
        body: 'If they are reversible, you do not need an oracle. You need a week of walking.',
        choices: [
          { label: 'Make a spreadsheet of criteria', next: 'sheet', kind: 'loop' },
          { label: 'Flip and honor 20 minutes', next: 'flip', kind: 'advance' },
        ],
      },
      {
        id: 'sheet',
        prompt: 'The spreadsheet looks like adulthood.',
        body: 'It cannot feel the weather on either path. You are trying to think a sensation you can only get by moving.',
        choices: [
          { label: 'Add weights. Then it will be objective.', next: 'fail', kind: 'fail' },
          { label: 'Flip anyway', next: 'flip', kind: 'advance' },
        ],
      },
      {
        id: 'flip',
        prompt: 'The coin landed. Your stomach talked.',
        body: 'Honor it for a short block. You can still change next week with data. You cannot change with another fantasy.',
        choices: [{ label: 'Clear', next: 'win', kind: 'win' }],
      },
      {
        id: 'fail',
        prompt: 'Objectivity theater continues.',
        body: 'Come back when you will let a week of motion vote.',
        choices: [{ label: 'Retry', next: 'start', kind: 'loop' }],
      },
      {
        id: 'win',
        prompt: 'Protocol complete.',
        body: 'Flip, honor, 20 minutes. Park the rest.',
        choices: [],
      },
    ],
  },
  {
    id: 'night-spiral',
    title: 'NIGHT SPIRAL',
    freeze: 'It is late. The committee opened a second shift.',
    signal: 'Bed, glow, replay, future-dread, sudden genius plans that will not survive 9am.',
    diagnosis: 'Fatigue plus no new data. The mind fills the dark with simulations because the world is not answering.',
    loop: 'You think to find peace. The thinking creates more targets. Sleep gets later. Tomorrow’s freeze gets stronger.',
    immediate: {
      seconds: 120,
      title: 'Leave the glow',
      body: 'Stand up. Light a real light. Water. Write the loop in one sentence on paper. Close the glass. If you must think, do it standing, two minutes max.',
    },
    protocol24: [
      'No planning after a cutoff you write tonight.',
      'Park a single next action for morning on paper.',
    ],
    protocol7: [
      'Same cutoff most nights. Body contact earlier in the day so the night has less unused fuel.',
    ],
    relatedEntries: ['body-breaks-the-loop', 'when-to-think', 'daily-os'],
    drillId: 'stand-and-move',
    path: [
      {
        id: 'start',
        prompt: 'The ceiling is accepting presentations.',
        body: 'None of the slides can be implemented at this hour. You know this and you keep presenting.',
        choices: [
          { label: 'One more pass. I might solve my life.', next: 'pass', kind: 'loop' },
          { label: 'Stand, paper, park one action, stop', next: 'paper', kind: 'advance' },
        ],
      },
      {
        id: 'pass',
        prompt: 'You solved it in a way that requires a new personality at dawn.',
        body: 'Dawn will not accept the delivery. You will feel behind and use that as more spiral fuel.',
        choices: [
          { label: 'Keep presenting to the ceiling', next: 'fail', kind: 'fail' },
          { label: 'Park one action on paper and kill the glow', next: 'paper', kind: 'advance' },
        ],
      },
      {
        id: 'paper',
        prompt: 'The thought has a body now: ink.',
        body: 'It can wait. You are not a 24-hour helpdesk for imaginary crises.',
        choices: [{ label: 'Clear', next: 'win', kind: 'win' }],
      },
      {
        id: 'fail',
        prompt: 'The second shift wins.',
        body: 'Tomorrow you will call this insomnia. It was unscheduled thinking. Come back and cut the shift.',
        choices: [{ label: 'Retry', next: 'start', kind: 'loop' }],
      },
      {
        id: 'win',
        prompt: 'Protocol complete.',
        body: 'Stand. Paper. One parked action. Glow off.',
        choices: [],
      },
    ],
  },
  {
    id: 'send-the-thing',
    title: 'I CANNOT SEND IT',
    freeze: 'The draft is done enough. The send button is a cliff.',
    signal: 'Tweaking, adding context, waiting for a “better moment,” unsent sitting for days.',
    diagnosis: 'The send makes the result real. While unsent, you still live in superposition: maybe genius, maybe safe.',
    loop: 'Each reread finds a new way you could be misread. You try to write a text that cannot be misread. Impossible, so you never send.',
    immediate: {
      seconds: 45,
      title: 'One error check, then send',
      body: 'Check names, dates, links, actual insults. Do not check vibe. Send. Walk away for ten minutes.',
    },
    protocol24: [
      'No more than one reread.',
      'If it is still sitting at tonight, send or delete. No third state.',
    ],
    protocol7: [
      'A quota of sends: applications, invoices, follow-ups, invitations.',
    ],
    relatedEntries: ['money-and-asks', 'five-second-commit', 'the-audience-in-your-head'],
    drillId: 'send-imperfect',
    path: [
      {
        id: 'start',
        prompt: 'The cursor is blinking on Send.',
        body: 'You are not missing a sentence. You are missing a willingness to be interpreted.',
        choices: [
          { label: 'Add more context so they cannot misunderstand', next: 'context', kind: 'loop' },
          { label: 'Check facts once and send', next: 'sent', kind: 'advance' },
        ],
      },
      {
        id: 'context',
        prompt: 'It is longer. It is not safer.',
        body: 'Extra paragraphs are often anxiety in prose form. They create new things to misread.',
        choices: [
          { label: 'Wait for a better moment this week', next: 'fail', kind: 'fail' },
          { label: 'Cut two sentences and send', next: 'sent', kind: 'advance' },
        ],
      },
      {
        id: 'sent',
        prompt: 'It is in the world. Superposition collapsed.',
        body: 'Do not unsay it. Do the next physical thing that is not the inbox.',
        choices: [{ label: 'Clear', next: 'win', kind: 'win' }],
      },
      {
        id: 'fail',
        prompt: 'The draft remains a pet.',
        body: 'Pets do not get you jobs, dates, or paid. Come back and collapse the wave.',
        choices: [{ label: 'Retry', next: 'start', kind: 'loop' }],
      },
      {
        id: 'win',
        prompt: 'Protocol complete.',
        body: 'Send the real thing.',
        choices: [],
      },
    ],
  },
  {
    id: 'gym-avoid',
    title: 'I KEEP NOT SHOWING UP',
    freeze: 'The session is simple. The story about the session is a novel.',
    signal: 'New programs, waiting for Monday, “I’ll go when I feel like it,” perfect kit, empty log.',
    diagnosis: 'You want the identity of a person who trains without the awkward middle where you are just a person who showed up tired.',
    loop: 'Missed day becomes a fallen identity, so you wait to restart clean, so you miss more days.',
    immediate: {
      seconds: 180,
      title: 'Minimum viable session',
      body: 'Put on shoes. Leave the house or the room. Ten minutes of real movement. If you continue, good. If you stop at ten, it still counts.',
    },
    protocol24: [
      'Lay out the thing you need for tomorrow’s minimum session.',
      'Do not download a new program.',
    ],
    protocol7: [
      'Show up 5 of 7 days at the minimum. Intensity is optional. Contact is not.',
    ],
    relatedEntries: ['the-body', 'momentum-physics', 'the-readiness-myth'],
    drillId: 'stand-and-move',
    path: [
      {
        id: 'start',
        prompt: 'You are negotiating with a future body.',
        body: 'The future body only exists if this one moves.',
        choices: [
          { label: 'Start fresh Monday with a better plan', next: 'monday', kind: 'loop' },
          { label: 'Shoes on. Ten minutes now.', next: 'ten', kind: 'advance' },
        ],
      },
      {
        id: 'monday',
        prompt: 'Monday is a mythological creature.',
        body: 'It eats resolutions and leaves you the same sofa. You have met this animal.',
        choices: [
          { label: 'Feed it again', next: 'fail', kind: 'fail' },
          { label: 'Betray Monday. Move now.', next: 'ten', kind: 'advance' },
        ],
      },
      {
        id: 'ten',
        prompt: 'You are a person who showed up. That is the whole identity.',
        body: 'You may continue. You may stop at ten. You may not uncount it.',
        choices: [{ label: 'Clear', next: 'win', kind: 'win' }],
      },
      {
        id: 'fail',
        prompt: 'The novel continues. The log does not.',
        body: 'Come back when you will let a small session be enough to count.',
        choices: [{ label: 'Retry', next: 'start', kind: 'loop' }],
      },
      {
        id: 'win',
        prompt: 'Protocol complete.',
        body: 'Minimum viable session. Now. Not Monday.',
        choices: [],
      },
    ],
  },
];

export const scenarioMap = Object.fromEntries(scenarios.map((s) => [s.id, s]));
