export function createChronicle() {
  return {
    beats: 0,
    passed: 0,
    watched: 0,
    tended: 0,
    acted: 0,
    rightCalls: 0,
    threadsResolved: 0,
    threadsChanged: 0,
    threadsWorsened: 0,
    threadsSaved: 0,
    collapses: 0,
    entries: [],
  };
}

export function recordBeat(chronicle, { choice, need, threadTitle, text }) {
  const next = { ...chronicle, entries: [...chronicle.entries] };
  next.beats += 1;
  if (choice === "pass") next.passed += 1;
  if (choice === "watch") next.watched += 1;
  if (choice === "tend") next.tended += 1;
  if (choice === "act") next.acted += 1;
  if (choice === need || (choice === "watch" && need === "pass")) next.rightCalls += 1;
  next.entries.push({ kind: "beat", threadTitle, choice, need, text });
  return next;
}

export function recordThread(chronicle, { threadTitle, ending, counterfactual, domain }) {
  const next = { ...chronicle, entries: [...chronicle.entries] };
  next.threadsResolved += 1;
  const changed = ending.key !== counterfactual.key;
  if (changed) {
    next.threadsChanged += 1;
    if (ending.rank > counterfactual.rank) next.threadsWorsened += 1;
    if (ending.rank < counterfactual.rank) next.threadsSaved += 1;
  }
  next.entries.push({
    kind: "thread",
    threadTitle,
    domain,
    ending: ending.title,
    text: ending.text,
    changed,
    better: changed && ending.rank < counterfactual.rank,
    worse: changed && ending.rank > counterfactual.rank,
    counterfactual: counterfactual.title,
  });
  return next;
}

export function recordCollapse(chronicle) {
  return {
    ...chronicle,
    collapses: chronicle.collapses + 1,
    entries: [
      ...chronicle.entries,
      { kind: "collapse", text: "You ran yourself out. A day went by without you in it." },
    ],
  };
}

export function interventions(chronicle) {
  return chronicle.tended + chronicle.acted;
}

export function discernment(chronicle) {
  if (!chronicle.beats) return 0;
  return chronicle.rightCalls / chronicle.beats;
}

export function accounting(chronicle) {
  const lines = [];
  lines.push(`${chronicle.beats} moments asked something of you.`);
  lines.push(
    `You let ${chronicle.passed} go by, watched ${chronicle.watched}, tended ${chronicle.tended}, and acted on ${chronicle.acted}.`,
  );

  if (chronicle.threadsResolved > 0) {
    lines.push(
      chronicle.threadsChanged === 0
        ? `${chronicle.threadsResolved} stories finished. Not one of them finished differently because of you.`
        : `${chronicle.threadsResolved} stories finished. ${chronicle.threadsChanged} of them ended differently than they would have if you had done nothing at all.`,
    );
    if (chronicle.threadsSaved > 0) {
      lines.push(`${chronicle.threadsSaved} went better for your hand being in it.`);
    }
    if (chronicle.threadsWorsened > 0) {
      lines.push(`${chronicle.threadsWorsened} went worse.`);
    }
  }

  if (chronicle.collapses > 0) {
    lines.push(`You emptied yourself ${chronicle.collapses} ${chronicle.collapses === 1 ? "time" : "times"} and lost the day.`);
  }

  return { lines, verdict: chronicleVerdict(chronicle), discernment: discernment(chronicle) };
}

export function chronicleVerdict(chronicle) {
  const ratio = discernment(chronicle);
  const reached = interventions(chronicle);

  if (!chronicle.beats) return "Nothing was asked of you. You asked nothing back.";
  if (reached === 0) {
    return chronicle.threadsSaved === 0 && chronicle.threadsWorsened === 0
      ? "You never once put your hand in. Almost nothing needed it — but a few things did, and they went the way things go when nobody comes."
      : "You stayed out of all of it.";
  }
  if (ratio >= 0.82) return "You could tell the difference between what was loud and what was yours. That is the whole skill.";
  if (ratio >= 0.62) return "You were mostly right about where you were needed.";
  if (ratio >= 0.4) return "You reached for a great deal of it. Much of it was never in your hands.";
  return "You touched nearly everything. The valley would have arrived at roughly the same place without you.";
}
