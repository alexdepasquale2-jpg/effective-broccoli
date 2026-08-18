import { describe, expect, it } from "vitest";
import { applyLeapToMeta, emptyMeta, nextMilestone, titleForLeaps } from "./meta.js";

describe("lineage meta", () => {
  it("names ranks from evolution leaps", () => {
    expect(titleForLeaps(0)).toBe("Lost Infant");
    expect(titleForLeaps(2)).toBe("Tool Knapper");
  });

  it("tracks next milestone", () => {
    const meta = emptyMeta();
    expect(nextMilestone(meta).name).toBe("Night Watcher");
    const reward = applyLeapToMeta(meta, { reinforced: ["motricity", "olfactory"] });
    expect(reward.gained).toBeGreaterThan(0);
    expect(meta.leaps).toBe(1);
  });
});
