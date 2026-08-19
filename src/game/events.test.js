import { describe, expect, it } from "vitest";
import { EVENTS, bestChoice, eventsForTier, pickEvent, resolveEvent } from "./events.js";

describe("event catalog", () => {
  it("gives every event both outcomes and a declared effect", () => {
    for (const event of EVENTS) {
      expect(event.onAct.length).toBeGreaterThan(0);
      expect(event.onPass.length).toBeGreaterThan(0);
      expect(["same", "better", "worse"]).toContain(event.effect);
      expect(event.cost).toBeGreaterThan(0);
      expect(event.window).toBeGreaterThan(0);
    }
  });

  it("makes inaction correct more often than action", () => {
    const passIsBest = EVENTS.filter((e) => bestChoice(e) === "pass").length;
    expect(passIsBest / EVENTS.length).toBeGreaterThan(0.5);
  });

  it("keeps the loud things from being the ones that need you", () => {
    const loud = EVENTS.filter((e) => e.loud);
    const quiet = EVENTS.filter((e) => !e.loud);
    const loudNeedsAction = loud.filter((e) => e.effect === "better").length / loud.length;
    const quietNeedsAction = quiet.filter((e) => e.effect === "better").length / quiet.length;
    expect(quietNeedsAction).toBeGreaterThan(loudNeedsAction);
  });

  it("only offers deeper events once the tier allows them", () => {
    expect(eventsForTier(1).every((e) => e.tier === 1)).toBe(true);
    expect(eventsForTier(3).length).toBe(EVENTS.length);
  });

  it("prefers events you have not just seen", () => {
    const recent = EVENTS.slice(0, EVENTS.length - 1).map((e) => e.id);
    const picked = pickEvent(3, () => 0, recent);
    expect(recent).not.toContain(picked.id);
  });
});

describe("resolveEvent", () => {
  const same = EVENTS.find((e) => e.effect === "same");
  const worse = EVENTS.find((e) => e.effect === "worse");
  const better = EVENTS.find((e) => e.effect === "better");

  it("charges you for acting and nothing for letting it pass", () => {
    expect(resolveEvent(same, true).cost).toBe(same.cost);
    expect(resolveEvent(same, false).cost).toBe(0);
  });

  it("records that acting on an unchangeable thing changed nothing", () => {
    const acted = resolveEvent(same, true);
    expect(acted.changedAnything).toBe(false);
    expect(acted.right).toBe(false);
    expect(resolveEvent(same, false).right).toBe(true);
  });

  it("flags interventions that made things worse", () => {
    expect(resolveEvent(worse, true).madeWorse).toBe(true);
    expect(resolveEvent(worse, false).madeWorse).toBe(false);
  });

  it("credits the rare thing that genuinely needed you", () => {
    const acted = resolveEvent(better, true);
    expect(acted.helped).toBe(true);
    expect(acted.right).toBe(true);
    expect(resolveEvent(better, false).missed).toBe(true);
  });
});
