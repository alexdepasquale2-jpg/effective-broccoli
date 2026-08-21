import { el, button } from './dom.js';
import { vessel } from '../core/storage.js';
import { drawGlyph } from '../render/glyph.js';
import { PHRASES } from '../culture/tongue.js';
import * as voice from '../audio/voice.js';

/**
 * THE THRESHOLD — shown once, on the first opening.
 *
 * The three peoples wrote this together and then spent longer editing it than
 * they spent on the rules. The Vel wanted one line. The Kor wanted a proof.
 * What survived is four beats and an unglamorous promise.
 */
const BEATS = [
  {
    written: "ael lae'eth thaan",
    lines: [
      'You have opened something that three peoples built together, a long way from here, on purpose, for you.',
      'Nothing in it is urgent.',
    ],
  },
  {
    written: 'vel · kor · mira',
    lines: [
      'The Vel live in the loud part of stars and last only moments. They gave the near, quick tongue.',
      'The Kor hold form and will not be hurried. They gave the true one.',
      'The Sha came from seven close stars your ancestors named. They gave the one that reaches furthest.',
    ],
  },
  {
    written: "braia korath'eth",
    lines: [
      'The weave has one rule. A sleeping mind wakes when all three tongues arrive on it in the same breath.',
      'Not two. Not three, near enough. The same breath.',
      'Everything else in here is that rule wearing a different hat.',
    ],
  },
  {
    written: "krannu ael'o' zhaa",
    lines: [
      'What this is for, stated plainly, because vagueness here would be a kind of theft:',
      'it is practice at holding several separate arrivals in your attention at once, being patient with all of them, and starting again without contempt for yourself when the timing was wrong.',
      'That is the whole mechanism. There is nothing else in here.',
      'You can put it down at any time. It will not follow you.',
    ],
  },
];

export function screenThreshold({ go }) {
  let i = 0;
  const mark = el('canvas', { class: 'threshold-mark', width: 220, height: 220 });
  const written = el('div', { class: 'threshold-written' });
  const body = el('div', { class: 'threshold-body' });
  const next = button('go on', () => step(1), { class: 'primary wide' });

  function paint() {
    const beat = BEATS[i];
    const dpr = Math.min(3, globalThis.devicePixelRatio || 1);
    mark.width = 220 * dpr;
    mark.height = 220 * dpr;
    mark.style.width = '220px';
    mark.style.height = '220px';
    const ctx = mark.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, 220, 220);
    const colors = ['#c98dff', '#4fb8ff', '#ff6a2b', '#ffe9a8'];
    drawGlyph(ctx, beat.written, 110, 110, 72, {
      source: ['sha', 'kor', 'vel', 'kor'][i],
      color: colors[i],
      width: 2.2,
    });
    written.textContent = beat.written;
    body.replaceChildren(...beat.lines.map((l) => el('p', { text: l })));
    next.textContent = i === BEATS.length - 1 ? 'open the weave' : 'go on';
  }

  function step(d) {
    voice.wake();
    voice.startDrone();
    voice.uiTap(true);
    i += d;
    if (i >= BEATS.length) {
      vessel.set('seenPrologue', true);
      go('weave');
      return;
    }
    paint();
  }

  paint();
  return el('div', { class: 'screen threshold' }, [
    el('div', { class: 'threshold-top' }, [
      el('h1', { class: 'threshold-title', text: "Zha'elim" }),
      el('p', { class: 'threshold-sub', text: PHRASES.greet.loose }),
    ]),
    mark,
    written,
    body,
    next,
    button(
      'skip the threshold',
      () => {
        vessel.set('seenPrologue', true);
        go('weave');
      },
      { class: 'ghost' },
    ),
  ]);
}
