/**
 * Thin wrapper over the DOM overlay.
 *
 * Menus and the HUD are DOM rather than canvas-drawn: text stays sharp at any
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
      menuBest: document.getElementById('menu-best'),
      overScore: document.getElementById('over-score'),
      overBest: document.getElementById('over-best'),
    };
    this.panels = Object.fromEntries(
      Object.entries(PANELS).map(([k, id]) => [k, document.getElementById(id)])
    );
  }

  /** Show one panel by key, or hide them all with `null`. */
  showPanel(key) {
    for (const [k, el] of Object.entries(this.panels)) {
      el.classList.toggle('hidden', k !== key);
    }
  }

  showHud(visible) {
    this.el.hud.classList.toggle('hidden', !visible);
  }

  setScore(n) {
    this.el.score.textContent = String(n);
  }

  setBest(n) {
    this.el.menuBest.textContent = String(n);
  }

  setResult(score, best) {
    this.el.overScore.textContent = String(score);
    this.el.overBest.textContent = String(best);
  }

  /** Wire a click handler to a button id. */
  on(id, handler) {
    document.getElementById(id).addEventListener('click', handler);
  }
}
