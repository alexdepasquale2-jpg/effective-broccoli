import { AudioBus } from "./audio.js";
import {
  TRADES,
  UPGRADES,
  addToCargo,
  buyUpgrade,
  canTrade,
  cargoCapacity,
  cargoCount,
  executeTrade,
  sellAll,
  statFor,
  upgradeCost,
} from "./economy.js";
import { RARITY, SPECIES, canHook, spawnAround, speciesById } from "./fish.js";
import { emptyMeta, titleForCaught } from "./meta.js";
import { loadMeta, saveMeta } from "./storage.js";
import { clamp, distance, rand } from "./utils.js";

const STATE = { menu: "menu", playing: "playing" };

export class Game {
  constructor(canvas, ui) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ui = ui;
    this.audio = new AudioBus();
    this.state = STATE.menu;
    this.meta = loadMeta(emptyMeta);
    this.save = this.meta.save;
    this.dpr = 1;
    this.width = 640;
    this.height = 480;
    this.lastTime = 0;
    this.running = false;
    this.boundFrame = (t) => this.frame(t);

    this.boat = { x: 0, y: 0, angle: 0 };
    this.fish = [];
    this.particles = [];
    this.spawnTimer = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.shake = 0;
    this.flash = 0;

    this.harpoon = { state: "ready", x: 0, y: 0, len: 0, angle: 0, target: null };
    this.pointer = { x: 0, y: 0, active: false, aiming: false };

    this.resize();
    this.bindInput();
    this.bindUi();
    this.syncHud();
    this.draw();
  }

  startLoop() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.boundFrame);
  }

  uiTarget(event) {
    return event.target?.closest?.("#play, #overlay, #hud, #dock, #market, #upgrades, #trade, .dock-btn, .upgrade-card, .trade-card");
  }

  bindInput() {
    const toLocal = (event) => {
      const rect = this.canvas.getBoundingClientRect();
      this.pointer.x = clamp(event.clientX - rect.left, 0, this.width);
      this.pointer.y = clamp(event.clientY - rect.top, 0, this.height);
    };

    const onDown = (event) => {
      this.audio.unlock();
      if (this.uiTarget(event)) return;
      this.pointer.active = true;
      toLocal(event);
      if (this.state === STATE.playing && this.harpoon.state === "ready") {
        this.pointer.aiming = true;
      }
    };

    const onMove = (event) => {
      if (!this.pointer.active) return;
      if (this.uiTarget(event)) return;
      toLocal(event);
    };

    const onUp = (event) => {
      if (!this.pointer.active) return;
      if (this.state === STATE.playing && this.pointer.aiming && this.harpoon.state === "ready") {
        this.fireHarpoon();
      }
      this.pointer.active = false;
      this.pointer.aiming = false;
    };

    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener(
      "touchmove",
      (e) => {
        if (e.target.closest("button, #market, #upgrades, #trade, .overlay")) return;
        e.preventDefault();
      },
      { passive: false },
    );
    window.addEventListener("resize", () => this.resize());
    window.visualViewport?.addEventListener("resize", () => this.resize());
  }

  bindUi() {
    this.ui.play?.addEventListener("click", () => this.play());
    this.ui.marketBtn?.addEventListener("click", () => this.openMarket());
    this.ui.upgradeBtn?.addEventListener("click", () => this.openUpgrades());
    this.ui.tradeBtn?.addEventListener("click", () => this.openTrade());
    this.ui.marketClose?.addEventListener("click", () => this.closePanels());
    this.ui.upgradeClose?.addEventListener("click", () => this.closePanels());
    this.ui.tradeClose?.addEventListener("click", () => this.closePanels());
    this.ui.sellAll?.addEventListener("click", () => this.doSellAll());
  }

  play() {
    this.audio.unlock();
    this.audio.start();
    this.state = STATE.playing;
    this.boat.x = this.width * 0.5;
    this.boat.y = this.height * 0.52;
    this.fish = [];
    this.spawnTimer = 0.2;
    this.ui.overlay.hidden = true;
    this.ui.hud.hidden = false;
    this.ui.dock.hidden = false;
    this.syncHud();
  }

  persist() {
    this.meta.save = this.save;
    saveMeta(this.meta);
  }

  fireHarpoon() {
    const angle = Math.atan2(this.pointer.y - this.boat.y, this.pointer.x - this.boat.x);
    this.harpoon = {
      state: "out",
      x: this.boat.x,
      y: this.boat.y,
      len: 0,
      angle,
      target: null,
    };
    this.boat.angle = angle;
    this.audio.fold();
  }

  openMarket() {
    this.ui.market.hidden = false;
    this.ui.upgrades.hidden = true;
    this.ui.trade.hidden = true;
    this.renderMarket();
  }

  openUpgrades() {
    this.ui.upgrades.hidden = false;
    this.ui.market.hidden = true;
    this.ui.trade.hidden = true;
    this.renderUpgrades();
  }

  openTrade() {
    this.ui.trade.hidden = false;
    this.ui.market.hidden = true;
    this.ui.upgrades.hidden = true;
    this.renderTrade();
  }

  closePanels() {
    this.ui.market.hidden = true;
    this.ui.upgrades.hidden = true;
    this.ui.trade.hidden = true;
  }

  doSellAll() {
    this.save = sellAll(this.save);
    this.audio.jackpot();
    this.persist();
    this.syncHud();
    this.renderMarket();
  }

  renderMarket() {
    if (!this.ui.cargoList) return;
    const entries = Object.entries(this.save.cargo).filter(([, n]) => n > 0);
    if (!entries.length) {
      this.ui.cargoList.textContent = "Cargo empty. Harpoon something flashy.";
      return;
    }
    this.ui.cargoList.innerHTML = entries
      .map(([id, n]) => {
        const sp = speciesById(id);
        return `<div class="cargo-row"><span>${sp.name}</span><span>x${n}</span></div>`;
      })
      .join("");
  }

  renderUpgrades() {
    if (!this.ui.upgradeRow) return;
    this.ui.upgradeRow.innerHTML = "";
    for (const row of UPGRADES) {
      const lvl = this.save.upgrades[row.id] || 0;
      const cost = upgradeCost(row.id, lvl);
      const maxed = lvl >= row.max;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "upgrade-card";
      btn.disabled = maxed || this.save.coins < cost;
      btn.innerHTML = `<strong>${row.name}</strong><span>${row.desc}</span><em>Lv ${lvl}/${row.max}${maxed ? "" : ` · $${cost}`}</em>`;
      btn.addEventListener("click", () => {
        const result = buyUpgrade(this.save, row.id);
        if (!result.ok) return;
        this.save = result.save;
        this.audio.boon();
        this.persist();
        this.syncHud();
        this.renderUpgrades();
      });
      this.ui.upgradeRow.appendChild(btn);
    }
  }

  renderTrade() {
    if (!this.ui.tradeRow) return;
    this.ui.tradeRow.innerHTML = "";
    for (const trade of TRADES) {
      const need = Object.entries(trade.need)
        .map(([id, n]) => `${n}× ${speciesById(id).name}`)
        .join(", ");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "trade-card";
      btn.innerHTML = `<strong>${trade.name}</strong><span>${trade.text}</span><em>Need ${need}</em>`;
      btn.disabled = !canTrade(this.save, trade);
      btn.addEventListener("click", () => {
        const result = executeTrade(this.save, trade);
        if (!result.ok) return;
        this.save = result.save;
        this.audio.draft();
        this.persist();
        this.syncHud();
        this.renderTrade();
        this.renderMarket();
      });
      this.ui.tradeRow.appendChild(btn);
    }
  }

  syncHud() {
    if (!this.ui.coins) return;
    this.ui.coins.textContent = `$${this.save.coins}`;
    this.ui.pearls.textContent = String(this.save.pearls);
    this.ui.cargo.textContent = `${cargoCount(this.save.cargo)}/${cargoCapacity(this.save)}`;
    this.ui.rank.textContent = titleForCaught(this.save.caught);
    if (this.ui.rankTitle) this.ui.rankTitle.textContent = titleForCaught(this.save.caught);
    this.ui.dex.textContent = `${this.save.discovered.length}/${SPECIES.length} species`;
    if (this.ui.combo) {
      this.ui.combo.hidden = this.combo < 2;
      this.ui.combo.textContent = `x${this.combo}`;
    }
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const width = Math.round(window.visualViewport?.width ?? window.innerWidth);
    const height = Math.round(window.visualViewport?.height ?? window.innerHeight);
    this.dpr = dpr;
    this.width = width;
    this.height = height;
    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.state === STATE.playing) {
      this.boat.x = width * 0.5;
      this.boat.y = height * 0.52;
    }
  }

  frame(time) {
    const dt = clamp((time - this.lastTime) / 1000, 0, 0.05);
    this.lastTime = time;
    this.update(dt);
    this.draw();
    requestAnimationFrame(this.boundFrame);
  }

  update(dt) {
    if (this.state !== STATE.playing) return;

    this.spawnTimer -= dt;
    const sonar = statFor(this.save, "sonar");
    const targetFish = 7 + sonar * 2;
    if (this.spawnTimer <= 0 && this.fish.length < targetFish) {
      this.fish.push(spawnAround(this.boat.x, this.boat.y, Math.random, sonar));
      this.spawnTimer = rand(0.5, 1.4) - sonar * 0.08;
    }

    const lineLvl = statFor(this.save, "line");
    const maxRange = statFor(this.save, "range");
    const reelSpeed = statFor(this.save, "reel");

    if (this.harpoon.state === "out") {
      this.harpoon.len += dt * 420;
      const tipX = this.boat.x + Math.cos(this.harpoon.angle) * this.harpoon.len;
      const tipY = this.boat.y + Math.sin(this.harpoon.angle) * this.harpoon.len;
      this.harpoon.x = tipX;
      this.harpoon.y = tipY;
      if (this.harpoon.len >= maxRange) this.harpoon.state = "return";

      for (const fish of this.fish) {
        if (fish.hooked) continue;
        const sp = speciesById(fish.speciesId);
        if (distance(tipX, tipY, fish.x, fish.y) < sp.size + 8) {
          if (!canHook(sp, lineLvl)) {
            this.harpoon.state = "return";
            this.audio.hit();
            this.shake = 0.4;
            break;
          }
          fish.hooked = true;
          this.harpoon.target = fish;
          this.harpoon.state = "hooked";
          this.audio.collect(1);
          break;
        }
      }
    } else if (this.harpoon.state === "hooked" && this.harpoon.target) {
      const fish = this.harpoon.target;
      const sp = speciesById(fish.speciesId);
      const pull = reelSpeed * dt;
      const dx = this.boat.x - fish.x;
      const dy = this.boat.y - fish.y;
      const d = Math.hypot(dx, dy) || 1;
      fish.x += (dx / d) * pull;
      fish.y += (dy / d) * pull;
      fish.vx *= 0.9;
      fish.vy *= 0.9;
      fish.x -= Math.cos(this.harpoon.angle) * sp.fight * dt * 8;
      fish.y -= Math.sin(this.harpoon.angle) * sp.fight * dt * 8;
      this.harpoon.x = fish.x;
      this.harpoon.y = fish.y;
      if (d < 34) this.landFish(fish);
    } else if (this.harpoon.state === "return") {
      this.harpoon.len -= dt * 500;
      this.harpoon.x = this.boat.x + Math.cos(this.harpoon.angle) * Math.max(0, this.harpoon.len);
      this.harpoon.y = this.boat.y + Math.sin(this.harpoon.angle) * Math.max(0, this.harpoon.len);
      if (this.harpoon.len <= 0) this.harpoon = { state: "ready", x: 0, y: 0, len: 0, angle: 0, target: null };
    }

    for (const fish of this.fish) {
      if (fish.hooked) continue;
      fish.wobble += dt * 3;
      fish.x += fish.vx * dt;
      fish.y += fish.vy * dt;
      if (fish.x < -80 || fish.x > this.width + 80 || fish.y < -80 || fish.y > this.height + 80) {
        fish.vx *= -1;
        fish.vy *= -1;
      }
    }
    this.fish = this.fish.filter((f) => !f.caught);

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }

    this.shake = Math.max(0, this.shake - dt * 3);
    this.flash = Math.max(0, this.flash - dt * 2.5);
    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  landFish(fish) {
    const result = addToCargo(this.save, fish.speciesId);
    if (!result.ok) {
      this.harpoon = { state: "ready", x: 0, y: 0, len: 0, angle: 0, target: null };
      fish.hooked = false;
      return;
    }
    this.save = result.save;
    fish.caught = true;
    fish.hooked = false;
    this.harpoon = { state: "ready", x: 0, y: 0, len: 0, angle: 0, target: null };
    this.combo += 1;
    this.comboTimer = 3.5;
    const sp = result.species;
    this.flash = 0.15 + sp.rarity * 0.05;
    if (sp.rarity >= 4) this.shake = 0.5;
    this.burst(this.boat.x, this.boat.y, sp.color, 10 + sp.rarity * 4);
    this.audio.collect(this.combo);
    if (sp.rarity >= 5) this.audio.jackpot();
    this.persist();
    this.syncHud();
  }

  burst(x, y, color, count) {
    for (let i = 0; i < count; i += 1) {
      const a = rand(0, Math.PI * 2);
      const s = rand(40, 160);
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.3, 0.7), color, size: rand(2, 5) });
    }
  }

  draw() {
    const { ctx, width, height } = this;
    const shakeX = this.shake ? rand(-6, 6) * this.shake : 0;
    const shakeY = this.shake ? rand(-6, 6) * this.shake : 0;
    ctx.save();
    ctx.translate(shakeX, shakeY);
    ctx.clearRect(-20, -20, width + 40, height + 40);

    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, "#0d3b66");
    grad.addColorStop(0.55, "#1b6ca8");
    grad.addColorStop(1, "#0f4c5c");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    this.drawWaves(ctx, width, height);

    if (this.state === STATE.playing) {
      for (const fish of this.fish) this.drawFish(ctx, fish);
      this.drawHarpoon(ctx);
      this.drawBoat(ctx);
      this.drawAim(ctx);
      for (const p of this.particles) {
        ctx.globalAlpha = clamp(p.life, 0, 1);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    ctx.restore();

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.flash * 0.2})`;
      ctx.fillRect(0, 0, width, height);
    }
  }

  drawWaves(ctx, width, height) {
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    const t = performance.now() * 0.001;
    for (let y = 40; y < height; y += 48) {
      ctx.beginPath();
      for (let x = 0; x <= width; x += 16) {
        const w = Math.sin(x * 0.02 + t + y * 0.01) * 4;
        if (x === 0) ctx.moveTo(x, y + w);
        else ctx.lineTo(x, y + w);
      }
      ctx.stroke();
    }
  }

  drawBoat(ctx) {
    const { boat } = this;
    ctx.save();
    ctx.translate(boat.x, boat.y);
    ctx.rotate(boat.angle);
    ctx.fillStyle = "#c57b39";
    ctx.strokeStyle = "#2a1608";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(26, 0);
    ctx.lineTo(-16, 14);
    ctx.lineTo(-16, -14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#6e3b16";
    ctx.fillRect(-8, -6, 16, 12);
    ctx.restore();
  }

  drawAim(ctx) {
    if (this.harpoon.state !== "ready" || !this.pointer.aiming) return;
    const angle = Math.atan2(this.pointer.y - this.boat.y, this.pointer.x - this.boat.x);
    const range = statFor(this.save, "range");
    ctx.strokeStyle = "rgba(255, 230, 120, 0.55)";
    ctx.setLineDash([6, 8]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.boat.x, this.boat.y);
    ctx.lineTo(this.boat.x + Math.cos(angle) * range, this.boat.y + Math.sin(angle) * range);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  drawHarpoon(ctx) {
    if (this.harpoon.state === "ready") return;
    ctx.strokeStyle = "#ddd";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.boat.x, this.boat.y);
    ctx.lineTo(this.harpoon.x, this.harpoon.y);
    ctx.stroke();
    ctx.fillStyle = "#fffd";
    ctx.beginPath();
    ctx.arc(this.harpoon.x, this.harpoon.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  drawFish(ctx, fish) {
    const sp = speciesById(fish.speciesId);
    const rarity = RARITY[sp.rarity];
    const angle = Math.atan2(fish.vy, fish.vx);
    const wobble = Math.sin(fish.wobble) * 2;
    ctx.save();
    ctx.translate(fish.x, fish.y + wobble);
    ctx.rotate(angle);
    if (fish.hooked) {
      ctx.shadowColor = rarity.color;
      ctx.shadowBlur = 12;
    } else if (sp.rarity >= 4) {
      ctx.shadowColor = rarity.color;
      ctx.shadowBlur = 8 * rarity.glow;
    }
    ctx.fillStyle = sp.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, sp.size, sp.size * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-sp.size, 0);
    ctx.lineTo(-sp.size - 10, -6);
    ctx.lineTo(-sp.size - 10, 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(sp.size * 0.35, -sp.size * 0.15, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
