import { load } from '../engine/storage.js';

/**
 * Mission briefing. The buttons are DOM (see index.html) — canvas here only
 * keeps the map alive so the screen never looks frozen.
 */
export const menu = {
  enter(ctx) {
    ctx.ui.showHud(false);
    ctx.ui.setBest(load('best', 0));
    ctx.ui.showPanel('menu');
  },

  update(dt, ctx) {
    ctx.background.update(dt, ctx.viewport);
  },

  render(ctx2d, ctx) {
    ctx.background.render(ctx2d, ctx.viewport);
  },
};
