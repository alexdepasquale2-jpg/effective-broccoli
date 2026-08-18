import type { Drill, FreezeOption, Rank } from './types';

export const drills: Drill[] = [
  {
    id: 'ten-second-start',
    title: 'TEN-SECOND START',
    durationSec: 30,
    intensity: 'LOW',
    setup: 'Stand if you can. Identify the real tool or doorway. No headphones. No new tabs.',
    why: 'Interrupts the briefing that arrives after the impulse. Motion first, story later.',
    beats: [
      { at: 0, text: 'Name the thing out loud. Ugly is allowed. Vague is not.' },
      { at: 8, text: 'Count 5-4-3-2-1. On one, move toward the real surface.' },
      { at: 18, text: 'You should be in contact: file open, shoes on, message up. Stay.' },
      { at: 28, text: 'Do not leave. The freeze will offer a deal. Decline.' },
    ],
    completePrompt: 'What did you open or start? One sentence.',
  },
  {
    id: 'ugly-four-minutes',
    title: 'UGLY FOUR MINUTES',
    durationSec: 240,
    intensity: 'MED',
    setup: 'Real medium only. Timer visible. If you delete everything, you failed the drill even if you were “working.”',
    why: 'Creates clay. Taste cannot colonize a session that is this short and this ugly on purpose.',
    beats: [
      { at: 0, text: 'Make the worst useful version. Speed over dignity.' },
      { at: 60, text: 'Still going. Do not restart. Patch in place.' },
      { at: 120, text: 'Halfway. If you are planning, you are cheating. Put marks on the thing.' },
      { at: 180, text: 'One more ugly pass. Leave evidence.' },
      { at: 230, text: 'Stop soon. Save. Do not beautify as a way to unsee it.' },
    ],
    completePrompt: 'What exists now that did not exist four minutes ago?',
  },
  {
    id: 'send-imperfect',
    title: 'SEND IMPERFECT',
    durationSec: 90,
    intensity: 'HIGH',
    setup: 'Have the real unsent thing ready: email, application, invoice, text, post to one human.',
    why: 'Collapses superposition. You cannot learn from a draft that never leaves the house.',
    beats: [
      { at: 0, text: 'Read once for facts: names, dates, links, actual errors.' },
      { at: 30, text: 'Cut one apology or extra context paragraph.' },
      { at: 55, text: 'Send on the next breath. Do not wait to feel noble.' },
      { at: 70, text: 'If it is sent: stand up and leave the inbox. If not: you still have time. Send.' },
    ],
    completePrompt: 'What did you send, and to whom (role, not a novel)?',
  },
  {
    id: 'stand-and-move',
    title: 'STAND AND MOVE',
    durationSec: 120,
    intensity: 'LOW',
    setup: 'Enough space to move. Water nearby. Phone stays here as a timer, not a feed.',
    why: 'Rumination is a seated sport. Changing posture changes the available thoughts.',
    beats: [
      { at: 0, text: 'Stand. Unclench jaw. Drop shoulders. Look at a far point.' },
      { at: 20, text: 'Move: walk, stairs, squats, shake. Breathe through the nose if you can.' },
      { at: 60, text: 'Name five objects in the room out loud. Keep moving.' },
      { at: 90, text: 'Drink water. Decide the next work action in one phrase.' },
      { at: 110, text: 'Go straight to that action when this ends. No reward scroll.' },
    ],
    completePrompt: 'What was the next work action you named?',
  },
  {
    id: 'one-human-sentence',
    title: 'ONE HUMAN SENTENCE',
    durationSec: 60,
    intensity: 'MED',
    setup: 'A real channel to a real person. Not a notes app. Not a group chat you use as a stage.',
    why: 'Social freeze dies in unrehearsed contact, not in better scripts.',
    beats: [
      { at: 0, text: 'Pick the human. Pick the sentence: hello, ask, invite, thank, follow-up.' },
      { at: 20, text: 'Write it once. No essay. No pre-repair.' },
      { at: 40, text: 'Send. If your hands shake, that is the drill working, not a stop sign.' },
    ],
    completePrompt: 'What sentence left your phone?',
  },
  {
    id: 'coin-commit',
    title: 'COIN COMMIT',
    durationSec: 75,
    intensity: 'MED',
    setup: 'Two reversible options. A coin or a 50/50 generator. A 20-minute block after this drill is required.',
    why: 'Ends oracle shopping. Motion produces the data a spreadsheet cannot feel.',
    beats: [
      { at: 0, text: 'Name option A and option B in one line each. If one is irreversible harm, abort this drill.' },
      { at: 20, text: 'Flip. Notice the flinch. The flinch is information, not a veto unless harm is involved.' },
      { at: 40, text: 'Honor the coin. Write the first 20-minute action. Start it when the timer ends.' },
      { at: 65, text: 'Park the other option on paper. It is not dead. It is just not today.' },
    ],
    completePrompt: 'Which path did you honor, and what is the 20-minute action?',
  },
  {
    id: 'close-the-tabs',
    title: 'CLOSE THE TABS',
    durationSec: 90,
    intensity: 'LOW',
    setup: 'The machine with the extra library open. You will close, not bookmark-for-later as a lie.',
    why: 'Input is often mood control. Removing input makes the next action obvious and uncomfortable.',
    beats: [
      { at: 0, text: 'Count the tabs or saved posts you are using as a nest.' },
      { at: 25, text: 'Close all but the real task. If you need a source, keep one. One.' },
      { at: 50, text: 'Write the next physical action on paper. Start it.' },
      { at: 75, text: 'If you opened a new tab, you reset. Close it. Return to the action.' },
    ],
    completePrompt: 'What is the next physical action, with the library closed?',
  },
  {
    id: 'name-it-out-loud',
    title: 'NAME IT OUT LOUD',
    durationSec: 45,
    intensity: 'LOW',
    setup: 'A place you can speak. If you cannot speak, write in one breath on paper and read it.',
    why: 'Vague dread is larger than named dread. Speech forces a shape the loop does not like.',
    beats: [
      { at: 0, text: 'Say: “The thing I am avoiding is…” and finish the sentence with a noun and a verb.' },
      { at: 15, text: 'Say: “The feeling is…” Keep it short. Do not justify.' },
      { at: 30, text: 'Say: “The next contact is…” A move, not a lifestyle.' },
    ],
    completePrompt: 'Write the three sentences you spoke.',
  },
];

export const drillMap = Object.fromEntries(drills.map((d) => [d.id, d]));

export const ranks: Rank[] = [
  { id: 'civilian', title: 'CIVILIAN', minXp: 0, line: 'Still treating thought as a home.' },
  { id: 'recruit', title: 'RECRUIT', minXp: 40, line: 'You have touched the real surface at least once.' },
  { id: 'operator', title: 'OPERATOR', minXp: 140, line: 'Contact is becoming a habit, not a holiday.' },
  { id: 'field-maxer', title: 'FIELD MAXER', minXp: 320, line: 'You move before the briefing ends.' },
  { id: 'void-walker', title: 'VOID WALKER', minXp: 600, line: 'Quiet output. Less speech about the bit.' },
];

export function rankFor(xp: number): Rank {
  let current = ranks[0];
  for (const r of ranks) {
    if (xp >= r.minXp) current = r;
  }
  return current;
}

export function nextRank(xp: number): Rank | null {
  const r = rankFor(xp);
  const i = ranks.findIndex((x) => x.id === r.id);
  return ranks[i + 1] ?? null;
}

export const freezeOptions: FreezeOption[] = [
  { id: 'cant-start', label: 'I cannot start the thing', survivalId: 'cant-start' },
  { id: 'perfect-plan', label: 'I need a perfect plan first', survivalId: 'perfect-plan' },
  { id: 'they-will-laugh', label: 'People will judge me', survivalId: 'they-will-laugh' },
  { id: 'more-research', label: 'I just need more research', survivalId: 'more-research' },
  { id: 'not-ready', label: 'I am not ready yet', survivalId: 'not-ready' },
  { id: 'already-failed', label: 'I already failed once', survivalId: 'already-failed' },
  { id: 'too-many-options', label: 'Too many paths', survivalId: 'too-many-options' },
  { id: 'night-spiral', label: 'Night brain will not shut up', survivalId: 'night-spiral' },
  { id: 'send-the-thing', label: 'I cannot send it', survivalId: 'send-the-thing' },
  { id: 'gym-avoid', label: 'I keep not showing up', survivalId: 'gym-avoid' },
];

export const quotes = [
  'Start ugly. Correct in motion.',
  'Think after contact. Not instead of it.',
  'You cannot edit a ghost.',
  'Ready is a costume you put on later.',
  'The library will not live your life.',
  'Embarrassment is a fee, not a verdict.',
  'Never finish at zero.',
  'Be hard to embarrass and easy to correct.',
  'Objects at rest invent philosophies.',
  'The log is the only honest rank.',
];

export function quoteForDay(d = new Date()) {
  const start = new Date(d.getFullYear(), 0, 0);
  const day = Math.floor((d.getTime() - start.getTime()) / 86400000);
  return quotes[day % quotes.length];
}
