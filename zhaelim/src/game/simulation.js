import { key } from '../core/hex.js';
import { CASTES, CASTE_IDS } from './castes.js';
import { CELL, cloneCells, isPassable, ringsFrom, seedKeys } from './lattice.js';

/**
 * The rule of the weave, in one paragraph:
 *
 * Time moves in *breaths*. When you cast, a wave is born at your finger but
 * does not touch the cell beneath it — on the next breath it stands one ring
 * out, the breath after that two rings, and so on until it has spent its
 * reach. A dormant seed wakes only when all three tongues stand on it *in the
 * same breath*. Two tongues make a chime: not a waking, but not nothing.
 *
 * Everything here is pure. Give it the same state and the same casts and it
 * will give you the same universe, which is the only promise this game makes.
 */

export function createSim(song) {
  const cells = cloneCells(song.cells);
  return {
    songId: song.id,
    cells,
    pulse: 0,
    ma: song.ma ?? 6,
    maMax: song.maMax ?? 10,
    maRegen: song.maRegen ?? 1,
    breaths: song.breaths ?? 40,
    breathsMax: song.breaths ?? 40,
    waves: [],
    nextWaveId: 1,
    seedsTotal: seedKeys(cells).length,
    braided: 0,
    chimes: 0,
    casts: 0,
    status: 'weaving',
    events: [],
  };
}

export function canCast(sim, q, r, casteId) {
  if (sim.status !== 'weaving') return { ok: false, why: 'the song has closed' };
  const caste = CASTES[casteId];
  if (!caste) return { ok: false, why: 'no such tongue' };
  const cell = sim.cells.get(key(q, r));
  if (!isPassable(cell?.type)) return { ok: false, why: 'the weave refuses there' };
  if (sim.ma < caste.cost) return { ok: false, why: 'not enough ma' };
  return { ok: true };
}

/** Open a throat for `casteId` at (q,r). Mutates and returns the sim. */
export function cast(sim, q, r, casteId) {
  const check = canCast(sim, q, r, casteId);
  if (!check.ok) return { ...check };
  const caste = CASTES[casteId];
  sim.ma -= caste.cost;
  sim.casts += 1;
  sim.waves.push({
    id: sim.nextWaveId++,
    caste: casteId,
    q,
    r,
    birth: sim.pulse,
    reach: caste.reach,
    rings: ringsFrom(sim.cells, q, r, caste.reach),
    relayed: new Set(),
  });
  sim.events.push({ type: 'cast', caste: casteId, q, r });
  return { ok: true };
}

/** Cells a wave stands on during the given pulse (empty once it is spent). */
export function frontOf(wave, pulse) {
  const d = pulse - wave.birth;
  if (d < 1 || d > wave.reach) return [];
  return wave.rings[d] ?? [];
}

export function isSpent(wave, pulse) {
  return pulse - wave.birth > wave.reach;
}

/**
 * Advance one breath. Returns the events of that breath so the renderer and
 * the voice can react without reaching into the state themselves.
 */
export function advance(sim) {
  if (sim.status !== 'weaving') return [];
  sim.pulse += 1;
  sim.events = [];

  // 1. Where does every living wave stand this breath?
  const front = new Map(); // cell key -> Map(casteId -> waveId)
  for (const wave of sim.waves) {
    for (const k of frontOf(wave, sim.pulse)) {
      if (!front.has(k)) front.set(k, new Map());
      front.get(k).set(wave.caste, wave.id);
    }
  }

  // 2. Prisms repeat what reaches them — once per wave, outward from itself.
  const born = [];
  for (const [k, castes] of front) {
    const cell = sim.cells.get(k);
    if (cell?.type !== CELL.PRISM) continue;
    for (const [casteId, waveId] of castes) {
      const source = sim.waves.find((w) => w.id === waveId);
      if (!source || source.relayed.has(k)) continue;
      source.relayed.add(k);
      born.push({
        id: sim.nextWaveId++,
        caste: casteId,
        q: cell.q,
        r: cell.r,
        birth: sim.pulse,
        reach: CASTES[casteId].reach,
        rings: ringsFrom(sim.cells, cell.q, cell.r, CASTES[casteId].reach),
        relayed: new Set([k]),
      });
      sim.events.push({ type: 'relay', caste: casteId, q: cell.q, r: cell.r });
    }
  }
  sim.waves.push(...born);

  // 3. Resolve seeds. Three tongues wake one; two only ring it.
  for (const [k, castes] of front) {
    const cell = sim.cells.get(k);
    if (cell?.type !== CELL.SEED) continue;
    const present = CASTE_IDS.filter((c) => castes.has(c));
    if (present.length === 3) {
      cell.type = CELL.BRAID;
      sim.braided += 1;
      sim.ma = Math.min(sim.maMax, sim.ma + 2);
      sim.events.push({ type: 'braid', q: cell.q, r: cell.r });
    } else if (present.length === 2) {
      sim.chimes += 1;
      sim.ma = Math.min(sim.maMax, sim.ma + 1);
      sim.events.push({ type: 'chime', q: cell.q, r: cell.r, castes: present });
    }
  }

  // 4. Breathe: ma returns, the budget shortens, the spent waves let go.
  sim.ma = Math.min(sim.maMax, sim.ma + sim.maRegen);
  sim.breaths -= 1;
  sim.waves = sim.waves.filter((w) => !isSpent(w, sim.pulse));

  if (sim.braided >= sim.seedsTotal) {
    sim.status = 'woven';
    sim.events.push({ type: 'woven' });
  } else if (sim.breaths <= 0) {
    sim.status = 'stilled';
    sim.events.push({ type: 'stilled' });
  }
  return sim.events;
}

/** A read-only view of what stands where, for the renderer. */
export function frontMap(sim) {
  const front = new Map();
  for (const wave of sim.waves) {
    for (const k of frontOf(wave, sim.pulse)) {
      if (!front.has(k)) front.set(k, new Set());
      front.get(k).add(wave.caste);
    }
  }
  return front;
}

/** Where a wave will stand next breath — drawn faintly, as intention. */
export function nextFrontMap(sim) {
  const front = new Map();
  for (const wave of sim.waves) {
    for (const k of frontOf(wave, sim.pulse + 1)) {
      if (!front.has(k)) front.set(k, new Set());
      front.get(k).add(wave.caste);
    }
  }
  return front;
}
