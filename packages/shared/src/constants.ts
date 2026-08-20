/** Server simulation and broadcast rate. */
export const TICK_HZ = 20;
export const TICK_MS = 1000 / TICK_HZ;
export const TICK_S = TICK_MS / 1000;

/** Platformer physics, in pixels and seconds. Shared so the client can predict. */
export const PHYSICS = {
  gravity: 2200,
  walkSpeed: 240,
  jumpVelocity: -760,
  /** Horizontal drag applied when no input is held, as a fraction retained per tick. */
  groundFriction: 0.6,
  airControl: 0.55,
  terminalVelocity: 1600,
  playerHalfWidth: 18,
  playerHeight: 62,
} as const;

/** How close a player must stand to an entity to use a verb on it. */
export const INTERACT_RANGE = 130;

export const INVENTORY_SLOTS = 10;

/** Sessions last a week; refreshed on use. */
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Players are flushed to Postgres at most this often while active. */
export const PERSIST_INTERVAL_MS = 5_000;
