# Warm War 2026

A turn-based hybrid strategy game: **Russia · Europe · 2026**. You command either the European Coalition or the Russian Federation. The board now carries **troops, drones, missiles, supplies, supply lines, energy, and pipelines**. Win the continent **without** lighting the match.

This is a strategy game, not a forecast.

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:8080](http://localhost:8080).

**Hosted build:** [https://alexdepasquale2-jpg.github.io/effective-broccoli/](https://alexdepasquale2-jpg.github.io/effective-broccoli/) (GitHub Pages — enable Pages from the `gh-pages` branch or GitHub Actions in repo settings if the link is not live yet).

## How to play

Each season you have **3 operations**. Operations spend **supplies**. Tap a theater, then an action:

| Action | What it does |
|--------|----------------|
| SHAPE | Influence. Weaker if the theater is off a live supply line. |
| GRID | Energy and pipelines. Repair or squeeze a hub, restock supplies. |
| NET | Cyber. Cuts supply lines from that theater for 2 seasons; can nick a pipe. |
| HOLD | Shield, depot fill, harden a pipe hub. |
| TROOPS | Deploy one formation from reserve. May clash. Raises Heat. |
| DRONE | Package from reserve. Interdicts lines, can pick off a troop, nicks pipes. |
| STRIKE | Expend one missile. Hits troops, drones, depots, pipelines. Sharp Heat spike. |
| TALK | Lower Heat and reopen cut corridors. |

**Win:** control 8 of 13 theaters.  
**Lose together:** Heat hits 100.  
**Clock:** 8 seasons.

Gold lines are European supply, red are Russian, cyan are pipelines, dark red are cut. Cyan triangles mark pipe hubs. Unsupplied formations take attrition at season end. Live batteries feed missiles; West EU and the Black Sea feed drones.

## Stack

Phaser 4 + Vite + TypeScript.
