/**
 * Entry point: builds the shared context, registers scenes, wires the DOM
 * buttons and starts the loop.
 *
 * Everything a scene needs is passed through the `context` object, so scenes
 * import no globals and can be tested or swapped independently.
 */

import { Viewport } from './engine/viewport.js';
import { Loop } from './engine/loop.js';
import { Input } from './engine/input.js';
import { SceneManager } from './engine/scene.js';
import { Audio } from './engine/audio.js';
import { Background } from './game/background.js';
import { UI } from './ui.js';
import { menu } from './scenes/menu.js';
import { play } from './scenes/play.js';
import { gameover } from './scenes/gameover.js';

const canvas = document.getElementById('game');
const viewport = new Viewport(canvas);
const input = new Input(viewport, canvas);
const audio = new Audio();
const ui = new UI();
const background = new Background(viewport);

const context = { viewport, input, audio, ui, background, scenes: null };

const scenes = new SceneManager(context);
context.scenes = scenes;
scenes.add('menu', menu).add('play', play).add('gameover', gameover);

const loop = new Loop({
  update(dt) {
    scenes.update(dt);
    input.endFrame();
  },
  render(alpha) {
    scenes.render(alpha);
  },
});

// Browsers only allow audio to start from a real gesture, so unlock on the
// first interaction of any kind and then stop listening.
const unlock = () => audio.unlock();
window.addEventListener('pointerdown', unlock, { once: true });
window.addEventListener('keydown', unlock, { once: true });

function click(id, fn) {
  ui.on(id, () => {
    audio.play('ui');
    fn();
  });
}

click('btn-play', () => scenes.go('play'));
click('btn-retry', () => scenes.go('play'));
click('btn-menu', () => scenes.go('menu'));

click('btn-pause', () => {
  play.setPaused(true);
  ui.showPanel('pause');
});

click('btn-resume', () => {
  play.setPaused(false);
  ui.showPanel(null);
});

click('btn-quit', () => {
  play.setPaused(false);
  scenes.go('menu');
});

// Losing focus mid-run (a call, app switch) should pause rather than kill you.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && scenes.name === 'play' && !play.paused) {
    play.setPaused(true);
    ui.showPanel('pause');
  }
});

// Handy from the console while tuning: `game.play.score`, `game.viewport.width`.
window.game = { viewport, input, audio, ui, scenes, loop, play };

scenes.go('menu');
scenes.update(0);
loop.start();

// Offline support. Registered late so a broken SW can never block first paint,
// and skipped on localhost-less file:// runs where registration would throw.
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => { /* offline is optional */ });
  });
}
