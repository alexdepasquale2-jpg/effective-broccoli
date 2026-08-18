import { CONFIG } from '../game/config.js';
import { Player } from '../game/player.js';
import { ItemPool, ParticlePool } from '../game/items.js';

/**
 * The playable scene: catch the broccoli, dodge the spiky things.
 *
 * Difficulty is a pure function of score — spawn interval shrinks and fall
 * speed grows — so the ramp is reproducible and easy to retune from
 * config.js without touching this file.
 */

export const play = {
  player: null,
  items: new ItemPool(),
  particles: new ParticlePool(),
  score: 0,
  lives: CONFIG.rules.lives,
  paused: false,
  time: 0,
  shake: 0,
  spawnTimer: 0,

  enter(ctx) {
    this.player = this.player || new Player(ctx.viewport);
    this.player.reset(ctx.viewport);
    this.items.clear();
    this.particles.clear();
    this.score = 0;
    this.lives = CONFIG.rules.lives;
    this.time = 0;
    this.shake = 0;
    this.paused = false;
    this.spawnTimer = CONFIG.items.baseInterval;

    ctx.ui.showPanel(null);
    ctx.ui.showHud(true);
    ctx.ui.setScore(0);
  },

  exit(ctx) {
    ctx.ui.showHud(false);
  },

  setPaused(paused) {
    this.paused = paused;
  },

  update(dt, ctx) {
    if (this.paused) return;

    this.time += dt;
    const { viewport, input, audio } = ctx;

    this.player.update(dt, input, viewport);
    this.items.update(dt, viewport.height);
    this.particles.update(dt);
    ctx.background.update(dt, viewport);

    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 40);

    this._spawn(dt, viewport);
    this._collide(ctx, audio);

  },

  _spawn(dt, viewport) {
    const C = CONFIG.items;
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;

    const interval = Math.max(C.minInterval, C.baseInterval - this.score * C.intervalPerPoint);
    this.spawnTimer = interval * (0.75 + Math.random() * 0.5);

    const speed = Math.min(C.maxSpeed, C.baseSpeed + this.score * C.speedPerPoint);
    const hazardChance = Math.min(C.maxHazardChance, C.hazardChance + this.score * 0.002);
    const pad = C.radius + 12;
    const x = pad + Math.random() * (viewport.width - pad * 2);

    this.items.spawn(x, speed, Math.random() < hazardChance);
  },

  _collide(ctx, audio) {
    const p = this.player;
    const reach = p.r * 0.95 + CONFIG.items.radius;

    for (const it of this.items.items) {
      if (!it.active) continue;
      const dx = it.x - p.x;
      const dy = it.y - p.y;
      if (dx * dx + dy * dy > reach * reach) continue;

      it.active = false;

      if (it.hazard) {
        if (!p.vulnerable) continue;   // still inside the mercy window
        p.hit();
        this.lives -= 1;
        this.shake = CONFIG.fx.shakeOnHit;
        this.particles.burst(it.x, it.y, '#ff6b81', 20);
        audio.play('hit');
        if (this.lives <= 0) {
          ctx.scenes.go('gameover', { score: this.score });
          return;
        }
      } else {
        this.score += 1;
        this.particles.burst(it.x, it.y, '#6ee7a8');
        audio.play('pickup');
        ctx.ui.setScore(this.score);
      }
    }
  },

  render(ctx2d, ctx) {
    const { viewport } = ctx;

    ctx2d.save();
    if (this.shake > 0) {
      const s = this.shake * 0.35;
      ctx2d.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
    }

    ctx.background.render(ctx2d, viewport);
    this.items.render(ctx2d);
    this.player.render(ctx2d, this.time);
    this.particles.render(ctx2d);
    drawLives(ctx2d, viewport, this.lives);

    ctx2d.restore();
  },
};

function drawLives(ctx2d, viewport, lives) {
  const y = viewport.height - 22;
  for (let i = 0; i < CONFIG.rules.lives; i++) {
    const x = 20 + i * 20;
    ctx2d.globalAlpha = i < lives ? 1 : 0.22;
    ctx2d.fillStyle = '#ff6b81';
    ctx2d.beginPath();
    ctx2d.arc(x - 3.2, y - 2, 4.2, 0, Math.PI * 2);
    ctx2d.arc(x + 3.2, y - 2, 4.2, 0, Math.PI * 2);
    ctx2d.moveTo(x - 7.6, y);
    ctx2d.lineTo(x, y + 8.5);
    ctx2d.lineTo(x + 7.6, y);
    ctx2d.closePath();
    ctx2d.fill();
  }
  ctx2d.globalAlpha = 1;
}

