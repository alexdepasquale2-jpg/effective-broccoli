import { PHYSICS, TICK_S } from './constants.ts';
import type { Platform } from './content.ts';

/**
 * The authoritative movement step, shared verbatim between server and client.
 *
 * The server runs this to decide truth; the client runs the *same function* to
 * predict locally and to replay unacknowledged inputs after a correction. Any
 * divergence here would show up as rubber-banding, which is exactly why it
 * lives in the shared package rather than being written twice.
 */

export interface Body {
  x: number;
  y: number;
  vx: number;
  vy: number;
  grounded: boolean;
  facing: -1 | 1;
}

export interface Input {
  dx: number;
  jump: boolean;
}

export function stepBody(
  body: Body,
  input: Input,
  platforms: readonly Platform[],
  worldWidth: number,
  dt: number = TICK_S,
): void {
  const dx = Math.max(-1, Math.min(1, input.dx));

  if (dx !== 0) {
    const control = body.grounded ? 1 : PHYSICS.airControl;
    body.vx += (dx * PHYSICS.walkSpeed - body.vx) * control;
    body.facing = dx < 0 ? -1 : 1;
  } else if (body.grounded) {
    body.vx *= PHYSICS.groundFriction;
    if (Math.abs(body.vx) < 1) body.vx = 0;
  }

  if (input.jump && body.grounded) {
    body.vy = PHYSICS.jumpVelocity;
    body.grounded = false;
  }

  body.vy = Math.min(body.vy + PHYSICS.gravity * dt, PHYSICS.terminalVelocity);

  const prevY = body.y;
  body.x += body.vx * dt;
  body.y += body.vy * dt;

  // Clamp to the location's horizontal bounds.
  const minX = PHYSICS.playerHalfWidth;
  const maxX = worldWidth - PHYSICS.playerHalfWidth;
  if (body.x < minX) {
    body.x = minX;
    body.vx = 0;
  } else if (body.x > maxX) {
    body.x = maxX;
    body.vx = 0;
  }

  // Land on any platform crossed from above during this step. Only downward
  // motion collides, so players can jump up through a platform from below.
  body.grounded = false;
  if (body.vy >= 0) {
    for (const p of platforms) {
      if (body.x < p.x1 || body.x > p.x2) continue;
      if (prevY <= p.y && body.y >= p.y) {
        body.y = p.y;
        body.vy = 0;
        body.grounded = true;
        break;
      }
    }
  }
}

export function distance(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * How high a standing jump actually clears, in pixels.
 *
 * Computed by simulation rather than from the closed-form v^2/2g, because the
 * fixed timestep loses height to discretisation: the analytic answer is ~131px
 * but a player only ever clears ~112px. Content validation uses this to reject
 * platforms nobody can stand on, which is a mistake that is invisible when
 * reading a location file and obvious the moment you play it.
 */
export function maxJumpHeight(): number {
  const ground: Platform[] = [{ x1: -1e6, x2: 1e6, y: 0 }];
  const body: Body = { x: 0, y: 0, vx: 0, vy: 0, grounded: true, facing: 1 };
  let apex = 0;

  stepBody(body, { dx: 0, jump: true }, ground, 1e6);
  for (let i = 0; i < 500 && !body.grounded; i++) {
    stepBody(body, { dx: 0, jump: false }, ground, 1e6);
    apex = Math.min(apex, body.y);
  }
  return -apex;
}
