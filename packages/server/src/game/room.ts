import {
  INTERACT_RANGE,
  TICK_MS,
  TICK_S,
  distance,
  levelForXp,
  stepBody,
  type Actor,
  type Body,
  type EntityState,
  type Input,
  type InventorySlot,
  type Location,
  type ServerMessage,
} from '@glimmer/shared';
import type { Content } from '../content.ts';
import { addItem, isFull } from './inventory.ts';

/** A connected player, as the room sees them. */
export interface Occupant {
  playerId: string;
  name: string;
  body: Body;
  /** Latest input received. Applied every tick until superseded. */
  input: Input;
  /** Sequence number of that input, echoed back for client reconciliation. */
  lastSeq: number;
  inventory: InventorySlot[];
  skills: Map<string, number>;
  dirty: boolean;
  send: (msg: ServerMessage) => void;
}

export interface HarvestOutcome {
  ok: boolean;
  code?: 'out_of_range' | 'not_ready' | 'inventory_full' | 'unknown';
  message?: string;
}

/**
 * One location, simulated authoritatively.
 *
 * A room owns its occupants and its entity state, ticks them on a fixed step,
 * and broadcasts deltas. Rooms never share mutable state, which is what makes
 * sharding them across processes an additive change rather than a rewrite.
 */
export class LocationRoom {
  readonly occupants = new Map<string, Occupant>();
  /** entityId -> epoch ms at which it becomes usable again. */
  private readonly readyAt = new Map<string, number>();
  private departed: string[] = [];
  private changedEntities = new Set<string>();
  private timer: ReturnType<typeof setInterval> | null = null;

  tick = 0;
  stateDirty = false;

  readonly def: Location;
  private readonly content: Content;
  /** Injectable for deterministic tests. */
  private readonly now: () => number;
  private readonly random: () => number;

  constructor(
    def: Location,
    content: Content,
    now: () => number = Date.now,
    random: () => number = Math.random,
  ) {
    this.def = def;
    this.content = content;
    this.now = now;
    this.random = random;
  }

  get id(): string {
    return this.def.id;
  }

  get isEmpty(): boolean {
    return this.occupants.size === 0;
  }

  /** Restores persisted entity cooldowns. */
  hydrate(entities: Record<string, { readyAt: number }>): void {
    for (const [id, state] of Object.entries(entities)) {
      if (typeof state?.readyAt === 'number') this.readyAt.set(id, state.readyAt);
    }
  }

  /** The subset of entity state worth persisting: cooldowns still in the future. */
  snapshotState(): Record<string, { readyAt: number }> {
    const now = this.now();
    const out: Record<string, { readyAt: number }> = {};
    for (const [id, at] of this.readyAt) {
      if (at > now) out[id] = { readyAt: at };
    }
    return out;
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.step(), TICK_MS);
    // Never let the game loop hold the process open on its own.
    this.timer.unref?.();
  }

  stop(): void {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  join(occupant: Occupant): void {
    this.occupants.set(occupant.playerId, occupant);
    occupant.send({
      t: 'welcome',
      youId: occupant.playerId,
      tick: this.tick,
      serverTime: this.now(),
      location: {
        id: this.def.id,
        name: this.def.name,
        width: this.def.width,
        height: this.def.height,
        sky: this.def.sky,
        layers: this.def.layers,
        platforms: this.def.platforms,
        entities: this.def.entities,
      },
      actors: [...this.occupants.values()].map(toActor),
      entityStates: this.entityStates(),
      inventory: occupant.inventory,
      skills: [...occupant.skills].map(([id, xp]) => ({ id, xp, level: levelForXp(xp) })),
    });
    this.start();
  }

  leave(playerId: string): Occupant | undefined {
    const occupant = this.occupants.get(playerId);
    if (!occupant) return undefined;
    this.occupants.delete(playerId);
    this.departed.push(playerId);
    if (this.isEmpty) this.stop();
    return occupant;
  }

  setInput(playerId: string, input: Input, seq: number): void {
    const occupant = this.occupants.get(playerId);
    if (!occupant) return;
    // Ignore out-of-order or replayed input.
    if (seq < occupant.lastSeq) return;
    occupant.input = input;
    occupant.lastSeq = seq;
  }

  /** Advances the simulation one tick and broadcasts the delta. */
  step(): void {
    this.tick++;

    for (const occupant of this.occupants.values()) {
      const before = { x: occupant.body.x, y: occupant.body.y };
      stepBody(occupant.body, occupant.input, this.def.platforms, this.def.width, TICK_S);
      // A jump is an edge, not a state: consume it so it fires once.
      if (occupant.input.jump) occupant.input = { ...occupant.input, jump: false };
      if (occupant.body.x !== before.x || occupant.body.y !== before.y) occupant.dirty = true;
    }

    const actors = [...this.occupants.values()].map(toActor);
    const entityStates = this.changedEntities.size > 0 ? this.entityStates() : [];
    const left = this.departed;
    this.departed = [];
    this.changedEntities.clear();

    const serverTime = this.now();
    for (const occupant of this.occupants.values()) {
      occupant.send({
        t: 'snapshot',
        tick: this.tick,
        serverTime,
        actors,
        left,
        entityStates,
        ackSeq: occupant.lastSeq,
        you: toActor(occupant),
      });
    }
  }

  /**
   * Attempts a harvest. Every precondition is checked here, on the server:
   * the entity must exist and be harvestable, be off cooldown, be in reach,
   * and the player must have room for what it gives.
   */
  harvest(playerId: string, entityId: string): HarvestOutcome {
    const occupant = this.occupants.get(playerId);
    if (!occupant) return { ok: false, code: 'unknown', message: 'not in this location' };

    const entity = this.def.entities.find((e) => e.id === entityId);
    if (!entity || !entity.verbs.includes('harvest') || !entity.yield) {
      return { ok: false, code: 'unknown', message: 'nothing to harvest there' };
    }

    const now = this.now();
    const readyAt = this.readyAt.get(entityId) ?? 0;
    if (readyAt > now) {
      return { ok: false, code: 'not_ready', message: 'it needs a moment to recover' };
    }

    if (distance(occupant.body.x, occupant.body.y, entity.x, entity.y) > INTERACT_RANGE) {
      return { ok: false, code: 'out_of_range', message: 'too far away' };
    }

    const item = this.content.item(entity.yield.item);
    if (!item) return { ok: false, code: 'unknown', message: 'unknown item' };

    if (isFull(occupant.inventory, item)) {
      return { ok: false, code: 'inventory_full', message: 'your pack is full' };
    }

    const { min, max } = entity.yield;
    const rolled = min + Math.floor(this.random() * (max - min + 1));
    const { slots, added } = addItem(occupant.inventory, item, rolled);
    if (added === 0) {
      return { ok: false, code: 'inventory_full', message: 'your pack is full' };
    }

    occupant.inventory = slots;
    this.readyAt.set(entityId, now + entity.cooldownMs);
    this.changedEntities.add(entityId);
    this.stateDirty = true;
    occupant.dirty = true;

    // Grant XP.
    const skillId = entity.yield.skill;
    const before = occupant.skills.get(skillId) ?? 0;
    const after = before + entity.yield.xp;
    occupant.skills.set(skillId, after);
    const beforeLevel = levelForXp(before);
    const afterLevel = levelForXp(after);

    occupant.send({ t: 'inventory', slots: occupant.inventory });
    occupant.send({
      t: 'skill',
      id: skillId,
      xp: after,
      level: afterLevel,
      gained: entity.yield.xp,
      levelledUp: afterLevel > beforeLevel,
    });

    this.broadcast({
      t: 'harvested',
      entityId,
      byId: playerId,
      item: item.id,
      count: added,
    });

    return { ok: true };
  }

  say(playerId: string, text: string): void {
    const occupant = this.occupants.get(playerId);
    if (!occupant) return;
    this.broadcast({ t: 'say', fromId: playerId, fromName: occupant.name, text });
  }

  broadcast(msg: ServerMessage, exceptPlayerId?: string): void {
    for (const occupant of this.occupants.values()) {
      if (occupant.playerId === exceptPlayerId) continue;
      occupant.send(msg);
    }
  }

  private entityStates(): EntityState[] {
    return this.def.entities
      .filter((e) => e.verbs.length > 0)
      .map((e) => ({ id: e.id, readyAt: this.readyAt.get(e.id) ?? 0 }));
  }
}

function toActor(o: Occupant): Actor {
  return {
    id: o.playerId,
    name: o.name,
    x: o.body.x,
    y: o.body.y,
    vx: o.body.vx,
    vy: o.body.vy,
    facing: o.body.facing,
    grounded: o.body.grounded,
  };
}
