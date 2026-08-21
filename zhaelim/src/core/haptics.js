import { vessel } from './storage.js';

/** A body remembers what a screen cannot. Short, quiet, never a buzz-saw. */
export function tap(pattern = 8) {
  if (vessel.get('reducedMotion')) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* desktop, or a device with more dignity */
  }
}

export const PATTERNS = {
  cast: 8,
  chime: [6, 40, 6],
  braid: [10, 30, 10, 30, 24],
  fail: [30, 60, 30],
  won: [12, 40, 12, 40, 12, 40, 60],
};
