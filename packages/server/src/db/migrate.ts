import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sql } from './index.ts';

/**
 * Plain SQL migrations applied in filename order, tracked in a table.
 *
 * Deliberately not an ORM migration toolchain: the schema is three tables of
 * mostly JSONB, and readable SQL beats generated SQL at this size.
 */
const migrationsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'schema');

export async function migrate(log: (msg: string) => void = console.log): Promise<string[]> {
  await sql`
    create table if not exists _migrations (
      name       text primary key,
      applied_at timestamptz not null default now()
    )
  `;

  const applied = new Set(
    (await sql<{ name: string }[]>`select name from _migrations`).map((r) => r.name),
  );

  const files = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();
  const ran: string[] = [];

  for (const file of files) {
    if (applied.has(file)) continue;
    const contents = await readFile(path.join(migrationsDir, file), 'utf8');
    await sql.begin(async (tx) => {
      await tx.unsafe(contents);
      await tx`insert into _migrations ${sql({ name: file })}`;
    });
    log(`applied ${file}`);
    ran.push(file);
  }

  if (ran.length === 0) log('database up to date');
  return ran;
}

// Run directly: `npm run db:migrate`
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    await migrate();
  } catch (err) {
    console.error(`migration failed: ${(err as Error).message}`);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}
