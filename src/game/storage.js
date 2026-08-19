import { worldAverage } from "./world.js";

const KEY = "let-it-pass-valley-v1";

export function emptyRecord() {
  return {
    runs: 0,
    bestValley: 0,
    bestStillness: 0,
    lifetimeBeats: 0,
    lifetimeInterventions: 0,
    lifetimeChanged: 0,
    lifetimeWorsened: 0,
  };
}

export function loadRecord() {
  const fallback = emptyRecord();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

export function saveRecord(record) {
  try {
    localStorage.setItem(KEY, JSON.stringify(record));
  } catch {
    // A game about letting go should not break over a blocked cookie jar.
  }
  return record;
}

export function mergeRun(record, { world, chronicle, peakStillness }) {
  return {
    ...record,
    runs: record.runs + 1,
    bestValley: Math.max(record.bestValley, Math.round(worldAverage(world))),
    bestStillness: Math.max(record.bestStillness, Math.floor(peakStillness || 0)),
    lifetimeBeats: record.lifetimeBeats + chronicle.beats,
    lifetimeInterventions: record.lifetimeInterventions + chronicle.tended + chronicle.acted,
    lifetimeChanged: record.lifetimeChanged + chronicle.threadsChanged,
    lifetimeWorsened: record.lifetimeWorsened + chronicle.threadsWorsened,
  };
}

export function recordLine(record) {
  if (!record.runs) return "";
  if (!record.lifetimeInterventions) {
    return `${record.runs} ${record.runs === 1 ? "year" : "years"} lived. You have never once put your hand in.`;
  }
  return `${record.runs} ${record.runs === 1 ? "year" : "years"} lived · best valley ${record.bestValley} · ${record.lifetimeChanged} of ${record.lifetimeInterventions} interventions changed an ending.`;
}
