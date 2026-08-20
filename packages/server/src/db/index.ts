import postgres from 'postgres';
import { config } from '../config.ts';

/**
 * One connection pool for the process. Deliberately small: a single-box
 * deployment with a few dozen concurrent players does not need more, and a
 * small pool surfaces slow queries instead of hiding them behind concurrency.
 */
export const sql = postgres(config.databaseUrl, {
  max: 10,
  onnotice: () => {},
});

export type Sql = typeof sql;
