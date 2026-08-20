# Roadmap

Estimates are in solo evenings-and-weekends time. Milestones past M2 are deliberately coarse —
estimating month nine of a solo project in week one is fiction, and M1's outcome should be allowed
to reshape what follows.

## M0 — Foundation ✅

Monorepo, TypeScript, ESLint, Vitest, CI against a real Postgres service, licence and credits, the
CC0 fetch script.

## M1 — Vertical slice ✅

> Sign in → spawn in a street → walk and jump → click a trant → harvest → item in your pack → skill
> XP → it all persists → and someone else sees you do it.

Delivered:

- `packages/shared` — protocol, deterministic shared physics, skill curve
- `packages/server` — argon2 auth, session cookies, `LocationRoom` at 20 Hz, authoritative harvest,
  JSONB persistence with timed and on-disconnect flush
- `packages/client` — PixiJS renderer with parallax, prediction and reconciliation, remote
  interpolation, inventory and skill HUD, reconnect with backoff
- `packages/dataforge` — CC0 importer (1,270 items, 105 skills) with build-time reachability
  validation
- 41 tests, including a full-stack integration suite driving two real WebSocket clients against
  real Postgres

## M2 — One real region (3–4 months)

The theme is _breadth of world_, using content that already exists.

1. **Import Glitch location geometry.** The 49 GSJS location files plus the community geometry
   exports. This is the milestone's main risk — geometry did not ship in the same shape as items, and
   community copies vary. The location schema already works, so this is an importer task against a
   known target, not a redesign.
2. **Import the CC0 art.** ~10,000 assets, packed into atlases. The renderer is already built around
   named layers and entity kinds, so this touches `render.ts` and the atlas step.
3. **Multiple connected locations**, with exits and travel between them. Rooms already isolate
   cleanly, so this is routing plus a transition.
4. **Crafting**, driven by the GSJS recipe data already sitting in the import.
5. **Chat**, promoted from the debug toast it currently is.

## M3 — Alpha (≈3 months)

Deploy to a single VPS. Backups, metrics, error reporting. Invite ten friends and fix what actually
breaks, which will not be what this document predicts.

## M4 and beyond

Everything in [`90-backlog.md`](90-backlog.md), reprioritised by what the alpha teaches. The likely
first candidates are quests (448 of them are already sitting in the CC0 import) and player housing.

## How to tell if this is going wrong

The failure mode for this kind of project is invisible until it is terminal, so these are the
tripwires:

- The game stops being playable on `main` for more than a week.
- A milestone is spent on engine work with no new player-visible behaviour.
- Content is being hand-authored that could have been imported.
- Systems are being built for a player population that does not exist yet.
