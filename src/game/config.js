/** All gameplay tuning lives here so balance changes stay in one file. */
export const CONFIG = {
  player: {
    radius: 20,
    y: 92,            // distance from the bottom edge
    speed: 340,       // keyboard movement, design units / second
    dragFollow: 16,   // how sharply the player chases the finger (higher = snappier)
    margin: 8,        // keep-off distance from the screen edges
  },

  items: {
    radius: 13,
    baseSpeed: 150,
    speedPerPoint: 3.2,
    maxSpeed: 520,
    baseInterval: 0.85,   // seconds between spawns
    minInterval: 0.28,
    intervalPerPoint: 0.012,
    hazardChance: 0.34,   // rises slightly with score, see play.js
    maxHazardChance: 0.5,
  },

  rules: {
    lives: 3,
    invulnerable: 1.1,    // seconds of mercy after taking a hit
  },

  fx: {
    particles: 14,
    shakeOnHit: 12,
  },
};
