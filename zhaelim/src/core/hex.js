/**
 * Axial hex coordinates, pointy-top.
 *
 * The Kor call this lattice *aen'korath* — "the counting that has no corner".
 * They insist the six-fold grid is not a human convenience but the smallest
 * shape a thought can hold without leaking. We use it because waves travelling
 * on it expand as rings of equal cost, which is what makes the weave fair.
 */

/** Six unit steps, in the order the Kor sing them (dawn-ward first). */
export const DIRECTIONS = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

export const key = (q, r) => `${q},${r}`;

export function parseKey(k) {
  const [q, r] = k.split(',');
  return { q: Number(q), r: Number(r) };
}

export function neighbors(q, r) {
  return DIRECTIONS.map((d) => ({ q: q + d.q, r: r + d.r }));
}

/** Hex (Manhattan-on-a-lattice) distance between two axial cells. */
export function distance(aq, ar, bq, br) {
  const dq = aq - bq;
  const dr = ar - br;
  return (Math.abs(dq) + Math.abs(dq + dr) + Math.abs(dr)) / 2;
}

/** Pixel centre of a pointy-top hex of the given size (centre to corner). */
export function toPixel(q, r, size) {
  return {
    x: size * Math.sqrt(3) * (q + r / 2),
    y: size * (3 / 2) * r,
  };
}

/** Nearest axial cell to a pixel position. Rounds through cube space. */
export function fromPixel(x, y, size) {
  const r = ((2 / 3) * y) / size;
  const q = ((Math.sqrt(3) / 3) * x - y / 3) / size;
  return round(q, r);
}

export function round(qf, rf) {
  const sf = -qf - rf;
  let q = Math.round(qf);
  let r = Math.round(rf);
  const s = Math.round(sf);
  const dq = Math.abs(q - qf);
  const dr = Math.abs(r - rf);
  const ds = Math.abs(s - sf);
  if (dq > dr && dq > ds) q = -r - s;
  else if (dr > ds) r = -q - s;
  return { q, r };
}

/** Corner points of a pointy-top hex, for drawing. */
export function corners(cx, cy, size) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 30);
    pts.push({ x: cx + size * Math.cos(a), y: cy + size * Math.sin(a) });
  }
  return pts;
}
