/**
 * Viewport
 *
 * Owns canvas sizing so the rest of the game draws in stable "design units"
 * and never thinks about device pixel ratio or screen size again.
 *
 * The design width is fixed (DESIGN_W) and the height follows the device
 * aspect ratio, so the game fills the screen edge-to-edge instead of
 * letterboxing. On very short screens (landscape phones) scaling down to a
 * fixed width would leave too little vertical room, so the scale is derived
 * from the height instead and the play area gets *wider* rather than
 * cropped — which is why `width` and `height` are both variable and layout
 * code must read them every frame rather than caching them.
 */

const DESIGN_W = 360;   // reference width; layout is authored against this
const MIN_H = 520;      // never show less vertical play area than this

export class Viewport {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.width = DESIGN_W;
    this.height = 640;
    this.scale = 1;
    this._onResize = () => this.resize();

    window.addEventListener('resize', this._onResize);
    window.addEventListener('orientationchange', this._onResize);
    // iOS fires this when the URL bar collapses and the visual viewport shifts.
    window.visualViewport?.addEventListener('resize', this._onResize);

    this.resize();
  }

  resize() {
    const cssW = this.canvas.clientWidth || window.innerWidth;
    const cssH = this.canvas.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);

    let scale = cssW / DESIGN_W;
    if (cssH / scale < MIN_H) scale = cssH / MIN_H;

    this.scale = scale;
    this.width = cssW / scale;
    this.height = cssH / scale;

    this.canvas.width = Math.round(cssW * dpr);
    this.canvas.height = Math.round(cssH * dpr);

    // One transform to rule them all: draw calls use design units from here on.
    const s = scale * dpr;
    this.ctx.setTransform(s, 0, 0, s, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
  }

  /** Convert a DOM/pointer client coordinate into design-unit space. */
  toWorld(clientX, clientY) {
    const r = this.canvas.getBoundingClientRect();
    return {
      x: (clientX - r.left) / this.scale,
      y: (clientY - r.top) / this.scale,
    };
  }

  destroy() {
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('orientationchange', this._onResize);
    window.visualViewport?.removeEventListener('resize', this._onResize);
  }
}

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}
