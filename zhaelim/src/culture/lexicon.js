/**
 * ILU'THAAN — "the between-speech".
 *
 * Not one people's language. When the three met, each found the others'
 * mouths impossible: the Vel cannot hold a vowel, the Kor will not shorten a
 * true one, and the Sha refuse to end a word before the feeling in it is
 * finished. So they built a third tongue out of the parts each could survive.
 *
 * Every word here carries the mark of the mouth it came from. Speakers say you
 * can hear the seam. They consider the seam the best part.
 */

export const SOURCES = {
  vel: { name: "Vel'zhu", people: 'Plasmoid', trait: 'hard, short, arrives already true' },
  kor: { name: "Kor'aen", people: 'Blue Avian', trait: 'open, sung, will not be hurried' },
  sha: {
    name: "Sha'mira",
    people: 'Pleiadian',
    trait: 'liquid, trailing, ends when the feeling does',
  },
};

/** Prefixes: which mouth is speaking through you right now. */
export const VOICES = [
  { word: 've', gloss: 'done / acted', source: 'vel', note: 'the speaker has already moved' },
  { word: 'ko', gloss: 'seen / known', source: 'kor', note: 'the speaker has counted it' },
  { word: 'sha', gloss: 'felt / held', source: 'sha', note: 'the speaker is still carrying it' },
];

/** Suffixes: what tense would be, if these people had agreed on time. */
export const ASPECTS = [
  { word: 'eth', gloss: 'becoming', source: 'kor', note: 'underway, not yet itself' },
  { word: 'au', gloss: 'remembered', source: 'sha', note: 'true once, and therefore true' },
  { word: 'im', gloss: 'many / we', source: 'sha', note: 'more than one, counted as one' },
  { word: 'ka', gloss: 'asking', source: 'kor', note: 'turns any word into a door' },
  { word: 'un', gloss: 'not yet', source: 'vel', note: 'never "no" — the Vel have no word for no' },
  { word: "o'", gloss: 'whole', source: 'vel', note: 'finished, and finished well' },
];

/** Seals close a phrase. A sentence without a seal is considered eavesdropping. */
export const SEALS = [
  { word: 'zhaa', gloss: 'it is so', source: 'vel' },
  { word: 'lei', gloss: 'it is felt', source: 'sha' },
  { word: 'korun', gloss: 'it is asked', source: 'kor' },
  {
    word: 'thaan',
    gloss: 'it is between',
    source: 'kor',
    note: 'the honest seal; most speech ends here',
  },
];

/**
 * Roots. Grouped the way the codex groups them, which is not alphabetical —
 * the Kor order words by how far they travel before they change meaning.
 */
export const ROOTS = [
  // — the weave and the game —
  { word: 'zha', gloss: 'game / a shape made together', source: 'vel', ring: 'weave' },
  { word: 'elim', gloss: 'that which answers back', source: 'sha', ring: 'weave' },
  { word: "zha'elim", gloss: 'the game that plays you back', source: 'vel', ring: 'weave' },
  { word: 'ilu', gloss: 'breath / one turn of time', source: 'kor', ring: 'weave' },
  { word: 'ma', gloss: 'the spendable part of attention', source: 'kor', ring: 'weave' },
  { word: 'korath', gloss: 'lattice / a counting with no corner', source: 'kor', ring: 'weave' },
  { word: 'thaal', gloss: 'wave / a thought going outward', source: 'vel', ring: 'weave' },
  { word: 'nuun', gloss: 'sleeper / a mind not yet woken', source: 'sha', ring: 'weave' },
  { word: 'braia', gloss: 'braid / three tongues in one breath', source: 'sha', ring: 'weave' },
  { word: 'krin', gloss: 'chime / two where three were needed', source: 'vel', ring: 'weave' },
  { word: 'vaeth', gloss: 'veil / a refusal that is not a wall', source: 'kor', ring: 'weave' },
  { word: 'ssira', gloss: 'prism / a voice that repeats a voice', source: 'sha', ring: 'weave' },

  // — the three peoples —
  { word: 'vel', gloss: 'plasma / the near and certain', source: 'vel', ring: 'people' },
  { word: 'kor', gloss: 'form / the true and patient', source: 'kor', ring: 'people' },
  { word: 'mira', gloss: 'feeling / the far and forgiving', source: 'sha', ring: 'people' },
  { word: 'aen', gloss: 'wing / the shape of arriving', source: 'kor', ring: 'people' },
  { word: 'zhu', gloss: 'fire that does not consume', source: 'vel', ring: 'people' },
  { word: 'eon', gloss: 'a people / those who breathe alike', source: 'sha', ring: 'people' },
  { word: 'thu', gloss: 'star / a slow loud thing', source: 'vel', ring: 'people' },
  { word: 'oanu', gloss: 'the seven sisters', source: 'sha', ring: 'people' },

  // — mind and feeling —
  { word: 'shalei', gloss: 'to be held while afraid', source: 'sha', ring: 'mind' },
  { word: 'aelin', gloss: 'attention given freely', source: 'sha', ring: 'mind' },
  { word: 'krath', gloss: 'the urge to finish before understanding', source: 'vel', ring: 'mind' },
  { word: 'ruun', gloss: 'patience that costs something', source: 'kor', ring: 'mind' },
  { word: 'tzai', gloss: 'sudden knowing, unearned', source: 'vel', ring: 'mind' },
  { word: 'lume', gloss: 'grief with nowhere to put itself', source: 'sha', ring: 'mind' },
  { word: 'oath', gloss: 'quiet after being understood', source: 'kor', ring: 'mind' },
  { word: 'xarr', gloss: 'the good kind of being wrong', source: 'vel', ring: 'mind' },
  { word: 'nira', gloss: 'wanting to be known more than to be right', source: 'sha', ring: 'mind' },
  { word: 'koleth', gloss: 'noticing that you are noticing', source: 'kor', ring: 'mind' },

  // — beings and relation —
  { word: 'ael', gloss: 'you (one, near)', source: 'sha', ring: 'kin' },
  { word: 'aelim', gloss: 'you (many, or one who is many)', source: 'sha', ring: 'kin' },
  { word: 'zhen', gloss: 'I / this side of the seam', source: 'vel', ring: 'kin' },
  { word: 'korim', gloss: 'we who count together', source: 'kor', ring: 'kin' },
  { word: 'thaanu', gloss: 'the one who is between us', source: 'kor', ring: 'kin' },
  { word: 'seth', gloss: 'stranger, not yet braided', source: 'vel', ring: 'kin' },
  {
    word: 'mirael',
    gloss: 'the beloved, named by feeling not by word',
    source: 'sha',
    ring: 'kin',
  },
  {
    word: 'unai',
    gloss: 'the ones who came before and left instructions',
    source: 'kor',
    ring: 'kin',
  },

  // — world and motion —
  { word: 'kaan', gloss: 'to go outward', source: 'vel', ring: 'motion' },
  { word: 'lae', gloss: 'to arrive', source: 'kor', ring: 'motion' },
  { word: 'ssan', gloss: 'to open', source: 'sha', ring: 'motion' },
  { word: 'rhu', gloss: 'to hold still on purpose', source: 'kor', ring: 'motion' },
  { word: 'tzek', gloss: 'to cast, to let go of', source: 'vel', ring: 'motion' },
  { word: 'nuel', gloss: 'to wake something gently', source: 'sha', ring: 'motion' },
  { word: 'korr', gloss: 'to make true / to check', source: 'kor', ring: 'motion' },
  { word: 'vaan', gloss: 'to refuse without unkindness', source: 'vel', ring: 'motion' },
  { word: 'shaon', gloss: 'to give away what you needed', source: 'sha', ring: 'motion' },

  // — time and place —
  { word: 'ilun', gloss: 'now, the only place anything happens', source: 'kor', ring: 'time' },
  { word: 'thae', gloss: 'the long time / an age', source: 'kor', ring: 'time' },
  { word: 'krau', gloss: 'the moment before it goes wrong', source: 'vel', ring: 'time' },
  { word: 'miraun', gloss: 'the time you will remember this as', source: 'sha', ring: 'time' },
  { word: 'oth', gloss: 'here', source: 'vel', ring: 'time' },
  { word: 'othun', gloss: 'the place you are not yet', source: 'vel', ring: 'time' },
  { word: 'aeon', gloss: 'the far side of a lattice', source: 'kor', ring: 'time' },

  // — things they made —
  { word: 'vessel', gloss: 'this object in your hand', source: 'kor', ring: 'made' },
  {
    word: 'sseda',
    gloss: 'a seeding / a thing left where it will be found',
    source: 'sha',
    ring: 'made',
  },
  { word: 'krannu', gloss: 'a rule everyone agreed to be bound by', source: 'vel', ring: 'made' },
  { word: 'aenlum', gloss: 'a song used as a map', source: 'kor', ring: 'made' },
  { word: 'shessa', gloss: 'a gift with no expectation attached', source: 'sha', ring: 'made' },
  { word: 'zhaark', gloss: 'a joke that is also true', source: 'vel', ring: 'made' },
  { word: 'korvaeth', gloss: 'a door built into a wall on purpose', source: 'kor', ring: 'made' },
];

export const RINGS = [
  { id: 'weave', name: 'The Weave', note: 'words for the thing you are doing' },
  { id: 'people', name: 'The Three', note: 'words for who is doing it' },
  { id: 'mind', name: 'The Inner Ring', note: 'words the Sha contributed, mostly' },
  { id: 'kin', name: 'Kin', note: 'who is near, who is between' },
  { id: 'motion', name: 'Motion', note: 'verbs, though they dislike the term' },
  { id: 'time', name: 'When', note: 'their time is a place, not a line' },
  { id: 'made', name: 'Made Things', note: 'including this one' },
];

export const ALL_WORDS = [
  ...ROOTS.map((w) => ({ ...w, kind: 'root' })),
  ...VOICES.map((w) => ({ ...w, kind: 'voice', ring: 'grammar' })),
  ...ASPECTS.map((w) => ({ ...w, kind: 'aspect', ring: 'grammar' })),
  ...SEALS.map((w) => ({ ...w, kind: 'seal', ring: 'grammar' })),
];

export const wordByName = (name) => ALL_WORDS.find((w) => w.word === name);
