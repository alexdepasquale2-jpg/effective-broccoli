import { clamp, distance, rand, randInt, circleHit } from "./utils.js";
import { CROPS, WEAPONS, PASSIVES, ALLIES } from "./farmingData.js";
import { FarmPlot, createFarmGrid } from "./farmPlot.js";
import { createPlayerStats, recomputePlayerStats, pickLevelUpOptions, getRequiredXp } from "./combatSystems.js";
import { Monster, WaveSpawner } from "./monsterSpawner.js";
import { Ally } from "./allySystem.js";
import { loadMeta, saveMeta } from "./metaStorage.js";
import { AudioBus } from "./audio.js";

export const GAME_STATES = {
  TITLE: "TITLE",
  PLAYING: "PLAYING",
  LEVEL_UP: "LEVEL_UP",
  GAME_OVER: "GAME_OVER",
  VICTORY: "VICTORY",
};

export const TIME_OF_DAY = {
  DAY: "DAY", // 35 seconds: Farming, merge crops to giant level, water, summon allies
  NIGHT: "NIGHT", // 55+ seconds: Vampire survivors horde defense, swarms, boss fights
};

export class Game {
  constructor(canvas, ui) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ui = ui;
    this.audio = new AudioBus();

    this.state = GAME_STATES.TITLE;
    this.meta = loadMeta();
    this.dpr = window.devicePixelRatio || 1;
    this.width = 640;
    this.height = 480;
    this.lastTime = 0;
    this.running = false;
    this.boundFrame = (t) => this.frame(t);

    // World & Camera
    this.camera = { x: 0, y: 0 };
    this.shake = 0;
    this.flash = 0;

    // Run Session State
    this.dayNumber = 1;
    this.timePhase = TIME_OF_DAY.DAY;
    this.phaseTimer = 35;
    this.phaseDuration = 35;

    // Player Run Data
    this.player = {
      x: 0,
      y: 0,
      facingX: 1,
      facingY: 0,
      speed: 160,
      level: 1,
      xp: 0,
      xpNeeded: 5,
      gold: 50 + (this.meta.upgrades.startingGold || 0) * 50,
      selectedSeed: "parsnip",
      seedInventory: { parsnip: 6, potato: 2, strawberry: 0, cauliflower: 0, starfruit: 0 },
      cropInventory: {},
    };

    this.stats = createPlayerStats(this.meta.upgrades);
    this.inventory = {
      weapons: { scythe: 1 },
      passives: {},
      evolutions: {},
    };
    this.stats = recomputePlayerStats(this.stats, this.inventory.passives);

    // Weapons Cooldown Timers
    this.weaponTimers = {
      scythe: 0,
      sprinkler: 0,
      eggBlaster: 0,
      seedGatling: 0,
      fertilizerMortar: 0,
      scarecrow: 0,
      pitchfork: 0,
      beehive: 0,
      sunburst: 0,
    };

    // World Entities
    this.plots = createFarmGrid(9, this.meta.upgrades.plotCount || 0);
    this.allies = [];
    this.monsters = [];
    this.projectiles = [];
    this.xpGems = [];
    this.damageNumbers = [];
    this.particles = [];
    this.scarecrowOrbitAngle = 0;

    // Drag-to-merge plot state
    this.dragSourcePlot = null;
    this.pointerPos = { x: 0, y: 0 };

    // Spawner
    this.spawner = new WaveSpawner();

    // Controls
    this.keys = {};
    this.virtualJoystick = { active: false, startX: 0, startY: 0, curX: 0, curY: 0, dx: 0, dy: 0 };

    this.init();
  }

  init() {
    this.resize();
    this.bindInputs();
    this.syncUI();
  }

  startLoop() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.boundFrame);
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
  }

  bindInputs() {
    // Keyboard
    window.addEventListener("keydown", (e) => {
      this.keys[e.code] = true;
      if (e.code === "KeyE" || e.code === "Space") {
        this.tryInteract();
      }
      if (e.code === "KeyB") {
        this.openShop();
      }
      if (e.code === "KeyM") {
        this.tryAutoMergeAdjacent();
      }
    });
    window.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
    });

    // Touch / Mouse Joystick & Plot Merge Click/Drag
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const toWorld = (screenX, screenY) => {
      return {
        x: screenX - this.width / 2 + this.camera.x,
        y: screenY - this.height / 2 + this.camera.y,
      };
    };

    const onStart = (e) => {
      this.audio.unlock();
      if (e.target.closest("button, .modal, #shop-modal, #levelup-modal, #meta-modal")) return;
      const pos = getPos(e);
      this.pointerPos = pos;
      const worldPos = toWorld(pos.x, pos.y);

      // Check if clicked directly on a plot with a crop for merging!
      const clickedPlot = this.getPlotAt(worldPos.x, worldPos.y);
      if (clickedPlot && clickedPlot.crop) {
        this.dragSourcePlot = clickedPlot;
      } else {
        this.virtualJoystick.active = true;
        this.virtualJoystick.startX = pos.x;
        this.virtualJoystick.startY = pos.y;
        this.virtualJoystick.curX = pos.x;
        this.virtualJoystick.curY = pos.y;
        this.virtualJoystick.dx = 0;
        this.virtualJoystick.dy = 0;
      }
    };

    const onMove = (e) => {
      const pos = getPos(e);
      this.pointerPos = pos;

      if (this.virtualJoystick.active) {
        this.virtualJoystick.curX = pos.x;
        this.virtualJoystick.curY = pos.y;
        const rawDx = pos.x - this.virtualJoystick.startX;
        const rawDy = pos.y - this.virtualJoystick.startY;
        const dist = Math.hypot(rawDx, rawDy) || 1;
        const maxDist = 55;
        const factor = Math.min(dist, maxDist) / dist;
        this.virtualJoystick.dx = (rawDx * factor) / maxDist;
        this.virtualJoystick.dy = (rawDy * factor) / maxDist;
      }
    };

    const onEnd = (e) => {
      if (this.dragSourcePlot) {
        const pos = this.pointerPos;
        const worldPos = toWorld(pos.x, pos.y);
        const targetPlot = this.getPlotAt(worldPos.x, worldPos.y);

        if (targetPlot && targetPlot !== this.dragSourcePlot && this.dragSourcePlot.canMergeWith(targetPlot)) {
          const mergeResult = this.dragSourcePlot.mergeInto(targetPlot);
          if (mergeResult) {
            this.audio.jackpot();
            this.createMergeParticles(targetPlot.x, targetPlot.y);
            const sizeName = mergeResult.level === 2 ? "Large" : "GIANT ★ SUMMON READY";
            this.createFloatingText(
              targetPlot.x,
              targetPlot.y - 30,
              `✨ MERGED! ${sizeName} ${CROPS[mergeResult.type].name}`,
              "#ffd700"
            );
            this.syncUI();
          }
        }
        this.dragSourcePlot = null;
      }

      this.virtualJoystick.active = false;
      this.virtualJoystick.dx = 0;
      this.virtualJoystick.dy = 0;
    };

    this.canvas.addEventListener("pointerdown", onStart);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
    window.addEventListener("resize", () => this.resize());
    window.visualViewport?.addEventListener("resize", () => this.resize());
  }

  getPlotAt(worldX, worldY) {
    for (const plot of this.plots) {
      if (Math.abs(worldX - plot.x) <= plot.size / 2 + 6 && Math.abs(worldY - plot.y) <= plot.size / 2 + 6) {
        return plot;
      }
    }
    return null;
  }

  tryAutoMergeAdjacent() {
    // Auto merge all ready matching pairs on the farm
    for (let i = 0; i < this.plots.length; i++) {
      const pA = this.plots[i];
      if (!pA.crop) continue;

      for (let j = i + 1; j < this.plots.length; j++) {
        const pB = this.plots[j];
        if (pA.canMergeWith(pB)) {
          const mergeResult = pA.mergeInto(pB);
          if (mergeResult) {
            this.audio.jackpot();
            this.createMergeParticles(pB.x, pB.y);
            this.createFloatingText(pB.x, pB.y - 25, `✨ MERGED! ${CROPS[mergeResult.type].name}`, "#ffd700");
          }
          break;
        }
      }
    }
  }

  play() {
    this.audio.unlock();
    this.audio.start();
    this.state = GAME_STATES.PLAYING;
    this.dayNumber = 1;
    this.timePhase = TIME_OF_DAY.DAY;
    this.phaseDuration = 35;
    this.phaseTimer = 35;

    this.player.x = 0;
    this.player.y = -60;
    this.player.level = 1;
    this.player.xp = 0;
    this.player.xpNeeded = getRequiredXp(1);
    this.player.gold = 60 + (this.meta.upgrades.startingGold || 0) * 50;
    this.player.seedInventory = { parsnip: 8, potato: 4, strawberry: 0, cauliflower: 0, starfruit: 0 };
    this.player.cropInventory = {};

    this.stats = createPlayerStats(this.meta.upgrades);
    this.inventory = {
      weapons: { scythe: 1 },
      passives: {},
      evolutions: {},
    };
    this.stats = recomputePlayerStats(this.stats, this.inventory.passives);

    this.plots = createFarmGrid(9, this.meta.upgrades.plotCount || 0);
    this.allies = [];
    this.monsters = [];
    this.projectiles = [];
    this.xpGems = [];
    this.damageNumbers = [];
    this.spawner.reset();

    this.ui.overlay.hidden = true;
    this.ui.hud.hidden = false;
    this.syncUI();
  }

  frame(time) {
    const dt = clamp((time - this.lastTime) / 1000, 0, 0.05);
    this.lastTime = time;

    this.update(dt);
    this.draw();

    requestAnimationFrame(this.boundFrame);
  }

  update(dt) {
    if (this.state !== GAME_STATES.PLAYING) return;

    this.updateTimeAndCycles(dt);
    this.updatePlayerMovement(dt);
    this.updateCrops(dt);
    this.updateAllies(dt);
    this.updateWeapons(dt);
    this.updateProjectiles(dt);
    this.updateMonsters(dt);
    this.updateGems(dt);
    this.updateParticles(dt);
    this.updateCamera(dt);

    // HP Regen
    if (this.stats.hpRegen && this.stats.hp < this.stats.maxHp) {
      this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + this.stats.hpRegen * dt);
    }
  }

  updateTimeAndCycles(dt) {
    this.phaseTimer -= dt;

    if (this.phaseTimer <= 0) {
      if (this.timePhase === TIME_OF_DAY.DAY) {
        // Transition to Night horde!
        this.timePhase = TIME_OF_DAY.NIGHT;
        this.phaseDuration = 55 + this.dayNumber * 5;
        this.phaseTimer = this.phaseDuration;
        this.spawner.reset();
        this.audio.hit();
        this.flash = 0.4;
        this.createFloatingText(
          this.player.x,
          this.player.y - 40,
          "🌙 NIGHT SWARM! ALLIES TO BATTLE STATIONS!",
          "#ff5252"
        );
      } else {
        // Night survived! Dawn breaks!
        this.timePhase = TIME_OF_DAY.DAY;
        this.dayNumber += 1;
        this.phaseDuration = 35;
        this.phaseTimer = this.phaseDuration;

        this.autoShipCrops();

        // Convert leftover monsters to XP
        for (const m of this.monsters) {
          this.xpGems.push({ x: m.x, y: m.y, value: m.xp });
        }
        this.monsters = [];

        this.meta.highestNight = Math.max(this.meta.highestNight, this.dayNumber);
        saveMeta(this.meta);

        this.audio.jackpot();
        this.flash = 0.5;
        this.createFloatingText(
          this.player.x,
          this.player.y - 40,
          `☀️ DAY ${this.dayNumber} DAWNS! MERGE CROPS & REPAIR!`,
          "#ffd700"
        );
      }
      this.syncUI();
    }
  }

  autoShipCrops() {
    let shippedGold = 0;
    for (const [cropId, count] of Object.entries(this.player.cropInventory)) {
      if (count > 0 && CROPS[cropId]) {
        const value = CROPS[cropId].yieldValue * count;
        shippedGold += value;
        this.player.cropInventory[cropId] = 0;
      }
    }
    if (shippedGold > 0) {
      this.player.gold += shippedGold;
      this.meta.totalGold += shippedGold;
      saveMeta(this.meta);
      this.createFloatingText(this.player.x, this.player.y - 60, `📦 Shipped Crops: +${shippedGold} Gold!`, "#ffd700");
    }
  }

  updatePlayerMovement(dt) {
    let mx = 0;
    let my = 0;

    if (this.keys["KeyW"] || this.keys["ArrowUp"]) my -= 1;
    if (this.keys["KeyS"] || this.keys["ArrowDown"]) my += 1;
    if (this.keys["KeyA"] || this.keys["ArrowLeft"]) mx -= 1;
    if (this.keys["KeyD"] || this.keys["ArrowRight"]) mx += 1;

    if (this.virtualJoystick.active) {
      mx += this.virtualJoystick.dx;
      my += this.virtualJoystick.dy;
    }

    const dist = Math.hypot(mx, my);
    if (dist > 0.05) {
      const speed = this.stats.speed * this.stats.speedMult;
      const nx = mx / (dist > 1 ? dist : 1);
      const ny = my / (dist > 1 ? dist : 1);
      this.player.x += nx * speed * dt;
      this.player.y += ny * speed * dt;
      this.player.facingX = nx;
      this.player.facingY = ny;
    }

    const worldRadius = 800;
    const playerDist = Math.hypot(this.player.x, this.player.y);
    if (playerDist > worldRadius) {
      this.player.x = (this.player.x / playerDist) * worldRadius;
      this.player.y = (this.player.y / playerDist) * worldRadius;
    }
  }

  updateCrops(dt) {
    for (const plot of this.plots) {
      const matured = plot.update(dt, this.stats.cropSpeedMult);
      if (matured) {
        const isGiant = plot.crop && plot.crop.level >= 3;
        this.createFloatingText(plot.x, plot.y - 20, isGiant ? "🌟 SUMMON READY!" : "✨ READY!", "#76ff03");
      }

      // Walking over plots plants/waters/harvests
      if (!this.dragSourcePlot && distance(this.player.x, this.player.y, plot.x, plot.y) < 32) {
        if (!plot.crop) {
          const seed = this.player.selectedSeed;
          if (this.player.seedInventory[seed] > 0) {
            this.player.seedInventory[seed] -= 1;
            plot.plant(seed, 1);
            this.audio.collect(1);
            this.createFloatingText(plot.x, plot.y - 15, `Planted ${CROPS[seed].name}`, "#a5d6a7");
            this.syncUI();
          }
        } else if (plot.crop.isReady) {
          const harvest = plot.harvest();
          if (harvest) {
            this.player.cropInventory[harvest.cropData.id] =
              (this.player.cropInventory[harvest.cropData.id] || 0) + (harvest.level === 3 ? 3 : harvest.level);
            this.addXp(harvest.xp);
            this.meta.totalCropsHarvested += 1;

            if (harvest.allyType) {
              // SUMMON POWERFUL ALLY!
              const ally = new Ally(harvest.allyType, plot.x, plot.y);
              this.allies.push(ally);
              this.flash = 0.6;
              this.audio.jackpot();
              this.createFloatingText(
                plot.x,
                plot.y - 35,
                `⚡ SUMMONED ${ally.icon} ${ally.name.toUpperCase()}!`,
                "#ffd700"
              );
            } else {
              this.audio.collect(3);
              this.createFloatingText(plot.x, plot.y - 25, `+${harvest.cropData.name} (${harvest.cropData.icon})`, "#ffd54f");
            }
            this.syncUI();
          }
        } else if (!plot.isWatered) {
          plot.water();
          this.audio.collect(2);
        }
      }
    }
  }

  updateAllies(dt) {
    for (let i = this.allies.length - 1; i >= 0; i--) {
      const ally = this.allies[i];
      ally.update(
        dt,
        this.monsters,
        this.player.x,
        this.player.y,
        (p) => this.projectiles.push(p),
        (x, y, dmg, col) => this.createDamageNumber(x, y, dmg, col)
      );
    }
  }

  updateWeapons(dt) {
    const cdMult = this.stats.cooldownMult;
    this.scarecrowOrbitAngle += dt * 3.5;

    // 1. Scythe / Soul Harvester
    if (this.inventory.weapons.scythe) {
      this.weaponTimers.scythe -= dt;
      if (this.weaponTimers.scythe <= 0) {
        const isEvo = Boolean(this.inventory.evolutions.scythe);
        const wData = WEAPONS.scythe;
        this.weaponTimers.scythe = wData.cooldown * cdMult;
        const radius = isEvo ? 115 : 75 + this.inventory.weapons.scythe * 6;
        const damage = (isEvo ? 55 : wData.damage + this.inventory.weapons.scythe * 6) * this.stats.damageMult;

        this.projectiles.push({
          type: "scythe_slash",
          x: this.player.x,
          y: this.player.y,
          radius,
          damage,
          duration: 0.22,
          isEvo,
          hitMonsters: new Set(),
        });
        this.audio.fold();
      }
    }

    // 2. Sprinkler / Tsunami
    if (this.inventory.weapons.sprinkler) {
      this.weaponTimers.sprinkler -= dt;
      if (this.weaponTimers.sprinkler <= 0) {
        const isEvo = Boolean(this.inventory.evolutions.sprinkler);
        const wData = WEAPONS.sprinkler;
        this.weaponTimers.sprinkler = (isEvo ? 0.45 : wData.cooldown) * cdMult;
        const streams = isEvo ? 8 : 2 + this.inventory.weapons.sprinkler;
        const damage = (isEvo ? 26 : wData.damage + this.inventory.weapons.sprinkler * 3) * this.stats.damageMult;

        for (let i = 0; i < streams; i++) {
          const angle = performance.now() * 0.005 + (i * Math.PI * 2) / streams;
          this.projectiles.push({
            type: "water_jet",
            x: this.player.x,
            y: this.player.y,
            vx: Math.cos(angle) * wData.speed,
            vy: Math.sin(angle) * wData.speed,
            damage,
            pierce: isEvo ? 99 : 3,
            life: 0.7,
            isEvo,
          });
        }

        for (const plot of this.plots) {
          if (distance(this.player.x, this.player.y, plot.x, plot.y) < 140) {
            plot.water();
          }
        }
      }
    }

    // 3. Egg Blaster / Phoenix Nova Egg (Unique Weapon)
    if (this.inventory.weapons.eggBlaster) {
      this.weaponTimers.eggBlaster -= dt;
      if (this.weaponTimers.eggBlaster <= 0) {
        const isEvo = Boolean(this.inventory.evolutions.eggBlaster);
        const wData = WEAPONS.eggBlaster;
        this.weaponTimers.eggBlaster = wData.cooldown * cdMult;
        const count = isEvo ? 3 : 1 + Math.floor(this.inventory.weapons.eggBlaster / 3);
        const damage = (isEvo ? 75 : wData.damage + this.inventory.weapons.eggBlaster * 8) * this.stats.damageMult;

        for (let i = 0; i < count; i++) {
          const angle = Math.atan2(this.player.facingY, this.player.facingX) + rand(-0.35, 0.35);
          this.projectiles.push({
            type: "bouncing_egg",
            x: this.player.x,
            y: this.player.y,
            vx: Math.cos(angle) * wData.speed,
            vy: Math.sin(angle) * wData.speed,
            damage,
            bouncesLeft: isEvo ? 5 : 3,
            life: 2.0,
            isEvo,
          });
        }
        this.audio.start();
      }
    }

    // 4. Seed Gatling / Bramble Cannon (Unique Weapon)
    if (this.inventory.weapons.seedGatling) {
      this.weaponTimers.seedGatling -= dt;
      if (this.weaponTimers.seedGatling <= 0) {
        const isEvo = Boolean(this.inventory.evolutions.seedGatling);
        const wData = WEAPONS.seedGatling;
        this.weaponTimers.seedGatling = (isEvo ? 0.18 : wData.cooldown) * cdMult;
        const damage = (isEvo ? 18 : wData.damage + this.inventory.weapons.seedGatling * 2) * this.stats.damageMult;
        const angle = Math.atan2(this.player.facingY, this.player.facingX) + rand(-wData.spread, wData.spread);

        this.projectiles.push({
          type: "gatling_seed",
          x: this.player.x,
          y: this.player.y,
          vx: Math.cos(angle) * wData.speed,
          vy: Math.sin(angle) * wData.speed,
          damage,
          life: 0.8,
          isEvo,
        });
      }
    }

    // 5. Fertilizer Mortar / Biohazard Catapult (Unique Weapon)
    if (this.inventory.weapons.fertilizerMortar) {
      this.weaponTimers.fertilizerMortar -= dt;
      if (this.weaponTimers.fertilizerMortar <= 0) {
        const isEvo = Boolean(this.inventory.evolutions.fertilizerMortar);
        const wData = WEAPONS.fertilizerMortar;
        this.weaponTimers.fertilizerMortar = wData.cooldown * cdMult;
        const damage = (isEvo ? 90 : wData.damage + this.inventory.weapons.fertilizerMortar * 12) * this.stats.damageMult;

        let tx = this.player.x + rand(-180, 180);
        let ty = this.player.y + rand(-180, 180);
        const target = this.getClosestMonster(this.player.x, this.player.y);
        if (target) {
          tx = target.x;
          ty = target.y;
        }

        this.projectiles.push({
          type: "mortar_sludge",
          x: tx,
          y: ty,
          radius: isEvo ? 100 : wData.radius,
          damage,
          duration: isEvo ? 5.0 : wData.poolDuration,
          isEvo,
          hitMonstersTimer: 0,
        });
        this.audio.hit();
      }
    }

    // 6. Pitchfork / Titan Trident
    if (this.inventory.weapons.pitchfork) {
      this.weaponTimers.pitchfork -= dt;
      if (this.weaponTimers.pitchfork <= 0) {
        const isEvo = Boolean(this.inventory.evolutions.pitchfork);
        const wData = WEAPONS.pitchfork;
        this.weaponTimers.pitchfork = wData.cooldown * cdMult;
        const count = isEvo ? 3 : 1;
        const damage = (isEvo ? 65 : wData.damage + this.inventory.weapons.pitchfork * 8) * this.stats.damageMult;
        const baseAngle = Math.atan2(this.player.facingY, this.player.facingX);

        for (let i = 0; i < count; i++) {
          const spread = count === 1 ? 0 : (i - 1) * 0.25;
          const angle = baseAngle + spread;
          this.projectiles.push({
            type: "pitchfork",
            x: this.player.x,
            y: this.player.y,
            vx: Math.cos(angle) * wData.speed,
            vy: Math.sin(angle) * wData.speed,
            damage,
            life: 1.2,
            isEvo,
          });
        }
        this.audio.start();
      }
    }

    // 7. Beehive
    if (this.inventory.weapons.beehive) {
      this.weaponTimers.beehive -= dt;
      if (this.weaponTimers.beehive <= 0) {
        const isEvo = Boolean(this.inventory.evolutions.beehive);
        const wData = WEAPONS.beehive;
        this.weaponTimers.beehive = wData.cooldown * cdMult;
        const count = isEvo ? 8 : wData.count + this.inventory.weapons.beehive;
        const damage = (isEvo ? 24 : wData.damage + this.inventory.weapons.beehive * 3) * this.stats.damageMult;

        for (let i = 0; i < count; i++) {
          this.projectiles.push({
            type: "bee",
            x: this.player.x + rand(-15, 15),
            y: this.player.y + rand(-15, 15),
            damage,
            speed: wData.speed + rand(-20, 40),
            life: 2.2,
            isEvo,
          });
        }
      }
    }

    // 8. Sunburst Solar Totem
    if (this.inventory.weapons.sunburst) {
      this.weaponTimers.sunburst -= dt;
      if (this.weaponTimers.sunburst <= 0) {
        const isEvo = Boolean(this.inventory.evolutions.sunburst);
        const wData = WEAPONS.sunburst;
        this.weaponTimers.sunburst = wData.cooldown * cdMult;
        const damage = (isEvo ? 90 : wData.damage + this.inventory.weapons.sunburst * 12) * this.stats.damageMult;

        let targetX = this.player.x + rand(-150, 150);
        let targetY = this.player.y + rand(-150, 150);
        const closest = this.getClosestMonster(this.player.x, this.player.y);
        if (closest) {
          targetX = closest.x;
          targetY = closest.y;
        }

        this.projectiles.push({
          type: "sunburst_beam",
          x: targetX,
          y: targetY,
          radius: isEvo ? 100 : 60,
          damage,
          duration: 0.45,
          isEvo,
          hitMonsters: new Set(),
        });
        this.audio.jackpot();
      }
    }
  }

  getClosestMonster(x, y) {
    let closest = null;
    let minDist = Infinity;
    for (const m of this.monsters) {
      const d = distance(x, y, m.x, m.y);
      if (d < minDist) {
        minDist = d;
        closest = m;
      }
    }
    return closest;
  }

  updateProjectiles(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];

      if (p.type === "scythe_slash" || p.type === "sunburst_beam") {
        p.duration -= dt;
        if (p.type === "scythe_slash") {
          p.x = this.player.x;
          p.y = this.player.y;
        }

        for (const m of this.monsters) {
          if (!p.hitMonsters.has(m.id) && distance(p.x, p.y, m.x, m.y) < p.radius + m.size) {
            p.hitMonsters.add(m.id);
            const dx = m.x - p.x;
            const dy = m.y - p.y;
            const dist = Math.hypot(dx, dy) || 1;
            const dead = m.takeDamage(p.damage, (dx / dist) * 160, (dy / dist) * 160);
            this.createDamageNumber(m.x, m.y, p.damage, p.isEvo ? "#ffd700" : "#ffffff");

            if (p.isEvo && p.type === "scythe_slash" && dead) {
              this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + 1);
            }
          }
        }

        if (p.duration <= 0) {
          this.projectiles.splice(i, 1);
        }
      } else if (p.type === "bouncing_egg") {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;

        for (const m of this.monsters) {
          if (distance(p.x, p.y, m.x, m.y) < 16 + m.size) {
            m.takeDamage(p.damage, p.vx * 0.4, p.vy * 0.4);
            this.createDamageNumber(m.x, m.y, p.damage, "#ffeb3b");
            p.bouncesLeft -= 1;
            p.vx *= -0.85;
            p.vy *= -0.85;

            // Egg shrapnel particles
            this.createDeathParticles(p.x, p.y, "#fffde7");

            if (p.bouncesLeft <= 0) {
              p.life = 0;
              break;
            }
          }
        }

        if (p.life <= 0) {
          this.projectiles.splice(i, 1);
        }
      } else if (p.type === "gatling_seed" || p.type === "water_jet" || p.type === "pitchfork" || p.type === "ally_thorn" || p.type === "cosmic_plasma") {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;

        for (const m of this.monsters) {
          if (distance(p.x, p.y, m.x, m.y) < 18 + m.size) {
            m.takeDamage(p.damage, p.vx * 0.25, p.vy * 0.25);
            this.createDamageNumber(m.x, m.y, p.damage, p.color || "#80d8ff");
            if (p.pierce) {
              p.pierce -= 1;
              if (p.pierce <= 0) p.life = 0;
            } else {
              p.life = 0;
            }
            break;
          }
        }

        if (p.life <= 0) {
          this.projectiles.splice(i, 1);
        }
      } else if (p.type === "mortar_sludge") {
        p.duration -= dt;
        p.hitMonstersTimer -= dt;

        if (p.hitMonstersTimer <= 0) {
          p.hitMonstersTimer = 0.25;
          for (const m of this.monsters) {
            if (distance(p.x, p.y, m.x, m.y) < p.radius + m.size) {
              m.takeDamage(p.damage * 0.4);
              this.createDamageNumber(m.x, m.y, p.damage * 0.4, "#aeea00");
            }
          }
        }

        if (p.duration <= 0) {
          this.projectiles.splice(i, 1);
        }
      } else if (p.type === "crimson_beam" || p.type === "ground_shockwave") {
        p.duration -= dt;
        if (p.duration <= 0) {
          this.projectiles.splice(i, 1);
        }
      } else if (p.type === "bee") {
        p.life -= dt;
        const target = this.getClosestMonster(p.x, p.y);
        if (target) {
          const dx = target.x - p.x;
          const dy = target.y - p.y;
          const dist = Math.hypot(dx, dy) || 1;
          p.x += (dx / dist) * p.speed * dt;
          p.y += (dy / dist) * p.speed * dt;

          if (distance(p.x, p.y, target.x, target.y) < 14 + target.size) {
            target.takeDamage(p.damage);
            this.createDamageNumber(target.x, target.y, p.damage, "#ffff00");
            p.life = 0;
          }
        } else {
          p.x += rand(-30, 30) * dt;
          p.y += rand(-30, 30) * dt;
        }

        if (p.life <= 0) {
          this.projectiles.splice(i, 1);
        }
      }
    }

    // Scarecrow Orbit Damage
    if (this.inventory.weapons.scarecrow) {
      const isEvo = Boolean(this.inventory.evolutions.scarecrow);
      const count = isEvo ? 4 : 2 + Math.floor(this.inventory.weapons.scarecrow / 2);
      const radius = isEvo ? 110 : 85;
      const damage = (isEvo ? 45 : 15 + this.inventory.weapons.scarecrow * 4) * this.stats.damageMult * dt;

      for (let i = 0; i < count; i++) {
        const angle = this.scarecrowOrbitAngle + (i * Math.PI * 2) / count;
        const sx = this.player.x + Math.cos(angle) * radius;
        const sy = this.player.y + Math.sin(angle) * radius;

        for (const m of this.monsters) {
          if (distance(sx, sy, m.x, m.y) < 26 + m.size) {
            m.takeDamage(damage, Math.cos(angle) * 40, Math.sin(angle) * 40);
          }
        }
      }
    }
  }

  updateMonsters(dt) {
    if (this.timePhase === TIME_OF_DAY.NIGHT) {
      const newMonsters = this.spawner.update(
        dt,
        this.dayNumber,
        this.phaseTimer,
        this.phaseDuration,
        this.player.x,
        this.player.y
      );
      for (const m of newMonsters) {
        this.monsters.push(m);
      }
    }

    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const m = this.monsters[i];
      m.update(dt, this.player.x, this.player.y);

      if (distance(this.player.x, this.player.y, m.x, m.y) < 18 + m.size) {
        this.playerTakeDamage(m.damage * dt);
      }

      if (m.hp <= 0) {
        this.monsters.splice(i, 1);
        this.meta.totalMonstersSlain += 1;
        this.xpGems.push({ x: m.x, y: m.y, value: m.xp });
        this.createDeathParticles(m.x, m.y, m.color);

        if (Math.random() < 0.08 + this.stats.luck * 0.1) {
          const seeds = Object.keys(CROPS);
          const seedDrop = seeds[randInt(0, Math.min(seeds.length - 1, this.dayNumber))];
          this.player.seedInventory[seedDrop] = (this.player.seedInventory[seedDrop] || 0) + 1;
          this.createFloatingText(m.x, m.y - 20, `+1 ${CROPS[seedDrop].name} Seed!`, "#b9f6ca");
        }
      }
    }
  }

  playerTakeDamage(amount) {
    this.stats.hp -= amount;
    this.shake = Math.max(this.shake, 0.4);
    this.flash = Math.max(this.flash, 0.25);

    if (this.stats.hp <= 0) {
      this.stats.hp = 0;
      this.gameOver();
    }
    this.syncUI();
  }

  updateGems(dt) {
    const magnet = this.stats.magnetRadius;

    for (let i = this.xpGems.length - 1; i >= 0; i--) {
      const gem = this.xpGems[i];
      const d = distance(this.player.x, this.player.y, gem.x, gem.y);

      if (d < magnet) {
        const pullSpeed = (1 - d / magnet) * 380 + 120;
        const dx = this.player.x - gem.x;
        const dy = this.player.y - gem.y;
        gem.x += (dx / d) * pullSpeed * dt;
        gem.y += (dy / d) * pullSpeed * dt;
      }

      if (d < 22) {
        this.addXp(gem.value);
        this.xpGems.splice(i, 1);
        this.audio.collect(1);
      }
    }
  }

  addXp(amount) {
    this.player.xp += amount;
    if (this.player.xp >= this.player.xpNeeded) {
      this.player.xp -= this.player.xpNeeded;
      this.player.level += 1;
      this.player.xpNeeded = getRequiredXp(this.player.level);
      this.triggerLevelUp();
    }
    this.syncUI();
  }

  triggerLevelUp() {
    this.state = GAME_STATES.LEVEL_UP;
    this.audio.boon();
    const options = pickLevelUpOptions(this.inventory);
    this.showLevelUpModal(options);
  }

  showLevelUpModal(options) {
    this.ui.levelupModal.hidden = false;
    this.ui.levelupOptions.innerHTML = "";

    for (const opt of options) {
      const card = document.createElement("button");
      card.type = "button";
      card.className = `option-card ${opt.type === "evolution" ? "evo" : ""}`;
      card.innerHTML = `
        <span class="icon">${opt.icon}</span>
        <div class="info">
          <strong>${opt.name}</strong>
          <p>${opt.desc}</p>
        </div>
      `;
      card.addEventListener("click", () => {
        this.applyLevelUpChoice(opt);
        this.ui.levelupModal.hidden = true;
        this.state = GAME_STATES.PLAYING;
        this.syncUI();
      });
      this.ui.levelupOptions.appendChild(card);
    }
  }

  applyLevelUpChoice(opt) {
    if (opt.type === "new_weapon") {
      this.inventory.weapons[opt.weaponId] = 1;
    } else if (opt.type === "weapon_upgrade") {
      this.inventory.weapons[opt.weaponId] += 1;
    } else if (opt.type === "new_passive") {
      this.inventory.passives[opt.passiveId] = 1;
    } else if (opt.type === "passive_upgrade") {
      this.inventory.passives[opt.passiveId] += 1;
    } else if (opt.type === "evolution") {
      this.inventory.evolutions[opt.weaponId] = true;
      this.flash = 0.8;
      this.audio.jackpot();
    } else if (opt.type === "heal") {
      this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + 40);
    } else if (opt.type === "gold") {
      this.player.gold += 60;
    }

    this.stats = recomputePlayerStats(createPlayerStats(this.meta.upgrades), this.inventory.passives);
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const d = this.damageNumbers[i];
      d.life -= dt;
      d.y -= 25 * dt;
      if (d.life <= 0) this.damageNumbers.splice(i, 1);
    }

    this.shake = Math.max(0, this.shake - dt * 2.5);
    this.flash = Math.max(0, this.flash - dt * 2);
  }

  createDamageNumber(x, y, damage, color = "#ffffff") {
    this.damageNumbers.push({
      x: x + rand(-8, 8),
      y: y - 10,
      text: Math.round(damage).toString(),
      color,
      life: 0.65,
    });
  }

  createFloatingText(x, y, text, color = "#ffffff") {
    this.damageNumbers.push({
      x,
      y,
      text,
      color,
      life: 1.2,
    });
  }

  createDeathParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(40, 140);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: rand(3, 6),
        color,
        life: 0.45,
      });
    }
  }

  createMergeParticles(x, y) {
    for (let i = 0; i < 16; i++) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(60, 200);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: rand(4, 8),
        color: "#ffd700",
        life: 0.6,
      });
    }
  }

  updateCamera(dt) {
    const targetX = this.player.x;
    const targetY = this.player.y;
    this.camera.x += (targetX - this.camera.x) * Math.min(1, 10 * dt);
    this.camera.y += (targetY - this.camera.y) * Math.min(1, 10 * dt);
  }

  tryInteract() {
    if (distance(this.player.x, this.player.y, 0, -160) < 95) {
      this.openShop();
    }
  }

  openShop() {
    this.ui.shopModal.hidden = false;
    this.renderShop();
  }

  closeShop() {
    this.ui.shopModal.hidden = true;
  }

  renderShop() {
    this.ui.shopGold.textContent = `${this.player.gold} Gold`;
    this.ui.seedStoreList.innerHTML = "";

    for (const [cropId, data] of Object.entries(CROPS)) {
      const isUnlocked = this.dayNumber >= data.unlockedAtDay;
      const count = this.player.seedInventory[cropId] || 0;
      const row = document.createElement("div");
      row.className = "shop-item";
      row.innerHTML = `
        <span class="crop-icon">${data.icon}</span>
        <div class="crop-details">
          <strong>${data.name} ${!isUnlocked ? `(Day ${data.unlockedAtDay}+)` : ""}</strong>
          <small>Grows in ${data.growTime}s · Summons: ${ALLIES[data.allySummon].name} · (Bag: ${count})</small>
        </div>
        <button type="button" class="buy-btn" ${!isUnlocked || this.player.gold < data.seedCost ? "disabled" : ""}>
          Buy ${data.seedCost}g
        </button>
      `;

      const buyBtn = row.querySelector(".buy-btn");
      buyBtn.addEventListener("click", () => {
        if (this.player.gold >= data.seedCost) {
          this.player.gold -= data.seedCost;
          this.player.seedInventory[cropId] = (this.player.seedInventory[cropId] || 0) + 1;
          this.audio.collect(1);
          this.syncUI();
          this.renderShop();
        }
      });

      this.ui.seedStoreList.appendChild(row);
    }
  }

  gameOver() {
    this.state = GAME_STATES.GAME_OVER;
    this.audio.hit();
    this.meta.totalGold += this.player.gold;
    saveMeta(this.meta);

    this.ui.gameoverModal.hidden = false;
    this.ui.gameoverStats.innerHTML = `
      <p>Survives until: <b>Day ${this.dayNumber}</b></p>
      <p>Allies Summoned: <b>${this.allies.length}</b></p>
      <p>Player Level Reached: <b>Lv ${this.player.level}</b></p>
      <p>Gold Deposited: <b>+${this.player.gold}g</b></p>
    `;
  }

  syncUI() {
    if (!this.ui.hpBar) return;
    const hpPct = Math.max(0, (this.stats.hp / this.stats.maxHp) * 100);
    this.ui.hpBar.style.width = `${hpPct}%`;
    this.ui.hpText.textContent = `${Math.ceil(this.stats.hp)} / ${this.stats.maxHp}`;

    const xpPct = Math.min(100, (this.player.xp / this.player.xpNeeded) * 100);
    this.ui.xpBar.style.width = `${xpPct}%`;
    this.ui.levelText.textContent = `Lv ${this.player.level}`;

    this.ui.goldText.textContent = `${this.player.gold}g`;
    this.ui.timeBanner.textContent = `${this.timePhase === TIME_OF_DAY.DAY ? "☀️ DAY" : "🌙 NIGHT"} ${this.dayNumber}`;
    this.ui.timeTimer.textContent = `${Math.ceil(this.phaseTimer)}s`;
    this.ui.timeTimer.className = this.timePhase === TIME_OF_DAY.NIGHT ? "night-timer" : "day-timer";

    // Ally counter banner
    if (this.ui.allyCounter) {
      this.ui.allyCounter.textContent = `🛡️ Allies: ${this.allies.length}`;
    }

    // Seed selector bar
    if (this.ui.seedSelector) {
      this.ui.seedSelector.innerHTML = "";
      for (const [cropId, data] of Object.entries(CROPS)) {
        const count = this.player.seedInventory[cropId] || 0;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `seed-btn ${this.player.selectedSeed === cropId ? "active" : ""}`;
        btn.innerHTML = `${data.icon} <span>${count}</span>`;
        btn.addEventListener("click", () => {
          this.player.selectedSeed = cropId;
          this.syncUI();
        });
        this.ui.seedSelector.appendChild(btn);
      }
    }
  }

  draw() {
    const { ctx, width, height } = this;
    ctx.clearRect(0, 0, width, height);

    const sx = this.shake ? rand(-6, 6) * this.shake : 0;
    const sy = this.shake ? rand(-6, 6) * this.shake : 0;

    ctx.save();
    ctx.translate(width / 2 + sx - this.camera.x, height / 2 + sy - this.camera.y);

    // 1. Terrain
    this.drawTerrain(ctx);

    // 2. Farm Plots & Merged Crops
    this.drawFarmPlots(ctx);

    // 3. Farmhouse
    this.drawFarmBuildings(ctx);

    // 4. XP Gems
    this.drawGems(ctx);

    // 5. Summoned Allies
    this.drawAllies(ctx);

    // 6. Monsters
    this.drawMonsters(ctx);

    // 7. Player
    this.drawPlayer(ctx);

    // 8. Weapons, Projectiles & Orbiters
    this.drawProjectiles(ctx);

    // 9. Particles & Damage Numbers
    this.drawEffects(ctx);

    // 10. Drag-to-merge visual line
    if (this.dragSourcePlot) {
      const targetWorld = {
        x: this.pointerPos.x - width / 2 + this.camera.x,
        y: this.pointerPos.y - height / 2 + this.camera.y,
      };
      ctx.strokeStyle = "#ffd700";
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(this.dragSourcePlot.x, this.dragSourcePlot.y);
      ctx.lineTo(targetWorld.x, targetWorld.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();

    // 11. Day/Night Screen Lighting
    this.drawAmbientLighting(ctx, width, height);

    // 12. Virtual Touch Joystick
    this.drawJoystick(ctx);
  }

  drawTerrain(ctx) {
    const size = 1800;
    ctx.fillStyle = "#5c8a3d";
    ctx.fillRect(-size / 2, -size / 2, size, size);

    ctx.fillStyle = "#8d6e4a";
    ctx.fillRect(-220, -180, 440, 26);
    ctx.fillRect(-18, -180, 36, 420);

    ctx.strokeStyle = "#4e342e";
    ctx.lineWidth = 6;
    ctx.strokeRect(-800, -800, 1600, 1600);
  }

  drawFarmPlots(ctx) {
    for (const plot of this.plots) {
      ctx.fillStyle = plot.isWatered ? "#3e2723" : "#6d4c41";
      ctx.fillRect(plot.x - plot.size / 2, plot.y - plot.size / 2, plot.size, plot.size);
      ctx.strokeStyle = plot.isWatered ? "#271610" : "#4e342e";
      ctx.lineWidth = 2;
      ctx.strokeRect(plot.x - plot.size / 2, plot.y - plot.size / 2, plot.size, plot.size);

      // Selected for dragging outline
      if (this.dragSourcePlot === plot) {
        ctx.strokeStyle = "#ffd700";
        ctx.lineWidth = 3;
        ctx.strokeRect(plot.x - plot.size / 2 - 2, plot.y - plot.size / 2 - 2, plot.size + 4, plot.size + 4);
      }

      if (plot.crop) {
        const cropData = CROPS[plot.crop.type];
        const progressPct = Math.min(1.0, plot.crop.progress / plot.crop.maxTime);
        const level = plot.crop.level;
        const isGiant = level >= 3;

        if (plot.crop.isReady) {
          const bounce = Math.sin(performance.now() * 0.008) * 3;
          const fontPx = isGiant ? 32 : level === 2 ? 26 : 20;
          ctx.font = `${fontPx}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(cropData.icon, plot.x, plot.y + bounce);

          // Star badge for level 2 / 3 giant crops
          if (level > 1) {
            ctx.font = "12px sans-serif";
            ctx.fillText(isGiant ? "🌟Lv3" : "⭐Lv2", plot.x, plot.y - 18);
          }
        } else {
          const baseSize = level === 3 ? 8 : level === 2 ? 6 : 4;
          const sproutSize = baseSize + progressPct * (level === 3 ? 18 : 12);

          ctx.fillStyle = cropData.leafColor;
          ctx.beginPath();
          ctx.arc(plot.x, plot.y - 2, sproutSize, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = cropData.color;
          ctx.beginPath();
          ctx.arc(plot.x, plot.y - 2, sproutSize * 0.5, 0, Math.PI * 2);
          ctx.fill();

          if (level > 1) {
            ctx.fillStyle = "#ffd700";
            ctx.font = "10px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(isGiant ? "🌟" : "⭐", plot.x, plot.y - sproutSize - 4);
          }
        }
      }
    }
  }

  drawFarmBuildings(ctx) {
    const hx = 0;
    const hy = -160;

    ctx.fillStyle = "#c28858";
    ctx.fillRect(hx - 60, hy - 40, 120, 80);
    ctx.strokeStyle = "#3e2723";
    ctx.lineWidth = 3;
    ctx.strokeRect(hx - 60, hy - 40, 120, 80);

    ctx.fillStyle = "#b71c1c";
    ctx.beginPath();
    ctx.moveTo(hx - 75, hy - 40);
    ctx.lineTo(hx, hy - 95);
    ctx.lineTo(hx + 75, hy - 40);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#4e342e";
    ctx.fillRect(hx - 16, hy + 10, 32, 30);

    ctx.fillStyle = "#ffe082";
    ctx.fillRect(hx - 45, hy - 25, 90, 20);
    ctx.strokeRect(hx - 45, hy - 25, 90, 20);
    ctx.fillStyle = "#3e2723";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🏡 FARM SHOP", hx, hy - 11);
  }

  drawGems(ctx) {
    for (const gem of this.xpGems) {
      ctx.fillStyle = "#00e676";
      ctx.beginPath();
      ctx.arc(gem.x, gem.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  drawAllies(ctx) {
    for (const ally of this.allies) {
      ctx.save();
      ctx.translate(ally.x, ally.y);

      // Glowing aura
      ctx.fillStyle = `${ally.color}33`;
      ctx.beginPath();
      ctx.arc(0, 0, ally.size * 1.4, 0, Math.PI * 2);
      ctx.fill();

      // Shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
      ctx.beginPath();
      ctx.ellipse(0, ally.size * 0.8, ally.size * 0.8, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ally Icon & Body
      ctx.font = `${Math.round(ally.size * 1.5)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(ally.icon, 0, Math.sin(ally.animPhase) * 3);

      // Ally Name tag
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText(ally.name, 0, -ally.size - 6);

      ctx.restore();
    }
  }

  drawMonsters(ctx) {
    for (const m of this.monsters) {
      ctx.save();
      ctx.translate(m.x, m.y);

      ctx.fillStyle = m.hitTimer > 0 ? "#ffffff" : m.color;
      ctx.beginPath();
      ctx.arc(0, 0, m.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = m.eyeColor;
      ctx.beginPath();
      ctx.arc(-m.size * 0.35, -m.size * 0.2, m.size * 0.2, 0, Math.PI * 2);
      ctx.arc(m.size * 0.35, -m.size * 0.2, m.size * 0.2, 0, Math.PI * 2);
      ctx.fill();

      if (m.isBoss) {
        ctx.fillStyle = "#ffd700";
        ctx.font = "16px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("👑", 0, -m.size - 6);
      }

      ctx.restore();
    }
  }

  drawPlayer(ctx) {
    ctx.save();
    ctx.translate(this.player.x, this.player.y);

    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.beginPath();
    ctx.ellipse(0, 14, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#1976d2";
    ctx.fillRect(-9, -4, 18, 16);

    ctx.fillStyle = "#ffcc80";
    ctx.beginPath();
    ctx.arc(0, -10, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fbc02d";
    ctx.beginPath();
    ctx.ellipse(0, -16, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f57f17";
    ctx.beginPath();
    ctx.arc(0, -18, 8, Math.PI, 0);
    ctx.fill();

    ctx.restore();
  }

  drawProjectiles(ctx) {
    for (const p of this.projectiles) {
      if (p.type === "scythe_slash") {
        ctx.strokeStyle = p.isEvo ? "#ffd700" : "#ffffff";
        ctx.lineWidth = p.isEvo ? 8 : 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === "water_jet") {
        ctx.fillStyle = p.isEvo ? "#00e5ff" : "#29b6f6";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.isEvo ? 8 : 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === "bouncing_egg") {
        ctx.fillStyle = p.isEvo ? "#ff5722" : "#fffde7";
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#3e2723";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (p.type === "gatling_seed") {
        ctx.fillStyle = p.isEvo ? "#ffd700" : "#ff9800";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === "mortar_sludge") {
        ctx.fillStyle = p.isEvo ? "rgba(174, 234, 0, 0.4)" : "rgba(76, 175, 80, 0.35)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#7cb342";
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (p.type === "pitchfork" || p.type === "ally_thorn") {
        ctx.strokeStyle = p.isEvo ? "#ff3d00" : p.color || "#b0bec5";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(p.x - p.vx * 0.05, p.y - p.vy * 0.05);
        ctx.lineTo(p.x + p.vx * 0.05, p.y + p.vy * 0.05);
        ctx.stroke();
      } else if (p.type === "crimson_beam") {
        ctx.strokeStyle = "rgba(233, 30, 99, 0.85)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.tx, p.ty);
        ctx.stroke();
      } else if (p.type === "ground_shockwave") {
        ctx.strokeStyle = p.color || "#8d6e63";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === "cosmic_plasma") {
        ctx.fillStyle = "#ffd700";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === "bee") {
        ctx.fillStyle = p.isEvo ? "#ff9100" : "#ffeb3b";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === "sunburst_beam") {
        ctx.fillStyle = p.isEvo ? "rgba(255, 215, 0, 0.45)" : "rgba(255, 235, 59, 0.35)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }

    if (this.inventory.weapons.scarecrow) {
      const isEvo = Boolean(this.inventory.evolutions.scarecrow);
      const count = isEvo ? 4 : 2 + Math.floor(this.inventory.weapons.scarecrow / 2);
      const radius = isEvo ? 110 : 85;

      for (let i = 0; i < count; i++) {
        const angle = this.scarecrowOrbitAngle + (i * Math.PI * 2) / count;
        const sx = this.player.x + Math.cos(angle) * radius;
        const sy = this.player.y + Math.sin(angle) * radius;

        ctx.font = isEvo ? "24px sans-serif" : "18px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(isEvo ? "🔥" : "🎃", sx, sy);
      }
    }
  }

  drawEffects(ctx) {
    for (const d of this.damageNumbers) {
      ctx.fillStyle = d.color;
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(d.text, d.x, d.y);
    }

    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawAmbientLighting(ctx, width, height) {
    if (this.timePhase === TIME_OF_DAY.NIGHT) {
      ctx.save();
      ctx.fillStyle = "rgba(10, 15, 30, 0.65)";
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const lightGrad = ctx.createRadialGradient(cx, cy, 30, cx, cy, 180);
      lightGrad.addColorStop(0, "rgba(255, 230, 150, 0.35)");
      lightGrad.addColorStop(1, "rgba(255, 230, 150, 0)");
      ctx.fillStyle = lightGrad;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.flash * 0.35})`;
      ctx.fillRect(0, 0, width, height);
    }
  }

  drawJoystick(ctx) {
    if (!this.virtualJoystick.active) return;
    const j = this.virtualJoystick;

    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(j.startX, j.startY, 50, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 215, 0, 0.75)";
    ctx.beginPath();
    ctx.arc(j.startX + j.dx * 50, j.startY + j.dy * 50, 22, 0, Math.PI * 2);
    ctx.fill();
  }
}
