import { key, neighbors, distance } from '../core/hex.js';

/**
 * A lattice is a field of dormant attention. Cells are authored as text — the
 * Kor would not accept a level format they could not read aloud.
 *
 *   '.'  open    — a thought passes through
 *   'o'  seed    — a dormant consciousness, waiting to be braided
 *   '#'  veil    — refusal; nothing crosses
 *   '*'  prism   — repeats whatever reaches it, once, outward
 *   ' '  void    — outside the weave
 */

export const CELL = {
  OPEN: 'open',
  SEED: 'seed',
  VEIL: 'veil',
  PRISM: 'prism',
  BRAID: 'braid',
};

const CHARS = {
  '.': CELL.OPEN,
  o: CELL.SEED,
  '#': CELL.VEIL,
  '*': CELL.PRISM,
};

/** Waves travel through everything except refusal and the outer dark. */
export const isPassable = (type) => type !== undefined && type !== CELL.VEIL;

/**
 * Parse odd-r offset rows into axial cells.
 * Row index is `r`; column index maps to `q = col - floor(r / 2)`.
 */
export function parseLattice(rows) {
  const cells = new Map();
  rows.forEach((row, r) => {
    [...row].forEach((ch, col) => {
      const type = CHARS[ch];
      if (!type) return;
      const q = col - Math.floor(r / 2);
      cells.set(key(q, r), { q, r, type });
    });
  });
  return cells;
}

export function cloneCells(cells) {
  const out = new Map();
  for (const [k, c] of cells) out.set(k, { ...c });
  return out;
}

export function seedKeys(cells) {
  return [...cells.values()].filter((c) => c.type === CELL.SEED).map((c) => key(c.q, c.r));
}

export function bounds(cells) {
  let minQ = Infinity;
  let maxQ = -Infinity;
  let minR = Infinity;
  let maxR = -Infinity;
  for (const c of cells.values()) {
    minQ = Math.min(minQ, c.q);
    maxQ = Math.max(maxQ, c.q);
    minR = Math.min(minR, c.r);
    maxR = Math.max(maxR, c.r);
  }
  return { minQ, maxQ, minR, maxR };
}

/**
 * Breadth-first rings outward from an origin, blocked by veils and the void.
 * `rings[d]` is the list of cell keys exactly d steps away, walking the weave.
 * Ring 0 (the throat itself) is never returned as a wavefront — a caster does
 * not braid the ground they stand on.
 */
export function ringsFrom(cells, q, r, reach) {
  const rings = [];
  const seen = new Set([key(q, r)]);
  let frontier = [{ q, r }];
  for (let d = 1; d <= reach; d++) {
    const next = [];
    for (const cur of frontier) {
      for (const n of neighbors(cur.q, cur.r)) {
        const k = key(n.q, n.r);
        if (seen.has(k)) continue;
        const cell = cells.get(k);
        if (!isPassable(cell?.type)) continue;
        seen.add(k);
        next.push(n);
      }
    }
    if (next.length === 0) break;
    rings[d] = next.map((n) => key(n.q, n.r));
    frontier = next;
  }
  return rings;
}

/** Straight-line distance, ignoring veils. Used for quick reach filtering. */
export const asCrow = (a, b) => distance(a.q, a.r, b.q, b.r);
