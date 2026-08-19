export function createLedger() {
  return {
    seen: 0,
    acted: 0,
    passed: 0,
    changedAnything: 0,
    madeWorse: 0,
    helped: 0,
    missed: 0,
    rightCalls: 0,
    buttonPresses: 0,
  };
}

export function recordChoice(ledger, resolution) {
  const next = { ...ledger };
  next.seen += 1;
  if (resolution.acted) next.acted += 1;
  else next.passed += 1;
  if (resolution.changedAnything) next.changedAnything += 1;
  if (resolution.madeWorse) next.madeWorse += 1;
  if (resolution.helped) next.helped += 1;
  if (resolution.missed) next.missed += 1;
  if (resolution.right) next.rightCalls += 1;
  return next;
}

export function discernment(ledger) {
  if (!ledger.seen) return 0;
  return ledger.rightCalls / ledger.seen;
}

export function verdict(ledger) {
  if (!ledger.seen) return "Nothing has happened yet. That is allowed.";
  const ratio = discernment(ledger);
  if (ledger.acted === 0) {
    return ledger.missed > 0
      ? "You let everything pass. Almost everything was fine. A few small things needed you."
      : "You let everything pass, and nothing needed otherwise.";
  }
  if (ratio >= 0.85) return "You could tell the difference between noise and need. That is the rare skill.";
  if (ratio >= 0.65) return "You are learning which things are actually yours.";
  if (ratio >= 0.4) return "You reached for a lot of it. Most of it was never in your hands.";
  return "You intervened almost everywhere. The world proceeded as it was going to.";
}

export function summarize(ledger) {
  const lines = [];
  lines.push(`${ledger.seen} things happened.`);

  if (ledger.acted === 0) {
    lines.push("You did not intervene once.");
  } else {
    lines.push(`You intervened ${ledger.acted} ${ledger.acted === 1 ? "time" : "times"}.`);
    lines.push(
      ledger.changedAnything === 0
        ? "None of it changed the outcome."
        : `${ledger.changedAnything} of those changed the outcome.`,
    );
    if (ledger.madeWorse > 0) {
      lines.push(`${ledger.madeWorse} made it worse.`);
    }
  }

  if (ledger.missed > 0) {
    lines.push(`${ledger.missed} quiet ${ledger.missed === 1 ? "thing" : "things"} needed you and did not get you.`);
  }
  if (ledger.buttonPresses > 0) {
    lines.push(`You pressed the button ${ledger.buttonPresses} ${ledger.buttonPresses === 1 ? "time" : "times"}. It does nothing.`);
  }

  return { lines, verdict: verdict(ledger), discernment: discernment(ledger) };
}
