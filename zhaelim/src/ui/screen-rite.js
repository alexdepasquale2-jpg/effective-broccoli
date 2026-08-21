import { el, button } from './dom.js';
import {
  CYCLES,
  PHASES,
  activeBoon,
  completeRite,
  riteAt,
  riteAvailable,
} from '../culture/rites.js';
import { vessel } from '../core/storage.js';
import { PHRASES } from '../culture/tongue.js';
import * as voice from '../audio/voice.js';

/**
 * THE LONG INHALE. Seventy seconds. Not a game, and deliberately not scored.
 */
export function screenRite({ go }) {
  const canvas = el('canvas', { class: 'rite-canvas' });
  const word = el('div', { class: 'rite-word' });
  const say = el('div', { class: 'rite-say' });
  const countOut = el('div', { class: 'rite-count' });
  const result = el('div', { class: 'rite-result' });

  let running = false;
  let startedAt = 0;
  let raf = 0;
  let lastPhase = null;

  const startBtn = button(
    riteAvailable() ? 'begin the rite' : 'sit again',
    () => {
      running = true;
      startedAt = performance.now();
      lastPhase = null;
      result.replaceChildren();
      startBtn.classList.add('hidden');
      voice.wake();
      voice.startDrone();
    },
    { class: 'primary wide' },
  );

  function sizeCanvas() {
    const dpr = Math.min(3, globalThis.devicePixelRatio || 1);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const ctx = canvas.getContext('2d');
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    // The start button leaves the flow when the rite begins, so the stage grows
    // under the canvas. Re-size here, or the breath comes out an egg.
    const dpr = Math.min(3, globalThis.devicePixelRatio || 1);
    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) sizeCanvas();
    const state = running
      ? riteAt(now - startedAt)
      : { scale: 0.34, phase: PHASES[3], cycle: 0, progress: 0, done: false };

    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    const R = Math.min(w, h) * 0.42;

    // the ring of the whole rite: a faint track, filled once as it goes
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(150,178,255,0.14)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * state.progress);
    ctx.strokeStyle = 'rgba(201,141,255,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // the breath itself
    const r = R * 0.86 * state.scale;
    const g = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
    g.addColorStop(0, 'rgba(201,141,255,0.35)');
    g.addColorStop(1, 'rgba(79,184,255,0.05)');
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(232,234,246,0.6)';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    if (running) {
      if (state.phase !== lastPhase) {
        lastPhase = state.phase;
        voice.breathTone(state.phase.id);
        word.textContent = `${state.phase.word} — ${state.phase.gloss}`;
        say.textContent = state.phase.say;
      }
      countOut.textContent = `${Math.min(CYCLES, state.cycle + 1)} of ${CYCLES}`;
      if (state.done) finish();
    }
  }

  function finish() {
    running = false;
    const res = completeRite();
    voice.wovenChord();
    result.replaceChildren(
      el('div', { class: 'card' }, [
        el('div', { class: 'card-written', text: PHRASES.rite.written }),
        el('div', { class: 'card-loose', text: PHRASES.rite.loose }),
        el('div', {
          class: 'card-stats',
          text: res.alreadyDone
            ? 'You had already kept the rite today. It still counted, to you.'
            : `Kept ${res.streak} day${res.streak === 1 ? '' : 's'} running. +${res.boon} ma at every opening today.`,
        }),
        button('to the weave', () => go('weave'), { class: 'primary' }),
      ]),
    );
    startBtn.classList.remove('hidden');
    startBtn.textContent = 'sit again';
    word.textContent = '';
    say.textContent = '';
  }

  const streak = vessel.get('riteStreak');
  const node = el('div', { class: 'screen rite' }, [
    el('header', { class: 'crown small' }, [
      el('h1', { class: 'crown-title', text: "Rhu'aelin" }),
      el('p', {
        class: 'crown-sub',
        text: 'the long inhale · four in, two held, six out, two empty',
      }),
    ]),
    el('div', { class: 'rite-stage' }, [canvas]),
    word,
    say,
    countOut,
    result,
    startBtn,
    el('p', {
      class: 'footnote',
      text: activeBoon()
        ? `Kept today. Streak ${streak}. The boon caps at three, on purpose.`
        : `About seventy seconds. Nothing in the vessel requires it.`,
    }),
  ]);

  requestAnimationFrame(() => {
    sizeCanvas();
    raf = requestAnimationFrame(frame);
  });
  const onResize = () => sizeCanvas();
  globalThis.addEventListener('resize', onResize);

  return {
    node,
    dispose() {
      cancelAnimationFrame(raf);
      globalThis.removeEventListener('resize', onResize);
      voice.stopDrone();
    },
  };
}
