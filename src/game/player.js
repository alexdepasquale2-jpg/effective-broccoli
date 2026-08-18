import { CONFIG } from './config.js';
import { clamp } from '../engine/viewport.js';

/**
 * The basket the player steers along the bottom of the screen.
 *
 * Touch control is absolute-with-easing: the basket chases the finger's x
 * position rather than jumping to it, which keeps movement readable and
 * hides the jitter of a finger resting on glass. Keyboard control is a plain
 * velocity, for desktop testing.
 */
export class Player {
  constructor(viewport) {
    this.r = CONFIG.player.radius;
    this.reset(viewport);
  }

  reset(viewport) {
    this.x = viewport.width / 2;
    this.y = viewport.height - CONFIG.player.y;
    this.targetX = this.x;
    this.tilt = 0;
    this.invuln = 0;
  }

  update(dt, input, viewport) {
    const { margin, speed, dragFollow } = CONFIG.player;
    this.y = viewport.height - CONFIG.player.y;

    if (input.pointer.down || input.tapped) {
      // `tapped` covers quick taps whose press and release both land between
      // two updates — those never show up as `down`.
      this.targetX = input.pointer.x;
    } else {
      const axis = input.axisX();
      if (axis !== 0) this.targetX = this.x + axis * speed * dt * 3;
    }

    this.targetX = clamp(this.targetX, this.r + margin, viewport.width - this.r - margin);

    const prev = this.x;
    // Frame-rate independent exponential smoothing toward the target.
    this.x += (this.targetX - this.x) * (1 - Math.exp(-dragFollow * dt));
    this.x = clamp(this.x, this.r + margin, viewport.width - this.r - margin);

    // Lean into the movement; purely cosmetic.
    const vel = (this.x - prev) / Math.max(dt, 1e-6);
    this.tilt += (clamp(vel / 900, -0.35, 0.35) - this.tilt) * 0.2;

    if (this.invuln > 0) this.invuln -= dt;
  }

  hit() {
    this.invuln = CONFIG.rules.invulnerable;
  }

  get vulnerable() {
    return this.invuln <= 0;
  }

  render(ctx, time) {
    // Blink while the mercy window is running.
    if (!this.vulnerable && Math.floor(time * 12) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.tilt);

    ctx.fillStyle = '#f4d19b';
    ctx.strokeStyle = '#c99a55';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-this.r, -this.r * 0.5);
    ctx.lineTo(this.r, -this.r * 0.5);
    ctx.lineTo(this.r * 0.7, this.r * 0.6);
    ctx.lineTo(-this.r * 0.7, this.r * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-this.r, -this.r * 0.5);
    ctx.quadraticCurveTo(0, -this.r * 1.5, this.r, -this.r * 0.5);
    ctx.stroke();

    ctx.restore();
  }
}
