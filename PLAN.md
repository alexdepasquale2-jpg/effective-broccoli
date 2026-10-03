# PLAN — "Mergeborn" (card battler × clicker × merge-summon idle)

Third game in this repo, separate from Canon Lane. Route: `?game=merge`. Code: `src/mergeborn/` (`sim/` pure TS + node tests, `scenes/` Phaser), same as `canon-lane`.
Visual plan: `docs-plan/mergeborn-plan.html` (https://claude.ai/artifact/HFYyLb17qiEDonXTfJQtRB).

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
| L1 **Shuffle** | Stage 25 boss | Gold, board, stage | Essence = floor(((stage−20)/2.5)^1.6) | Essence shop: start tier, summon odds, tap mult. Unlocks Tap Stage 2 |
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
Done: Phases 1–3; Phase 4 core: Ascend (after 1st Shuffle; wipes run+Essence+shop; +1 element, +1 random hero), chi tiles, element merges, counter wheel, hero summons (4%), all 36 hero skills live, hero collection screen with card art.
Phase 5a done: Eras I–V (gate stage 60; ×3 dmg ×2 gold each; Decay, Hex, Fusion, Turncoat). Heroes survive Era resets.
Phase 5b done: Revolution (Era V stage 60; ×10 dmg ×5 gold; one automation per Revolution: merge, summon, upgrade, Shuffle, Ascend; challenges No Tap / No Merge / Tiny Board, clear at stage 30 for ×2 dmg). Graphics pass done (juice, board cards, atmosphere).
Phase 6 done: `npm run balance [hours]` bot. Pacing (perfect bot, 4 taps/s): Shuffle #1 10 min, Ascend 1 34 min, Era 2 1.4 h, Era 5 7 h, Revolution 1 7.5 h, Rev 2 17.5 h, Rev 3 31.6 h; 34/36 heroes by 48 h.
Open: Shuffle runs hold ~8 min (Ascend resets the Shuffle count, so the old "Shuffle #10 in 90 s" target no longer applies).

## Phase 4 design (agreed)
- Ascend: any time after 1st Shuffle; resets run + Essence + shop; pays 1 token = 1 random hero unlock; each Ascend adds next element (Fire→Water→Earth→Air→Light→Void).
- Elements: tiles hold chi (re-rolled each run); cards take tile chi; merge needs same tier + element (neutral merges into any). Enemies have elements; counter wheel ×2 / ×0.5.
- Heroes: 6 per element, rare summon roll, keep skill when tiering. Fire batch (art in docs-plan/): Fire Bellows (adjacent +25%), Magma Turtle (boss +5 s), Flare Sprite (summon wager: 25% free +1 tier / 10% burns), Ifrit Duelist (every 10th tap ×10), Smelter (merge 2 copies → 3× merge gold), Wildfire Hound (×1.5 vs Earth).
- Water batch (art in docs-plan/): Drowned Bellringer (after boss kill next 3 foes -30% HP), Tide Clerk (offline gold +50%), Mirror Eel (adjacent merges 10% leave a T1 copy), Rain Smuggler (summon cost -15%), Undertow Siren (shields don't reduce board damage), Abyss Diver (×1.5 vs Fire).
- Earth/Air/Light/Void batches (art via template generator, sheets in docs-plan/<element>-heroes.png):
  Earth: Quarry Golem (+10%/Earth card), Root Weaver (neighbours +1 tier/5 min), Moss Hermit (no taps 10 s → ×2), Gem Miner (5% 10× gold kill), Tremor Ram (boss HP −20%), Stone Warden (×1.5 vs Air).
  Air: Gale Courier (auto-tap 2/s), Kite Thief (taps earn 2% dmg as gold), Storm Bard (combo cap +5), Feather Monk (+3% lucky merge), Thunder Hawk (every 5 s burst), Cyclone Dervish (×1.5 vs Water).
  Light: Lantern Saint (all +10%), Prism Knight (neighbours +30% of its power), Dawn Herald (first foe/stage 1 HP), Mirror Oracle (pity 7), Sun Forger (Essence +20%), Radiant Judge (×2 vs Void).
  Void: Hollow King (merges into it 15% +2), Null Jester (kill gold ×3 or ×0), Rift Walker (merges any element), Ink Wraith (enemies −1% HP/s), Eclipse Widow (bosses no regen/split), Abyssal Seer (×2 vs Light).
- Counter wheel: Fire>Earth>Air>Water>Fire; Light and Void counter each other.

## Hyperslice (public/fractal4d.html): all 10 systems, DONE. Next: real-device test (phone touch, mic hum), tune rapid speed.
1. Regions along w: one seed per region, crossfade at borders, locked past `unlocked`.
2. Harmony: consonance(f1,f2) from simple ratios; consonant pairs attract, dissonant repel.
3. Wave field: tap/hum emits 4D waves; entities feel gradient, waves ripple the surface (shader).
4. Player orb + tap entity to take its tone; humming (mic pitch detect) sets tone; 2-finger pinch/4D; haptics.
5. Chords (done): 3 attuned distinct pitch classes = chord → unlock next region. Progress + places (songs as seeds) in localStorage.
6. Sound: region drone glides on crossing, sequencer per region, entities sing. Entity cap adapts to fps.

## Hyperslice v3 (DONE): generative depth (seed tree: world → region → species → individual → offspring)
- Depth tier = |region|. Deeper = more fractal families, species, music voices, exotic scales, mutation.
- Terrain: 4 families (quat Julia z², cubic z³, 4D Mandelbox, 4D KIFS), per-region params, cosine palette, fog, vibration freq. Crossfade = mix of 2 DEs.
- Species: per-region genomes (shape ×5, size, 4D span, temperament: social/curious/shy/drift, motif, name). Individuals vary ±10%.
- Lineage: consonant excited pairs that touch breed a hybrid (blended traits + mutation, gen+1). Bestiary saved per world.
- Music: L-system phrase from species motif, chord progression per bar, bass/pad/counter voices unlock by depth.
- Region heart: one large long-span landmark per region singing the root; tap it to take the root tone.

## Hyperslice v4 (DONE): the hive along w
Ant colony lives at hive.w (±1.15–1.5). Sun drifts the slice ±0.65 in w on a 150 s day. Ants: individual traits, 3 chemical fields on a 12^4 grid, path integration home.
Order = 1 − spatial entropy. Chorus tunes with order. Passing the core (needs region ±1 open) = "hive mind" event. Next: real-device fps with ~400 ants.

## Hyperslice v5 (DONE): a world built from 4D slices
First-person flight through an endless lattice of golden cells (2φ²). Each cell: one of 6 4D families (any family anywhere, regions lean the odds), golden-angle rotation, own slice.
w at a point = 0.55·sin(2.2·W + dist/φ²), so travel cycles you through slices. Shapes, scales, rhythms are continuous/generated. Fixed: fps counter (wall-clock), uniforms set on wrong program.
Next: check on a real GPU; tune Kaleido/Menger/Icosa so they don't read as dust at low res.

## Hyperslice v6 (DONE): minds
Species learn note transitions from what they hear (answer you with learned phrases), learn to value notes that attuned them (approach them), hybrids inherit blended memory.
Hive learns your sequence and predicts your next note (accuracy shown; hums its guess when near). Test: 4-note loop → hive 88% after 3 loops, 99% after 30; species sang the loop back.

## Hyperslice v7 (DONE): nested universes
Flying into a block's body (<0.75·sc from centre) = 1.6 s fall (spiral tunnel, w sweep, flash, glissando) into a universe seeded by that cell, leaning to its family and constant. Stack of universes; Rise ↑ / X climbs out beside the block. Each visited universe is kept in Places.
