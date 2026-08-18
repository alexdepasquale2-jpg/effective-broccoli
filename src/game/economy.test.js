import { describe, expect, it } from "vitest";
import { addToCargo, buyUpgrade, createSave, executeTrade, sellAll, TRADES } from "./economy.js";

describe("harpoon economy", () => {
  it("stores fish until cargo is full", () => {
    let save = createSave();
    save.upgrades.hold = 0;
    const first = addToCargo(save, "minnow");
    expect(first.ok).toBe(true);
    save = first.save;
    for (let i = 0; i < 8; i += 1) {
      const next = addToCargo(save, "minnow");
      if (!next.ok) {
        expect(i).toBeGreaterThan(4);
        return;
      }
      save = next.save;
    }
  });

  it("sells cargo for coins", () => {
    const save = { ...createSave(), cargo: { minnow: 3 } };
    const sold = sellAll(save);
    expect(sold.coins).toBeGreaterThan(0);
    expect(sold.cargo.minnow || 0).toBe(0);
  });

  it("buys upgrades when affordable", () => {
    const save = { ...createSave(), coins: 200 };
    const bought = buyUpgrade(save, "range");
    expect(bought.ok).toBe(true);
    expect(bought.save.upgrades.range).toBe(1);
  });

  it("trades rare fish for pearls", () => {
    const save = { ...createSave(), cargo: { angelfin: 2 } };
    const trade = executeTrade(save, TRADES[0]);
    expect(trade.ok).toBe(true);
    expect(trade.save.pearls).toBe(1);
  });
});
