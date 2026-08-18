export function playerPolarityFromW(w) {
  return w >= 0 ? 1 : -1;
}

export function shardCollides({ shardSlice, polarity, folding, bulkPhased }) {
  if (folding) {
    if (shardSlice === 0) return !bulkPhased;
    return false;
  }
  if (shardSlice === 0) return true;
  return shardSlice === polarity;
}

export function orbMultiplier({ orbSlice, polarity, alignedStacks }) {
  if (!alignedStacks || orbSlice === 0) return 1;
  if (orbSlice === polarity) return 1 + alignedStacks * 2;
  return Math.max(0.25, 1 - alignedStacks * 0.25);
}

export function pickSlice(randFn, bulkChance) {
  const roll = randFn();
  if (roll < bulkChance) return 0;
  return roll < bulkChance + (1 - bulkChance) * 0.5 ? 1 : -1;
}

export function sliceName(polarity) {
  return polarity >= 0 ? "ANA" : "KATA";
}
