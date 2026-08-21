import { el, button } from './dom.js';
import { key } from '../core/hex.js';
import { CASTES, CASTE_IDS } from '../game/castes.js';
import { CELL } from '../game/lattice.js';
import { songById } from '../game/songs.js';
import { advance, canCast, cast, createSim } from '../game/simulation.js';
import { nextCast } from '../game/solver.js';
import { createView } from '../render/lattice-view.js';
import { vessel } from '../core/storage.js';
import { tap, PATTERNS } from '../core/haptics.js';
import { activeBoon } from '../culture/rites.js';
import { PHRASES } from '../culture/tongue.js';
import * as voice from '../audio/voice.js';

/** One breath, in human milliseconds. The Kor rounded it; the Sha chose it. */
const BREATH_MS = 2100;

export function screenPlay({ go, songId }) {
  const song = songById(songId);
  const boon = activeBoon();
  let sim = createSim({ ...song, ma: (song.ma ?? 6) + boon });

  let flowing = false;
  let last = 0;
  let raf = 0;
  let selected = 'sha';
  let aim = null;
  let hint = null;
  let hintUntil = 0;
  let closed = false;

  const canvas = el('canvas', { class: 'lattice', 'aria-label': 'the lattice' });
  const view = createView(canvas);

  // — head —
  const breathsOut = el('b', { text: String(sim.breaths) });
  const maOut = el('b', { text: String(sim.ma) });
  const seedsOut = el('b', { text: `0/${sim.seedsTotal}` });
  const head = el('header', { class: 'play-head' }, [
    button('‹', () => go('weave'), { class: 'ghost back', 'aria-label': 'leave the song' }),
    el('div', { class: 'play-title' }, [
      el('span', { class: 'pt-name', text: song.title }),
      el('span', { class: 'pt-gloss', text: song.gloss }),
    ]),
    el('div', { class: 'play-stats' }, [
      el('span', { class: 'stat' }, ['ilu ', breathsOut]),
      el('span', { class: 'stat' }, ['ma ', maOut]),
      el('span', { class: 'stat' }, ['nuun ', seedsOut]),
    ]),
  ]);

  // — the whisper: the song's one piece of teaching —
  const whisper = el('div', { class: 'whisper' }, [
    el('p', { text: song.whisper }),
    button(
      'begin',
      () => {
        whisper.classList.add('gone');
        setFlow(true);
      },
      { class: 'primary' },
    ),
  ]);

  // — tongues —
  const chips = CASTE_IDS.map((id) => {
    const c = CASTES[id];
    const chip = el('button', { class: `chip chip-${id}`, type: 'button', 'data-caste': id }, [
      el('span', { class: 'chip-name', text: c.short }),
      el('span', { class: 'chip-meta', text: `reach ${c.reach} · ${c.cost} ma` }),
    ]);
    chip.addEventListener('click', () => {
      selected = id;
      syncChips();
      voice.uiTap();
      tap(4);
    });
    return chip;
  });
  const syncChips = () => {
    chips.forEach((chip) => {
      const id = chip.dataset.caste;
      chip.classList.toggle('on', id === selected);
      chip.classList.toggle('poor', sim.ma < CASTES[id].cost);
    });
  };

  const flowBtn = button('flow', () => setFlow(!flowing), { class: 'flow' });
  const stepBtn = button(
    'breathe',
    () => {
      if (!flowing) pulse();
    },
    { class: 'step' },
  );
  const hintBtn = button('ask the Kor', askKor, { class: 'ghost' });

  const foot = el('div', { class: 'play-foot' }, [
    el('div', { class: 'chips' }, chips),
    el('div', { class: 'controls' }, [flowBtn, stepBtn, hintBtn]),
  ]);

  const overlay = el('div', { class: 'overlay hidden' });
  const stage = el('div', { class: 'stage' }, [canvas, whisper, overlay]);
  const node = el('div', { class: 'screen play' }, [head, stage, foot]);

  function setFlow(on) {
    flowing = on;
    last = performance.now();
    flowBtn.textContent = on ? 'hold' : 'flow';
    flowBtn.classList.toggle('holding', !on);
    node.classList.toggle('is-holding', !on);
    stepBtn.disabled = on;
  }
  setFlow(false);

  function syncStats() {
    breathsOut.textContent = String(Math.max(0, sim.breaths));
    maOut.textContent = String(sim.ma);
    seedsOut.textContent = `${sim.braided}/${sim.seedsTotal}`;
    node.classList.toggle('thin', sim.breaths <= 6);
    syncChips();
  }

  function pulse() {
    const events = advance(sim);
    voice.pulseTick(sim.pulse);
    for (const e of events) {
      if (e.type === 'braid') {
        view.spark(e.q, e.r, '#ffe9a8', 22, 1.6);
        voice.braidChord();
        tap(PATTERNS.braid);
        vessel.set('braidsTotal', vessel.get('braidsTotal') + 1);
      } else if (e.type === 'chime') {
        view.spark(e.q, e.r, CASTES[e.castes[0]].color, 8, 0.8);
        voice.chimeTone(e.castes);
        tap(PATTERNS.chime);
        vessel.set('chimesTotal', vessel.get('chimesTotal') + 1);
      } else if (e.type === 'relay') {
        view.spark(e.q, e.r, CASTES[e.caste].color, 6, 0.6);
      } else if (e.type === 'woven') {
        finish(true);
      } else if (e.type === 'stilled') {
        finish(false);
      }
    }
    syncStats();
  }

  function finish(won) {
    if (closed) return;
    closed = true;
    setFlow(false);
    vessel.update((v) => {
      v.breathsTaken += sim.pulse;
      if (won) {
        const prev = v.songsCleared[song.id];
        const best = prev ? Math.max(prev.breathsLeft ?? 0, sim.breaths) : sim.breaths;
        v.songsCleared[song.id] = { braided: sim.braided, breathsLeft: best, casts: sim.casts };
      }
    });
    if (won) {
      voice.wovenChord();
      tap(PATTERNS.won);
    } else {
      voice.stilledTone();
      tap(PATTERNS.fail);
    }
    const p = won ? PHRASES.woven : PHRASES.stilled;
    overlay.replaceChildren(
      el('div', { class: `card ${won ? 'won' : 'lost'}` }, [
        el('div', { class: 'card-written', text: p.written }),
        el('div', { class: 'card-loose', text: p.loose }),
        el('div', {
          class: 'card-stats',
          text: won
            ? `${sim.braided} woken · ${sim.casts} casts · ${sim.breaths} breaths unspent`
            : `${sim.braided} of ${sim.seedsTotal} woken`,
        }),
        el('div', { class: 'card-row' }, [
          button('again', restart, { class: 'primary' }),
          button('the weave', () => go('weave'), { class: 'ghost' }),
        ]),
      ]),
    );
    overlay.classList.remove('hidden');
  }

  function restart() {
    sim = createSim({ ...song, ma: (song.ma ?? 6) + boon });
    closed = false;
    hint = null;
    overlay.classList.add('hidden');
    view.resize(sim.cells);
    syncStats();
    setFlow(true);
  }

  function askKor() {
    if (sim.status !== 'weaving') return;
    const res = nextCast(sim);
    if (!res || !res.due.length) {
      hintBtn.textContent = 'the Kor are silent';
      setTimeout(() => (hintBtn.textContent = 'ask the Kor'), 1600);
      return;
    }
    hint = res.due;
    hintUntil = performance.now() + 4200;
    selected = res.due[0].caste;
    syncChips();
    voice.uiTap(true);
  }

  // — casting: hold to aim, release to let go —
  const pos = (e) => {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };
  const aimAt = (e) => {
    const p = pos(e);
    const cell = view.cellAt(p.x, p.y);
    const found = sim.cells.get(key(cell.q, cell.r));
    aim = found && found.type !== CELL.VEIL ? { q: cell.q, r: cell.r } : null;
  };
  let aiming = null;
  canvas.addEventListener('pointerdown', (e) => {
    if (sim.status !== 'weaving') return;
    aiming = e.pointerId;
    canvas.setPointerCapture(e.pointerId);
    aimAt(e);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (aiming !== e.pointerId) return;
    aimAt(e);
  });
  const release = (e) => {
    if (e && aiming !== e.pointerId) return;
    aiming = null;
    if (aim && sim.status === 'weaving') {
      const check = canCast(sim, aim.q, aim.r, selected);
      if (check.ok) {
        cast(sim, aim.q, aim.r, selected);
        view.spark(aim.q, aim.r, CASTES[selected].color, 12, 1.1);
        voice.castTone(selected);
        tap(PATTERNS.cast);
        hint = null;
        if (!flowing && !whisper.classList.contains('gone')) whisper.classList.add('gone');
        syncStats();
      } else {
        flashWhy(check.why);
      }
    }
    aim = null;
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', () => {
    aiming = null;
    aim = null;
  });

  const why = el('div', { class: 'why' });
  stage.append(why);
  let whyTimer = 0;
  function flashWhy(text) {
    why.textContent = text;
    why.classList.add('show');
    clearTimeout(whyTimer);
    whyTimer = setTimeout(() => why.classList.remove('show'), 1400);
  }

  // — the loop —
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (flowing && sim.status === 'weaving') {
      if (now - last >= BREATH_MS) {
        last = now;
        pulse();
      }
    }
    const t = flowing && sim.status === 'weaving' ? Math.min(1, (now - last) / BREATH_MS) : 0;
    if (hint && now > hintUntil) hint = null;
    view.draw(sim, { t, aim, caste: selected, hint, time: now, calm: vessel.get('reducedMotion') });
  }

  const onResize = () => view.resize(sim.cells);
  globalThis.addEventListener('resize', onResize);

  requestAnimationFrame(() => {
    view.resize(sim.cells);
    syncStats();
    voice.startDrone();
    last = performance.now();
    raf = requestAnimationFrame(frame);
  });

  return {
    node,
    dispose() {
      cancelAnimationFrame(raf);
      clearTimeout(whyTimer);
      globalThis.removeEventListener('resize', onResize);
      voice.stopDrone();
    },
  };
}
