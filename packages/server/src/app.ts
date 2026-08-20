import cookie from '@fastify/cookie';
import Fastify, { type FastifyInstance, type FastifyReply } from 'fastify';
import { z } from 'zod';
import { SESSION_TTL_MS } from '@glimmer/shared';
import {
  AuthError,
  SESSION_COOKIE,
  createSession,
  destroySession,
  login,
  playerForSession,
  register,
} from './auth.ts';
import { config } from './config.ts';
import type { Content } from './content.ts';
import { skillStates } from './game/world.ts';

const CredentialsSchema = z.object({
  username: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(200),
});

export async function buildApp(content: Content): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  await app.register(cookie);

  // The dev client runs on its own origin, so it needs credentialed CORS.
  app.addHook('onRequest', async (req, reply) => {
    const origin = req.headers.origin;
    if (origin === config.clientOrigin) {
      reply.header('access-control-allow-origin', origin);
      reply.header('access-control-allow-credentials', 'true');
      reply.header('access-control-allow-headers', 'content-type');
      reply.header('access-control-allow-methods', 'GET,POST,OPTIONS');
    }
    if (req.method === 'OPTIONS') reply.code(204).send();
  });

  const setSession = async (reply: FastifyReply, playerId: string) => {
    const sessionId = await createSession(playerId);
    reply.setCookie(SESSION_COOKIE, sessionId, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: config.cookieSecure,
      maxAge: Math.floor(SESSION_TTL_MS / 1000),
    });
  };

  app.get('/api/health', async () => ({ ok: true, content: content.describe() }));

  /**
   * The catalogue the client needs to name things.
   *
   * Only id, name and the couple of fields the UI reads -- the full imported
   * definitions stay server-side, so growing the catalogue does not grow what
   * every player downloads.
   */
  app.get('/api/content', async () => ({
    items: content.manifest.items.map((i) => ({
      id: i.id,
      name: i.name,
      namePlural: i.namePlural,
      stackMax: i.stackMax,
    })),
    skills: content.manifest.skills.map((s) => ({ id: s.id, name: s.name, level: s.level })),
  }));

  app.post('/api/register', async (req, reply) => {
    const creds = CredentialsSchema.parse(req.body);
    const spawn = content.startingLocation;
    try {
      const player = await register(creds, {
        locationId: spawn.id,
        x: spawn.spawn.x,
        y: spawn.spawn.y,
      });
      await setSession(reply, player.id);
      return { id: player.id, username: player.username };
    } catch (err) {
      if (err instanceof AuthError) return reply.code(err.status).send({ error: err.message });
      throw err;
    }
  });

  app.post('/api/login', async (req, reply) => {
    const creds = CredentialsSchema.parse(req.body);
    try {
      const player = await login(creds);
      await setSession(reply, player.id);
      return { id: player.id, username: player.username };
    } catch (err) {
      if (err instanceof AuthError) return reply.code(err.status).send({ error: err.message });
      throw err;
    }
  });

  app.post('/api/logout', async (req, reply) => {
    await destroySession(req.cookies[SESSION_COOKIE]);
    reply.clearCookie(SESSION_COOKIE, { path: '/' });
    return { ok: true };
  });

  app.get('/api/me', async (req, reply) => {
    const player = await playerForSession(req.cookies[SESSION_COOKIE]);
    if (!player) return reply.code(401).send({ error: 'not signed in' });
    return {
      id: player.id,
      username: player.username,
      locationId: player.location_id,
      inventory: player.inventory ?? [],
      skills: skillStates(player.skills ?? {}),
    };
  });

  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof z.ZodError) {
      return reply.code(400).send({ error: 'That request did not look right.' });
    }
    console.error(err);
    return reply.code(500).send({ error: 'Something went wrong on our end.' });
  });

  return app;
}
