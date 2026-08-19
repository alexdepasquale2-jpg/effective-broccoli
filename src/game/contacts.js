import { CONFIG } from './config.js';

/**
 * Contacts on the board and the strike effects they leave behind.
 *
 * Both use fixed-size free lists rather than allocating per spawn: churning
 * hundreds of short-lived objects a minute is exactly what produces a visible
 * GC hitch on a mid-range phone.
 */

const MAX_CONTACTS = 16;
const MAX_EFFECTS = 48;
const MAX_SPARKS = 140;

export const HOSTILE = 'hostile';
export const FRIENDLY = 'friendly';

export class ContactPool {
  constructor() {
    this.list = Array.from({ length: MAX_CONTACTS }, () => ({
      active: false, c: 0, r: 0, type: HOSTILE, fuse: 0, maxFuse: 1, age: 0,
    }));
  }

  count() {
    let n = 0;
    for (const k of this.list) if (k.active) n++;
    return n;
  }

  occupied(c, r) {
    return this.list.some((k) => k.active && k.c === c && k.r === r);
  }

  at(c, r) {
    return this.list.find((k) => k.active && k.c === c && k.r === r) || null;
  }

  spawn(c, r, type, fuse) {
    const k = this.list.find((i) => !i.active);
    if (!k) return null;
    k.active = true;
    k.c = c;
    k.r = r;
    k.type = type;
    k.fuse = k.maxFuse = fuse;
    k.age = 0;
    return k;
  }

  /**
   * Ticks every fuse and hands back the ones that ran out, so the scene can
   * decide what expiry means per type (a breach, or a convoy leaving safely).
   */
  update(dt, expired) {
    expired.length = 0;
    for (const k of this.list) {
      if (!k.active) continue;
      k.age += dt;
      k.fuse -= dt;
      if (k.fuse <= 0) {
        k.active = false;
        expired.push(k);
      }
    }
    return expired;
  }

  clear() {
    for (const k of this.list) k.active = false;
  }

  render(ctx, grid, time) {
    for (const k of this.list) {
      if (!k.active) continue;
      const b = grid.rect(k.c, k.r);
      const p = grid.center(k.c, k.r);
      const frac = k.fuse / k.maxFuse;
      const hostile = k.type === HOSTILE;
      const color = hostile ? '#ff5a5a' : '#4dc3ff';

      // Sector tint, hotter as the fuse runs down.
      ctx.fillStyle = hostile
        ? `rgba(255, 70, 70, ${0.10 + (1 - frac) * 0.34})`
        : 'rgba(77, 195, 255, .14)';
      ctx.fillRect(b.x, b.y, b.w, b.h);

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);

      const rad = grid.cell * 0.2;
      ctx.save();
      ctx.translate(p.x, p.y);

      if (hostile) {
        // Diamond, pulsing faster the closer it is to breaching.
        const pulse = 1 + Math.sin(time * (6 + (1 - frac) * 14)) * 0.10;
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = color;
        ctx.fillRect(-rad * pulse, -rad * pulse, rad * 2 * pulse, rad * 2 * pulse);
        ctx.rotate(-Math.PI / 4);
      } else {
        // Allied marker: circle with a cross, deliberately unlike the hostile.
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, rad, 0, Math.PI * 2);
        ctx.moveTo(-rad * 1.5, 0); ctx.lineTo(rad * 1.5, 0);
        ctx.moveTo(0, -rad * 1.5); ctx.lineTo(0, rad * 1.5);
        ctx.stroke();
      }

      // Fuse ring.
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, grid.cell * 0.34, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
      ctx.stroke();

      ctx.restore();
    }
  }
}

export class EffectPool {
  constructor() {
    this.rings = Array.from({ length: MAX_EFFECTS }, () => ({
      active: false, x: 0, y: 0, life: 0, max: 1, from: 0, to: 0, color: '#fff',
    }));
    this.sparks = Array.from({ length: MAX_SPARKS }, () => ({
      active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, color: '#fff', size: 2,
    }));
  }

  ring(x, y, from, to, color, dur = 0.45) {
    const e = this.rings.find((i) => !i.active);
    if (!e) return;
    Object.assign(e, { active: true, x, y, from, to, color, life: dur, max: dur });
  }

  burst(x, y, color, count = CONFIG.fx.particles) {
    let made = 0;
    for (const p of this.sparks) {
      if (made >= count) break;
      if (p.active) continue;
      const a = Math.random() * Math.PI * 2;
      const sp = 70 + Math.random() * 200;
      Object.assign(p, {
        active: true, x, y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: 0.3 + Math.random() * 0.3, color,
        size: 1.5 + Math.random() * 2.5,
      });
      p.max = p.life;
      made++;
    }
  }

  update(dt) {
    for (const e of this.rings) {
      if (!e.active) continue;
      e.life -= dt;
      if (e.life <= 0) e.active = false;
    }
    for (const p of this.sparks) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) { p.active = false; continue; }
      p.vx *= 1 - 2.2 * dt;   // drag, so sparks settle instead of flying off
      p.vy *= 1 - 2.2 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  clear() {
    for (const e of this.rings) e.active = false;
    for (const p of this.sparks) p.active = false;
  }

  render(ctx) {
    for (const e of this.rings) {
      if (!e.active) continue;
      const t = 1 - e.life / e.max;
      ctx.globalAlpha = 1 - t;
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.from + (e.to - e.from) * t, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (const p of this.sparks) {
      if (!p.active) continue;
      ctx.globalAlpha = Math.max(p.life / p.max, 0);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }
}
