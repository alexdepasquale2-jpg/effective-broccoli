import { PERSIST_INTERVAL_MS, levelForXp, type InventorySlot } from '@glimmer/shared';
import type { Content } from '../content.ts';
import { sql } from '../db/index.ts';
import { LocationRoom, type Occupant } from './room.ts';

export interface PlayerRow {
  id: string;
  username: string;
  location_id: string;
  x: number;
  y: number;
  inventory: InventorySlot[];
  skills: Record<string, number>;
}

/**
 * Owns the set of live rooms and the write-back of their state to Postgres.
 *
 * Rooms are hydrated on first entry and dropped once empty, so an idle world
 * costs nothing. Player state is flushed on a timer while they play and
 * synchronously when they disconnect, so a crash loses at most one interval.
 */
export class World {
  private readonly rooms = new Map<string, LocationRoom>();
  /** Which room each connected player is in, for routing messages. */
  private readonly playerRoom = new Map<string, string>();
  private flushTimer: ReturnType<typeof setInterval> | null = null;

  private readonly content: Content;

  constructor(content: Content) {
    this.content = content;
  }

  start(): void {
    if (this.flushTimer) return;
    this.flushTimer = setInterval(() => {
      void this.flush().catch((err) => {
        console.error(`world flush failed: ${(err as Error).message}`);
      });
    }, PERSIST_INTERVAL_MS);
    this.flushTimer.unref?.();
  }

  async stop(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    for (const room of this.rooms.values()) room.stop();
    await this.flush();
  }

  async roomFor(locationId: string): Promise<LocationRoom> {
    const existing = this.rooms.get(locationId);
    if (existing) return existing;

    const def = this.content.location(locationId) ?? this.content.startingLocation;
    const room = new LocationRoom(def, this.content);

    const [row] = await sql<{ entities: Record<string, { readyAt: number }> }[]>`
      select entities from location_state where location_id = ${def.id}
    `;
    if (row) room.hydrate(row.entities);

    this.rooms.set(def.id, room);
    return room;
  }

  async join(player: PlayerRow, send: Occupant['send']): Promise<LocationRoom> {
    // A second login for the same account displaces the first, rather than
    // running two authoritative bodies for one player.
    await this.leave(player.id);

    const room = await this.roomFor(player.location_id);
    const spawn = room.def.spawn;
    const onPlatform = Number.isFinite(player.x) && Number.isFinite(player.y);

    room.join({
      playerId: player.id,
      name: player.username,
      body: {
        x: onPlatform ? player.x : spawn.x,
        y: onPlatform ? player.y : spawn.y,
        vx: 0,
        vy: 0,
        grounded: false,
        facing: 1,
      },
      input: { dx: 0, jump: false },
      lastSeq: 0,
      inventory: player.inventory ?? [],
      skills: new Map(Object.entries(player.skills ?? {})),
      dirty: false,
      send,
    });

    this.playerRoom.set(player.id, room.id);
    this.start();
    return room;
  }

  roomOf(playerId: string): LocationRoom | undefined {
    const id = this.playerRoom.get(playerId);
    return id ? this.rooms.get(id) : undefined;
  }

  /** Removes a player and writes their state back immediately. */
  async leave(playerId: string): Promise<void> {
    const room = this.roomOf(playerId);
    if (!room) return;
    const occupant = room.leave(playerId);
    this.playerRoom.delete(playerId);
    if (occupant) await this.persistPlayer(room.id, occupant);
    if (room.stateDirty) await this.persistRoom(room);
    if (room.isEmpty) this.rooms.delete(room.id);
  }

  /** Writes every dirty player and room. Called on a timer and at shutdown. */
  async flush(): Promise<void> {
    for (const room of this.rooms.values()) {
      for (const occupant of room.occupants.values()) {
        if (!occupant.dirty) continue;
        await this.persistPlayer(room.id, occupant);
      }
      if (room.stateDirty) await this.persistRoom(room);
    }
  }

  private async persistPlayer(locationId: string, occupant: Occupant): Promise<void> {
    const skills = Object.fromEntries(occupant.skills);
    await sql`
      update players set
        location_id  = ${locationId},
        x            = ${occupant.body.x},
        y            = ${occupant.body.y},
        inventory    = ${sql.json(occupant.inventory)},
        skills       = ${sql.json(skills)},
        last_seen_at = now()
      where id = ${occupant.playerId}
    `;
    occupant.dirty = false;
  }

  private async persistRoom(room: LocationRoom): Promise<void> {
    await sql`
      insert into location_state (location_id, entities, updated_at)
      values (${room.id}, ${sql.json(room.snapshotState())}, now())
      on conflict (location_id) do update
        set entities = excluded.entities, updated_at = now()
    `;
    room.stateDirty = false;
  }
}

/** Shapes a DB row's skills map into the wire form. */
export function skillStates(skills: Record<string, number>) {
  return Object.entries(skills).map(([id, xp]) => ({ id, xp, level: levelForXp(xp) }));
}
