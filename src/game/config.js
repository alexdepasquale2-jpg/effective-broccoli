/** All gameplay tuning lives here so balance changes stay in one file. */
export const CONFIG = {
  grid: {
    cols: 5,
    rows: 7,
    gap: 3,             // spacing between sectors, design units
    topInset: 132,      // fallback if the HUD has not been measured yet
    headroom: 22,       // gap under the HUD for the column letters
    bottomInset: 58,    // room for the status readout
    sidePad: 12,
  },

  contacts: {
    baseInterval: 1.45,       // seconds between drops
    minInterval: 0.46,
    intervalPerPoint: 0.0055,

    baseFuse: 5.0,            // seconds before a hostile breaches
    minFuse: 2.0,
    fusePerPoint: 0.018,

    friendlyChance: 0.16,     // allied convoys you must not fire on
    maxFriendlyChance: 0.34,
    friendlyPerPoint: 0.0016,

    baseActive: 3,            // simultaneous contacts allowed on the board
    maxActive: 9,
    activePerPoint: 0.035,

    friendlyFuse: 3.2,        // friendlies clear the sector on their own
  },

  weapon: {
    cooldown: 0.42,           // seconds between strikes
  },

  scoring: {
    hostile: 10,
    comboMax: 8,
  },

  rules: {
    integrity: 4,             // sector breaches tolerated before mission fail
  },

  fx: {
    shakeOnBreach: 14,
    shakeOnFriendlyFire: 10,
    particles: 16,
  },
};
