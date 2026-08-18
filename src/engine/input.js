/**
 * Input
 *
 * Normalises pointer (touch/mouse/pen) and keyboard into one small state
 * object that scenes poll each frame. Polling rather than callbacks keeps
 * input in step with the fixed timestep — a tap that lands between updates is
 * still seen by the next one.
 *
 * Coordinates are reported in design units via the Viewport.
 */

export class Input {
  constructor(viewport, target = window) {
    this.viewport = viewport;
    this.target = target;

    this.pointer = {
      down: false,
      x: 0, y: 0,     // current position, design units
      startX: 0, startY: 0,
      dx: 0, dy: 0,   // movement since the last frame
    };

    this.keys = new Set();
    this._tapped = false;      // a press that started this frame
    this._prevX = 0;
    this._prevY = 0;

    const opts = { passive: false };
    target.addEventListener('pointerdown', this._onDown = (e) => this._down(e), opts);
    target.addEventListener('pointermove', this._onMove = (e) => this._move(e), opts);
    target.addEventListener('pointerup', this._onUp = (e) => this._up(e), opts);
    target.addEventListener('pointercancel', this._onUp, opts);
    // Belt and braces: some mobile browsers still synthesise these.
    target.addEventListener('touchmove', (e) => e.preventDefault(), opts);
    target.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key);
      if (e.key === ' ' || e.key.startsWith('Arrow')) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key));
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.pointer.down = false;
    });
  }

  _fromEvent(e) {
    return this.viewport.toWorld(e.clientX, e.clientY);
  }

  _down(e) {
    // Ignore presses that land on UI buttons; the DOM overlay handles those.
    if (e.target?.closest?.('.panel, .hud-btn')) return;
    const p = this._fromEvent(e);
    this.pointer.down = true;
    this.pointer.x = this._prevX = this.pointer.startX = p.x;
    this.pointer.y = this._prevY = this.pointer.startY = p.y;
    this.pointer.dx = this.pointer.dy = 0;
    this._tapped = true;
    // Keep receiving move/up even if the finger slides off the canvas.
    try { this.target.setPointerCapture?.(e.pointerId); } catch { /* not capturable */ }
  }

  _move(e) {
    if (!this.pointer.down) return;
    const p = this._fromEvent(e);
    this.pointer.x = p.x;
    this.pointer.y = p.y;
    e.preventDefault();
  }

  _up() {
    this.pointer.down = false;
    this.pointer.dx = this.pointer.dy = 0;
  }

  /**
   * True for the one update that follows a press.
   *
   * A tap can start and end between two updates, so `pointer.down` alone
   * would never be observed for a quick tap. Scenes that only want to know
   * "was there a press" should read this; `consumeTap()` is for one-shot
   * actions that must not fire twice.
   */
  get tapped() {
    return this._tapped;
  }

  /** Horizontal axis from the keyboard: -1, 0 or 1. */
  axisX() {
    let a = 0;
    if (this.keys.has('ArrowLeft') || this.keys.has('a')) a -= 1;
    if (this.keys.has('ArrowRight') || this.keys.has('d')) a += 1;
    return a;
  }

  /** True once per press. Consuming it clears the flag. */
  consumeTap() {
    const t = this._tapped;
    this._tapped = false;
    return t;
  }

  /** Call at the end of every update so per-frame deltas stay per-frame. */
  endFrame() {
    this.pointer.dx = this.pointer.x - this._prevX;
    this.pointer.dy = this.pointer.y - this._prevY;
    this._prevX = this.pointer.x;
    this._prevY = this.pointer.y;
    this._tapped = false;
  }
}
