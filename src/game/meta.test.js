import { describe, expect, it } from "vitest";
import { applyRunToMeta, emptyMeta, nextUnlock, runXp, titleForXp } from "./meta.js";

describe("runXp", () => {
  it("pays score, orbs, and drafts", () => {
    expect(runXp({ score: 100, orbs: 4, drafts: 1 })).toBe(170);
  });
});

describe("unlock ladder", () => {
  it("unlocks the next boon when XP crosses a threshold", () => {
    const meta = emptyMeta();
    const result = applyRunToMeta(meta, { score: 50, orbs: 0, drafts: 0 }, [
      { xp: 40, id: "thin" },
      { xp: 200, id: "orbit" },
    ]);
    expect(result.gained).toBe(50);
    expect(result.unlocks).toEqual(["thin"]);
    expect(meta.unlocked).toContain("thin");
    expect(nextUnlock(meta, [{ xp: 40, id: "thin" }, { xp: 200, id: "orbit" }]).id).toBe("orbit");
    expect(result.next.need).toBe(150);
  });

  it("names ranks from XP", () => {
    expect(titleForXp(0)).toBe("Nobody");
    expect(titleForXp(400)).toBe("Campus Legend");
  });
});

describe("empty life", () => {
  it("starts a broke stick with no hat", () => {
    const meta = emptyMeta();
    expect(meta.hero.cash).toBe(20);
    expect(meta.hero.items.hat).toBe(false);
  });
});
