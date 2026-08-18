import { createSave } from "./economy.js";

const KEY = "harpoon-reef-v1";

export function loadMeta(emptyMeta) {
  const fallback = emptyMeta();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return {
      ...fallback,
      ...parsed,
      save: { ...createSave(), ...(parsed.save || {}) },
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
  return meta;
}
