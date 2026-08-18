/**
 * Tiny persistence helper.
 *
 * localStorage throws in private-mode Safari and in sandboxed iframes, so
 * every access is guarded and silently degrades to "no saved data" rather
 * than taking the game down with it.
 */

const PREFIX = 'broccolidrop:';

export function load(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
