import { load, save } from '../engine/storage.js';
import { play } from './play.js';

/**
 * Debrief. Keeps the final board visible behind the panel so the operator can
 * see which sectors went down, and commits the best score.
 */
export const gameover = {
  enter(ctx, { score = 0 } = {}) {
    const best = Math.max(load('best', 0), score);
    save('best', best);

    ctx.ui.showHud(false);
    ctx.ui.setResult(score, best);
    ctx.ui.showPanel('over');
  },

  update(dt, ctx) {
    ctx.background.update(dt, ctx.viewport);
    play.grid.layout(ctx.viewport);
    play.fx.update(dt);
  },

  render(ctx2d, ctx) {
    ctx.background.render(ctx2d, ctx.viewport);
    play.grid.render(ctx2d);
    play.contacts.render(ctx2d, play.grid, play.time);
    play.fx.render(ctx2d);
  },
};
