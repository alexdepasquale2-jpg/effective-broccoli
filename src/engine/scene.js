/**
 * SceneManager
 *
 * A scene is a plain object with optional enter/exit/update/render methods.
 * Swapping is deferred to the end of the frame so a scene can safely call
 * `go()` from inside its own update without pulling the rug out from under
 * the loop.
 */

export class SceneManager {
  constructor(context) {
    this.context = context;   // shared services: viewport, input, audio, ui...
    this.current = null;
    this.name = null;
    this._pending = null;
    this.scenes = new Map();
  }

  add(name, scene) {
    this.scenes.set(name, scene);
    return this;
  }

  /** Queue a scene change; it takes effect after the current frame. */
  go(name, params = {}) {
    if (!this.scenes.has(name)) throw new Error(`Unknown scene: ${name}`);
    this._pending = { name, params };
  }

  update(dt) {
    this.current?.update?.(dt, this.context);
    if (this._pending) this._swap();
  }

  render(alpha) {
    this.current?.render?.(this.context.viewport.ctx, this.context, alpha);
  }

  _swap() {
    const { name, params } = this._pending;
    this._pending = null;
    this.current?.exit?.(this.context);
    this.current = this.scenes.get(name);
    this.name = name;
    this.current?.enter?.(this.context, params);
  }
}
