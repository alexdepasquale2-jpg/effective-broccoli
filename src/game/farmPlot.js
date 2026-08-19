import { CROPS, getNextTierCrop, ALLIES } from "./farmingData.js";

export class FarmPlot {
  constructor(id, x, y, size = 40) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.size = size;
    this.isWatered = false;
    this.crop = null; // { type: 'parsnip', level: 1, progress: 0, maxTime: 5, isReady: false }
  }

  plant(cropType, level = 1) {
    if (this.crop) return false;
    const cropData = CROPS[cropType];
    if (!cropData) return false;
    this.crop = {
      type: cropType,
      level, // level 1: standard, level 2: large, level 3: giant (summon ready)
      progress: 0,
      maxTime: cropData.growTime * (level === 2 ? 1.4 : level === 3 ? 1.8 : 1.0),
      isReady: false,
    };
    return true;
  }

  water() {
    this.isWatered = true;
  }

  update(dt, speedMultiplier = 1.0) {
    if (!this.crop || this.crop.isReady) return false;
    const waterSpeed = this.isWatered ? 1.75 : 1.0;
    this.crop.progress += dt * speedMultiplier * waterSpeed;
    if (this.crop.progress >= this.crop.maxTime) {
      this.crop.isReady = true;
      this.isWatered = false;
      return true; // Crop just matured
    }
    return false;
  }

  canMergeWith(otherPlot) {
    if (!this.crop || !otherPlot.crop) return false;
    if (this.crop.type !== otherPlot.crop.type) return false;
    if (this.crop.level !== otherPlot.crop.level) return false;
    if (this.crop.level >= 3) return false; // Max merge level
    return true;
  }

  mergeInto(targetPlot) {
    if (!this.canMergeWith(targetPlot)) return null;
    const cropType = this.crop.type;
    const nextLevel = this.crop.level + 1;

    // Clear this plot
    this.crop = null;
    this.isWatered = false;

    // Upgrade target plot (clear previous crop first to allow replant at higher tier)
    targetPlot.crop = null;
    targetPlot.plant(cropType, nextLevel);
    targetPlot.crop.progress = targetPlot.crop.maxTime * 0.5; // Jump start progress on merge!
    return {
      type: cropType,
      level: nextLevel,
      isGiant: nextLevel === 3,
    };
  }

  harvest() {
    if (!this.crop || !this.crop.isReady) return null;
    const cropType = this.crop.type;
    const level = this.crop.level;
    const data = CROPS[cropType];
    const isGiant = level >= 3;
    const allyType = isGiant ? data.allySummon : null;

    this.crop = null;
    this.isWatered = false;

    return {
      id: cropType,
      cropData: data,
      level,
      isGiant,
      allyType,
      yieldValue: data.yieldValue * (level === 2 ? 2.5 : level === 3 ? 6 : 1),
      xp: data.xp * (level === 2 ? 2.5 : level === 3 ? 6 : 1),
    };
  }
}

export function createFarmGrid(basePlots = 9, extraPlots = 0) {
  const plots = [];
  const total = Math.min(25, basePlots + extraPlots * 4);
  const cols = 5;
  const spacing = 52;
  const startX = -((Math.min(total, cols) - 1) * spacing) / 2;
  const startY = 36; // Centered below farmhouse

  for (let i = 0; i < total; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * spacing;
    const y = startY + row * spacing;
    plots.push(new FarmPlot(i, x, y, 44));
  }
  return plots;
}
