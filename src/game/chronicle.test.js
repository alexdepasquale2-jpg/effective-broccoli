import { describe, expect, it } from "vitest";
import {
  accounting,
  chronicleVerdict,
  createChronicle,
  discernment,
  interventions,
  recordBeat,
  recordCollapse,
  recordThread,
} from "./chronicle.js";

const best = { key: "best", rank: 0, title: "It held", text: "..." };
const mid = { key: "mid", rank: 1, title: "Roughly even", text: "..." };
const worst = { key: "worst", rank: 2, title: "It went", text: "..." };

describe("chronicle", () => {
  it("counts each verb separately", () => {
    let c = createChronicle();
    c = recordBeat(c, { choice: "pass", need: "pass", threadTitle: "T", text: "" });
    c = recordBeat(c, { choice: "act", need: "pass", threadTitle: "T", text: "" });
    c = recordBeat(c, { choice: "tend", need: "tend", threadTitle: "T", text: "" });
    expect(c.beats).toBe(3);
    expect(c.passed).toBe(1);
    expect(c.acted).toBe(1);
    expect(c.tended).toBe(1);
    expect(c.rightCalls).toBe(2);
    expect(interventions(c)).toBe(2);
    expect(discernment(c)).toBeCloseTo(2 / 3);
  });

  it("compares each ending against what inaction would have produced", () => {
    let c = createChronicle();
    c = recordThread(c, { threadTitle: "A", domain: "kin", ending: best, counterfactual: worst });
    c = recordThread(c, { threadTitle: "B", domain: "town", ending: worst, counterfactual: best });
    c = recordThread(c, { threadTitle: "C", domain: "work", ending: mid, counterfactual: mid });

    expect(c.threadsResolved).toBe(3);
    expect(c.threadsChanged).toBe(2);
    expect(c.threadsSaved).toBe(1);
    expect(c.threadsWorsened).toBe(1);
  });

  it("says plainly when nothing you did changed an ending", () => {
    let c = createChronicle();
    c = recordThread(c, { threadTitle: "A", domain: "kin", ending: mid, counterfactual: mid });
    expect(accounting(c).lines.join(" ")).toContain("Not one of them finished differently because of you.");
  });

  it("records running yourself empty", () => {
    const c = recordCollapse(createChronicle());
    expect(c.collapses).toBe(1);
    expect(accounting(c).lines.join(" ")).toContain("lost the day");
  });

  it("gives a different verdict for total restraint than for constant reaching", () => {
    let still = createChronicle();
    for (let i = 0; i < 6; i += 1) {
      still = recordBeat(still, { choice: "pass", need: "pass", threadTitle: "T", text: "" });
    }
    let busy = createChronicle();
    for (let i = 0; i < 6; i += 1) {
      busy = recordBeat(busy, { choice: "act", need: "pass", threadTitle: "T", text: "" });
    }
    expect(chronicleVerdict(still)).not.toBe(chronicleVerdict(busy));
    expect(chronicleVerdict(busy)).toContain("roughly the same place");
  });
});
