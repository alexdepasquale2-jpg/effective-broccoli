/**
 * Persistence. The Vel find it obscene that a mind should need an external
 * store; the Sha point out that humans forget everything twice a day, and
 * built this anyway.
 */
const KEY = 'zhaelim.vessel.v1';

const DEFAULTS = {
  songsCleared: {},
  braidsTotal: 0,
  chimesTotal: 0,
  loreSeen: [],
  wordsHeard: [],
  riteStreak: 0,
  riteLastDay: null,
  breathsTaken: 0,
  muted: false,
  reducedMotion: false,
  seenPrologue: false,
};

let cache = null;

function read() {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    cache = { ...DEFAULTS };
  }
  return cache;
}

function write() {
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* private browsing, a full disk, a hostile universe — play on regardless */
  }
}

export const vessel = {
  get all() {
    return read();
  },
  get(k) {
    return read()[k];
  },
  set(k, v) {
    read()[k] = v;
    write();
    return v;
  },
  update(fn) {
    fn(read());
    write();
    return cache;
  },
  addUnique(k, value) {
    const list = read()[k];
    if (!list.includes(value)) {
      list.push(value);
      write();
      return true;
    }
    return false;
  },
  reset() {
    cache = { ...DEFAULTS };
    write();
  },
};
