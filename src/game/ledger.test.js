import { describe, expect, it } from "vitest";
import { createLedger, discernment, recordChoice, summarize, verdict } from "./ledger.js";

const passedSame = { acted: false, right: true, changedAnything: false, madeWorse: false, helped: false, missed: false };
const actedSame = { acted: true, right: false, changedAnything: false, madeWorse: false, helped: false, missed: false };
const actedWorse = { acted: true, right: false, changedAnything: true, madeWorse: true, helped: false, missed: false };
const actedHelped = { acted: true, right: true, changedAnything: true, madeWorse: false, helped: true, missed: false };
const missedIt = { acted: false, right: false, changedAnything: false, madeWorse: false, helped: false, missed: true };

function ledgerFrom(...resolutions) {
  return resolutions.reduce(recordChoice, createLedger());
}

describe("ledger", () => {
  it("counts what you did and what it changed", () => {
    const ledger = ledgerFrom(passedSame, actedSame, actedWorse, actedHelped);
    expect(ledger.seen).toBe(4);
    expect(ledger.acted).toBe(3);
    expect(ledger.passed).toBe(1);
    expect(ledger.changedAnything).toBe(2);
    expect(ledger.madeWorse).toBe(1);
    expect(ledger.helped).toBe(1);
  });

  it("scores discernment on right calls, not on inaction alone", () => {
    expect(discernment(ledgerFrom(passedSame, actedHelped))).toBe(1);
    expect(discernment(ledgerFrom(actedSame, actedWorse))).toBe(0);
    expect(discernment(createLedger())).toBe(0);
  });

  it("reports interventions that changed nothing", () => {
    const { lines } = summarize(ledgerFrom(actedSame, actedSame, passedSame));
    expect(lines.join(" ")).toContain("None of it changed the outcome.");
  });

  it("names the quiet things that needed you and were missed", () => {
    const { lines } = summarize(ledgerFrom(missedIt, passedSame));
    expect(lines.join(" ")).toContain("needed you");
  });

  it("counts the button that does nothing", () => {
    const ledger = { ...ledgerFrom(passedSame), buttonPresses: 3 };
    expect(summarize(ledger).lines.join(" ")).toContain("It does nothing.");
  });

  it("gives a distinct verdict for total inaction", () => {
    expect(verdict(ledgerFrom(passedSame, passedSame))).toContain("nothing needed otherwise");
    expect(verdict(ledgerFrom(actedSame, actedWorse))).toContain("proceeded");
  });
});
