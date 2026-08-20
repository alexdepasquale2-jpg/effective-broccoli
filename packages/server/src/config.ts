import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export const config = {
  root: path.resolve(here, '..', '..', '..'),
  port: Number(process.env.PORT ?? 8080),
  host: process.env.HOST ?? '0.0.0.0',
  databaseUrl: process.env.DATABASE_URL ?? 'postgres://localhost:5432/glimmer',
  /** Origin allowed to talk to the API in dev, where the client is on its own port. */
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
} as const;

export const contentDir = path.join(config.root, 'packages', 'content', 'generated');
