export function playerPolarityFromW(w) {
  return w >= 0 ? 1 : -1;
}

export function shardCollides({ shardSlice, polarity, folding, bulkPhased, twinSlice = false }) {
  if (folding) {
    if (shardSlice === 0) return !bulkPhased;
    return false;
  }
  if (twinSlice && shardSlice !== 0) return false;
  if (shardSlice === 0) return true;
  return shardSlice === polarity;
}

export function orbMultiplier({ orbSlice, polarity, alignedStacks, jackpot = false }) {
  let value = 1;
  if (alignedStacks && orbSlice !== 0) {
    value = orbSlice === polarity ? 1 + alignedStacks * 2 : Math.max(0.25, 1 - alignedStacks * 0.25);
  }
  return jackpot ? value * 10 : value;
}

export function pickSlice(randFn, bulkChance) {
  const roll = randFn();
  if (roll < bulkChance) return 0;
  return roll < bulkChance + (1 - bulkChance) * 0.5 ? 1 : -1;
}

export function sliceName(polarity) {
  return polarity >= 0 ? "ANA" : "KATA";
}
