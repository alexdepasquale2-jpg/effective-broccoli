import { hash, rng, intRange, range } from '../core/rng.js';

/**
 * WRITTEN ILU'THAAN.
 *
 * A glyph is not drawn, it is derived: the word's own letters seed the shape,
 * so nobody had to design an alphabet and no two speakers can disagree about
 * how a word looks. The Kor call this "spelling without argument".
 *
 * Every glyph has a spine (what the word is), limbs (what it does), motes
 * (how sure the speaker is), and a foot marking which of the three mouths it
 * came from. Read from the foot upward.
 */

const FEET = {
  vel: (ctx, R) => {
    // plasma: two struck strokes, leaning, never touching
    ctx.beginPath();
    ctx.moveTo(-R * 0.32, R * 0.86);
    ctx.lineTo(-R * 0.1, R * 0.62);
    ctx.moveTo(R * 0.1, R * 0.86);
    ctx.lineTo(R * 0.32, R * 0.62);
    ctx.stroke();
  },
  kor: (ctx, R) => {
    // form: a closed triangle, the only closed shape in the script
    ctx.beginPath();
    ctx.moveTo(0, R * 0.58);
    ctx.lineTo(R * 0.3, R * 0.88);
    ctx.lineTo(-R * 0.3, R * 0.88);
    ctx.closePath();
    ctx.stroke();
  },
  sha: (ctx, R) => {
    // feeling: an open circle, deliberately unclosed at the bottom
    ctx.beginPath();
    ctx.arc(0, R * 0.72, R * 0.2, Math.PI * 0.15, Math.PI * 0.85, true);
    ctx.stroke();
  },
};

/**
 * Draw `word` centred at (cx, cy) at radius R.
 * `source` picks the foot; `color` is the ink.
 */
export function drawGlyph(
  ctx,
  word,
  cx,
  cy,
  R,
  { source = 'kor', color = '#e8eaf6', width = 2, alpha = 1 } = {},
) {
  const next = rng(hash(word));
  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // — spine —
  const bend = range(next, -0.42, 0.42);
  const top = -R * 0.82;
  const bottom = R * 0.5;
  ctx.beginPath();
  ctx.moveTo(0, top);
  ctx.quadraticCurveTo(bend * R, 0, 0, bottom);
  ctx.stroke();

  // — limbs —
  const limbs = intRange(next, 1, 3);
  for (let i = 0; i < limbs; i++) {
    const at = range(next, -0.6, 0.35);
    const y = at * R;
    const side = next() < 0.5 ? -1 : 1;
    const len = range(next, 0.3, 0.72) * R;
    const rise = range(next, -0.34, 0.34) * R;
    const curved = next() < 0.55;
    ctx.beginPath();
    ctx.moveTo(bend * R * (1 - Math.abs(at)), y);
    if (curved) ctx.quadraticCurveTo(side * len * 0.6, y + rise * 1.6, side * len, y + rise);
    else ctx.lineTo(side * len, y + rise);
    ctx.stroke();

    // limbs sometimes end in a tick, which marks emphasis
    if (next() < 0.34) {
      ctx.beginPath();
      ctx.moveTo(side * len, y + rise);
      ctx.lineTo(side * len + side * R * 0.1, y + rise - R * 0.16);
      ctx.stroke();
    }
  }

  // — ring: the word is about the whole of something —
  if (next() < 0.3) {
    const rr = range(next, 0.42, 0.62) * R;
    const a0 = range(next, 0, Math.PI * 2);
    ctx.beginPath();
    ctx.arc(0, range(next, -0.3, 0.1) * R, rr, a0, a0 + range(next, 1.1, 2.4) * Math.PI);
    ctx.stroke();
  }

  // — motes: certainty, counted —
  const motes = intRange(next, 0, 3);
  for (let i = 0; i < motes; i++) {
    ctx.beginPath();
    ctx.arc(
      range(next, -0.7, 0.7) * R,
      range(next, -0.85, 0.2) * R,
      Math.max(1, width * 0.85),
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  (FEET[source] ?? FEET.kor)(ctx, R);
  ctx.restore();
}

/** A glyph rendered to its own canvas, for lists that scroll. */
export function glyphCanvas(word, size, opts = {}) {
  const dpr = Math.min(3, globalThis.devicePixelRatio || 1);
  const c = document.createElement('canvas');
  c.width = size * dpr;
  c.height = size * dpr;
  c.style.width = `${size}px`;
  c.style.height = `${size}px`;
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);
  drawGlyph(ctx, word, size / 2, size / 2, size * 0.36, opts);
  return c;
}
