/**
 * The three tongues that agreed to build this thing.
 *
 * A caste is not a faction. Nobody in Zha'elim fights. A caste is a *way of
 * travelling*: how far a thought goes before it forgets itself, and what it
 * costs the one who thinks it.
 */

export const CASTES = {
  vel: {
    id: 'vel',
    name: "Vel'zhu",
    short: 'VEL',
    people: 'the Plasmoid',
    /** Plasma does not wander. It arrives, insists, and is gone. */
    reach: 3,
    cost: 2,
    hue: 18,
    color: '#ff6a2b',
    glow: 'rgba(255,106,43,0.55)',
    note: 'quick, near, unarguable',
    /** Root of the synth voice: bright, transient, a struck thing. */
    timbre: { wave: 'sawtooth', base: 288, decay: 0.5, bite: 0.5 },
  },
  kor: {
    id: 'kor',
    name: "Kor'aen",
    short: 'KOR',
    people: 'the Blue Avian',
    /** Form travels exactly as far as it stays true. */
    reach: 5,
    cost: 2,
    hue: 205,
    color: '#4fb8ff',
    glow: 'rgba(79,184,255,0.5)',
    note: 'measured, true, patient',
    timbre: { wave: 'triangle', base: 216, decay: 1.1, bite: 0.12 },
  },
  sha: {
    id: 'sha',
    name: "Sha'mira",
    short: 'SHA',
    people: 'the Pleiadian',
    /** Feeling is the only thing that reaches the far edge of a lattice. */
    reach: 7,
    cost: 3,
    hue: 291,
    color: '#c98dff',
    glow: 'rgba(201,141,255,0.5)',
    note: 'far, slow, forgiving',
    timbre: { wave: 'sine', base: 162, decay: 2.2, bite: 0.04 },
  },
};

export const CASTE_IDS = ['vel', 'kor', 'sha'];

export const ALL_THREE = new Set(CASTE_IDS);
