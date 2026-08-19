import { CONFIG } from './config.js';

/**
 * The sector grid.
 *
 * Pure geometry plus naming — it holds no game state, so the play scene can
 * ask "which sector was tapped" and "where do I draw sector C4" without
 * caring how the board is sized. Layout is recomputed every frame because
 * viewport width and height both change on rotation.
 */

const LETTERS = 'ABCDEFGH';

export class Grid {
  constructor() {
    this.cols = CONFIG.grid.cols;
    this.rows = CONFIG.grid.rows;
    this.x = 0;
    this.y = 0;
    this.cell = 0;
    this.w = 0;
    this.h = 0;
  }

  /**
   * Fit the board into the free space below the HUD.
   *
   * `topInset` is passed in design units by the scene, measured from the real
   * HUD element — the HUD is DOM, so its height in design units changes with
   * screen size and a constant here would overlap it on small phones.
   */
  layout(viewport, topInset = CONFIG.grid.topInset) {
    const G = CONFIG.grid;
    const availW = viewport.width - G.sidePad * 2;
    const availH = viewport.height - topInset - G.bottomInset;

    this.cell = Math.min(availW / this.cols, availH / this.rows);
    this.w = this.cell * this.cols;
    this.h = this.cell * this.rows;
    this.x = (viewport.width - this.w) / 2;
    this.y = topInset + (availH - this.h) / 2;
  }

  /** Screen rect of one sector, inset by the gap. */
  rect(c, r) {
    const g = CONFIG.grid.gap;
    return {
      x: this.x + c * this.cell + g / 2,
      y: this.y + r * this.cell + g / 2,
      w: this.cell - g,
      h: this.cell - g,
    };
  }

  center(c, r) {
    return {
      x: this.x + (c + 0.5) * this.cell,
      y: this.y + (r + 0.5) * this.cell,
    };
  }

  /** Sector under a point, or null if the tap landed off the board. */
  cellAt(px, py) {
    const c = Math.floor((px - this.x) / this.cell);
    const r = Math.floor((py - this.y) / this.cell);
    if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) return null;
    return { c, r };
  }

  /** Military-style callsign: column letter, row number. */
  label(c, r) {
    return `${LETTERS[c] ?? '?'}${r + 1}`;
  }

  render(ctx) {
    const { cell } = this;

    // Sector cells.
    ctx.lineWidth = 1;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const b = this.rect(c, r);
        ctx.fillStyle = 'rgba(28, 68, 44, .28)';
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = 'rgba(90, 220, 150, .16)';
        ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
      }
    }

    // Corner ticks on the board itself, the way a map overlay is framed.
    ctx.strokeStyle = 'rgba(120, 255, 190, .5)';
    ctx.lineWidth = 2;
    const t = 12;
    for (const [cx, cy, dx, dy] of [
      [this.x, this.y, 1, 1],
      [this.x + this.w, this.y, -1, 1],
      [this.x, this.y + this.h, 1, -1],
      [this.x + this.w, this.y + this.h, -1, -1],
    ]) {
      ctx.beginPath();
      ctx.moveTo(cx + dx * t, cy);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx, cy + dy * t);
      ctx.stroke();
    }

    // Column letters above, row numbers to the left.
    ctx.fillStyle = 'rgba(120, 255, 190, .45)';
    ctx.font = `${Math.max(9, cell * 0.24)}px ui-monospace, Menlo, Consolas, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    for (let c = 0; c < this.cols; c++) {
      ctx.fillText(LETTERS[c], this.x + (c + 0.5) * cell, this.y - 6);
    }
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let r = 0; r < this.rows; r++) {
      ctx.fillText(String(r + 1), this.x - 6, this.y + (r + 0.5) * cell);
    }
  }
}
