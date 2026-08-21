import { hash, rng, pick } from '../core/rng.js';
import { ASPECTS, ROOTS, SEALS, VOICES, wordByName } from './lexicon.js';

/**
 * The grammar of Ilu'thaan, such as it is.
 *
 *   unit   = [voice'] root [aspect]
 *   phrase = TOPIC · MOTION · SEAL
 *
 * A phrase names what is being spoken about, then what it is doing, then how
 * the speaker wants it received. There is no word for "no" and no punctuation;
 * the seal does that work. Written Ilu'thaan spirals outward from the centre
 * of the page, which is why their books are square and their margins are round.
 */

const VOICE_FRAME = {
  ve: (g) => `${g}, acted`,
  ko: (g) => `${g}, known`,
  sha: (g) => `${g}, held`,
};

const ASPECT_FRAME = {
  eth: (g) => `${g} becoming`,
  au: (g) => `${g} remembered`,
  im: (g) => `many ${g}`,
  ka: (g) => `${g}?`,
  un: (g) => `${g} not yet`,
  "o'": (g) => `${g}, whole`,
};

/** Assemble one written unit: ve'nueleth — "to wake gently, acted, becoming". */
export function speak(root, { voice, aspect } = {}) {
  const r = typeof root === 'string' ? wordByName(root) : root;
  if (!r) return null;
  const written = `${voice ? `${voice}'` : ''}${r.word}${aspect ?? ''}`;
  let gloss = r.gloss;
  if (voice && VOICE_FRAME[voice]) gloss = VOICE_FRAME[voice](gloss);
  if (aspect && ASPECT_FRAME[aspect]) gloss = ASPECT_FRAME[aspect](gloss);
  return { written, gloss, source: r.source, root: r.word, voice, aspect };
}

/**
 * A phrase is up to three units and a seal. Returns both the written form and
 * two readings: the literal gloss the Kor would accept, and the loose one the
 * Sha would prefer.
 */
export function compose(units, sealWord) {
  const parts = units.map((u) => speak(u.root, u)).filter(Boolean);
  const seal = SEALS.find((s) => s.word === sealWord) ?? null;
  const written = [...parts.map((p) => p.written), seal?.word].filter(Boolean).join(' ');
  const literal = parts.map((p) => p.gloss).join(' · ') + (seal ? ` — ${seal.gloss}` : '');

  let loose = '';
  if (parts.length === 1) loose = capitalise(short(parts[0].gloss));
  else if (parts.length >= 2) {
    const [topic, ...rest] = parts;
    loose = `Of ${short(topic.gloss)}: ${rest.map((p) => short(p.gloss)).join(', ')}`;
  }
  if (seal) loose += sealTail(seal.word);

  return { written, literal, loose: loose.trim(), parts, seal };
}

function sealTail(word) {
  switch (word) {
    case 'zhaa':
      return '. And that is so.';
    case 'lei':
      return '. And that is felt.';
    case 'korun':
      return '. And that is asked of you.';
    case 'thaan':
      return '. And that is still between us.';
    default:
      return '.';
  }
}

const capitalise = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Loose readings take only the first sense of a word. The Kor find this
 * appalling and the Sha find the Kor exhausting, so both practices survive.
 */
const short = (gloss) => gloss.split(' / ')[0];

/**
 * Sayings surface on their own. The Vel believe a language that cannot
 * surprise its speakers has stopped being a language and become a filing
 * system, so the vessel is allowed to say things nobody wrote.
 */
export function saying(seed) {
  const next = rng(hash(String(seed)));
  const roots = ROOTS.filter((r) => r.ring !== 'grammar');
  const a = pick(next, roots);
  const b = pick(
    next,
    roots.filter((r) => r.word !== a.word),
  );
  const units = [
    { root: a.word, voice: next() < 0.4 ? pick(next, VOICES).word : undefined },
    {
      root: b.word,
      voice: next() < 0.35 ? pick(next, VOICES).word : undefined,
      aspect: next() < 0.65 ? pick(next, ASPECTS).word : undefined,
    },
  ];
  return compose(units, pick(next, SEALS).word);
}

/**
 * Phrases the vessel actually uses on you. Authored, not generated — the three
 * peoples were clear that a machine should not improvise a condolence.
 */
export const PHRASES = {
  greet: {
    written: "ael lae'eth thaan",
    literal: 'you · to arrive, becoming — it is between',
    loose: 'You are arriving. It is still between us.',
  },
  firstCast: {
    written: 'tzek zhaa',
    literal: 'to cast, to let go of — it is so',
    loose: 'Let it go. That is the whole of it.',
  },
  chime: {
    written: 'krin thaan',
    literal: 'two where three were needed — it is between',
    loose: 'Two where three were needed. Not nothing.',
  },
  braid: {
    written: "braia ko'lae zhaa",
    literal: 'braid · to arrive, known — it is so',
    loose: 'A braid. It arrived, and we all saw it.',
  },
  woven: {
    written: "korath sha'ssan o' lei",
    literal: 'lattice · to open, held, whole — it is felt',
    loose: 'The lattice opened all the way, and we felt it.',
  },
  stilled: {
    written: "ilu vaan'un lei",
    literal: 'breath · to refuse without unkindness, not yet — it is felt',
    loose: 'The breath ran out. Nothing refused you. Begin again.',
  },
  rite: {
    written: "rhu aelin'eth lei",
    literal: 'to hold still on purpose · attention given freely, becoming — it is felt',
    loose: 'Be still on purpose. Attention is becoming something.',
  },
  farewell: {
    written: "zhen rhu'au ael kaan zhaa",
    literal: 'I · to hold still, remembered · you · to go outward — it is so',
    loose: 'I stayed. You went outward. That is how it should be.',
  },
};
