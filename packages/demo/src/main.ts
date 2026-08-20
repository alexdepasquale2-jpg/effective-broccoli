import { INVENTORY_SLOTS, TICK_MS, levelForXp, levelProgress } from '@glimmer/shared';
import { CATALOGUE_SIZE, CONTENT_SOURCES, items, location, skills } from './content.generated.ts';
import { DemoRoom } from './room.ts';
import { MeadowRenderer } from './render.ts';
import './style.css';

const SAVE_KEY = 'glimmer.demo.v1';

/** localStorage is not guaranteed in a sandboxed frame; never let it throw. */
const safeStorage = {
  get(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Storage unavailable; the session simply will not be remembered.
    }
  },
  remove(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Nothing to clean up.
    }
  },
};

function must<T extends Element>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`page is missing ${selector}`);
  return el;
}

const canvas = must<HTMLCanvasElement>('#meadow');
const slotsEl = must<HTMLElement>('#slots');
const skillsEl = must<HTMLElement>('#skills');
const toastsEl = must<HTMLElement>('#toasts');
const placeEl = must<HTMLElement>('#place');
const resetEl = must<HTMLButtonElement>('#reset');
const sourceEl = must<HTMLElement>('#source-note');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const room = new DemoRoom(location, items);
const renderer = new MeadowRenderer(canvas, location);
const skillNames = new Map(
  skills.map((s) => [s.id, s.level > 1 ? `${s.name} ${roman(s.level)}` : s.name]),
);
const skillBlurbs = new Map(skills.map((s) => [s.id, s.description]));

placeEl.textContent = location.name;
sourceEl.textContent = CONTENT_SOURCES.includes('gsjs')
  ? `Names, stack sizes and skill descriptions imported from Tiny Speck’s CC0 release — ${CATALOGUE_SIZE.items.toLocaleString()} items and ${CATALOGUE_SIZE.skills} skills in the full catalogue.`
  : 'Running on authored bootstrap content.';

// ---------------------------------------------------------------- persistence

const saved = safeStorage.get(SAVE_KEY);
if (saved) room.load(saved);

function persist(): void {
  safeStorage.set(SAVE_KEY, room.save());
}

resetEl.addEventListener('click', () => {
  safeStorage.remove(SAVE_KEY);
  window.location.reload();
});

// ---------------------------------------------------------------- input

const held = new Set<string>();
let jumpQueued = false;

function keyOf(e: KeyboardEvent): 'left' | 'right' | 'jump' | 'use' | null {
  switch (e.key) {
    case 'ArrowLeft':
    case 'a':
    case 'A':
      return 'left';
    case 'ArrowRight':
    case 'd':
    case 'D':
      return 'right';
    case ' ':
    case 'ArrowUp':
    case 'w':
    case 'W':
      return 'jump';
    case 'e':
    case 'E':
      return 'use';
    default:
      return null;
  }
}

window.addEventListener('keydown', (e) => {
  const key = keyOf(e);
  if (!key) return;
  e.preventDefault();
  if (key === 'use') {
    const target = room.nearestUsable(Date.now());
    if (target) tryHarvest(target.id);
    else toast('Nothing in reach.', 'bad');
    return;
  }
  if (key === 'jump' && !held.has('jump')) jumpQueued = true;
  held.add(key);
});

window.addEventListener('keyup', (e) => {
  const key = keyOf(e);
  if (key) held.delete(key);
});
window.addEventListener('blur', () => held.clear());

let hovered: string | null = null;
let lastCam = renderer.camera(room.body.x, room.body.y);

canvas.addEventListener('pointermove', (e) => {
  const rect = canvas.getBoundingClientRect();
  hovered = renderer.hitTest(e.clientX - rect.left, e.clientY - rect.top, lastCam)?.id ?? null;
  canvas.style.cursor = hovered ? 'pointer' : 'default';
});
canvas.addEventListener('pointerleave', () => {
  hovered = null;
});
canvas.addEventListener('pointerdown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const hit = renderer.hitTest(e.clientX - rect.left, e.clientY - rect.top, lastCam);
  if (hit) tryHarvest(hit.id);
});

// Touch: tap-to-walk on the left/right halves, since there is no keyboard.
let touchDir = 0;
canvas.addEventListener(
  'touchstart',
  (e) => {
    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0];
    if (!t) return;
    if (renderer.hitTest(t.clientX - rect.left, t.clientY - rect.top, lastCam)) return;
    const half = rect.left + rect.width / 2;
    if (t.clientY - rect.top < rect.height * 0.45) jumpQueued = true;
    else touchDir = t.clientX < half ? -1 : 1;
  },
  { passive: true },
);
canvas.addEventListener(
  'touchend',
  () => {
    touchDir = 0;
  },
  { passive: true },
);

window.addEventListener('resize', () => renderer.resize());

// ---------------------------------------------------------------- actions

function tryHarvest(entityId: string): void {
  const result = room.harvest(entityId, Date.now());
  if (!result.ok) {
    toast(result.message, 'bad');
    return;
  }
  toast(result.message, 'good');
  if (result.skillId) {
    const name = skillNames.get(result.skillId) ?? result.skillId;
    toast(`+${result.gained} ${name}`, 'xp');
    if (result.levelledUp) {
      toast(`${name} reached level ${levelForXp(room.xpFor(result.skillId))}`, 'good');
    }
  }
  renderInventory();
  renderSkills();
  persist();
}

// ---------------------------------------------------------------- hud

function renderInventory(): void {
  slotsEl.replaceChildren();
  for (let i = 0; i < INVENTORY_SLOTS; i++) {
    const slot = room.inventory.find((s) => s.slot === i);
    const el = document.createElement('div');
    el.className = slot ? 'slot filled' : 'slot';
    if (slot) {
      const item = items.find((x) => x.id === slot.item);
      const name = document.createElement('span');
      name.className = 'slot-name';
      name.textContent = item?.name ?? slot.item;
      const count = document.createElement('span');
      count.className = 'slot-count';
      count.textContent = String(slot.count);
      el.append(name, count);
      el.title = `${slot.count} × ${item?.namePlural ?? slot.item} (stacks to ${item?.stackMax ?? 1})`;
    }
    slotsEl.append(el);
  }
}

function renderSkills(): void {
  skillsEl.replaceChildren();
  if (room.skills.size === 0) {
    const hint = document.createElement('p');
    hint.className = 'skills-empty';
    hint.textContent = 'Harvest a trant to begin learning.';
    skillsEl.append(hint);
    return;
  }
  for (const [id, xp] of room.skills) {
    const level = levelForXp(xp);
    const el = document.createElement('div');
    el.className = 'skill';
    el.title = skillBlurbs.get(id) ?? '';

    const head = document.createElement('div');
    head.className = 'skill-head';
    const name = document.createElement('span');
    name.className = 'skill-name';
    name.textContent = skillNames.get(id) ?? id;
    const lv = document.createElement('span');
    lv.className = 'skill-level';
    lv.textContent = `lv ${level}`;
    head.append(name, lv);

    const track = document.createElement('div');
    track.className = 'skill-track';
    const fill = document.createElement('div');
    fill.className = 'skill-fill';
    fill.style.width = `${Math.round(levelProgress(xp) * 100)}%`;
    track.append(fill);

    const xpEl = document.createElement('span');
    xpEl.className = 'skill-xp';
    xpEl.textContent = `${xp} xp`;

    el.append(head, track, xpEl);
    skillsEl.append(el);
  }
}

let toastSeq = 0;
function toast(message: string, kind: 'good' | 'bad' | 'xp'): void {
  const el = document.createElement('div');
  el.className = `toast toast-${kind}`;
  el.textContent = message;
  el.style.setProperty('--i', String(toastSeq++));
  toastsEl.append(el);
  setTimeout(() => el.classList.add('fading'), 2400);
  setTimeout(() => el.remove(), 3200);
}

// ---------------------------------------------------------------- loops

// Fixed-step simulation at the server's tick rate, so the physics behaves
// exactly as it does against the real server.
setInterval(() => {
  const dx = touchDir !== 0 ? touchDir : (held.has('right') ? 1 : 0) - (held.has('left') ? 1 : 0);
  const jump = jumpQueued || held.has('jump');
  jumpQueued = false;
  room.step({ dx, jump });
}, TICK_MS);

let lastPersist = Date.now();
function frame(ts: number): void {
  const time = ts / 1000;
  lastCam = renderer.camera(room.body.x, room.body.y);
  renderer.draw({
    cam: lastCam,
    playerX: room.body.x,
    playerY: room.body.y,
    facing: room.body.facing,
    walking: Math.abs(room.body.vx) > 8,
    time,
    readyAt: room.readyAt,
    now: Date.now(),
    hovered,
    reducedMotion,
  });

  if (Date.now() - lastPersist > 4000) {
    persist();
    lastPersist = Date.now();
  }
  requestAnimationFrame(frame);
}

renderInventory();
renderSkills();
requestAnimationFrame(frame);

// ---------------------------------------------------------------- helpers

function roman(n: number): string {
  const table: [number, string][] = [
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let out = '';
  let rest = n;
  for (const [v, glyph] of table) {
    while (rest >= v) {
      out += glyph;
      rest -= v;
    }
  }
  return out;
}
