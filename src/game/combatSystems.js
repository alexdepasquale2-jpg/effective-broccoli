import { WEAPONS, PASSIVES, checkEvolution } from "./farmingData.js";
import { rand, circleHit, distance } from "./utils.js";

export function createPlayerStats(metaUpgrades = {}) {
  const hpBonus = (metaUpgrades.vitality || 0) * 25;
  return {
    maxHp: 100 + hpBonus,
    hp: 100 + hpBonus,
    speed: 160,
    speedMult: 1.0,
    damageMult: 1.0,
    cooldownMult: 1.0,
    magnetRadius: 75,
    luck: 0,
    cropSpeedMult: 1.0 + (metaUpgrades.tractor || 0) * 0.2,
  };
}

export function recomputePlayerStats(baseStats, passives = {}) {
  const stats = { ...baseStats };

  // Apply Passives
  const fertLvl = passives.fertilizer || 0;
  stats.damageMult = 1.0 + fertLvl * 0.15;
  stats.cropSpeedMult = baseStats.cropSpeedMult * (1.0 + fertLvl * 0.15);

  const waterLvl = passives.wateringCan || 0;
  stats.cooldownMult = Math.max(0.4, 1.0 - waterLvl * 0.1);

  const hayLvl = passives.hayBale || 0;
  const extraHp = hayLvl * 20;
  stats.maxHp = baseStats.maxHp + extraHp;
  stats.hpRegen = hayLvl * 0.5;

  const bootLvl = passives.boots || 0;
  stats.speedMult = 1.0 + bootLvl * 0.12;

  const honeyLvl = passives.honeyComb || 0;
  stats.magnetRadius = baseStats.magnetRadius + honeyLvl * 35;

  const cloverLvl = passives.clover || 0;
  stats.luck = cloverLvl * 0.15;

  return stats;
}

export function pickLevelUpOptions(playerInventory) {
  // Available weapon upgrades or new weapons
  const options = [];

  // 1. Check existing weapons to upgrade or evolve
  for (const [weaponId, level] of Object.entries(playerInventory.weapons)) {
    const data = WEAPONS[weaponId];
    if (level < data.maxLevel) {
      options.push({
        type: "weapon_upgrade",
        id: weaponId,
        name: `${data.name} (Lv ${level + 1})`,
        desc: `Increases damage and area of ${data.name}.`,
        icon: data.icon,
        weaponId,
      });
    } else if (level === data.maxLevel && !playerInventory.evolutions[weaponId]) {
      if (checkEvolution(weaponId, level, playerInventory)) {
        options.push({
          type: "evolution",
          id: weaponId,
          name: `⚡ EVOLUTION: ${data.evolutionName}`,
          desc: data.evolutionDesc,
          icon: "🌟",
          weaponId,
        });
      }
    }
  }

  // 2. Offer new unowned weapons if slot available (< 4 weapons)
  const currentWeaponCount = Object.keys(playerInventory.weapons).length;
  if (currentWeaponCount < 4) {
    for (const [weaponId, data] of Object.entries(WEAPONS)) {
      if (!playerInventory.weapons[weaponId]) {
        options.push({
          type: "new_weapon",
          id: weaponId,
          name: `New: ${data.name}`,
          desc: data.desc,
          icon: data.icon,
          weaponId,
        });
      }
    }
  }

  // 3. Existing passives to upgrade
  for (const [passiveId, level] of Object.entries(playerInventory.passives)) {
    const data = PASSIVES[passiveId];
    if (level < data.maxLevel) {
      options.push({
        type: "passive_upgrade",
        id: passiveId,
        name: `${data.name} (Lv ${level + 1})`,
        desc: data.desc,
        icon: data.icon,
        passiveId,
      });
    }
  }

  // 4. Offer new unowned passives if slot available (< 4 passives)
  const currentPassiveCount = Object.keys(playerInventory.passives).length;
  if (currentPassiveCount < 4) {
    for (const [passiveId, data] of Object.entries(PASSIVES)) {
      if (!playerInventory.passives[passiveId]) {
        options.push({
          type: "new_passive",
          id: passiveId,
          name: `New: ${data.name}`,
          desc: data.desc,
          icon: data.icon,
          passiveId,
        });
      }
    }
  }

  // 5. Fallback options if all slots maxed: Roast Chicken (Heal 30) or Gold Bag (100g)
  if (options.length === 0) {
    options.push({
      type: "heal",
      id: "roast_chicken",
      name: "Grandma's Roast Stew",
      desc: "Instantly restore 40 Health.",
      icon: "🍲",
    });
    options.push({
      type: "gold",
      id: "gold_bag",
      name: "Merchant's Gold Purse",
      desc: "Instantly gain +60 Farm Gold.",
      icon: "💰",
    });
  }

  // Shuffle and pick up to 3 options
  const shuffled = [...options].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

// XP curve for leveling up (Vampire survivors style)
export function getRequiredXp(level) {
  if (level <= 1) return 5;
  if (level <= 20) return Math.floor(5 + (level - 1) * 10);
  if (level <= 40) return Math.floor(200 + (level - 20) * 15);
  return Math.floor(500 + (level - 40) * 22);
}
