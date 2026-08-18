# Harpoon Reef

Top-down arcade harpoon incremental. Aim from your boat, hook fish, reel them in, sell at the market, buy upgrades, and trade rare species for pearls.

## Play

**Phone:** use the live `trycloudflare.com` link from the agent session.

```bash
npm install
npm run dev
```

Open `http://localhost:5173`, tap **Cast Off**, drag from the boat to aim, release to fire.

## Loop

- **Harpoon** fish swimming around your boat (top-down)
- **Reel** them in automatically — upgrade reel speed, range, and line strength
- **Cargo** fills up — sell at the **Market** for coins
- **Upgrades** make rarer fish spawn (sonar) and sell for more (trader's tongue)
- **Trade** bundles of rare/legendary fish for pearls

Progress saves in `localStorage`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm test` | Unit tests |
| `npm run build` | Build to `docs/` |
