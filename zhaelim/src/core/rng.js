/**
 * Deterministic noise. Every glyph, bloom and drifting mote in Zha'elim is a
 * pure function of an integer, so two people on two continents looking at the
 * same word see the same shape. The Sha consider shared hallucination the
 * entire point of writing.
 */

/** mulberry32 — small, fast, good enough for shapes and sparkle. */
export function rng(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable 32-bit hash of a string, so words can seed their own glyphs. */
export function hash(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const pick = (next, list) => list[Math.floor(next() * list.length) % list.length];

export const range = (next, lo, hi) => lo + next() * (hi - lo);

export const intRange = (next, lo, hi) => Math.floor(range(next, lo, hi + 1));
