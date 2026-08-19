import { CONFIG } from '../game/config.js';
import { Grid } from '../game/grid.js';
import { ContactPool, EffectPool, HOSTILE, FRIENDLY } from '../game/contacts.js';

/**
 * Sector defence.
 *
 * Hostile contacts drop into sectors on a fuse; tap a sector to strike it
 * before the fuse runs out. Allied convoys share the board and must be left
 * alone, which is what stops the game from being "tap everything fast" — the
 * weapon cooldown means every strike is a choice about which sector to spend
 * it on.
 *
 * Difficulty is a pure function of score (drop rate, fuse length, how many
 * contacts may be live at once, friendly ratio), so the ramp is reproducible
 * and retunable entirely from config.js.
 */

export const play = {
  grid: new Grid(),
  contacts: new ContactPool(),
  fx: new EffectPool(),
  score: 0,
  integrity: CONFIG.rules.integrity,
  combo: 1,
  paused: false,
  time: 0,
  shake: 0,
  cooldown: 0,
  spawnTimer: 0,
  cursor: { c: 2, r: 3 },
  _expired: [],

  enter(ctx) {
    this.contacts.clear();
    this.fx.clear();
    this.score = 0;
    this.integrity = CONFIG.rules.integrity;
    this.combo = 1;
    this.time = 0;
    this.shake = 0;
    this.cooldown = 0;
    this.paused = false;
    this.spawnTimer = 0.7;
    this.cursor = { c: (CONFIG.grid.cols / 2) | 0, r: (CONFIG.grid.rows / 2) | 0 };

    ctx.ui.showPanel(null);
    ctx.ui.showHud(true);
    ctx.ui.setScore(0);
    ctx.ui.setIntegrity(this.integrity, CONFIG.rules.integrity);
    ctx.ui.setCombo(1);
    ctx.ui.setStatus('SECTORS NOMINAL');
  },

  exit(ctx) {
    ctx.ui.showHud(false);
  },

  setPaused(paused) {
    this.paused = paused;
  },

  /** Space taken by the HUD, in design units, plus room for column letters. */
  _topInset(ctx) {
    const px = ctx.ui.hudBottomPx;
    if (!px) return CONFIG.grid.topInset;
    return px / ctx.viewport.scale + CONFIG.grid.headroom;
  },

  update(dt, ctx) {
    if (this.paused) return;

    this.time += dt;
    this.grid.layout(ctx.viewport, this._topInset(ctx));
    ctx.background.update(dt, ctx.viewport);
    this.fx.update(dt);

    if (this.cooldown > 0) this.cooldown = Math.max(0, this.cooldown - dt);
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 40);
    ctx.ui.setCooldown(1 - this.cooldown / CONFIG.weapon.cooldown);

    this._input(ctx);
    this._spawn(dt);
    this._expire(dt, ctx);
  },

  _input(ctx) {
    const { input } = ctx;

    // Keyboard aiming, for desktop. Touch fires wherever it lands.
    if (input.consumeKey('ArrowLeft') || input.consumeKey('a')) this.cursor.c--;
    if (input.consumeKey('ArrowRight') || input.consumeKey('d')) this.cursor.c++;
    if (input.consumeKey('ArrowUp') || input.consumeKey('w')) this.cursor.r--;
    if (input.consumeKey('ArrowDown') || input.consumeKey('s')) this.cursor.r++;
    this.cursor.c = wrap(this.cursor.c, this.grid.cols);
    this.cursor.r = wrap(this.cursor.r, this.grid.rows);

    if (input.consumeKey(' ') || input.consumeKey('Enter')) {
      this._strike(this.cursor.c, this.cursor.r, ctx);
    }

    if (input.consumeTap()) {
      const hit = this.grid.cellAt(input.pointer.x, input.pointer.y);
      if (hit) {
        this.cursor = hit;
        this._strike(hit.c, hit.r, ctx);
      }
    }
  },

  _strike(c, r, ctx) {
    if (this.cooldown > 0) {
      ctx.ui.setStatus('WEAPON RELOADING');
      return;
    }
    this.cooldown = CONFIG.weapon.cooldown;

    const p = this.grid.center(c, r);
    const label = this.grid.label(c, r);
    const target = this.contacts.at(c, r);

    if (!target) {
      this.fx.ring(p.x, p.y, 4, this.grid.cell * 0.5, 'rgba(160,255,200,.8)', 0.3);
      this.combo = 1;
      ctx.ui.setCombo(this.combo);
      ctx.ui.setStatus(`${label} CLEAR — NO CONTACT`);
      ctx.audio.play('miss');
      return;
    }

    target.active = false;

    if (target.type === HOSTILE) {
      this.score += CONFIG.scoring.hostile * this.combo;
      this.combo = Math.min(this.combo + 1, CONFIG.scoring.comboMax);
      this.fx.ring(p.x, p.y, 4, this.grid.cell * 0.9, '#ff8a5a', 0.45);
      this.fx.burst(p.x, p.y, '#ffb545');
      ctx.audio.play('hit');
      ctx.ui.setScore(this.score);
      ctx.ui.setCombo(this.combo);
      ctx.ui.setStatus(`${label} NEUTRALISED`);
    } else {
      // Friendly fire: the one mistake that costs integrity outright.
      this.integrity -= 1;
      this.combo = 1;
      this.shake = CONFIG.fx.shakeOnFriendlyFire;
      this.fx.ring(p.x, p.y, 4, this.grid.cell * 0.9, '#4dc3ff', 0.5);
      this.fx.burst(p.x, p.y, '#4dc3ff');
      ctx.audio.play('friendly');
      ctx.ui.setCombo(this.combo);
      ctx.ui.setIntegrity(this.integrity, CONFIG.rules.integrity);
      ctx.ui.setStatus(`${label} FRIENDLY FIRE`);
      this._checkFail(ctx);
    }
  },

  _spawn(dt) {
    const C = CONFIG.contacts;
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;

    const points = this.score / CONFIG.scoring.hostile;
    const interval = Math.max(C.minInterval, C.baseInterval - points * C.intervalPerPoint);
    this.spawnTimer = interval * (0.8 + Math.random() * 0.4);

    const allowed = Math.min(C.maxActive, Math.floor(C.baseActive + points * C.activePerPoint));
    if (this.contacts.count() >= allowed) return;

    const free = [];
    for (let r = 0; r < this.grid.rows; r++) {
      for (let c = 0; c < this.grid.cols; c++) {
        if (!this.contacts.occupied(c, r)) free.push({ c, r });
      }
    }
    if (!free.length) return;

    const spot = free[(Math.random() * free.length) | 0];
    const friendlyChance = Math.min(
      C.maxFriendlyChance,
      C.friendlyChance + points * C.friendlyPerPoint
    );
    const friendly = Math.random() < friendlyChance;
    const fuse = friendly
      ? C.friendlyFuse
      : Math.max(C.minFuse, C.baseFuse - points * C.fusePerPoint);

    this.contacts.spawn(spot.c, spot.r, friendly ? FRIENDLY : HOSTILE, fuse);
  },

  _expire(dt, ctx) {
    // Contacts whose fuse ran out this frame: a hostile breached the line, a
    // friendly simply cleared the sector.
    this.contacts.update(dt, this._expired);
    for (const k of this._expired) {
      if (k.type !== HOSTILE) continue;
      const p = this.grid.center(k.c, k.r);
      this.integrity -= 1;
      this.combo = 1;
      this.shake = CONFIG.fx.shakeOnBreach;
      this.fx.ring(p.x, p.y, 4, this.grid.cell * 1.2, '#ff4d4d', 0.6);
      this.fx.burst(p.x, p.y, '#ff4d4d', 22);
      ctx.audio.play('breach');
      ctx.ui.setIntegrity(this.integrity, CONFIG.rules.integrity);
      ctx.ui.setCombo(this.combo);
      ctx.ui.setStatus(`${this.grid.label(k.c, k.r)} BREACHED`);
      if (this._checkFail(ctx)) return;
    }
  },

  _checkFail(ctx) {
    if (this.integrity > 0) return false;
    ctx.scenes.go('gameover', { score: this.score });
    return true;
  },

  render(ctx2d, ctx) {
    ctx2d.save();
    if (this.shake > 0) {
      const s = this.shake * 0.3;
      ctx2d.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
    }

    ctx.background.render(ctx2d, ctx.viewport);
    this.grid.render(ctx2d);
    this.contacts.render(ctx2d, this.grid, this.time);
    drawCursor(ctx2d, this.grid, this.cursor, this.cooldown > 0);
    this.fx.render(ctx2d);

    ctx2d.restore();
  },
};

function wrap(v, n) {
  return ((v % n) + n) % n;
}

/** Selection brackets around the aimed sector. */
function drawCursor(ctx, grid, cursor, reloading) {
  const b = grid.rect(cursor.c, cursor.r);
  const t = Math.min(10, b.w * 0.3);
  ctx.strokeStyle = reloading ? 'rgba(255, 181, 69, .55)' : 'rgba(180, 255, 215, .95)';
  ctx.lineWidth = 2;
  for (const [x, y, dx, dy] of [
    [b.x, b.y, 1, 1],
    [b.x + b.w, b.y, -1, 1],
    [b.x, b.y + b.h, 1, -1],
    [b.x + b.w, b.y + b.h, -1, -1],
  ]) {
    ctx.beginPath();
    ctx.moveTo(x + dx * t, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + dy * t);
    ctx.stroke();
  }
}
