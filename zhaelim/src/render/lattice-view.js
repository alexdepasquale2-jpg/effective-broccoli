import { corners, key, toPixel, fromPixel } from '../core/hex.js';
import { CASTES, CASTE_IDS } from '../game/castes.js';
import { CELL, ringsFrom } from '../game/lattice.js';
import { frontMap, nextFrontMap } from '../game/simulation.js';
import { PALETTE, withAlpha } from './palette.js';

/**
 * THE LATTICE, SEEN.
 *
 * A compromise, and known to be one. The real weave has no colour and is not
 * flat. What is drawn here is the largest part of it that survives being put
 * behind glass: rings that expand one step per breath, three inks that do not
 * blend, and a sleeper that brightens as more of the three stand on it.
 */

/**
 * Fit a lattice into a box. Pure, and exported on purpose: the end-to-end
 * harness needs to know where a cell landed on screen without asking the
 * renderer, and two copies of this arithmetic would eventually disagree.
 */
export function fitLattice(cells, w, h, pad = 10) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const c of cells.values()) {
    const p = toPixel(c.q, c.r, 1);
    minX = Math.min(minX, p.x - Math.sqrt(3) / 2);
    maxX = Math.max(maxX, p.x + Math.sqrt(3) / 2);
    minY = Math.min(minY, p.y - 1);
    maxY = Math.max(maxY, p.y + 1);
  }
  const size = Math.min((w - pad * 2) / (maxX - minX), (h - pad * 2) / (maxY - minY));
  return {
    size,
    ox: (w - (maxX + minX) * size) / 2,
    oy: (h - (maxY + minY) * size) / 2,
  };
}

/** Screen position of a cell, given a fit. */
export function cellCenter(q, r, fit) {
  const p = toPixel(q, r, fit.size);
  return { x: p.x + fit.ox, y: p.y + fit.oy };
}

export function createView(canvas) {
  const ctx = canvas.getContext('2d');
  let layout = { size: 24, ox: 0, oy: 0, dpr: 1, w: 0, h: 0 };
  let motes = [];
  const sparks = [];

  function resize(cells) {
    const dpr = Math.min(3, globalThis.devicePixelRatio || 1);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layout = { ...fitLattice(cells, w, h), dpr, w, h };
    motes = makeMotes(w, h);
    return layout;
  }

  const center = (q, r) => cellCenter(q, r, layout);

  function cellAt(px, py) {
    return fromPixel(px - layout.ox, py - layout.oy, layout.size);
  }

  function spark(q, r, color, count = 10, spread = 1) {
    const c = center(q, r);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = (0.5 + Math.random()) * layout.size * 0.08 * spread;
      sparks.push({
        x: c.x,
        y: c.y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: 1,
        decay: 0.015 + Math.random() * 0.02,
        color,
        r: layout.size * (0.04 + Math.random() * 0.06),
      });
    }
  }

  function hexPath(cx, cy, size) {
    const pts = corners(cx, cy, size);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < 6; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
  }

  function draw(sim, view) {
    const { t = 0, aim = null, caste = 'vel', hint = null, time = 0, calm = false } = view;
    const s = layout.size;

    // — the dark, which is not black —
    const g = ctx.createRadialGradient(
      layout.w / 2,
      layout.h * 0.42,
      s,
      layout.w / 2,
      layout.h / 2,
      layout.h,
    );
    g.addColorStop(0, PALETTE.field);
    g.addColorStop(1, PALETTE.void);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, layout.w, layout.h);
    if (!calm) drawMotes(time);

    const front = frontMap(sim);
    const ahead = nextFrontMap(sim);

    // — cells —
    for (const cell of sim.cells.values()) {
      const c = center(cell.q, cell.r);
      drawCell(cell, c, s, sim, time);
    }

    // — where the tongues stand this breath —
    for (const [k, castes] of front) {
      const cell = sim.cells.get(k);
      if (!cell) continue;
      const c = center(cell.q, cell.r);
      drawFront(c, s, [...castes], t, 1);
    }
    // — and where they will stand next —
    for (const [k, castes] of ahead) {
      if (t < 0.55) continue;
      const cell = sim.cells.get(k);
      if (!cell) continue;
      const c = center(cell.q, cell.r);
      drawFront(c, s, [...castes], 0, ((t - 0.55) / 0.45) * 0.42);
    }

    // — seeds report how close they are to waking —
    for (const cell of sim.cells.values()) {
      if (cell.type !== CELL.SEED) continue;
      const castes = front.get(key(cell.q, cell.r));
      if (!castes) continue;
      drawSeedPips(center(cell.q, cell.r), s, [...castes]);
    }

    // — throats: where a caster's hand still rests —
    for (const wave of sim.waves) {
      if (sim.pulse - wave.birth > 1) continue;
      const c = center(wave.q, wave.r);
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = CASTES[wave.caste].color;
      ctx.lineWidth = 2;
      hexPath(c.x, c.y, s * 0.6);
      ctx.stroke();
      ctx.restore();
    }

    if (aim) drawAim(sim, aim, caste, s, time);
    if (hint) drawHint(sim, hint, s, time);
    drawSparks();
  }

  function drawCell(cell, c, s, sim, time) {
    switch (cell.type) {
      case CELL.VEIL: {
        ctx.fillStyle = PALETTE.veil;
        hexPath(c.x, c.y, s * 0.94);
        ctx.fill();
        ctx.strokeStyle = PALETTE.veilEdge;
        ctx.lineWidth = 1;
        ctx.stroke();
        break;
      }
      case CELL.PRISM: {
        ctx.strokeStyle = 'rgba(190,214,255,0.5)';
        ctx.lineWidth = 1.2;
        hexPath(c.x, c.y, s * 0.86);
        ctx.stroke();
        const spin = time * 0.0004;
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(spin);
        ctx.strokeStyle = 'rgba(210,230,255,0.75)';
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
          const p = { x: Math.cos(a) * s * 0.42, y: Math.sin(a) * s * 0.42 };
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
        break;
      }
      case CELL.SEED: {
        const breathe = 0.5 + 0.5 * Math.sin(time * 0.0016 + (cell.q + cell.r) * 0.7);
        hexPath(c.x, c.y, s * 0.9);
        ctx.strokeStyle = PALETTE.line;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(c.x, c.y, s * (0.26 + breathe * 0.06), 0, Math.PI * 2);
        ctx.strokeStyle = withAlpha(PALETTE.seed, 0.4 + breathe * 0.35);
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(c.x, c.y, s * 0.09, 0, Math.PI * 2);
        ctx.fillStyle = withAlpha(PALETTE.seed, 0.55 + breathe * 0.35);
        ctx.fill();
        break;
      }
      case CELL.BRAID: {
        const glow = 0.5 + 0.5 * Math.sin(time * 0.001 + cell.q * 1.3 + cell.r);
        hexPath(c.x, c.y, s * 0.9);
        ctx.fillStyle = withAlpha(PALETTE.braid, 0.07 + glow * 0.05);
        ctx.fill();
        ctx.strokeStyle = withAlpha(PALETTE.braid, 0.4);
        ctx.lineWidth = 1.2;
        ctx.stroke();
        // three arcs, interlocked: the braid mark
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(time * 0.00018);
        ctx.lineWidth = 1.6;
        CASTE_IDS.forEach((id, i) => {
          ctx.strokeStyle = withAlpha2(CASTES[id].color, 0.85);
          ctx.beginPath();
          ctx.arc(0, 0, s * 0.34, (i / 3) * Math.PI * 2, (i / 3) * Math.PI * 2 + Math.PI * 0.62);
          ctx.stroke();
        });
        ctx.restore();
        break;
      }
      default: {
        hexPath(c.x, c.y, s * 0.9);
        ctx.strokeStyle = PALETTE.line;
        ctx.lineWidth = 1;
        ctx.stroke();
        void sim;
      }
    }
  }

  function drawFront(c, s, castes, t, strength) {
    const grow = 0.42 + t * 0.5;
    const fade = (1 - t * 0.62) * strength;
    castes.forEach((id, i) => {
      const caste = CASTES[id];
      const off = (i - (castes.length - 1) / 2) * s * 0.1;
      ctx.beginPath();
      ctx.arc(c.x + off, c.y, s * grow * (1 - i * 0.08), 0, Math.PI * 2);
      ctx.strokeStyle = withAlpha2(caste.color, 0.85 * fade);
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(c.x + off, c.y, s * grow * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = withAlpha2(caste.color, 0.1 * fade);
      ctx.fill();
    });
  }

  function drawSeedPips(c, s, castes) {
    CASTE_IDS.forEach((id, i) => {
      const on = castes.includes(id);
      const a = -Math.PI / 2 + (i / 3) * Math.PI * 2;
      const x = c.x + Math.cos(a) * s * 0.52;
      const y = c.y + Math.sin(a) * s * 0.52;
      ctx.beginPath();
      ctx.arc(x, y, s * (on ? 0.11 : 0.06), 0, Math.PI * 2);
      ctx.fillStyle = on ? CASTES[id].color : 'rgba(255,255,255,0.14)';
      ctx.fill();
    });
  }

  /**
   * What would happen if you let go here. Drawn while the finger is down.
   *
   * Every cell in reach is numbered with the breath the wave arrives on it,
   * which is the whole game stated once, plainly, in small digits. The Kor
   * wanted this on permanently. The Vel called it a walkthrough. It is on
   * while you are aiming and gone the moment you let go, which is the treaty.
   */
  function drawAim(sim, aim, casteId, s, time) {
    const caste = CASTES[casteId];
    const rings = ringsFrom(sim.cells, aim.q, aim.r, caste.reach);
    const c = center(aim.q, aim.r);
    const pulse = 0.5 + 0.5 * Math.sin(time * 0.006);

    hexPath(c.x, c.y, s * 0.88);
    ctx.fillStyle = withAlpha2(caste.color, 0.2 + pulse * 0.08);
    ctx.fill();
    ctx.strokeStyle = caste.color;
    ctx.lineWidth = 2.4;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let d = 1; d < rings.length; d++) {
      for (const k of rings[d] ?? []) {
        const cell = sim.cells.get(k);
        if (!cell) continue;
        const p = center(cell.q, cell.r);
        const sleeping = cell.type === CELL.SEED;
        if (sleeping) {
          hexPath(p.x, p.y, s * 0.82);
          ctx.fillStyle = withAlpha2(caste.color, 0.13 + pulse * 0.06);
          ctx.fill();
          ctx.strokeStyle = withAlpha2(caste.color, 0.7);
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }
        ctx.fillStyle = withAlpha2(caste.color, sleeping ? 0.95 : Math.max(0.14, 0.4 - d * 0.03));
        ctx.font = `${sleeping ? 700 : 500} ${Math.max(9, s * (sleeping ? 0.46 : 0.34))}px ui-monospace, monospace`;
        ctx.fillText(String(d), p.x, p.y + (sleeping ? -s * 0.34 : 0));
      }
    }
  }

  /** The Kor's offered stone: one cell, one tongue, no explanation. */
  function drawHint(sim, hint, s, time) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 0.005);
    for (const h of hint) {
      const c = center(h.q, h.r);
      hexPath(c.x, c.y, s * (0.7 + pulse * 0.2));
      ctx.strokeStyle = withAlpha2(CASTES[h.caste].color, 0.35 + pulse * 0.5);
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function makeMotes(w, h) {
    const out = [];
    for (let i = 0; i < 46; i++) {
      out.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.4 + Math.random() * 1.3,
        s: 0.06 + Math.random() * 0.2,
        p: Math.random() * Math.PI * 2,
      });
    }
    return out;
  }

  function drawMotes(time) {
    ctx.save();
    for (const m of motes) {
      const y = (m.y + time * 0.004 * m.s) % (layout.h + 20);
      const a = 0.12 + 0.14 * (0.5 + 0.5 * Math.sin(time * 0.001 + m.p));
      ctx.beginPath();
      ctx.arc(m.x, y, m.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(190,210,255,${a})`;
      ctx.fill();
    }
    ctx.restore();
  }

  function drawSparks() {
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.965;
      p.vy *= 0.965;
      p.life -= p.decay;
      if (p.life <= 0) {
        sparks.splice(i, 1);
        continue;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
      ctx.fillStyle = withAlpha2(p.color, p.life * 0.8);
      ctx.fill();
    }
  }

  return {
    resize,
    draw,
    cellAt,
    spark,
    center,
    get layout() {
      return layout;
    },
  };
}

/** Alpha over an arbitrary colour string (hex or rgb/rgba). */
export function withAlpha2(color, a) {
  if (color.startsWith('#')) return withAlpha(color, a);
  if (color.startsWith('rgba')) return color.replace(/[\d.]+\)$/, `${a})`);
  if (color.startsWith('rgb')) return color.replace('rgb(', 'rgba(').replace(')', `,${a})`);
  return color;
}
