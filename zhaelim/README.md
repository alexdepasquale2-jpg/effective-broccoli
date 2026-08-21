# Zha'elim — the game that plays you back

A mobile game left behind by three peoples who could not agree on anything except that it should
be finished. The Vel (plasmoids, who live in the loud part of stars and last only moments), the Kor
(blue avians, who hold form and will not be hurried) and the Sha (Pleiadians, who came from seven
close stars and stayed) each contributed one tongue, and the treaty between those tongues is the
whole rule set.

It runs in a browser, installs to a home screen, works offline, and has **no build step, no
dependencies and no network calls of any kind**. Open it and it plays.

```bash
node zhaelim/serve.mjs      # → http://localhost:5178
```

(ES modules will not load from `file://`, which is the one thing the three peoples cannot help you
with. Any static server works; `serve.mjs` is thirty lines and has no dependencies.)

## The rule

Time moves in **breaths**. When you cast, a wave is born at your finger but does not touch the cell
beneath it — on the next breath it stands one ring out, the breath after that two rings out, and so
on until it has spent its reach.

**A sleeping seed wakes when all three tongues stand on it in the same breath.** Not two. Not
three, near enough. The same breath.

|              | reach | cost | temperament                     |
| ------------ | ----- | ---- | ------------------------------- |
| **Vel**'zhu  | 3     | 2 ma | near, quick, arrives completely |
| **Kor**'aen  | 5     | 2 ma | measured, true, patient         |
| **Sha**'mira | 7     | 3 ma | far, slow, forgiving            |

So waking a seed is an arithmetic problem you solve with your thumb: cast Sha from five cells away
on this breath, Kor from three cells away two breaths later, Vel from one cell away two breaths
after that, and all three rings arrive together. Two tongues arriving is a **chime** — not a
waking, but not nothing, and it pays you back a little ma.

Everything else is that rule wearing a different hat: veils that waves must walk around (so the
walk, not the straight line, is what counts), prisms that repeat whatever reaches them, and ma that
returns one per breath so you cannot simply cast your way out of a bad plan.

## What is in here

| Room       | What it is                                                                        |
| ---------- | --------------------------------------------------------------------------------- |
| **Weave**  | Fourteen songs, in the order the three peoples agreed to teach them               |
| **Tongue** | Ilu'thaan — a working dictionary and a phrase composer that talks back            |
| **Codex**  | Sixteen transmissions, opened by playing, written by the engineers who built this |
| **Rite**   | The Long Inhale: four in, two held, six out, two empty, five times. Not scored    |
| **Nest**   | Everything you have woken, kept rather than ranked                                |

## Layout

```
zhaelim/
├── index.html            the shell; everything else is a module it pulls in
├── serve.mjs             a dependency-free static server for local play
├── sw.js                 cache-first service worker; the shell is the app
├── src/
│   ├── core/             hex maths, deterministic noise, storage, haptics
│   ├── game/             castes, lattice, simulation, solver, the fourteen songs
│   ├── audio/            the voice: a synthesiser, no samples, just intonation on 54 Hz
│   ├── render/           the lattice view, the derived glyph script, the palette
│   ├── culture/          the lexicon, the grammar, the codex, the rite
│   └── ui/               five screens and a tab bar
├── test/                 the rules, under test
└── tools/                verify-songs (proves every lattice is solvable), e2e
```

`src/game/simulation.js` is pure: the same state and the same casts always give the same universe.
Everything that decides anything lives there, so it can be tested without a browser, and it is.

## Two things worth knowing about the code

**Every song is proved solvable before it ships.** `tools/verify-songs.mjs` runs a planner over
each authored lattice and reports the budget it actually needs. A hard puzzle is a gift; an
impossible puzzle presented as hard is a small cruelty. `npm run verify` inside `zhaelim/`.

**The hint is the same planner.** "Ask the Kor" runs `planSeed` against the live board and offers
exactly one cast — the one that is due this breath — and no explanation. There is no separate
hand-authored hint table to drift out of sync with the rules.

## Checks

```bash
cd zhaelim
npm test        # 18 tests: hex maths, wave propagation, braiding, the tongue, the rite
npm run verify  # proves all fourteen songs weave inside their own breath budgets
npm run e2e     # optional; needs playwright. Plays song one to completion in a real browser
```

## Accessibility and manners

Nothing here notifies you, follows you, or grieves. There is no account, no server, no analytics
and no network request — the Nest lives in `localStorage` on your own device and the "forget
everything" button really does. Time does not move while you hold the game still, motion can be
calmed from the Nest, and the voice can be silenced. The three tongue colours stay distinguishable
without red/green discrimination, which is why Vel is orange.

## License

MIT, with the rest of this repository.
