import { key, parseKey } from '../core/hex.js';
import { CASTES, CASTE_IDS } from './castes.js';
import { CELL, isPassable, ringsFrom } from './lattice.js';
import { advance, canCast, cast, createSim } from './simulation.js';

/**
 * The Kor keep a habit they call *korath'un* — "the not-yet-counting". Shown a
 * knot, they will quietly work out whether it can be untied before saying a
 * word about it. This module is that habit.
 *
 * It does two jobs. In the studio it proves every authored song is solvable
 * and tells us what budget it needs. In the player's hand it becomes the hint:
 * one cast, offered without commentary, the way a Kor would offer it.
 */

function cloneSim(sim) {
  const cells = new Map();
  for (const [k, c] of sim.cells) cells.set(k, { ...c });
  return {
    ...sim,
    cells,
    waves: sim.waves.map((w) => ({ ...w, relayed: new Set(w.relayed) })),
    events: [],
  };
}

/**
 * Candidate throats for waking one seed: for each tongue, one or two passable
 * cells at each distance within that tongue's reach. Open ground is preferred
 * over another seed, because standing on a sleeper to wake its neighbour is
 * considered poor manners and, more practically, wastes a wave.
 */
function candidates(sim, seedKey) {
  const { q, r } = parseKey(seedKey);
  const out = {};
  for (const id of CASTE_IDS) {
    const rings = ringsFrom(sim.cells, q, r, CASTES[id].reach);
    const byDist = [];
    for (let d = 1; d < rings.length; d++) {
      const ring = rings[d] ?? [];
      const usable = ring.filter((k) => isPassable(sim.cells.get(k)?.type));
      if (!usable.length) continue;
      const ranked = usable.sort((a, b) => rank(sim, a) - rank(sim, b)).slice(0, 2);
      byDist.push({ d, cells: ranked });
    }
    out[id] = byDist;
  }
  return out;
}

function rank(sim, k) {
  const t = sim.cells.get(k)?.type;
  if (t === CELL.OPEN) return 0;
  if (t === CELL.PRISM) return 1;
  if (t === CELL.BRAID) return 2;
  return 3; // another sleeping seed
}

/** Turn three chosen distances into the breaths on which each cast must land. */
function schedule(sim, chosen) {
  const maxD = Math.max(...CASTE_IDS.map((id) => chosen[id].d));
  return CASTE_IDS.map((id) => ({
    caste: id,
    atPulse: sim.pulse + (maxD - chosen[id].d),
    ...parseKey(chosen[id].cell),
  })).sort((a, b) => a.atPulse - b.atPulse);
}

/** Play a schedule out on a copy of the world. Returns the copy, or null. */
function rehearse(sim, plan) {
  const trial = cloneSim(sim);
  const queue = [...plan].sort((a, b) => a.atPulse - b.atPulse);
  const last = queue[queue.length - 1].atPulse + CASTES.sha.reach + 2;
  const before = trial.braided;
  while (trial.pulse <= last && trial.status === 'weaving') {
    while (queue.length && queue[0].atPulse === trial.pulse) {
      const c = queue.shift();
      if (!canCast(trial, c.q, c.r, c.caste).ok) return null;
      cast(trial, c.q, c.r, c.caste);
    }
    advance(trial);
    if (trial.braided > before) return trial;
    if (!queue.length && trial.waves.length === 0) return null;
  }
  return null;
}

/**
 * Best plan for waking one particular seed from where we stand now.
 * Cheap plans first: fewer breaths, less ma held at once, no crowding.
 */
export function planSeed(sim, seedKey) {
  const cand = candidates(sim, seedKey);
  if (CASTE_IDS.some((id) => cand[id].length === 0)) return null;

  const options = [];
  for (const v of cand.vel) {
    for (const k of cand.kor) {
      for (const s of cand.sha) {
        const spread = new Set([v.d, k.d, s.d]).size;
        const span = Math.max(v.d, k.d, s.d);
        options.push({ v, k, s, score: span * 2 - spread * 3 });
      }
    }
  }
  options.sort((a, b) => a.score - b.score);

  for (const opt of options.slice(0, 120)) {
    for (const cellV of opt.v.cells) {
      for (const cellK of opt.k.cells) {
        for (const cellS of opt.s.cells) {
          const plan = schedule(sim, {
            vel: { d: opt.v.d, cell: cellV },
            kor: { d: opt.k.d, cell: cellK },
            sha: { d: opt.s.d, cell: cellS },
          });
          if (rehearse(sim, plan)) return plan;
        }
      }
    }
  }
  return null;
}

/** The seed that is cheapest to reach right now. */
export function easiestSeed(sim) {
  const seeds = [...sim.cells.values()].filter((c) => c.type === CELL.SEED);
  let best = null;
  for (const c of seeds) {
    const plan = planSeed(sim, key(c.q, c.r));
    if (!plan) continue;
    const span = plan[plan.length - 1].atPulse - plan[0].atPulse;
    if (!best || span < best.span) best = { seed: key(c.q, c.r), plan, span };
  }
  return best;
}

/**
 * A hint is the single next cast, and only if it is due this breath. The Kor
 * do not explain the whole shape; they hand you one stone and look away.
 */
export function nextCast(sim) {
  const best = easiestSeed(sim);
  if (!best) return null;
  const due = best.plan.filter((c) => c.atPulse === sim.pulse);
  return { seed: best.seed, plan: best.plan, due };
}

/**
 * Play a whole song from the outside. Used by tools/verify-songs.mjs to prove
 * every authored lattice can actually be woven, and to size its budgets.
 */
export function autoSolve(song, { maxBreaths = 400 } = {}) {
  const sim = createSim({ ...song, breaths: maxBreaths });
  const log = [];
  let guard = 0;
  while (sim.status === 'weaving' && guard++ < maxBreaths) {
    const best = easiestSeed(sim);
    if (!best) break;
    const queue = [...best.plan];
    while (queue.length && sim.status === 'weaving') {
      let stalled = true;
      while (queue.length && queue[0].atPulse <= sim.pulse) {
        const c = queue.shift();
        const res = cast(sim, c.q, c.r, c.caste);
        if (!res.ok) return { solved: false, why: res.why, breaths: sim.pulse, log };
        log.push({ pulse: sim.pulse, ...c });
        stalled = false;
      }
      void stalled;
      advance(sim);
    }
    // let the last wave finish crossing before re-planning
    let idle = 0;
    while (sim.status === 'weaving' && sim.waves.length && idle++ < 12) advance(sim);
  }
  return {
    solved: sim.status === 'woven',
    breaths: sim.pulse,
    casts: sim.casts,
    seeds: sim.seedsTotal,
    braided: sim.braided,
    log,
  };
}
