# Stick Ancestors

A mobile stick-figure take on **Ancestors: The Humankind Odyssey** — explore a savanna, conquer fear, discover neurons, reinforce them at camp, and leap generations.

## Play

**On a phone:** open the live HTTPS play link the agent gives you (`trycloudflare.com` while the session runs).

Tap **Begin Clan**, then tap the ground to walk and tap glowing **?** markers to investigate fear.

**On a computer:**

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Loop

- **Explore** the side-scrolling wilds: camp, berries, river, dark grove, rocks, tall grass, cave
- **Investigate** unknown places to map them and grow fear neurons (Ancestors-style dread → knowledge)
- **Survive** energy, thirst, and fear; groom clanmates at camp
- **Discover neurons** by interacting (olfactory from food, striking from rocks, predator sense from grass, etc.)
- **Rest** at camp to gain neuronal energy (NE)
- **Reinforce** discovered neurons from the Neurons panel
- **Evolution Leap** once Generational Memory is reinforced and you have 5+ neurons

Progress persists in `localStorage`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm test` | Unit tests |
| `npm run build` | Production build to `docs/` |

## Layout

- `src/game/ancestors.js` — clan sim, neurons, fear, evolution (tested)
- `src/game/wilds.js` — jungle map rendering
- `src/game/game.js` — loop, UI, input
- `src/game/stick.js` — hominid stick figures
