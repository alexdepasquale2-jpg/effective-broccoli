import { describe, expect, it } from "vitest";
import { FarmPlot, createFarmGrid } from "./farmPlot.js";

describe("FarmPlot & Grid logic", () => {
  it("plants and grows crops over time", () => {
    const plot = new FarmPlot(0, 0, 0);
    expect(plot.plant("parsnip")).toBe(true);
    expect(plot.crop.isReady).toBe(false);

    // Update with half time
    plot.update(3);
    expect(plot.crop.isReady).toBe(false);

    // Water the plot and update
    plot.water();
    expect(plot.isWatered).toBe(true);

    // Watered crops grow faster, finishing up remaining 3s
    plot.update(2); // 2 * 1.75 = 3.5s progress -> total > 6s
    expect(plot.crop.isReady).toBe(true);

    // Harvest
    const harvestResult = plot.harvest();
    expect(harvestResult.id).toBe("parsnip");
    expect(harvestResult.yieldValue).toBe(8);
    expect(plot.crop).toBe(null);
  });

  it("creates farm grid with expansion support", () => {
    const baseGrid = createFarmGrid(9, 0);
    expect(baseGrid.length).toBe(9);

    const expandedGrid = createFarmGrid(9, 2); // +8 plots
    expect(expandedGrid.length).toBe(17);
  });
});
