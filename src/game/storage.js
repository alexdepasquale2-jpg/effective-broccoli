const KEY = "aether-meta-v1";
const BEST_KEY = "aether-best-score";

export function loadBestScore() {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    const value = Number.parseInt(raw ?? "0", 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

export function saveBestScore(score) {
  const next = Math.max(0, Math.floor(score));
  const best = Math.max(loadBestScore(), next);
  try {
    localStorage.setItem(BEST_KEY, String(best));
  } catch {
    // Private mode or blocked storage should not break play.
  }
  return best;
}

export function loadMeta(emptyMeta) {
  const fallback = emptyMeta();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return {
      ...fallback,
      ...parsed,
      unlocked: Array.isArray(parsed.unlocked) && parsed.unlocked.length ? parsed.unlocked : fallback.unlocked,
      seen: Array.isArray(parsed.seen) ? parsed.seen : [],
      hero: {
        ...fallback.hero,
        ...(parsed.hero || {}),
        items: { ...fallback.hero.items, ...((parsed.hero && parsed.hero.items) || {}) },
      },
    };
  } catch {
    return fallback;
  }
}

export function saveMeta(meta) {
  try {
    localStorage.setItem(KEY, JSON.stringify(meta));
  } catch {
    // Ignore quota / private mode.
  }
  saveBestScore(meta.best || 0);
  return meta;
}
