export const WIDTH = 720;
export const HEIGHT = 1280;

/** The board is stored as a 5×5 grid (stride 5); early on only the top-left 4×4 is open. */
export const BOARD_STRIDE = 5;
export const BOARD_SIZE = BOARD_STRIDE * BOARD_STRIDE;
/** Centre slot of the 5×5 board doubles the power of the card on it. */
export const POWER_TILE = 12;
export const POWER_TILE_MULT = 2;

/** Merged card is this many times stronger than one of its inputs. */
export const MERGE_POWER_RATE = 2.5;

export const SUMMON_BASE_COST = 10;
export const SUMMON_COST_RATE = 1.15;

export const ENEMY_BASE_HP = 12;
export const ENEMY_HP_RATE = 1.18;
export const KILLS_PER_STAGE = 10;
export const BOSS_HP_MULT = 8;
export const BOSS_GOLD_MULT = 10;
export const BOSS_SECONDS = 30;

export const KILL_BASE_GOLD = 4;
export const KILL_GOLD_RATE = 1.16;

/** Tap damage = 1 + this share of board DPS, so tapping stays relevant. */
export const TAP_DPS_SHARE = 0.05;

export const STARTING_GOLD = 10;
export const OFFLINE_CAP_SECONDS = 8 * 60 * 60;
/** Offline earns a fraction of online income. */
export const OFFLINE_RATE = 0.5;
export const SAVE_KEY = 'mergeborn-v1';
export const SAVE_VERSION = 6;

/** Tap combo: taps within this window chain; each link adds COMBO_STEP to the multiplier. */
export const COMBO_WINDOW = 1;
export const COMBO_STEP = 0.1;
export const COMBO_CAP = 10;

export const MULTI_SUMMON = 5;
/** Every Nth summon is guaranteed tier 2 once pity is unlocked. */
export const PITY_EVERY = 10;
export const LUCK_PER_LEVEL = 0.02;
export const LUCK_CAP = 0.5;

/** Each merge pays this share of kill gold per resulting tier. */
export const MERGE_BOUNTY = 0.5;
export const LUCKY_MERGE_CHANCE = 0.05;

/** Enemy traits begin here. */
export const SHIELD_MULT = 0.5;
export const REGEN_PER_SEC = 0.03;
export const SPLIT_HP = 0.5;

export const UPGRADE_COST_RATE = 1.5;

/** Shuffle (layer 1 reset) opens at this stage. Essence = floor(((stage - OFFSET) / SCALE)^POW): polynomial, so it can't outrun exponential shop costs. */
export const SHUFFLE_STAGE = 25;
export const ESSENCE_OFFSET = 20;
export const ESSENCE_SCALE = 2.5;
export const ESSENCE_POW = 1.6;

/** Ascend (layer 2): chance a summon is one of your unlocked heroes of the tile's element. */
export const HERO_SUMMON_CHANCE = 0.04;

/** Era (layer 4): reached at this stage; each completed Era multiplies damage and gold. */
export const ERA_STAGE = 60;
/** Each later Era opens this many stages deeper. */
export const ERA_STAGE_STEP = 15;
/** Revolution opens at this stage in Era V, deeper by REV_STAGE_STEP per Revolution. */
export const REV_STAGE = 120;
export const REV_STAGE_STEP = 20;
/** Each Ascend multiplies damage for the rest of the Era. */
export const ASCEND_DAMAGE = 2;
export const MAX_ERA = 5;
export const ERA_DAMAGE = 3;
export const ERA_GOLD = 2;
export const DECAY_SECONDS = 90;
export const FUSE_SECONDS = 8;
export const TURNCOAT_CHANCE = 0.1;

/** Revolution (layer 5): each one gives these permanent multipliers and unlocks one automation. */
export const REV_DAMAGE = 4;
export const REV_GOLD = 3;
/** Challenges are cleared by reaching this stage; each clear doubles damage forever. */
export const CHALLENGE_GOAL = 30;
/** Auto-Shuffle fires after this long without a new stage. */
export const STALL_SECONDS = 60;
