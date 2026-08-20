import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WebSocket } from 'ws';
import type { FastifyInstance } from 'fastify';
import type { ServerMessage, WelcomeMessage } from '@glimmer/shared';
import { buildApp } from './app.ts';
import { Content } from './content.ts';
import { sql } from './db/index.ts';
import { migrate } from './db/migrate.ts';
import { World } from './game/world.ts';
import { attachGameSocket } from './net.ts';

/**
 * Full-stack test: real HTTP, real WebSockets, real Postgres.
 *
 * This is the acceptance test for the vertical slice. It asserts the thing the
 * milestone actually promises -- two players in one location, movement visible
 * across connections, an authoritative harvest, and state that survives a
 * disconnect -- rather than testing the pieces in isolation.
 *
 * Needs a database. Set DATABASE_URL; without one the suite skips rather than
 * failing, so `npm test` still works for someone who has not set Postgres up.
 */

const hasDatabase = await sql`select 1`.then(
  () => true,
  () => false,
);

const suite = hasDatabase ? describe : describe.skip;
if (!hasDatabase) {
  console.warn('integration tests skipped: no database at DATABASE_URL');
}

interface Client {
  ws: WebSocket;
  events: ServerMessage[];
  welcome: WelcomeMessage;
  send: (msg: unknown) => void;
  close: () => void;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function latest<T extends ServerMessage['t']>(
  c: Client,
  t: T,
): Extract<ServerMessage, { t: T }> | undefined {
  return c.events.filter((e): e is Extract<ServerMessage, { t: T }> => e.t === t).at(-1);
}

suite('vertical slice', () => {
  let app: FastifyInstance;
  let world: World;
  let base: string;
  let wsUrl: string;
  const suffix = Math.random().toString(36).slice(2, 8);
  const createdUsernames: string[] = [];
  const openClients: Client[] = [];
  /**
   * Harvestable entities are handed out one per test. Cooldowns are real and
   * outlast a test run, so sharing a tree would make tests order-dependent.
   */
  let nextTree = 0;

  beforeAll(async () => {
    await migrate(() => {});
    const content = await Content.load();
    app = await buildApp(content);
    world = new World(content);
    await app.listen({ port: 0, host: '127.0.0.1' });
    attachGameSocket(app.server, world);
    const { port } = app.server.address() as AddressInfo;
    base = `http://127.0.0.1:${port}`;
    wsUrl = `ws://127.0.0.1:${port}/ws`;
  });

  afterAll(async () => {
    for (const c of openClients) {
      try {
        c.ws.terminate();
      } catch {
        // Already gone.
      }
    }
    await wait(200);
    await world?.stop();
    await app?.close();
    if (createdUsernames.length > 0) {
      await sql`delete from players where username = any(${createdUsernames})`;
    }
    await sql.end();
  });

  async function api(path: string, body?: unknown, cookie?: string) {
    const res = await fetch(base + path, {
      method: body ? 'POST' : 'GET',
      headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    return {
      status: res.status,
      json: (await res.json().catch(() => null)) as Record<string, unknown> | null,
      cookie: res.headers.get('set-cookie')?.split(';')[0] ?? '',
    };
  }

  async function newPlayer(name: string) {
    const username = `${name}_${suffix}`;
    createdUsernames.push(username);
    const res = await api('/api/register', { username, password: 'correcthorse' });
    expect(res.status).toBe(200);
    return { username, cookie: res.cookie };
  }

  async function connect(cookie: string): Promise<Client> {
    const ws = new WebSocket(wsUrl, { headers: { cookie } });
    const events: ServerMessage[] = [];
    ws.on('message', (raw) => events.push(JSON.parse(raw.toString())));
    await new Promise<void>((resolve, reject) => {
      ws.once('open', () => resolve());
      ws.once('error', reject);
    });
    // The welcome arrives immediately after the socket opens.
    for (let i = 0; i < 50 && !events.some((e) => e.t === 'welcome'); i++) await wait(20);
    const welcome = events.find((e): e is WelcomeMessage => e.t === 'welcome');
    if (!welcome) throw new Error('no welcome received');
    const client: Client = {
      ws,
      events,
      welcome,
      send: (msg) => ws.send(JSON.stringify(msg)),
      close: () => ws.close(),
    };
    openClients.push(client);
    return client;
  }

  /** Claims a harvestable entity no other test in this run will touch. */
  function claimTree(c: Client, opts: { withCooldown?: boolean } = {}) {
    const trees = c.welcome.location.entities.filter(
      (e) => e.verbs.includes('harvest') && (!opts.withCooldown || e.cooldownMs > 0),
    );
    const tree = trees[nextTree++ % trees.length];
    if (!tree?.yield) throw new Error('content has no harvestable entity to test with');
    return tree;
  }

  /**
   * Walks a client toward a point, jumping when the target is above it, until
   * within `within` px. Some trees sit on ledges, so plain horizontal walking
   * is not enough to reach the whole location.
   */
  async function walkTo(c: Client, targetX: number, targetY: number, within = 100) {
    let seq = 1000;
    for (let i = 0; i < 400; i++) {
      const you = latest(c, 'snapshot')?.you;
      if (you && Math.hypot(you.x - targetX, you.y - targetY) < within) break;

      const dx = !you || you.x < targetX - 10 ? 1 : you && you.x > targetX + 10 ? -1 : 0;
      // Jump when the target is above and we are roughly underneath it.
      const jump = !!you && you.grounded && you.y > targetY + 20 && Math.abs(you.x - targetX) < 140;
      c.send({ t: 'input', seq: seq++, dx, jump });
      await wait(20);
    }
    c.send({ t: 'input', seq: seq + 1, dx: 0, jump: false });
    await wait(150);
  }

  it('rejects a socket with no session', async () => {
    const ws = new WebSocket(wsUrl);
    const err = await new Promise<Error>((resolve) => ws.once('error', resolve));
    expect(err.message).toMatch(/401/);
  });

  it('puts two players in the same location and shows one to the other', async () => {
    const alice = await newPlayer('alice');
    const bob = await newPlayer('bob');

    const ca = await connect(alice.cookie);
    expect(ca.welcome.actors).toHaveLength(1);

    const cb = await connect(bob.cookie);
    // Bob's welcome already contains Alice.
    expect(cb.welcome.actors.map((a) => a.name)).toContain(alice.username);
    expect(cb.welcome.location.name).toBe(ca.welcome.location.name);

    ca.close();
    cb.close();
    await wait(200);
  });

  it('broadcasts one player’s movement to another', async () => {
    const alice = await newPlayer('mover');
    const bob = await newPlayer('watcher');
    const ca = await connect(alice.cookie);
    const cb = await connect(bob.cookie);

    const startX = ca.welcome.actors.find((a) => a.id === ca.welcome.youId)?.x ?? 0;
    for (let i = 1; i <= 25; i++) {
      ca.send({ t: 'input', seq: i, dx: 1, jump: false });
      await wait(20);
    }
    await wait(300);

    const seenByBob = latest(cb, 'snapshot')?.actors.find((a) => a.id === ca.welcome.youId);
    expect(seenByBob).toBeDefined();
    expect(seenByBob!.x).toBeGreaterThan(startX + 50);
    expect(cb.events.filter((e) => e.t === 'snapshot').length).toBeGreaterThan(5);

    ca.close();
    cb.close();
    await wait(200);
  });

  it('refuses a harvest from out of range', async () => {
    const player = await newPlayer('distant');
    const c = await connect(player.cookie);
    const tree = claimTree(c);

    c.send({ t: 'interact', seq: 1, entityId: tree.id, verb: 'harvest' });
    await wait(300);

    expect(latest(c, 'error')?.code).toBe('out_of_range');
    expect(latest(c, 'inventory')).toBeUndefined();

    c.close();
    await wait(200);
  });

  it('grants items and xp for a harvest, and tells onlookers', async () => {
    const alice = await newPlayer('picker');
    const bob = await newPlayer('onlooker');
    const ca = await connect(alice.cookie);
    const cb = await connect(bob.cookie);

    const tree = claimTree(ca);
    await walkTo(ca, tree.x, tree.y);

    ca.send({ t: 'interact', seq: 5000, entityId: tree.id, verb: 'harvest' });
    await wait(400);

    const inv = latest(ca, 'inventory');
    expect(inv?.slots[0]?.item).toBe(tree.yield!.item);
    expect(inv!.slots[0]!.count).toBeGreaterThanOrEqual(tree.yield!.min);
    expect(inv!.slots[0]!.count).toBeLessThanOrEqual(tree.yield!.max);

    const skill = latest(ca, 'skill');
    expect(skill?.id).toBe(tree.yield!.skill);
    expect(skill?.xp).toBe(tree.yield!.xp);

    // The onlooker learns about it without having done anything.
    expect(latest(cb, 'harvested')?.entityId).toBe(tree.id);

    ca.close();
    cb.close();
    await wait(200);
  });

  it('puts the entity on cooldown after a harvest', async () => {
    const player = await newPlayer('greedy');
    const c = await connect(player.cookie);
    const tree = claimTree(c, { withCooldown: true });
    await walkTo(c, tree.x, tree.y);

    c.send({ t: 'interact', seq: 6000, entityId: tree.id, verb: 'harvest' });
    await wait(300);
    c.send({ t: 'interact', seq: 6001, entityId: tree.id, verb: 'harvest' });
    await wait(300);

    expect(latest(c, 'error')?.code).toBe('not_ready');
    c.close();
    await wait(200);
  });

  it('persists inventory, skills and position across a reconnect', async () => {
    const player = await newPlayer('persistent');
    const c1 = await connect(player.cookie);
    const tree = claimTree(c1, { withCooldown: true });
    await walkTo(c1, tree.x, tree.y);

    c1.send({ t: 'interact', seq: 7000, entityId: tree.id, verb: 'harvest' });
    await wait(400);
    expect(latest(c1, 'error'), 'harvest should have succeeded').toBeUndefined();
    const expectedInv = latest(c1, 'inventory')!.slots;
    const expectedXp = latest(c1, 'skill')!.xp;

    c1.close();
    await wait(500); // disconnect triggers a synchronous flush

    // Straight from the database, not from memory.
    const [row] = await sql<{ inventory: unknown[]; skills: Record<string, number> }[]>`
      select inventory, skills from players where username = ${player.username}
    `;
    expect(row!.inventory).toHaveLength(expectedInv.length);
    expect(row!.skills[tree.yield!.skill]).toBe(expectedXp);

    const c2 = await connect(player.cookie);
    expect(c2.welcome.inventory).toEqual(expectedInv);
    expect(c2.welcome.skills.find((s) => s.id === tree.yield!.skill)?.xp).toBe(expectedXp);
    // And the tree is still recovering, because location state persisted too.
    const state = c2.welcome.entityStates.find((e) => e.id === tree.id);
    expect(state!.readyAt).toBeGreaterThan(Date.now());

    c2.close();
    await wait(200);
  });

  it('ignores malformed and unrecognised messages without dropping the socket', async () => {
    const player = await newPlayer('noisy');
    const c = await connect(player.cookie);

    c.ws.send('not json at all');
    await wait(150);
    expect(latest(c, 'error')?.code).toBe('bad_message');

    c.send({ t: 'input', seq: 'not-a-number', dx: 99, jump: 'yes' });
    await wait(150);
    expect(latest(c, 'error')?.code).toBe('bad_message');

    // Still alive and still simulating.
    c.send({ t: 'ping', sentAt: 123 });
    await wait(150);
    expect(latest(c, 'pong')?.sentAt).toBe(123);

    c.close();
    await wait(200);
  });

  it('rejects bad credentials and duplicate names', async () => {
    const player = await newPlayer('careful');

    expect(
      (await api('/api/login', { username: player.username, password: 'wrong-one' })).status,
    ).toBe(401);
    expect(
      (
        await api('/api/register', {
          username: player.username.toUpperCase(),
          password: 'correcthorse',
        })
      ).status,
    ).toBe(409);
    expect(
      (await api('/api/register', { username: `x_${suffix}`, password: 'short' })).status,
    ).toBe(400);
    expect((await api('/api/me')).status).toBe(401);

    const ok = await api('/api/login', { username: player.username, password: 'correcthorse' });
    expect(ok.status).toBe(200);
    expect((await api('/api/me', undefined, ok.cookie)).status).toBe(200);
  });
});
