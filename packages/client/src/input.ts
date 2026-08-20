import type { Input } from '@glimmer/shared';

/**
 * Keyboard state, sampled once per network tick rather than on each event, so
 * held keys produce a steady stream of intent and taps are not lost between
 * samples.
 */
export class Keyboard {
  private readonly held = new Set<string>();
  private jumpQueued = false;

  constructor(target: EventTarget = window) {
    target.addEventListener('keydown', (e) => {
      const key = normalise(e as KeyboardEvent);
      if (!key) return;
      // Do not steal keys from the sign-in form.
      if ((e.target as HTMLElement | null)?.tagName === 'INPUT') return;
      if (key === 'jump') {
        e.preventDefault();
        if (!this.held.has('jump')) this.jumpQueued = true;
      }
      this.held.add(key);
    });

    target.addEventListener('keyup', (e) => {
      const key = normalise(e as KeyboardEvent);
      if (key) this.held.delete(key);
    });

    // A lost focus must not leave the player walking into a wall forever.
    window.addEventListener('blur', () => this.held.clear());
  }

  /** Reads and clears the queued jump. */
  sample(): Input {
    const dx = (this.held.has('right') ? 1 : 0) - (this.held.has('left') ? 1 : 0);
    const jump = this.jumpQueued || this.held.has('jump');
    this.jumpQueued = false;
    return { dx, jump };
  }
}

function normalise(e: KeyboardEvent): 'left' | 'right' | 'jump' | null {
  switch (e.key) {
    case 'ArrowLeft':
    case 'a':
    case 'A':
      return 'left';
    case 'ArrowRight':
    case 'd':
    case 'D':
      return 'right';
    case ' ':
    case 'ArrowUp':
    case 'w':
    case 'W':
      return 'jump';
    default:
      return null;
  }
}
