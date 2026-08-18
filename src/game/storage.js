const KEY = "aether-best-score";

export function loadBestScore() {
  try {
    const raw = localStorage.getItem(KEY);
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
    localStorage.setItem(KEY, String(best));
  } catch {
    // Private mode or blocked storage should not break play.
  }
  return best;
}
