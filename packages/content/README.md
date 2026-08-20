# Content

Game content, in two parts.

## `authored/`

Hand-written content, committed to the repo. This is the bootstrap set the vertical slice runs on, so
the game is playable immediately after `npm install` with no downloads.

It is deliberately keyed by **real Glitch identifiers** (`apple`, `plank`, `light_green_thumb_1`,
`woodworking_1`). That means when the CC0 import runs, the imported definitions land on the same ids
and upgrade the authored stubs in place — the authored entries act as fallbacks, not as a parallel
universe that has to be reconciled later.

## `generated/`

Written by `npm run dataforge`, gitignored. Derived data is never committed; re-run the importer
instead.

If `vendor/glitch-gsjs` is present (see `scripts/fetch-cc0-sources.sh`), the generated bundle contains
the full CC0 catalogue — around 1,300 items and the complete 106-skill tech tree with its
prerequisite graph. If it is absent, the bundle contains just the authored set and the game still
runs.
