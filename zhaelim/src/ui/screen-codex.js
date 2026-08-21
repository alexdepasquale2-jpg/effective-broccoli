import { el, button } from './dom.js';
import { CODEX, nextCodexUnlock, unlockedCodex } from '../culture/lore.js';
import { vessel } from '../core/storage.js';
import { glyphCanvas } from '../render/glyph.js';
import { uiTap } from '../audio/voice.js';

const FROM = {
  vel: { label: "Vel'zhu · the Plasmoid", color: '#ff6a2b' },
  kor: { label: "Kor'aen · the Blue Avian", color: '#4fb8ff' },
  sha: { label: "Sha'mira · the Pleiadian", color: '#c98dff' },
  all: { label: 'all three, in agreement', color: '#ffe9a8' },
};

/** THE CODEX — working notes left inside a toy by its engineers. */
export function screenCodex({ go }) {
  const state = vessel.all;
  const open = unlockedCodex(state);
  const next = nextCodexUnlock(state);
  const body = el('div', { class: 'codex-body' });

  function show(entry) {
    vessel.addUnique('loreSeen', entry.id);
    uiTap();
    body.replaceChildren(
      el('article', { class: 'entry' }, [
        el('div', { class: 'entry-glyph' }, [
          glyphCanvas(entry.id, 66, {
            source: entry.from === 'all' ? 'kor' : entry.from,
            color: FROM[entry.from].color,
            width: 1.8,
          }),
        ]),
        el('h2', { text: entry.title }),
        el('div', {
          class: 'entry-from',
          text: FROM[entry.from].label,
          style: { color: FROM[entry.from].color },
        }),
        ...entry.text.map((p) => el('p', { text: p })),
        button('close', () => body.replaceChildren(), { class: 'ghost' }),
      ]),
    );
    body.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const rows = CODEX.map((entry) => {
    const unlocked = open.includes(entry);
    const seen = state.loreSeen.includes(entry.id);
    const row = el(
      'button',
      {
        class: `lore-row ${unlocked ? '' : 'locked'} ${seen ? 'seen' : ''}`,
        type: 'button',
        disabled: !unlocked,
      },
      [
        el('span', {
          class: 'lore-dot',
          style: { background: unlocked ? FROM[entry.from].color : 'transparent' },
        }),
        el('span', { class: 'lore-title', text: unlocked ? entry.title : '— sealed —' }),
        el('span', {
          class: 'lore-from',
          text: unlocked ? FROM[entry.from].label.split(' · ')[0] : '',
        }),
      ],
    );
    if (unlocked) row.addEventListener('click', () => show(entry));
    return row;
  });

  return el('div', { class: 'screen scroll' }, [
    el('header', { class: 'crown small' }, [
      el('h1', { class: 'crown-title', text: 'The Codex' }),
      el('p', { class: 'crown-sub', text: `${open.length} of ${CODEX.length} recovered` }),
    ]),
    body,
    el('div', { class: 'lore-list' }, rows),
    next
      ? el('p', {
          class: 'footnote',
          text: next.unlock.song
            ? `The next note opens when you weave a song you have not yet woven.`
            : `The next note opens at ${next.unlock.braids} braids. You have ${state.braidsTotal}.`,
        })
      : el('p', { class: 'footnote', text: 'Nothing is left sealed.' }),
    button('to the weave', () => go('weave'), { class: 'ghost wide' }),
  ]);
}
