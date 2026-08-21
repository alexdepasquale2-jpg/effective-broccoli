import { el, button } from './dom.js';
import { SONGS, isUnlocked } from '../game/songs.js';
import { vessel } from '../core/storage.js';
import { glyphCanvas } from '../render/glyph.js';
import { saying } from '../culture/tongue.js';
import { activeBoon, riteAvailable } from '../culture/rites.js';
import { uiTap } from '../audio/voice.js';

/**
 * THE WEAVE — the songs, in the order the three agreed on.
 * Locked songs are shown, not hidden. The Kor consider a hidden path a lie of
 * omission; the Sha consider it rude.
 */
export function screenWeave({ go }) {
  const cleared = vessel.get('songsCleared');
  const today = saying(new Date().toDateString());
  const boon = activeBoon();

  const list = SONGS.map((song) => {
    const open = isUnlocked(song, cleared);
    const done = cleared[song.id];
    const row = el(
      'button',
      {
        class: `song ${open ? '' : 'locked'} ${done ? 'done' : ''}`,
        type: 'button',
        disabled: !open,
        'aria-label': `${song.title}, ${song.gloss}${done ? ', woven' : ''}`,
      },
      [
        el('div', { class: 'song-glyph' }, [
          glyphCanvas(song.id, 46, {
            source: ['vel', 'kor', 'sha'][song.index % 3],
            color: done ? '#ffe9a8' : '#9fb4e8',
            width: 1.6,
          }),
        ]),
        el('div', { class: 'song-body' }, [
          el('div', { class: 'song-title', text: song.title }),
          el('div', { class: 'song-gloss', text: song.gloss }),
          el('div', {
            class: 'song-meta',
            text: open
              ? `${song.seeds} sleeping · ${song.breaths} breaths`
              : 'weave the song before it',
          }),
        ]),
        el('div', {
          class: 'song-mark',
          text: done ? `${done.braided}/${song.seeds}` : open ? '' : '·',
        }),
      ],
    );
    if (open)
      row.addEventListener('click', () => {
        uiTap();
        go('play', { songId: song.id });
      });
    return row;
  });

  return el('div', { class: 'screen scroll' }, [
    el('header', { class: 'crown' }, [
      el('h1', { class: 'crown-title', text: "Zha'elim" }),
      el('p', { class: 'crown-sub', text: 'the game that plays you back' }),
    ]),
    el('div', { class: 'saying' }, [
      el('div', { class: 'saying-written', text: today.written }),
      el('div', { class: 'saying-loose', text: today.loose }),
    ]),
    boon > 0
      ? el('div', { class: 'boon', text: `The rite is kept today. +${boon} ma at every opening.` })
      : riteAvailable()
        ? button('The rite is unkept today →', () => go('rite'), { class: 'boon boon-call' })
        : null,
    el('div', { class: 'song-list' }, list),
    el('p', {
      class: 'footnote',
      text: 'Every song here was proved solvable before it was allowed in.',
    }),
  ]);
}
