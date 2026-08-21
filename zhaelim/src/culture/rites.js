import { vessel } from '../core/storage.js';

/**
 * THE LONG INHALE — rhu'aelin, "still on purpose".
 *
 * The one part of the vessel that is not a game. The Sha added it after
 * watching a recording of a human playing for two hours without once
 * unclenching their jaw, and asking the others, quietly, what exactly they
 * thought they were seeding.
 *
 * Four counts in, two held, six out, two empty. Five rounds. It takes about
 * seventy seconds, which is roughly the length of time a person will give
 * something before deciding whether it is for them.
 */

export const PHASES = [
  { id: 'in', secs: 4, word: 'ssan', gloss: 'to open', say: 'Draw it in.' },
  {
    id: 'full',
    secs: 2,
    word: 'rhu',
    gloss: 'to hold still on purpose',
    say: 'Hold. Nothing is owed yet.',
  },
  {
    id: 'out',
    secs: 6,
    word: 'shaon',
    gloss: 'to give away what you needed',
    say: 'Let it go, all of it.',
  },
  {
    id: 'empty',
    secs: 2,
    word: 'thaan',
    gloss: 'it is between',
    say: 'Empty. This part counts too.',
  },
];

export const CYCLES = 5;

const CYCLE_SECS = PHASES.reduce((a, p) => a + p.secs, 0);
export const RITE_SECS = CYCLE_SECS * CYCLES;

/** Where the rite stands after `elapsed` milliseconds. Pure; render from this. */
export function riteAt(elapsedMs) {
  const t = Math.max(0, elapsedMs / 1000);
  if (t >= RITE_SECS) {
    return { done: true, cycle: CYCLES, phase: PHASES[3], progress: 1, phaseT: 1, scale: 0.34 };
  }
  const cycle = Math.floor(t / CYCLE_SECS);
  let within = t - cycle * CYCLE_SECS;
  let phase = PHASES[0];
  for (const p of PHASES) {
    if (within < p.secs) {
      phase = p;
      break;
    }
    within -= p.secs;
  }
  const phaseT = within / phase.secs;
  return {
    done: false,
    cycle,
    phase,
    phaseT,
    progress: t / RITE_SECS,
    /** 0.34 empty, 1 full — the circle a body follows more easily than words. */
    scale: breathScale(phase.id, phaseT),
  };
}

function breathScale(id, t) {
  const ease = (x) => 0.5 - Math.cos(Math.PI * x) / 2;
  switch (id) {
    case 'in':
      return 0.34 + 0.66 * ease(t);
    case 'full':
      return 1;
    case 'out':
      return 1 - 0.66 * ease(t);
    default:
      return 0.34;
  }
}

export const todayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function riteAvailable() {
  return vessel.get('riteLastDay') !== todayKey();
}

/**
 * Completing the rite grants a boon: extra ma at the opening of every song
 * today. It caps at three. A streak is a nice thing to have and a poor thing
 * to be owned by, and the Kor were firm about the ceiling.
 */
export function completeRite() {
  const today = todayKey();
  const last = vessel.get('riteLastDay');
  if (last === today) return { alreadyDone: true, streak: vessel.get('riteStreak') };
  const yesterday = todayKey(new Date(Date.now() - 86400000));
  const streak = last === yesterday ? vessel.get('riteStreak') + 1 : 1;
  vessel.update((v) => {
    v.riteLastDay = today;
    v.riteStreak = streak;
    v.breathsTaken += CYCLES;
  });
  return { alreadyDone: false, streak, boon: boonFor(streak) };
}

export const boonFor = (streak) => Math.min(3, Math.ceil(streak / 2));

/** Today's boon, if the rite was kept today. */
export function activeBoon() {
  return vessel.get('riteLastDay') === todayKey() ? boonFor(vessel.get('riteStreak')) : 0;
}
