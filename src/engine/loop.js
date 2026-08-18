/**
 * Loop
 *
 * Fixed-timestep update with a decoupled render, so gameplay behaves the same
 * on a 60Hz phone and a 120Hz one. `update(dt)` always sees the same dt;
 * `render(alpha)` gets the leftover fraction for interpolation if a scene
 * wants it.
 *
 * The loop also auto-pauses when the tab is hidden — a backgrounded mobile
 * browser can stall for minutes, and resuming with that gap would teleport
 * every entity across the screen.
 */

const STEP = 1 / 60;
const MAX_FRAME = 0.25; // Never simulate more than a quarter second at once.

export class Loop {
  constructor({ update, render }) {
    this.update = update;
    this.render = render;
    this.running = false;
    this.accumulator = 0;
    this.last = 0;
    this._raf = 0;
    this._tick = this._tick.bind(this);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.stop();
      else this.start();
    });
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.accumulator = 0;
    this._raf = requestAnimationFrame(this._tick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this._raf);
  }

  _tick(now) {
    if (!this.running) return;
    this._raf = requestAnimationFrame(this._tick);

    let frame = (now - this.last) / 1000;
    this.last = now;
    if (frame > MAX_FRAME) frame = MAX_FRAME;

    this.accumulator += frame;
    while (this.accumulator >= STEP) {
      this.update(STEP);
      this.accumulator -= STEP;
    }

    this.render(this.accumulator / STEP);
  }
}
