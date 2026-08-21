# Project Glimmer

A modern revival of Tiny Speck's _Glitch_ — the whimsical, non-violent MMO set inside the dreams of
eleven giants — rebuilt on the game's own public-domain art and game data.

> **Status: early.** The vertical slice runs: register, walk around a street, harvest a tree, gain
> skill XP, and see other players move in real time, with everything persisted. See
> [`docs/20-roadmap.md`](docs/20-roadmap.md) for what comes next.

## Why this can work

When Tiny Speck closed _Glitch_ they released its art and its complete server-side game logic into
the public domain under CC0. That release includes every item definition, skill, recipe, quest, and
achievement the live game shipped with. Project Glimmer treats that as a **content database** and
builds a modern TypeScript engine around it — so the years of design work that went into Ur don't
have to be redone. See [`CREDITS.md`](CREDITS.md).

## Quickstart

Requires **Node 22+** and a **PostgreSQL 16** server.

```bash
npm install

# Point at your database (defaults to postgres://localhost:5432/glimmer)
export DATABASE_URL=postgres://localhost:5432/glimmer

npm run db:migrate     # create the schema
npm run dataforge      # build content into packages/content/generated
npm run dev            # server on :8080, client on :5173
```

Open <http://localhost:5173> in two browser windows, register two accounts, and you should see both
avatars in the same street.

Optionally, to import the real Glitch item and skill catalogue rather than the small authored
bootstrap set:

```bash
./scripts/fetch-cc0-sources.sh   # clones the CC0 GSJS repo into vendor/
npm run dataforge
```

## Layout

| Path                 | What it is                                                         |
| -------------------- | ------------------------------------------------------------------ |
| `packages/shared`    | Wire protocol (zod schemas), shared types, tick constants          |
| `packages/server`    | Fastify auth + WebSocket game server, Drizzle/Postgres persistence |
| `packages/client`    | Vite + PixiJS browser client                                       |
| `packages/dataforge` | Build-time importer that turns CC0 sources into game content       |
| `packages/content`   | Authored bootstrap content, plus generated output (gitignored)     |
| `docs/`              | Vision, scope, architecture, roadmap, ADRs                         |

## Documentation

- [The original concept](docs/00-concept.md) — the long-term vision, preserved as written
- [Scope and reality](docs/01-scope-reality.md) — what a solo project actually builds, and why
- [Architecture](docs/10-architecture.md) — the location-room model
- [Data pipeline](docs/11-data-pipeline.md) — how CC0 sources become content
- [Roadmap](docs/20-roadmap.md)
- [Legal](docs/30-legal-and-credits.md)

## Also in this repository

[`zhaelim/`](zhaelim/README.md) — **Zha'elim**, a self-contained mobile game with no build step and
no dependencies: a hex-lattice timing puzzle, an invented language with a derived glyph script, and
a daily breathing rite. It shares nothing with Project Glimmer but the repository. Run it with
`node zhaelim/serve.mjs`.

## License

Project Glimmer's own code is MIT ([`LICENSE`](LICENSE)). Imported Glitch assets and game data are
CC0 1.0 (public domain). The Glitch name and logo are trademarks and are **not** used by this
project.
