import { describe, expect, it } from "vitest";
import { emptyMeta, titleForCaught } from "./meta.js";

describe("meta", () => {
  it("starts broke on the dock", () => {
    const meta = emptyMeta();
    expect(meta.save.coins).toBe(0);
  });

  it("ranks captains by catch count", () => {
    expect(titleForCaught(0)).toBe("Dock Rat");
    expect(titleForCaught(40)).toBe("Harpoon Captain");
  });
});
