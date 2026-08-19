import { CROPS } from "./farmingData.js";

export class FarmPlot {
  constructor(id, x, y, size = 38) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.size = size;
    this.isWatered = false;
    this.crop = null; // { type: 'parsnip', progress: 0, maxTime: 6, isReady: false }
  }

  plant(cropType) {
    if (this.crop) return false;
    const cropData = CROPS[cropType];
    if (!cropData) return false;
    this.crop = {
      type: cropType,
      progress: 0,
      maxTime: cropData.growTime,
      isReady: false,
    };
    return true;
  }

  water() {
    this.isWatered = true;
  }

  update(dt, speedMultiplier = 1.0) {
    if (!this.crop || this.crop.isReady) return false;
    // Watered crops grow 1.75x faster
    const waterSpeed = this.isWatered ? 1.75 : 1.0;
    this.crop.progress += dt * speedMultiplier * waterSpeed;
    if (this.crop.progress >= this.crop.maxTime) {
      this.crop.isReady = true;
      this.isWatered = false; // Reset water on completion
      return true; // Crop just matured
    }
    return false;
  }

  harvest() {
    if (!this.crop || !this.crop.isReady) return null;
    const cropType = this.crop.type;
    const data = CROPS[cropType];
    this.crop = null;
    this.isWatered = false;
    return data;
  }
}

export function createFarmGrid(basePlots = 9, extraPlots = 0) {
  const plots = [];
  const total = Math.min(25, basePlots + extraPlots * 4);
  const cols = 5;
  const spacing = 48;
  const startX = -((Math.min(total, cols) - 1) * spacing) / 2;
  const startY = 30; // Centered below farmhouse

  for (let i = 0; i < total; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * spacing;
    const y = startY + row * spacing;
    plots.push(new FarmPlot(i, x, y, 40));
  }
  return plots;
}
