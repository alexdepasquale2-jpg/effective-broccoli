# PLAN — "Mergeborn" (card battler × clicker × merge-summon idle)

Third game in this repo. Route: `?game=merge`. Code: `src/mergeborn/` (`sim/` pure TS + node tests, `scenes/` Phaser), same as `canon-lane`.

## Pillar
Revolution Idle structure: each layer you unlock **changes how the earlier layers work**.
Tap, Summon, Merge, Battle, Prestige: every one gets its own upgrade track and **evolves** (new verbs, not just bigger numbers).
Rule: something new unlocks every 30–90 s early on, every 5–10 min mid-game, and on each reset later. No dead stretches.

## Core loop (first 60 seconds)
1. **Tap** the enemy card → damage + Gold.
2. **Summon** (Gold) → a random Tier-1 card drops onto a 4×4 board.
3. **Merge**: drag two identical cards together → one card a tier higher (power ×2.5, so merging always beats hoarding).
4. Cards on the board **auto-attack** the enemy each tick. Each kill gives Gold; every 10th enemy is a **Boss** with a timer.
5. Bosses hand out Gold and unlock the next system.

## Systems and how each one evolves
| System | Stage 1 | Stage 2 | Stage 3 | Stage 4 (automation) |
|---|---|---|---|---|
| Tap | Strike | Combo meter (×dmg while chaining) | Crit → chain-hit board cards (tap buffs allies) | Auto-tapper; taps become "Draws" (instant summon) |
| Summon | 1 card, flat odds | Multi-summon ×5/×10, pity counter | Banners (pick an element), lucky "skip-tier" summons | Auto-summon when board slot frees |
| Merge | 2 → 1 | Merge combo bonus Gold, chance +2 tiers | 3-way fusion → Hybrid cards (two elements) | Auto-merge; Merge-chain explosions deal AoE |
| Battle | 1 enemy lane | Enemy decks with traits (shield, regen, split) | Your board gets synergies (adjacent element/class bonuses) | Gauntlet: auto-pushes stages; you set formation |
| Board | 4×4 | 5×5, cell buffs (fire tile, +crit tile) | Multiple boards (decks) fight in parallel | Boards merge into each other at Era reset |

## Reset layers (Revolution Idle style)
| Layer | Unlocks at | Resets | Currency | Permanent rewards / rule change |
|---|---|---|---|---|
| L1 **Shuffle** | Stage 25 boss | Gold, board, stage | Essence = floor(sqrt(maxGold/1e6)) | Essence shop: start tier, summon odds, tap mult. Unlocks Tap Stage 2 |
| L2 **Ascend** | 10 Shuffles or 1e4 Essence | + Essence, Essence shop | Sigils | New **Element** joins the pool (Fire→Water→Earth→Air→Light→Void). Each one adds a counter mechanic |
| L3 **Codex** | Collect every card up to tier 12 | Collection progress | Pages | Codex gives permanent "card skills" (on-merge, on-death, aura). Merge Stage 3 |
| L4 **Era** | Final boss of each Era | Everything below | Era Shards | **Rules mutate**: Era 2 = cards decay, Era 3 = board grid hexes, Era 4 = enemies merge too, Era 5 = you can summon enemy cards |
| L5 **Revolution** | Era 5 | All | Revolutions | Automation for every lower layer; challenge runs (no tap / no merge / 3×3 board) with permanent multipliers |

Each layer also automates the one below (auto-Shuffle at X Essence, auto-Ascend…), so the old grind becomes a background number.

## Keeping the grind fun
- Variable rewards: summon odds, lucky +2 tier merges, crit chains. Pity timers so bad luck never lasts.
- Visible goal ladder: always show the next 3 unlocks with a progress bar.
- Make merging feel good: screen shake, sound pitch rises with tier, card art changes at tiers 5, 10, 15.
- Each reset gets faster (target: Shuffle #1 ≈ 8 min, #10 ≈ 90 s), so resets feel like power spikes.
- Offline progress (capped at 8 h, raised by upgrades), shown as a "while you were away" summary.
- Challenges and Codex give completionists a second target besides the main number.
- Honest design: no paid currency, no FOMO timers, no loot-box spending.

## Numbers (starting values, tune in sim)
- Card power: `base × 2.5^tier × elementMult`. Summon cost: `10 × 1.15^summons` (resets on Shuffle).
- Enemy HP: `20 × 1.18^stage`; boss = ×8 HP, 30 s timer.
- Tap damage = 1 + 5% of board DPS (so tapping stays relevant late).
- Big numbers: use mantissa/exponent (break_infinity-style) once over 1e300, which Era 2+ will pass.

## Build phases (each one playable and tested)
1. Sim core: state, tap, summon, merge, auto-battle tick, save/load + tests. Phaser board scene, route `?game=merge`.
2. Bosses, stages, the upgrade track for each system (Stages 1–2), offline progress.
3. L1 Shuffle + Essence shop, goal-ladder UI, juice (shake/sound/particles).
4. L2 Ascend + elements/synergies, L3 Codex + card skills.
5. L4 Eras with rule mutators, L5 Revolution + automation + challenges.
6. Balance pass: headless sim script that plays optimally and prints time-to-each-unlock vs the pacing targets.

## Status
Done: plan. Next: Phase 1. Blockers: none.
