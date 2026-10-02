export const WIDTH = 720;
export const HEIGHT = 1280;

export const BOARD_COLS = 4;
export const BOARD_ROWS = 4;
export const BOARD_SIZE = BOARD_COLS * BOARD_ROWS;

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
export const SAVE_VERSION = 1;
