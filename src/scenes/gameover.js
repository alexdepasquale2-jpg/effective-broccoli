import { load, save } from '../engine/storage.js';
import { play } from './play.js';

/**
 * Result screen. Keeps the finished board visible behind the panel so the
 * player can see where it went wrong, and commits the high score.
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
    play.particles.update(dt);
  },

  render(ctx2d, ctx) {
    ctx.background.render(ctx2d, ctx.viewport);
    play.items.render(ctx2d);
    play.player?.render(ctx2d, 0);
    play.particles.render(ctx2d);
  },
};
