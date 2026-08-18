# Stick RPG

A 2D mobile life sim in the spirit of classic Flash-era Stick RPG, with a 4D well at the end of the street.

Walk **Paper Thin Blvd**. Tap buildings. Get a job. Raise STR / INT / CHA / Karma. Sleep or pass out. Spend your greasy cash. When you are ready, dive **The Well** — the old arcade Fold run, now a dungeon that pays out in dollars.

## Play

**On a phone:** localhost will not work. Open the live HTTPS play link the agent gives you (a `trycloudflare.com` URL while this session is running).

Tap **Start Life**, then tap the street to walk and tap a building to enter.

**On a computer:**

```bash
npm install
npm run dev
```

Then open `http://localhost:5173`.

A static build also lives in `docs/` if you later host it (GitHub Pages, Netlify, and similar).

- **Town:** tap to walk, enter McStick's, U of S, the gym, Sky's Bar, the pawn shop, the clinic, church, or your pad
- **Time** passes. Sleep at home. Don't work yourself into a zombie.
- **The Well:** drag to move, **Fold** between ANA/KATA, draft boons, crawl out with cash
- Stats, cash, day, and unlock XP persist in `localStorage`

Add it to the home screen from a mobile browser for a fullscreen, app-like feel.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm test` | Run unit tests |
| `npm run build` | Production build |
| `npm run preview` | Serve the production build |

## Project layout

- `src/main.js` — boots the canvas and UI
- `src/game/game.js` — town / well modes, loop, input
- `src/game/rpg.js` — hero, buildings, jobs, clock (tested)
- `src/game/town.js` — street, NPCs, stick-figure city
- `src/game/stick.js` — stick people
- `src/game/hypercube.js` — 4D rotations, tesseract / 16-cell, projection (tested)
- `src/game/meta.js` — XP, ranks, unlock ladder (tested)
- `src/game/boons.js` — drafts, stacking, evolutions (tested)
- `src/game/slice.js` — ANA/KATA collision and scoring (tested)
- `src/game/utils.js` — collision, scoring, difficulty (tested)
- `src/game/audio.js` — tiny synthesized sound effects
- `src/game/storage.js` — local save
