import {
  TICK_S,
  stepBody,
  type Actor,
  type Body,
  type Input,
  type Platform,
} from '@glimmer/shared';

interface PendingInput extends Input {
  seq: number;
}

/**
 * Client-side prediction with server reconciliation.
 *
 * The local player moves immediately on input rather than waiting a round trip.
 * When the server's authoritative position arrives it is compared against where
 * we thought we were at that same sequence number; if they disagree we snap to
 * the server and replay every input it has not seen yet.
 *
 * Because `stepBody` is the same function on both sides, agreement is the
 * normal case and replay is usually a no-op -- which is the entire point of
 * keeping physics in the shared package.
 */
export class PredictedPlayer {
  readonly body: Body = { x: 0, y: 0, vx: 0, vy: 0, grounded: false, facing: 1 };

  private pending: PendingInput[] = [];
  private seq = 0;
  private platforms: readonly Platform[] = [];
  private worldWidth = 0;

  /** How far off the server was, in px. Surfaced for the debug overlay. */
  lastCorrection = 0;

  setWorld(platforms: readonly Platform[], worldWidth: number): void {
    this.platforms = platforms;
    this.worldWidth = worldWidth;
  }

  reset(actor: Actor): void {
    this.body.x = actor.x;
    this.body.y = actor.y;
    this.body.vx = actor.vx;
    this.body.vy = actor.vy;
    this.body.grounded = actor.grounded;
    this.body.facing = actor.facing;
    this.pending = [];
  }

  /** Applies an input locally and returns the sequence number to send. */
  apply(input: Input): number {
    this.seq++;
    this.pending.push({ ...input, seq: this.seq });
    stepBody(this.body, input, this.platforms, this.worldWidth, TICK_S);
    return this.seq;
  }

  /** Reconciles against the server's authoritative state. */
  reconcile(authoritative: Actor, ackSeq: number): void {
    // Drop inputs the server has already accounted for.
    this.pending = this.pending.filter((p) => p.seq > ackSeq);

    const replayed: Body = {
      x: authoritative.x,
      y: authoritative.y,
      vx: authoritative.vx,
      vy: authoritative.vy,
      grounded: authoritative.grounded,
      facing: authoritative.facing,
    };
    for (const input of this.pending) {
      stepBody(replayed, input, this.platforms, this.worldWidth, TICK_S);
    }

    this.lastCorrection = Math.hypot(replayed.x - this.body.x, replayed.y - this.body.y);

    // Snap only when the disagreement is visible; below that, smoothing it
    // away looks better than a jitter every tick.
    if (this.lastCorrection > 2) {
      this.body.x = replayed.x;
      this.body.y = replayed.y;
      this.body.vx = replayed.vx;
      this.body.vy = replayed.vy;
      this.body.grounded = replayed.grounded;
    }
  }
}

/**
 * Remote players arrive at the server tick rate (20Hz) but render at 60fps,
 * so their positions are interpolated toward the latest snapshot instead of
 * being teleported to it.
 */
export class RemoteActor {
  x: number;
  y: number;
  facing: -1 | 1;
  targetX: number;
  targetY: number;
  moving = false;

  constructor(actor: Actor) {
    this.x = actor.x;
    this.y = actor.y;
    this.targetX = actor.x;
    this.targetY = actor.y;
    this.facing = actor.facing;
  }

  setTarget(actor: Actor): void {
    this.targetX = actor.x;
    this.targetY = actor.y;
    this.facing = actor.facing;
    this.moving = Math.abs(actor.vx) > 1;
  }

  /** Eases toward the target. `dt` is the frame time in seconds. */
  interpolate(dt: number): void {
    const alpha = Math.min(1, dt * 14);
    this.x += (this.targetX - this.x) * alpha;
    this.y += (this.targetY - this.y) * alpha;
  }
}
