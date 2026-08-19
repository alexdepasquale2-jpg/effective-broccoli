const KEY = "let-it-pass-v1";

export function emptyRecord() {
  return {
    bestStillness: 0,
    deepestDepth: 0,
    lifetimeSeen: 0,
    lifetimeActed: 0,
    lifetimeChanged: 0,
    sessions: 0,
  };
}

export function loadRecord() {
  const fallback = emptyRecord();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

export function saveRecord(record) {
  try {
    localStorage.setItem(KEY, JSON.stringify(record));
  } catch {
    // Private mode should not break a game about letting things go.
  }
  return record;
}

export function mergeSession(record, { stillness, depthLevel, ledger }) {
  return {
    ...record,
    bestStillness: Math.max(record.bestStillness, Math.floor(stillness)),
    deepestDepth: Math.max(record.deepestDepth, depthLevel),
    lifetimeSeen: record.lifetimeSeen + ledger.seen,
    lifetimeActed: record.lifetimeActed + ledger.acted,
    lifetimeChanged: record.lifetimeChanged + ledger.changedAnything,
    sessions: record.sessions + 1,
  };
}
