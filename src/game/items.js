import { CONFIG } from './config.js';

/**
 * Falling objects and the burst particles they leave behind.
 *
 * Both use a fixed-size free list rather than allocating per spawn: on a
 * mid-range phone, churning hundreds of short-lived objects per minute is
 * exactly what triggers a visible GC hitch mid-run.
 */

const MAX_ITEMS = 48;
const MAX_PARTICLES = 120;

export class ItemPool {
  constructor() {
    this.items = Array.from({ length: MAX_ITEMS }, () => ({
      active: false, x: 0, y: 0, vy: 0, spin: 0, rot: 0, hazard: false,
    }));
  }

  spawn(x, speed, hazard) {
    const it = this.items.find((i) => !i.active);
    if (!it) return null;
    it.active = true;
    it.x = x;
    it.y = -CONFIG.items.radius * 2;
    it.vy = speed;
    it.rot = Math.random() * Math.PI * 2;
    it.spin = (Math.random() - 0.5) * 3;
    it.hazard = hazard;
    return it;
  }

  update(dt, height) {
    for (const it of this.items) {
      if (!it.active) continue;
      it.y += it.vy * dt;
      it.rot += it.spin * dt;
      if (it.y - CONFIG.items.radius > height) it.active = false;
    }
  }

  clear() {
    for (const it of this.items) it.active = false;
  }

  render(ctx) {
    const r = CONFIG.items.radius;
    for (const it of this.items) {
      if (!it.active) continue;
      ctx.save();
      ctx.translate(it.x, it.y);
      ctx.rotate(it.rot);
      if (it.hazard) drawHazard(ctx, r);
      else drawBroccoli(ctx, r);
      ctx.restore();
    }
  }
}

function drawBroccoli(ctx, r) {
  ctx.fillStyle = '#3f7d3a';
  ctx.fillRect(-r * 0.18, 0, r * 0.36, r * 0.9);

  ctx.fillStyle = '#6ee7a8';
  for (const [dx, dy, s] of [[0, -0.3, 1], [-0.6, 0.05, 0.65], [0.6, 0.05, 0.65], [-0.3, -0.7, 0.55], [0.3, -0.7, 0.55]]) {
    ctx.beginPath();
    ctx.arc(dx * r, dy * r, r * 0.55 * s, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHazard(ctx, r) {
  ctx.fillStyle = '#ff6b81';
  ctx.strokeStyle = '#7d1f2d';
  ctx.lineWidth = 2;
  ctx.beginPath();
  // Vertex count must stay even, or the inner/outer alternation never closes
  // the star and the shape collapses into a blob.
  const POINTS = 10;
  for (let i = 0; i < POINTS; i++) {
    const a = (i / POINTS) * Math.PI * 2;
    const rad = i % 2 === 0 ? r : r * 0.5;
    ctx[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(a) * rad, Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

export class ParticlePool {
  constructor() {
    this.parts = Array.from({ length: MAX_PARTICLES }, () => ({
      active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, color: '#fff', size: 3,
    }));
  }

  burst(x, y, color, count = CONFIG.fx.particles) {
    let made = 0;
    for (const p of this.parts) {
      if (made >= count) break;
      if (p.active) continue;
      const a = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 160;
      p.active = true;
      p.x = x; p.y = y;
      p.vx = Math.cos(a) * sp;
      p.vy = Math.sin(a) * sp - 40;
      p.max = p.life = 0.35 + Math.random() * 0.35;
      p.color = color;
      p.size = 2 + Math.random() * 3;
      made++;
    }
  }

  update(dt) {
    for (const p of this.parts) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) { p.active = false; continue; }
      p.vy += 620 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  clear() {
    for (const p of this.parts) p.active = false;
  }

  render(ctx) {
    for (const p of this.parts) {
      if (!p.active) continue;
      ctx.globalAlpha = Math.max(p.life / p.max, 0);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }
}
