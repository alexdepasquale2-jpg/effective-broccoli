import type { IncomingMessage, Server } from 'node:http';
import { ClientMessageSchema, type ServerMessage } from '@glimmer/shared';
import { WebSocketServer, type WebSocket } from 'ws';
import { SESSION_COOKIE, playerForSession } from './auth.ts';
import type { World } from './game/world.ts';

/**
 * Reads a Cookie header into a map.
 *
 * @fastify/cookie exposes this at runtime but not through its published types,
 * and the format is small and stable enough that owning six lines beats
 * casting away the mismatch.
 */
function parseCookies(header: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq < 1) continue;
    const key = part.slice(0, eq).trim();
    if (!key || key in out) continue;
    try {
      out[key] = decodeURIComponent(part.slice(eq + 1).trim());
    } catch {
      // A malformed percent-escape means the cookie is not ours to read.
    }
  }
  return out;
}

/**
 * The game socket.
 *
 * Authentication happens once, at upgrade, from the same session cookie the
 * HTTP API uses -- there is no separate token to leak. After that the socket
 * is bound to one player id for its lifetime, so no client message can ever
 * claim to be somebody else.
 */
export function attachGameSocket(server: Server, world: World): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    if (!req.url?.startsWith('/ws')) return;

    void (async () => {
      const cookies = parseCookies(req.headers.cookie ?? '');
      const player = await playerForSession(cookies[SESSION_COOKIE]);
      if (!player) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }
      wss.handleUpgrade(req, socket, head, (ws) => {
        void onConnection(ws, req, world, player);
      });
    })().catch(() => {
      socket.destroy();
    });
  });

  return wss;
}

async function onConnection(
  ws: WebSocket,
  _req: IncomingMessage,
  world: World,
  player: Awaited<ReturnType<typeof playerForSession>>,
): Promise<void> {
  if (!player) return;
  const playerId = player.id;

  const send = (msg: ServerMessage) => {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
  };

  await world.join(player, send);

  ws.on('message', (raw) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw.toString());
    } catch {
      send({ t: 'error', code: 'bad_message', message: 'malformed json' });
      return;
    }

    const result = ClientMessageSchema.safeParse(parsed);
    if (!result.success) {
      send({ t: 'error', code: 'bad_message', message: 'unrecognised message' });
      return;
    }

    const room = world.roomOf(playerId);
    if (!room) return;
    const msg = result.data;

    switch (msg.t) {
      case 'input':
        room.setInput(playerId, { dx: msg.dx, jump: msg.jump }, msg.seq);
        break;

      case 'interact': {
        const outcome = room.harvest(playerId, msg.entityId);
        if (!outcome.ok) {
          send({
            t: 'error',
            code: outcome.code ?? 'unknown',
            message: outcome.message ?? 'that did not work',
          });
        }
        break;
      }

      case 'chat':
        room.say(playerId, msg.text);
        break;

      case 'ping':
        send({ t: 'pong', sentAt: msg.sentAt, serverTime: Date.now() });
        break;
    }
  });

  const disconnect = () => {
    void world.leave(playerId).catch((err) => {
      console.error(`failed to persist ${playerId} on disconnect: ${(err as Error).message}`);
    });
  };

  ws.on('close', disconnect);
  ws.on('error', disconnect);
}
