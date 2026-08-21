import { el, button, clear } from './dom.js';
import { ALL_WORDS, ASPECTS, RINGS, ROOTS, SEALS, SOURCES, VOICES } from '../culture/lexicon.js';
import { compose, saying } from '../culture/tongue.js';
import { drawGlyph } from '../render/glyph.js';
import { vessel } from '../core/storage.js';
import { speakWord, uiTap } from '../audio/voice.js';

const SOURCE_COLOR = { vel: '#ff6a2b', kor: '#4fb8ff', sha: '#c98dff' };

/**
 * THE TONGUE — a dictionary you can talk back to.
 *
 * Tap a root to add it. Tap a voice or an aspect to bend the word you added
 * last. Tap a seal to finish, because in Ilu'thaan an unsealed phrase is
 * considered eavesdropping rather than speech.
 */
export function screenTongue() {
  let units = [];
  let seal = null;

  const glyphRow = el('canvas', { class: 'glyph-row' });
  const written = el('div', { class: 'phrase-written' });
  const literal = el('div', { class: 'phrase-literal' });
  const loose = el('div', { class: 'phrase-loose' });

  function redraw() {
    const out = compose(units, seal);
    written.textContent = out.written || '—';
    literal.textContent = out.literal || 'tap a root below';
    loose.textContent = out.loose || '';

    const dpr = Math.min(3, globalThis.devicePixelRatio || 1);
    const w = glyphRow.clientWidth || 320;
    const h = 96;
    glyphRow.width = w * dpr;
    glyphRow.height = h * dpr;
    glyphRow.style.height = `${h}px`;
    const ctx = glyphRow.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const marks = out.parts.map((p) => ({ word: p.written, source: p.source }));
    if (out.seal) marks.push({ word: out.seal.word, source: out.seal.source });
    if (!marks.length) return;
    const step = w / (marks.length + 1);
    marks.forEach((m, i) => {
      drawGlyph(ctx, m.word, step * (i + 1), h / 2, Math.min(30, step * 0.34), {
        source: m.source,
        color: SOURCE_COLOR[m.source],
        width: 1.8,
      });
    });
  }

  const addRoot = (w) => {
    if (units.length >= 3) units = units.slice(0, 2);
    units.push({ root: w.word });
    vessel.addUnique('wordsHeard', w.word);
    speakWord(w.word);
    redraw();
  };
  const bend = (kind, value) => {
    if (!units.length) return;
    units[units.length - 1][kind] = units[units.length - 1][kind] === value ? undefined : value;
    uiTap();
    redraw();
  };

  const grammarBar = el('div', { class: 'grammar' }, [
    el('div', { class: 'grammar-group' }, [
      el('span', { class: 'grammar-label', text: 'voice' }),
      ...VOICES.map((v) =>
        button(`${v.word}'`, () => bend('voice', v.word), {
          class: `pill p-${v.source}`,
          title: v.gloss,
        }),
      ),
    ]),
    el('div', { class: 'grammar-group' }, [
      el('span', { class: 'grammar-label', text: 'aspect' }),
      ...ASPECTS.map((a) =>
        button(`-${a.word}`, () => bend('aspect', a.word), {
          class: `pill p-${a.source}`,
          title: a.gloss,
        }),
      ),
    ]),
    el('div', { class: 'grammar-group' }, [
      el('span', { class: 'grammar-label', text: 'seal' }),
      ...SEALS.map((s) =>
        button(
          s.word,
          () => {
            seal = seal === s.word ? null : s.word;
            uiTap();
            redraw();
          },
          { class: `pill p-${s.source}`, title: s.gloss },
        ),
      ),
    ]),
  ]);

  const lexBody = el('div', { class: 'lex-body' });
  function showRing(ringId) {
    clear(lexBody);
    const words = ROOTS.filter((w) => w.ring === ringId);
    for (const w of words) {
      lexBody.append(
        el('button', { class: 'lex-row', type: 'button', onclick: () => addRoot(w) }, [
          el('span', { class: 'lex-word', text: w.word, style: { color: SOURCE_COLOR[w.source] } }),
          el('span', { class: 'lex-gloss', text: w.gloss }),
          el('span', { class: 'lex-src', text: SOURCES[w.source].name }),
        ]),
      );
    }
  }

  const tabs = el(
    'div',
    { class: 'ring-tabs' },
    RINGS.map((ring, i) =>
      button(
        ring.name,
        (e) => {
          [...e.currentTarget.parentNode.children].forEach((n) => n.classList.remove('on'));
          e.currentTarget.classList.add('on');
          showRing(ring.id);
          uiTap();
        },
        { class: `ring-tab ${i === 0 ? 'on' : ''}` },
      ),
    ),
  );

  showRing(RINGS[0].id);

  const heard = vessel.get('wordsHeard').length;
  const node = el('div', { class: 'screen scroll' }, [
    el('header', { class: 'crown small' }, [
      el('h1', { class: 'crown-title', text: "Ilu'thaan" }),
      el('p', { class: 'crown-sub', text: 'the between-speech · three mouths, one treaty' }),
    ]),
    el('div', { class: 'phrase' }, [
      glyphRow,
      written,
      literal,
      loose,
      el('div', { class: 'phrase-row' }, [
        button(
          'unsay the last',
          () => {
            units.pop();
            redraw();
          },
          { class: 'ghost' },
        ),
        button(
          'clear',
          () => {
            units = [];
            seal = null;
            redraw();
          },
          { class: 'ghost' },
        ),
        button(
          'a saying surfaces',
          () => {
            const s = saying(Date.now());
            units = s.parts.map((p) => ({ root: p.root, voice: p.voice, aspect: p.aspect }));
            seal = s.seal?.word ?? null;
            speakWord(s.written);
            redraw();
          },
          { class: 'primary' },
        ),
      ]),
    ]),
    grammarBar,
    tabs,
    lexBody,
    el('p', {
      class: 'footnote',
      text: `${heard} of ${ALL_WORDS.length} words have passed through your hands. Keep your accent.`,
    }),
  ]);

  requestAnimationFrame(redraw);
  return node;
}
