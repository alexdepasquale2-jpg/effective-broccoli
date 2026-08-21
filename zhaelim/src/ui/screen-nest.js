import { el, button } from './dom.js';
import { vessel } from '../core/storage.js';
import { SONGS } from '../game/songs.js';
import { CODEX } from '../culture/lore.js';
import { ALL_WORDS } from '../culture/lexicon.js';
import { PHRASES } from '../culture/tongue.js';
import { hash, rng, range } from '../core/rng.js';
import { CASTES, CASTE_IDS } from '../game/castes.js';
import { setMuted, isMuted } from '../audio/voice.js';

/**
 * THE NEST — not a leaderboard. A record that something happened and someone
 * was there for it. Every seed you have ever woken is a bloom here, and the
 * blooms are drawn from the count itself, so the garden is literally made of
 * what you did.
 */
export function screenNest({ go }) {
  const v = vessel.all;
  const canvas = el('canvas', { class: 'nest-canvas' });
  let raf = 0;

  function draw(now) {
    raf = requestAnimationFrame(draw);
    const dpr = Math.min(3, globalThis.devicePixelRatio || 1);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== w * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const count = Math.min(160, v.braidsTotal);
    const next = rng(hash(`nest:${v.braidsTotal}`));
    const cx = w / 2;
    const cy = h / 2;
    const calm = v.reducedMotion ? 0 : 1;

    for (let i = 0; i < count; i++) {
      // phyllotaxis — the arrangement the Kor call "the only fair way to crowd"
      const a = i * 2.39996 + now * 0.00004 * calm;
      const rad = Math.sqrt(i / Math.max(1, count)) * Math.min(w, h) * 0.44;
      const x = cx + Math.cos(a) * rad;
      const y = cy + Math.sin(a) * rad;
      const caste = CASTE_IDS[i % 3];
      const size = range(next, 2, 5.5) * (0.7 + 0.3 * Math.sin(now * 0.001 + i));
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = CASTES[caste].glow;
      ctx.fill();
      if (i % 7 === 0) {
        ctx.beginPath();
        ctx.arc(x, y, size * 2.6, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,233,168,0.16)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    if (count === 0) {
      ctx.fillStyle = 'rgba(232,234,246,0.4)';
      ctx.font = '13px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('nothing woken yet — the nest is patient', cx, cy);
    }
  }

  const woven = Object.keys(v.songsCleared).length;
  const stats = [
    ['braia', v.braidsTotal, 'seeds woken, all told'],
    ['krin', v.chimesTotal, 'chimes — two where three were needed'],
    ['ilu', v.breathsTaken, 'breaths spent here'],
    ['aenlum', `${woven}/${SONGS.length}`, 'songs woven'],
    ['sseda', `${v.loreSeen.length}/${CODEX.length}`, 'notes read'],
    ['thaan', `${v.wordsHeard.length}/${ALL_WORDS.length}`, 'words handled'],
    ['rhu', v.riteStreak, 'days of the rite, running'],
  ].map(([word, value, gloss]) =>
    el('div', { class: 'stat-row' }, [
      el('span', { class: 'stat-word', text: word }),
      el('b', { class: 'stat-value', text: String(value) }),
      el('span', { class: 'stat-gloss', text: gloss }),
    ]),
  );

  const muteBtn = button(
    isMuted() ? 'voice: off' : 'voice: on',
    (e) => {
      const m = setMuted(!isMuted());
      e.currentTarget.textContent = m ? 'voice: off' : 'voice: on';
    },
    { class: 'ghost' },
  );

  const motionBtn = button(
    v.reducedMotion ? 'motion: calm' : 'motion: full',
    (e) => {
      const on = !vessel.get('reducedMotion');
      vessel.set('reducedMotion', on);
      e.currentTarget.textContent = on ? 'motion: calm' : 'motion: full';
    },
    { class: 'ghost' },
  );

  const node = el('div', { class: 'screen scroll' }, [
    el('header', { class: 'crown small' }, [
      el('h1', { class: 'crown-title', text: 'The Nest' }),
      el('p', { class: 'crown-sub', text: 'kept, not scored' }),
    ]),
    el('div', { class: 'nest-stage' }, [canvas]),
    el('div', { class: 'stats' }, stats),
    el('div', { class: 'phrase small' }, [
      el('div', { class: 'phrase-written', text: PHRASES.farewell.written }),
      el('div', { class: 'phrase-loose', text: PHRASES.farewell.loose }),
    ]),
    el('div', { class: 'settings' }, [
      muteBtn,
      motionBtn,
      button(
        'forget everything',
        () => {
          if (confirm('Unmake the vessel? Every braid, note and word will be forgotten.')) {
            vessel.reset();
            go('weave');
          }
        },
        { class: 'ghost danger' },
      ),
    ]),
    el('p', {
      class: 'footnote',
      text: 'Nothing here leaves your device. There is no account and nobody is counting but you.',
    }),
  ]);

  requestAnimationFrame((t) => (raf = requestAnimationFrame(() => draw(t))));
  return { node, dispose: () => cancelAnimationFrame(raf) };
}
