import { describe, expect, it } from "vitest";
import { INCIDENT_TYPES, Incident } from "./incidentData.js";

describe("Incident Data & Simulation", () => {
  it("defines loud vs quiet incidents with correct needs", () => {
    expect(INCIDENT_TYPES.whirlwind.loud).toBe(true);
    expect(INCIDENT_TYPES.whirlwind.need).toBe("pass"); // Loud things resolve themselves!

    expect(INCIDENT_TYPES.crying_stranger.loud).toBe(false);
    expect(INCIDENT_TYPES.crying_stranger.need).toBe("tend");

    expect(INCIDENT_TYPES.stuck_sheep.loud).toBe(false);
    expect(INCIDENT_TYPES.stuck_sheep.need).toBe("act");
  });

  it("resolves naturally via pass when player ignores it", () => {
    const inc = new Incident("whirlwind", 100, 100);
    // Player is far away
    const res1 = inc.update(2.0, 500, 500, 0, false);
    expect(res1).toBe(null);

    // Drain timer
    const res2 = inc.update(10.0, 500, 500, 0, false);
    expect(res2).toBeDefined();
    expect(res2.action).toBe("pass");
    expect(res2.right).toBe(true); // Whirlwind need was pass!
  });

  it("resolves via tend when player stays calm nearby", () => {
    const inc = new Incident("crying_stranger", 100, 100);
    // Player stands still inside radius
    inc.update(1.0, 110, 100, 0, false);
    expect(inc.resolved).toBe(false);

    const res = inc.update(1.5, 110, 100, 0, false);
    expect(res).toBeDefined();
    expect(res.action).toBe("tend");
    expect(res.right).toBe(true);
  });

  it("resolves via act when player strikes nearby", () => {
    const inc = new Incident("stuck_sheep", 100, 100);
    const res = inc.update(0.1, 110, 100, 100, true);
    expect(res).toBeDefined();
    expect(res.action).toBe("act");
    expect(res.right).toBe(true);
  });
});
