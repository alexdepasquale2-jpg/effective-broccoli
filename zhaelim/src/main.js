import { mount } from './ui/app.js';
import { vessel } from './core/storage.js';

/**
 * Entry. Everything below is housekeeping for the fact that this runs inside a
 * browser on a telephone, a circumstance none of the three peoples anticipated
 * and all of them have since described as "characteristically inconvenient".
 */

// Real viewport height, because mobile browsers lie about 100vh.
const setVH = () =>
  document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
setVH();
addEventListener('resize', setVH);
addEventListener('orientationchange', () => setTimeout(setVH, 120));

// Respect the system preference the first time, then let the Nest override it.
if (
  matchMedia('(prefers-reduced-motion: reduce)').matches &&
  vessel.get('reducedMotion') === false
) {
  vessel.set('reducedMotion', true);
}

// No pinch-zoom, no double-tap zoom, no rubber-band. It is a lattice, not a page.
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener(
  'touchmove',
  (e) => {
    if (e.touches.length > 1) e.preventDefault();
  },
  { passive: false },
);

mount(document.getElementById('app'));

if ('serviceWorker' in navigator) {
  addEventListener('load', () => {
    navigator.serviceWorker
      .register(new URL('../sw.js', import.meta.url), { scope: './' })
      .catch(() => {
        /* offline is a courtesy, not a requirement */
      });
  });
}
