import { parseLattice, seedKeys } from './lattice.js';

/**
 * The Songs of the Seeding.
 *
 * Fourteen lattices, in the order the three peoples agreed to teach them.
 * They argued about the order for what the Sha describe as "one long
 * afternoon" and the Kor record as 900 years.
 *
 * Authoring key:  '.' open   'o' seed   '#' veil   '*' prism   ' ' void
 * Rows are odd-r offset: every odd row sits half a cell to the right of the
 * row above it. Read them as honeycomb, not as a chessboard.
 */

const RAW = [
  {
    id: 'ilu',
    title: 'Ilu',
    gloss: 'The First Breath',
    whisper:
      'Cast all three tongues so their rings stand on the sleeper in the same breath. Vel is near. Sha is far. Send the far one first.',
    rows: [
      '.......', //
      '.......',
      '...o...',
      '.......',
      '.......',
    ],
    ma: 8,
    maMax: 10,
    maRegen: 1,
    breaths: 22,
  },
  {
    id: 'thaan',
    title: "Ilu'thaan",
    gloss: 'Two Breaths, One Between',
    whisper: 'Two sleepers. One wave can cross both — a ring is not a line.',
    rows: [
      '.........', //
      '.........',
      '..o...o..',
      '.........',
      '.........',
    ],
    ma: 8,
    maMax: 12,
    maRegen: 1,
    breaths: 34,
  },
  {
    id: 'korath',
    title: 'Korath',
    gloss: 'The Counting Room',
    whisper:
      'A veil is a refusal, not a wall. Waves walk around it and arrive late. Count the walk, not the gap.',
    rows: [
      '.........', //
      '..#####..',
      '..#.o.#..',
      '..#...#..',
      '..##.##..',
      '.........',
      '.........',
    ],
    ma: 8,
    maMax: 12,
    maRegen: 1,
    breaths: 24,
  },
  {
    id: 'velmir',
    title: "Vel'mir",
    gloss: 'The Short Hand',
    whisper: 'Vel reaches only three. When the sleeper is deep, you must walk in with it.',
    rows: [
      '...........', //
      '.....#.....',
      '....#o#....',
      '.....#.....',
      '...........',
      '...........',
    ],
    ma: 8,
    maMax: 12,
    maRegen: 1,
    breaths: 24,
  },
  {
    id: 'shaeon',
    title: "Sha'eon",
    gloss: 'What Repeats',
    whisper:
      'A prism says again whatever touches it, outward, once. A borrowed voice still counts as a voice.',
    rows: [
      '...........', //
      '...........',
      '..*.....o..',
      '...........',
      '...........',
      '...........',
    ],
    ma: 7,
    maMax: 10,
    maRegen: 1,
    breaths: 26,
  },
  {
    id: 'maun',
    title: "Ma'un",
    gloss: 'The Thin Year',
    whisper:
      'Ma returns one for one breath. Spend as though the next breath is owed to someone else.',
    rows: [
      '.........', //
      '.........',
      '..o...o..',
      '.........',
      '..o...o..',
      '.........',
      '.........',
    ],
    ma: 6,
    maMax: 8,
    maRegen: 1,
    breaths: 44,
  },
  {
    id: 'zhurun',
    title: "Zhu'run",
    gloss: 'The Long Corridor',
    whisper: 'Only Sha reaches the far end. Vel will have to be carried there in your hand.',
    rows: [
      '#############', //
      '#...........#',
      '#.o.......o.#',
      '#...........#',
      '#############',
    ],
    ma: 8,
    maMax: 12,
    maRegen: 1,
    breaths: 38,
  },
  {
    id: 'aenlei',
    title: "Aen'lei",
    gloss: 'The Ring That Listens',
    whisper:
      'Standing at the centre of a ring, one wave touches every sleeper at once. Find the centre before you cast.',
    rows: [
      '....o....', //
      '...#.#...',
      '..o...o..',
      '...#.#...',
      '....o....',
      '.........',
    ],
    ma: 9,
    maMax: 14,
    maRegen: 2,
    breaths: 60,
  },
  {
    id: 'therun',
    title: "The'run",
    gloss: 'Two Rooms, One Door',
    whisper:
      'One door. Everything that reaches the far room has spent the same walk getting there.',
    rows: [
      '###########', //
      '#..o..#...#',
      '#.....#.o.#',
      '#..*..*...#',
      '#.....#...#',
      '###########',
    ],
    ma: 8,
    maMax: 12,
    maRegen: 1,
    breaths: 40,
  },
  {
    id: 'nuvel',
    title: "Nu'vel",
    gloss: 'The Scattered Nest',
    whisper:
      'Seven sleepers, no pattern. The Sha say: do not look for the pattern, look for the order.',
    rows: [
      '.o.......o.', //
      '.....o.....',
      '..o.....o..',
      '.....o.....',
      '.o.......o.',
      '...........',
    ],
    ma: 10,
    maMax: 16,
    maRegen: 2,
    breaths: 88,
  },
  {
    id: 'korima',
    title: "Kor'ima",
    gloss: 'The Lattice Remembers',
    whisper: 'A woken seed still carries waves. Braid the near ones first and use them as ground.',
    rows: [
      '#####.#####', //
      '#...#.#...#',
      '#.o.....o.#',
      '#...#.#...#',
      '##.##.##.##',
      '#....o....#',
      '###########',
    ],
    ma: 9,
    maMax: 14,
    maRegen: 2,
    breaths: 58,
  },
  {
    id: 'shathaan',
    title: "Sha'thaan",
    gloss: 'The Mirrored Choir',
    whisper:
      'Three prisms in a line will hand a wave along until it forgets who cast it. That is allowed.',
    rows: [
      '.............', //
      '..*..*..*....',
      '.............',
      '.o.........o.',
      '.............',
      '......o......',
    ],
    ma: 8,
    maMax: 12,
    maRegen: 1,
    breaths: 76,
  },
  {
    id: 'velkorsha',
    title: "Vel'kor'sha",
    gloss: 'The Argument',
    whisper:
      'This is the lattice the three peoples used to settle who was right. Nobody was. It is still here.',
    rows: [
      '.....#.....', //
      '..o..#..o..',
      '.....#.....',
      '..####*####',
      '.....#.....',
      '..o..#..o..',
      '.....#.....',
    ],
    ma: 10,
    maMax: 16,
    maRegen: 2,
    breaths: 78,
  },
  {
    id: 'zhaelim',
    title: "Zha'elim",
    gloss: 'The Game That Plays You Back',
    whisper:
      'The last song has no lesson in it. It was only ever a place to be together for a while.',
    rows: [
      '....ooo....', //
      '...o...o...',
      '..o..*..o..',
      '.o...*...o.',
      '..o..*..o..',
      '...o...o...',
      '....ooo....',
    ],
    ma: 12,
    maMax: 20,
    maRegen: 3,
    breaths: 120,
  },
];

export const SONGS = RAW.map((song, i) => {
  const cells = parseLattice(song.rows);
  return { ...song, index: i, cells, seeds: seedKeys(cells).length };
});

export const songById = (id) => SONGS.find((s) => s.id === id);

/** A song opens when the one before it has been woven at least once. */
export function isUnlocked(song, cleared) {
  return song.index === 0 || Boolean(cleared[SONGS[song.index - 1].id]);
}
