/**
 * Thin wrapper over the DOM overlay.
 *
 * The HUD and menus are DOM rather than canvas-drawn: text stays sharp at any
 * DPR, buttons get real tap targets and focus handling for free, and none of
 * it costs a redraw per frame.
 */

const PANELS = {
  menu: 'panel-menu',
  pause: 'panel-pause',
  over: 'panel-over',
};

export class UI {
  constructor() {
    this.el = {
      hud: document.getElementById('hud'),
      score: document.getElementById('hud-score'),
      combo: document.getElementById('hud-combo'),
      integrity: document.getElementById('hud-integrity'),
      cooldown: document.getElementById('hud-cooldown'),
      status: document.getElementById('hud-status'),
      menuBest: document.getElementById('menu-best'),
      overScore: document.getElementById('over-score'),
      overBest: document.getElementById('over-best'),
    };
    this.panels = Object.fromEntries(
      Object.entries(PANELS).map(([k, id]) => [k, document.getElementById(id)])
    );
    this._status = '';
    this._integrity = -1;
    this._hudBottom = 0;
    this._hudDirty = true;
    // Reading layout every frame would thrash, so re-measure only when
    // something that changes the HUD's height happens.
    window.addEventListener('resize', () => { this._hudDirty = true; });
    window.visualViewport?.addEventListener('resize', () => { this._hudDirty = true; });
  }

  /**
   * Bottom edge of the HUD in CSS pixels, for laying out the board below it.
   * Measured on demand because the HUD is only its full height once its
   * contents have been filled in.
   */
  get hudBottomPx() {
    if (this._hudDirty) {
      const r = this.el.hud.getBoundingClientRect();
      if (r.height > 0) {
        this._hudBottom = r.bottom;
        this._hudDirty = false;
      }
    }
    return this._hudBottom;
  }

  /** Show one panel by key, or hide them all with `null`. */
  showPanel(key) {
    for (const [k, el] of Object.entries(this.panels)) {
      el.classList.toggle('hidden', k !== key);
    }
  }

  showHud(visible) {
    this.el.hud.classList.toggle('hidden', !visible);
    this._hudDirty = true;
  }

  setScore(n) {
    this.el.score.textContent = String(n).padStart(5, '0');
  }

  setCombo(n) {
    this.el.combo.textContent = `x${n}`;
    this.el.combo.classList.toggle('hot', n > 1);
  }

  /** Integrity blocks. Rebuilt only when the value actually changes. */
  setIntegrity(value, max) {
    if (value === this._integrity) return;
    this._integrity = value;
    this._hudDirty = true;   // block count changes the HUD's height
    this.el.integrity.innerHTML = '';
    for (let i = 0; i < max; i++) {
      const b = document.createElement('i');
      b.className = i < value ? 'blk' : 'blk out';
      this.el.integrity.appendChild(b);
    }
  }

  /** Weapon readiness, 0..1. */
  setCooldown(t) {
    this.el.cooldown.style.transform = `scaleX(${Math.min(Math.max(t, 0), 1)})`;
  }

  setStatus(text) {
    if (text === this._status) return;
    this._status = text;
    this.el.status.textContent = text;
  }

  setBest(n) {
    this.el.menuBest.textContent = String(n).padStart(5, '0');
  }

  setResult(score, best) {
    this.el.overScore.textContent = String(score).padStart(5, '0');
    this.el.overBest.textContent = String(best).padStart(5, '0');
  }

  /** Wire a click handler to a button id. */
  on(id, handler) {
    document.getElementById(id).addEventListener('click', handler);
  }
}
