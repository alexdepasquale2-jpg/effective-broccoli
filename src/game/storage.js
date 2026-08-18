import { createClan } from "./ancestors.js";

const KEY = "aether-meta-v1";

export function loadMeta(emptyMeta) {
  const fallback = emptyMeta();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...fallback, clan: createClan() };
    const parsed = JSON.parse(raw);
    return {
      ...fallback,
      ...parsed,
      clan: { ...createClan(), ...(parsed.clan || parsed.hero || {}) },
    };
  } catch {
    return { ...fallback, clan: createClan() };
  }
}

export function saveMeta(meta) {
  try {
    localStorage.setItem(KEY, JSON.stringify(meta));
  } catch {
    // Ignore quota / private mode.
  }
  return meta;
}
