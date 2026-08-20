import { randomBytes } from 'node:crypto';
import { hash, verify } from '@node-rs/argon2';
import { SESSION_TTL_MS } from '@glimmer/shared';
import { sql } from './db/index.ts';
import type { PlayerRow } from './game/world.ts';

export const SESSION_COOKIE = 'glimmer_session';

const USERNAME_RE = /^[a-zA-Z0-9_][a-zA-Z0-9_ -]{1,22}[a-zA-Z0-9_]$/;

export interface Credentials {
  username: string;
  password: string;
}

export class AuthError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function validateCredentials({ username, password }: Credentials): void {
  if (!USERNAME_RE.test(username)) {
    throw new AuthError(
      400,
      'Names are 3-24 characters, using letters, numbers, spaces, hyphens and underscores.',
    );
  }
  if (password.length < 8) {
    throw new AuthError(400, 'Passwords need at least 8 characters.');
  }
  if (password.length > 200) {
    throw new AuthError(400, 'That password is unreasonably long.');
  }
}

export async function register(
  creds: Credentials,
  spawn: { locationId: string; x: number; y: number },
): Promise<PlayerRow> {
  validateCredentials(creds);

  const existing =
    await sql`select 1 from players where lower(username) = lower(${creds.username})`;
  if (existing.length > 0) {
    throw new AuthError(409, 'Somebody already goes by that name.');
  }

  const passwordHash = await hash(creds.password);
  const [row] = await sql<PlayerRow[]>`
    insert into players (username, password_hash, location_id, x, y)
    values (${creds.username}, ${passwordHash}, ${spawn.locationId}, ${spawn.x}, ${spawn.y})
    returning id, username, location_id, x, y, inventory, skills
  `;
  if (!row) throw new AuthError(500, 'Could not create that account.');
  return row;
}

export async function login(creds: Credentials): Promise<PlayerRow> {
  const [row] = await sql<(PlayerRow & { password_hash: string })[]>`
    select id, username, password_hash, location_id, x, y, inventory, skills
    from players where lower(username) = lower(${creds.username})
  `;

  // Verify even when the user is unknown, so a missing account and a wrong
  // password take the same time and cannot be told apart by timing.
  const stored = row?.password_hash ?? DUMMY_HASH;
  const ok = await verify(stored, creds.password).catch(() => false);
  if (!row || !ok) throw new AuthError(401, 'That name and password do not match.');

  const { password_hash: _discard, ...player } = row;
  return player;
}

export async function createSession(playerId: string): Promise<string> {
  const id = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await sql`insert into sessions (id, player_id, expires_at) values (${id}, ${playerId}, ${expiresAt})`;
  return id;
}

export async function playerForSession(sessionId: string | undefined): Promise<PlayerRow | null> {
  if (!sessionId) return null;
  const [row] = await sql<PlayerRow[]>`
    select p.id, p.username, p.location_id, p.x, p.y, p.inventory, p.skills
    from sessions s
    join players p on p.id = s.player_id
    where s.id = ${sessionId} and s.expires_at > now()
  `;
  return row ?? null;
}

export async function destroySession(sessionId: string | undefined): Promise<void> {
  if (!sessionId) return;
  await sql`delete from sessions where id = ${sessionId}`;
}

export async function purgeExpiredSessions(): Promise<void> {
  await sql`delete from sessions where expires_at <= now()`;
}

/**
 * A real argon2 hash of a value nobody can supply, used to keep the failure
 * path of `login` the same shape as the success path.
 */
const DUMMY_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHR2YWx1ZQ$Rd0EBTvZ0S6IMJ0mZ0mCQjMkTxLvfvOSm1JGx0Zh1Fo';
