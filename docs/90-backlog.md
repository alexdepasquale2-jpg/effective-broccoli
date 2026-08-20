# Backlog

Cut from v1, kept because they are good ideas whose time has not come. Each entry says what has to be
true before it is worth starting — the point being that most of them are gated on _players_, not on
engineering.

## From the concept

| Item                                                 | Wait until                                                                                                     |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Guild / community framework**                      | There are enough regular players to form groups. Formal groups for a population of twelve is ceremony.         |
| **Player-created quest tools**                       | The first-party quest system exists and is proven. Authoring tools for a system still in flux get rewritten.   |
| **Player-to-player economy, markets, trading posts** | Enough players and enough item variety that trade beats gathering. Needs the crafting web from M2 first.       |
| **Seasonal events / in-game calendar**               | There is a population to experience a season.                                                                  |
| **Player housing & construction**                    | M2 has landed. Wants persistent per-player space, which is a bigger persistence change than the slice's model. |
| **Creature relationships**                           | Art import (M2) — creatures need to be visible before they can be befriended.                                  |
| **Mobile support**                                   | Desktop play is actually good. Touch controls for a platformer are a design problem, not a CSS one.            |
| **Monetisation**                                     | See [`01-scope-reality.md`](01-scope-reality.md). Probably never for v1.                                       |
| **Auto-scaling infrastructure**                      | One box is measurably not enough. The room model already shards when that day comes.                           |

## Content still sitting in the CC0 import

Already downloaded, already parseable, not yet imported:

- **448 quests** — the largest single content win after items and skills
- **665 achievements**
- **49 location definitions** (M2)
- **~10,000 art assets** (M2)
- `quest_map` — the skill → quest mapping dataforge currently rejects as a non-skill. It becomes
  useful the moment quests are imported.
- Recipes, clothing, homes, and the giants' data in the `inc_data_*` files

## Engineering

- Interest-managed snapshots. Every occupant currently gets every actor each tick — fine for a street
  of a dozen, not for a crowd.
- Binary protocol (msgpack). Only if profiling asks for it; JSON is not the bottleneck yet.
- Rate limiting on `interact` and `chat`.
- Server-authoritative anti-cheat beyond range and cooldown checks.
- Horizontal room sharding.
- Account recovery. There is deliberately no email on file yet, which means there is deliberately no
  password reset.
