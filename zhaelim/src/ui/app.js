import { el, clear } from './dom.js';
import { vessel } from '../core/storage.js';
import { screenWeave } from './screen-weave.js';
import { screenPlay } from './screen-play.js';
import { screenCodex } from './screen-codex.js';
import { screenTongue } from './screen-tongue.js';
import { screenRite } from './screen-rite.js';
import { screenNest } from './screen-nest.js';
import { screenThreshold } from './screen-threshold.js';
import * as voice from '../audio/voice.js';

const SCREENS = {
  threshold: screenThreshold,
  weave: screenWeave,
  play: screenPlay,
  codex: screenCodex,
  tongue: screenTongue,
  rite: screenRite,
  nest: screenNest,
};

const TABS = [
  { id: 'weave', label: 'weave', gloss: 'korath' },
  { id: 'tongue', label: 'tongue', gloss: "ilu'thaan" },
  { id: 'codex', label: 'codex', gloss: 'sseda' },
  { id: 'rite', label: 'rite', gloss: 'rhu' },
  { id: 'nest', label: 'nest', gloss: 'eon' },
];

export function mount(root) {
  const stage = el('main', { class: 'stage-root' });
  const tabBar = el('nav', { class: 'tabs', 'aria-label': 'the five rooms' });
  let current = null;
  let currentId = null;

  const go = (id, props = {}) => {
    if (current?.dispose) current.dispose();
    clear(stage);
    currentId = id;
    const built = SCREENS[id]({ go, ...props });
    current = built.node ? built : { node: built };
    stage.append(current.node);
    stage.scrollTop = 0;
    syncTabs();
    document.body.classList.toggle('in-play', id === 'play');
    if (id !== 'threshold') history.replaceState({ id }, '', `#${id}`);
  };

  const tabButtons = TABS.map((tab) => {
    const b = el('button', { class: 'tab', type: 'button', 'data-id': tab.id }, [
      el('span', { class: 'tab-label', text: tab.label }),
      el('span', { class: 'tab-gloss', text: tab.gloss }),
    ]);
    b.addEventListener('click', () => {
      voice.wake();
      voice.uiTap();
      go(tab.id);
    });
    return b;
  });
  tabBar.append(...tabButtons);
  const syncTabs = () => {
    tabButtons.forEach((b) => b.classList.toggle('on', b.dataset.id === currentId));
  };

  root.append(stage, tabBar);

  // The first tap anywhere wakes the voice; mobile audio insists on a gesture.
  const waker = () => voice.wake();
  document.addEventListener('pointerdown', waker, { once: true, capture: true });

  const start = vessel.get('seenPrologue')
    ? location.hash.slice(1) in SCREENS
      ? location.hash.slice(1)
      : 'weave'
    : 'threshold';
  go(start === 'play' ? 'weave' : start);

  return { go };
}
