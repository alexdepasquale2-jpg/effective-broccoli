export const DEPTHS = [
  { level: 0, name: "Restless", at: 0, tint: "#1b2340", breath: 5.0 },
  { level: 1, name: "Idle", at: 70, tint: "#1a2a44", breath: 5.8 },
  { level: 2, name: "Settling", at: 190, tint: "#182f46", breath: 6.6 },
  { level: 3, name: "Still", at: 400, tint: "#153244", coreTint: "#8fd9c8", breath: 7.6 },
  { level: 4, name: "Quiet", at: 720, tint: "#123240", breath: 8.6 },
  { level: 5, name: "Deep", at: 1180, tint: "#0f2f3a", breath: 9.8 },
  { level: 6, name: "Vast", at: 1800, tint: "#0c2a33", breath: 11.0 },
  { level: 7, name: "Nothing", at: 2600, tint: "#08222a", breath: 12.5 },
];

export function depthForStillness(stillness) {
  let found = DEPTHS[0];
  for (const depth of DEPTHS) {
    if (stillness >= depth.at) found = depth;
  }
  return found;
}

export function nextDepth(stillness) {
  return DEPTHS.find((d) => d.at > stillness) || null;
}

// Uninterrupted quiet compounds. The multiplier tops out at 3x after 45s.
export function streakMultiplier(streakSeconds) {
  return 1 + Math.min(Math.max(streakSeconds, 0) / 45, 1) * 2;
}

export function stillnessRate(depthLevel, streakSeconds) {
  const base = 1.35;
  return base * (1 + depthLevel * 0.3) * streakMultiplier(streakSeconds);
}

// Letting an event resolve on its own is the game's main reward.
export function passBonus(depthLevel) {
  return Math.round(9 * (1 + depthLevel * 0.3));
}

// Events thin out as you settle. The world quiets when you do.
export function arrivalInterval(depthLevel) {
  return 7.5 + depthLevel * 1.4;
}

export function tierForDepth(depthLevel) {
  if (depthLevel >= 5) return 3;
  if (depthLevel >= 2) return 2;
  return 1;
}
