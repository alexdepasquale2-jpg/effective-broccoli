# Aether

A 2D mobile arcade game we can iterate on. Drag a glowing spark, collect light orbs, and dodge dark shards.

The genre and name are placeholders — this is a playable foundation with touch-first controls, scoring, and a full game loop.

## Play

```bash
npm install
npm run dev
```

Then open the local URL (default `http://localhost:5173`) on desktop or your phone.

- **Drag** to move
- **Collect gold orbs** for points and combos
- **Avoid red shards**
- High score is saved on the device

Add it to the home screen from a mobile browser for a fullscreen, app-like feel.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm test` | Run unit tests for scoring, collision, and difficulty |
| `npm run build` | Production build |
| `npm run preview` | Serve the production build |

## Project layout

- `src/main.js` — boots the canvas and UI
- `src/game/game.js` — loop, spawning, drawing, input
- `src/game/utils.js` — collision, scoring, difficulty (tested)
- `src/game/audio.js` — tiny synthesized sound effects
- `src/game/storage.js` — local high score
