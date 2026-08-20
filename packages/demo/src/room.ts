import {
  INTERACT_RANGE,
  TICK_S,
  addItem,
  distance,
  isFull,
  levelForXp,
  stepBody,
  type Body,
  type EntityDef,
  type Input,
  type InventorySlot,
  type ItemDef,
  type Location,
} from '@glimmer/shared';

/**
 * The authoritative room, running in the page.
 *
 * This mirrors the rules in `packages/server/src/game/room.ts`. The physics,
 * inventory stacking, skill curve and range check are not reimplemented here --
 * they are imported from `@glimmer/shared`, the same modules the real server
 * runs. What this file replaces is only the part that would otherwise be a
 * network round trip.
 */

export interface HarvestResult {
  ok: boolean;
  message: string;
  item?: ItemDef;
  count?: number;
  skillId?: string;
  gained?: number;
  levelledUp?: boolean;
}

export class DemoRoom {
  readonly body: Body;
  inventory: InventorySlot[] = [];
  readonly skills = new Map<string, number>();
  /** entityId -> epoch ms until usable again. */
  readonly readyAt = new Map<string, number>();

  private readonly itemsById: Map<string, ItemDef>;

  constructor(
    readonly location: Location,
    items: ItemDef[],
  ) {
    this.itemsById = new Map(items.map((i) => [i.id, i]));
    this.body = {
      x: location.spawn.x,
      y: location.spawn.y,
      vx: 0,
      vy: 0,
      grounded: false,
      facing: 1,
    };
  }

  step(input: Input): void {
    stepBody(this.body, input, this.location.platforms, this.location.width, TICK_S);
  }

  isReady(entityId: string, now: number): boolean {
    return (this.readyAt.get(entityId) ?? 0) <= now;
  }

  inRange(entity: EntityDef): boolean {
    return distance(this.body.x, this.body.y, entity.x, entity.y) <= INTERACT_RANGE;
  }

  xpFor(skillId: string): number {
    return this.skills.get(skillId) ?? 0;
  }

  /** Same preconditions, in the same order, as the server's `harvest`. */
  harvest(entityId: string, now: number, roll: () => number = Math.random): HarvestResult {
    const entity = this.location.entities.find((e) => e.id === entityId);
    if (!entity || !entity.verbs.includes('harvest') || !entity.yield) {
      return { ok: false, message: 'There is nothing to harvest there.' };
    }
    if (!this.isReady(entityId, now)) {
      return { ok: false, message: 'It needs a moment to recover.' };
    }
    if (!this.inRange(entity)) {
      return { ok: false, message: 'Too far away — walk closer.' };
    }

    const item = this.itemsById.get(entity.yield.item);
    if (!item) return { ok: false, message: 'Unknown item.' };
    if (isFull(this.inventory, item)) {
      return { ok: false, message: 'Your pack is full.' };
    }

    const { min, max } = entity.yield;
    const rolled = min + Math.floor(roll() * (max - min + 1));
    const { slots, added } = addItem(this.inventory, item, rolled);
    if (added === 0) return { ok: false, message: 'Your pack is full.' };

    this.inventory = slots;
    this.readyAt.set(entityId, now + entity.cooldownMs);

    const skillId = entity.yield.skill;
    const before = this.xpFor(skillId);
    const after = before + entity.yield.xp;
    this.skills.set(skillId, after);

    return {
      ok: true,
      message: `You got ${added} × ${added === 1 ? item.name : (item.namePlural ?? item.name)}`,
      item,
      count: added,
      skillId,
      gained: entity.yield.xp,
      levelledUp: levelForXp(after) > levelForXp(before),
    };
  }

  /** Nearest harvestable entity within reach, for the keyboard shortcut. */
  nearestUsable(now: number): EntityDef | null {
    let best: EntityDef | null = null;
    let bestDist = Infinity;
    for (const e of this.location.entities) {
      if (!e.verbs.includes('harvest')) continue;
      if (!this.isReady(e.id, now)) continue;
      const d = distance(this.body.x, this.body.y, e.x, e.y);
      if (d <= INTERACT_RANGE && d < bestDist) {
        best = e;
        bestDist = d;
      }
    }
    return best;
  }

  save(): string {
    return JSON.stringify({
      x: this.body.x,
      y: this.body.y,
      inventory: this.inventory,
      skills: [...this.skills],
    });
  }

  load(raw: string): void {
    try {
      const s = JSON.parse(raw) as {
        x?: number;
        y?: number;
        inventory?: InventorySlot[];
        skills?: [string, number][];
      };
      if (typeof s.x === 'number' && typeof s.y === 'number') {
        this.body.x = s.x;
        this.body.y = s.y;
      }
      if (Array.isArray(s.inventory)) this.inventory = s.inventory;
      if (Array.isArray(s.skills)) {
        for (const [id, xp] of s.skills) this.skills.set(id, xp);
      }
    } catch {
      // A corrupt save is not worth failing a page load over.
    }
  }
}
