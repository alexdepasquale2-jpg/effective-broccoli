import { purgeExpiredSessions } from './auth.ts';
import { buildApp } from './app.ts';
import { config } from './config.ts';
import { Content } from './content.ts';
import { sql } from './db/index.ts';
import { World } from './game/world.ts';
import { attachGameSocket } from './net.ts';

const content = await Content.load();
console.log(`content: ${content.describe()}`);

const app = await buildApp(content);
const world = new World(content);

await app.listen({ port: config.port, host: config.host });
attachGameSocket(app.server, world);
await purgeExpiredSessions();

console.log(`glimmer server listening on http://${config.host}:${config.port}`);

let shuttingDown = false;
const shutdown = async (signal: string) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n${signal} received, saving the world...`);
  try {
    await world.stop();
    await app.close();
    await sql.end();
    console.log('saved.');
    process.exit(0);
  } catch (err) {
    console.error(`unclean shutdown: ${(err as Error).message}`);
    process.exit(1);
  }
};

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
