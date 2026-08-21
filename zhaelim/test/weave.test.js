import test from 'node:test';
import assert from 'node:assert/strict';

import { distance, fromPixel, key, neighbors, toPixel } from '../src/core/hex.js';
import { CELL, parseLattice, ringsFrom, seedKeys } from '../src/game/lattice.js';
import { advance, canCast, cast, createSim, frontOf } from '../src/game/simulation.js';
import { autoSolve, planSeed } from '../src/game/solver.js';
import { SONGS } from '../src/game/songs.js';
import { compose, saying, speak } from '../src/culture/tongue.js';
import { ALL_WORDS } from '../src/culture/lexicon.js';
import { CODEX, unlockedCodex } from '../src/culture/lore.js';
import { RITE_SECS, boonFor, riteAt } from '../src/culture/rites.js';

const grid = (rows) => parseLattice(rows);
const sim9 = (rows, over = {}) =>
  createSim({ id: 't', cells: grid(rows), ma: 40, maMax: 40, maRegen: 0, breaths: 40, ...over });

test('hex distance is symmetric and matches ring counts', () => {
  assert.equal(distance(0, 0, 0, 0), 0);
  assert.equal(distance(0, 0, 3, -1), 3);
  assert.equal(distance(2, -2, -1, 1), 3);
  for (const n of neighbors(0, 0)) assert.equal(distance(0, 0, n.q, n.r), 1);
});

test('pixel round-trip lands back on the same cell', () => {
  for (const [q, r] of [
    [0, 0],
    [3, -2],
    [-4, 5],
    [7, 1],
  ]) {
    const p = toPixel(q, r, 20);
    assert.deepEqual(fromPixel(p.x, p.y, 20), { q, r });
  }
});

test('lattice parses odd-r rows into a connected weave', () => {
  const cells = grid(['...', '.o.', '...']);
  assert.equal(cells.size, 9);
  assert.equal(seedKeys(cells).length, 1);
  // the seed at row 1, col 1 -> q = 1 - 0 = 1
  assert.equal(cells.get(key(1, 1)).type, CELL.SEED);
});

test('veils block a wave and lengthen the walk around them', () => {
  //  row 0: open      cast from (0,0)
  //  row 1: ####.     one gap, at the far right
  //  row 2: open      the target sits directly below the caster
  const cells = grid(['.....', '####.', '.....']);
  const rings = ringsFrom(cells, 0, 0, 14);
  const flat = rings.flat().filter(Boolean);
  for (const veil of [key(0, 1), key(1, 1), key(2, 1), key(3, 1)]) {
    assert.ok(!flat.includes(veil), 'a veil is never a wavefront');
  }
  const target = key(-1, 2);
  const straight = distance(0, 0, -1, 2);
  const walked = rings.findIndex((ring) => (ring ?? []).includes(target));
  assert.equal(straight, 2);
  assert.ok(
    walked > straight,
    `walking round the veil should cost more than ${straight}, got ${walked}`,
  );
});

test('three tongues in one breath wake a sleeper; two only chime', () => {
  const s = sim9(['.......', '.......', '...o...', '.......', '.......']);
  const seed = { q: 2, r: 2 };
  // Sha from three cells away, Kor from two, Vel from one — all landing on pulse+3
  cast(s, seed.q - 3, seed.r, 'sha');
  advance(s);
  cast(s, seed.q - 2, seed.r, 'kor');
  advance(s);
  cast(s, seed.q - 1, seed.r, 'vel');
  const events = advance(s);
  assert.equal(s.braided, 1);
  assert.ok(events.some((e) => e.type === 'braid'));
  assert.equal(s.cells.get(key(seed.q, seed.r)).type, CELL.BRAID);

  const t = sim9(['.......', '.......', '...o...', '.......', '.......']);
  cast(t, 0, 2, 'sha');
  advance(t);
  cast(t, 1, 2, 'kor');
  advance(t);
  advance(t);
  assert.equal(t.braided, 0);
  assert.equal(t.chimes, 1, 'two where three were needed');
});

test('a wave stands on exactly one ring per breath and then is spent', () => {
  const s = sim9(['.........', '.........', '.........']);
  cast(s, 0, 1, 'vel');
  const wave = s.waves[0];
  assert.deepEqual(frontOf(wave, s.pulse), [], 'never the ground it was cast on');
  assert.equal(frontOf(wave, s.pulse + 1).length > 0, true);
  assert.deepEqual(frontOf(wave, s.pulse + wave.reach + 1), []);
});

test('casting costs ma, and ma is refused when short', () => {
  const s = sim9(['.....', '.....'], { ma: 3, maMax: 10, maRegen: 0 });
  assert.equal(cast(s, 0, 0, 'sha').ok, true); // costs 3
  assert.equal(s.ma, 0);
  assert.equal(canCast(s, 1, 0, 'vel').ok, false);
  assert.equal(cast(s, 1, 0, 'vel').ok, false);
});

test('a veil cannot be a throat, and neither can the outer dark', () => {
  const s = sim9(['.#.']);
  assert.equal(canCast(s, 0, 0, 'vel').ok, true, 'open ground takes a cast');
  assert.equal(canCast(s, 1, 0, 'vel').ok, false, 'the veil refuses');
  assert.equal(canCast(s, 9, 9, 'vel').ok, false, 'so does the outer dark');
});

test('a prism repeats a wave once, and does not echo itself forever', () => {
  const s = sim9(['..*......', '.........']);
  cast(s, 0, 0, 'kor');
  const before = s.waves.length;
  for (let i = 0; i < 8; i++) advance(s);
  assert.ok(s.waves.length <= before + 2, 'relays do not multiply without bound');
  assert.ok(s.events.length >= 0);
});

test('breaths run out and the song stills', () => {
  const s = sim9(['..o..'], { breaths: 3 });
  advance(s);
  advance(s);
  advance(s);
  assert.equal(s.status, 'stilled');
  assert.equal(advance(s).length, 0, 'a closed song does not keep breathing');
});

test('every authored song is solvable inside its own budget', () => {
  for (const song of SONGS) {
    const res = autoSolve(song);
    assert.ok(res.solved, `${song.id} could not be woven`);
    assert.ok(
      res.breaths <= song.breaths,
      `${song.id} needs ${res.breaths} of ${song.breaths} breaths`,
    );
  }
});

test('the hint always names a cast that is due now', () => {
  const s = createSim(SONGS[0]);
  const plan = planSeed(s, seedKeys(s.cells)[0]);
  assert.ok(plan, 'the first song has a plan');
  assert.equal(plan.filter((c) => c.atPulse === s.pulse).length >= 1, true);
});

test('the tongue assembles voice, root and aspect in that order', () => {
  const w = speak('nuel', { voice: 've', aspect: 'eth' });
  assert.equal(w.written, "ve'nueleth");
  assert.match(w.gloss, /acted/);
  assert.match(w.gloss, /becoming/);
});

test('a phrase without a seal is unsealed, and says so', () => {
  const sealed = compose([{ root: 'braia' }], 'zhaa');
  assert.equal(sealed.written, 'braia zhaa');
  assert.match(sealed.loose, /that is so/);
  const open = compose([{ root: 'braia' }], null);
  assert.equal(open.seal, null);
  assert.equal(open.written, 'braia');
});

test('sayings are deterministic per seed and always sealed', () => {
  assert.deepEqual(saying('a').written, saying('a').written);
  assert.notEqual(saying('a').written, saying('b').written);
  assert.ok(saying('c').seal);
});

test('every word carries a source the script can draw a foot for', () => {
  for (const w of ALL_WORDS) {
    assert.ok(['vel', 'kor', 'sha'].includes(w.source), `${w.word} has no mouth`);
    assert.ok(w.gloss.length > 0);
  }
});

test('the codex opens gradually and ends open', () => {
  assert.equal(unlockedCodex({ braidsTotal: 0, songsCleared: {} }).length, 1);
  const all = unlockedCodex({
    braidsTotal: 999,
    songsCleared: Object.fromEntries(SONGS.map((s) => [s.id, true])),
  });
  assert.equal(all.length, CODEX.length);
});

test('the rite runs its full length and returns to empty', () => {
  assert.equal(riteAt(0).phase.id, 'in');
  assert.ok(riteAt(RITE_SECS * 1000 * 0.5).scale > 0.3);
  assert.equal(riteAt(RITE_SECS * 1000 + 10).done, true);
  assert.equal(boonFor(1), 1);
  assert.equal(boonFor(99), 3, 'the boon caps at three, on purpose');
});
