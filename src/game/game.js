import {
  applyBoon,
  boonById,
  createMods,
  createRun,
  hungerText,
  pickDraft,
  relicChips,
} from "./boons.js";
import { applyRunToMeta, emptyMeta, nextUnlock, titleForXp } from "./meta.js";
import {
  ACTIONS,
  BUILDINGS,
  FLAVOR,
  actionLabel,
  applyAction,
  canAffordTime,
  clockLabel,
  createHero,
  heroLine,
  missingNeed,
  wellPayout,
} from "./rpg.js";
import { Town } from "./town.js";
import { drawStick } from "./stick.js";
import {
  createFourDAngles,
  hypersphereSliceRadius,
  projectCell16,
  projectTesseract,
  sliceWFromAngles,
  stepFourDAngles,
} from "./hypercube.js";
import { orbMultiplier, pickSlice, shardCollides, sliceName } from "./slice.js";
import { AudioBus } from "./audio.js";
import { loadMeta, saveBestScore, saveMeta } from "./storage.js";
import { createCamera, floorCorners, projectPoint, unprojectPoint, vanishingPoint } from "./perspective.js";
import {
  circleHit,
  clamp,
  damp,
  distance,
  keepAwayFrom,
  orbPoints,
  rand,
  spawnIntervals,
} from "./utils.js";

const STATES = {
  menu: "menu",
  town: "town",
  playing: "playing",
  draft: "draft",
  dying: "dying",
  over: "over",
};

const SLICE_COLORS = {
  "-1": { fill: "#3a1048", stroke: "#e56bff", glow: "#c84dff", orb: "#e9b4ff" },
  0: { fill: "#3a1020", stroke: "#ff6d86", glow: "#ff5d7a", orb: "#ffd56a" },
  1: { fill: "#10283a", stroke: "#5ce1ff", glow: "#5ce1ff", orb: "#9ef2ff" },
};

export class Game {
  constructor(canvas, ui) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ui = ui;
    this.audio = new AudioBus();
    this.state = STATES.menu;
    this.dpr = 1;
    this.width = 0;
    this.height = 0;
    this.lastTime = 0;
    this.elapsed = 0;
    this.score = 0;
    this.best = 0;
    this.meta = loadMeta(emptyMeta);
    this.best = this.meta.best || 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.shake = 0;
    this.flash = 0;
    this.orbTimer = 0;
    this.shardTimer = 0;
    this.deathTimer = 0;
    this.player = { x: 0, y: 0, r: 22, angles: createFourDAngles() };
    this.fourD = { tesseract: null, cell16: null, slice: 1 };
    this.run = createRun();
    this.mods = createMods({});
    this.pointer = { x: 0, y: 0, sx: 0, sy: 0, active: false, startX: 0, startY: 0, startAt: 0 };
    this.orbs = [];
    this.shards = [];
    this.particles = [];
    this.trail = [];
    this.stars = [];
    this.camera = createCamera();
    this.running = false;
    this.boundFrame = (time) => this.frame(time);
    this.scene = "town";
    this.hero = this.meta.hero || createHero();
    this.town = new Town(this);
    this.walkCycle = 0;
    this.roomId = null;

    this.resize();
    this.resetField();
    this.bindInput();
    this.bindRoom();
    this.syncHud();
    this.syncTownHud();
    this.renderMeta();
    this.draw(0);
  }

  startLoop() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.boundFrame);
  }

  uiTarget(event) {
    return event.target?.closest?.("#play, #fold, #draft, .boon-card, .overlay, #room, #town-hud");
  }

  clock() {
    return clockLabel(this.hero.hour);
  }

  saveLife() {
    this.meta.hero = this.hero;
    this.meta.best = this.best;
    saveMeta(this.meta);
  }

  bindRoom() {
    this.ui.roomLeave?.addEventListener("click", (event) => {
      event.preventDefault();
      this.closeRoom();
    });
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
    this.seedStars();
  }

  seedStars() {
    const count = 90;
    this.stars = Array.from({ length: count }, () => ({
      side: Math.floor(rand(0, 3)) - 1,
      t: Math.random(),
      tw: rand(0, Math.PI * 2),
      size: rand(0.5, 2.1),
    }));
  }

  world() {
    return { width: this.width, height: this.height };
  }

  view(x, y) {
    return projectPoint(x, y, this.world(), this.camera);
  }

  updateCamera(dt) {
    const target = this.run.polarity >= 0 ? 0.72 : -0.72;
    const folding = this.run.foldTimer > 0;
    this.camera.shear += (target - this.camera.shear) * Math.min(1, (folding ? 8 : 3.2) * dt);
    this.camera.punch = Math.max(0, this.camera.punch - dt * 2.4);
    if (folding) this.camera.punch = Math.max(this.camera.punch, 0.22);
  }

  bindInput() {
    const toLocal = (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const sx = clamp(event.clientX - rect.left, 0, this.width);
      const sy = clamp(event.clientY - rect.top, 0, this.height);
      this.pointer.sx = sx;
      this.pointer.sy = sy;
      const world = unprojectPoint(sx, sy, this.world(), this.camera);
      this.pointer.x = clamp(world.x, 0, this.width);
      this.pointer.y = clamp(world.y, 0, this.height);
    };

    const onDown = (event) => {
      this.audio.unlock();
      if (this.uiTarget(event)) return;
      this.pointer.active = true;
      toLocal(event);
      this.pointer.startX = this.pointer.sx;
      this.pointer.startY = this.pointer.sy;
      this.pointer.startAt = performance.now();
      if (this.state === STATES.playing) {
        try {
          event.target?.setPointerCapture?.(event.pointerId);
        } catch {
          // Some mobile browsers reject capture on non-canvas targets.
        }
      }
    };

    const onMove = (event) => {
      if (this.uiTarget(event)) return;
      if (!this.pointer.active && this.state !== STATES.playing) return;
      toLocal(event);
    };

    const onUp = (event) => {
      if (this.pointer.active && !this.uiTarget(event)) {
        if (this.scene === "well" && this.state === STATES.playing) {
          const moved = distance(this.pointer.sx, this.pointer.sy, this.pointer.startX, this.pointer.startY);
          const elapsed = performance.now() - this.pointer.startAt;
          if (moved < 18 && elapsed < 280) this.tryFold();
        } else if (this.state === STATES.town && this.scene === "town" && this.ui.room?.hidden !== false) {
          this.town.tap(this.pointer.sx);
        }
      }
      this.pointer.active = false;
    };

    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener(
      "touchmove",
      (event) => {
        if (event.target.closest("button, #draft, .overlay, #room")) return;
        event.preventDefault();
      },
      { passive: false },
    );
    window.addEventListener("resize", () => this.resize());
    window.visualViewport?.addEventListener("resize", () => this.resize());
    document.addEventListener("visibilitychange", () => {
      this.lastTime = performance.now();
    });
    this.ui.fold.addEventListener("click", (event) => {
      event.preventDefault();
      this.tryFold();
    });
  }

  play() {
    this.audio.unlock();
    this.audio.start();
    this.enterTown({ fromMenu: true });
  }

  wellHud(show) {
    this.ui.hud.hidden = !show;
    this.ui.fold.hidden = !show;
    if (this.ui.hunger) this.ui.hunger.hidden = !show;
    if (this.ui.townHud) this.ui.townHud.hidden = show;
    if (!show) this.ui.draft.hidden = true;
  }

  enterTown({ fromMenu = false, atWell = false } = {}) {
    this.scene = "town";
    this.state = STATES.town;
    this.ui.overlay.hidden = true;
    this.ui.draft.hidden = true;
    this.closeRoom();
    this.wellHud(false);
    if (fromMenu) {
      this.town.playerX = 220;
      this.town.targetX = 220;
      this.town.say("Tap a building. Get a job. Don't die broke.");
    }
    if (atWell) {
      const well = BUILDINGS.find((b) => b.id === "well");
      this.town.playerX = well.x + well.w * 0.5;
      this.town.targetX = this.town.playerX;
      this.town.cameraX = Math.max(0, this.town.playerX - this.width * 0.42);
    }
    this.syncTownHud();
  }

  enterWell() {
    this.audio.start();
    this.scene = "well";
    this.state = STATES.playing;
    this.resetField();
    this.elapsed = 0;
    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.orbTimer = 0.15;
    this.shardTimer = 1.1;
    this.closeRoom();
    this.wellHud(true);
    this.syncHud();
  }

  openRoom(building) {
    if (this.state !== STATES.town || !this.ui.room) return;
    this.roomId = building.id;
    this.ui.room.hidden = false;
    this.ui.roomTitle.textContent = building.name;
    this.ui.roomFlavor.textContent = FLAVOR[building.id] || "";
    this.ui.roomLog.hidden = true;
    this.ui.roomLog.textContent = "";
    this.ui.room.style.setProperty("--room-color", building.color);
    this.town.say(FLAVOR[building.id] || building.name);
    this.renderRoom();
  }

  closeRoom() {
    this.roomId = null;
    if (this.ui.room) this.ui.room.hidden = true;
  }

  renderRoom() {
    if (!this.ui.roomActions || !this.roomId) return;
    this.ui.roomStats.textContent = heroLine(this.hero);
    this.ui.roomActions.innerHTML = "";
    const actions = ACTIONS[this.roomId] || [];
    for (const action of actions) {
      const blocked = missingNeed(this.hero, action) || (!canAffordTime(this.hero, action) ? "Too late. Sleep." : null);
      const button = document.createElement("button");
      button.type = "button";
      button.className = `room-act${action.special === "well" ? " well" : ""}`;
      button.disabled = Boolean(blocked);
      button.textContent = blocked ? `${action.name} — ${blocked}` : actionLabel(action);
      button.addEventListener("click", () => this.doAction(action));
      this.ui.roomActions.appendChild(button);
    }
  }

  doAction(action) {
    const result = applyAction(this.hero, action);
    if (!result.ok) {
      if (this.ui.roomLog) {
        this.ui.roomLog.hidden = false;
        this.ui.roomLog.textContent = result.reason;
      }
      this.town.say(result.reason);
      return;
    }
    this.hero = result.hero;
    this.saveLife();
    this.syncTownHud();
    if (result.special === "well") {
      this.town.say(result.text);
      this.enterWell();
      return;
    }
    if (this.ui.roomLog) {
      this.ui.roomLog.hidden = false;
      this.ui.roomLog.textContent = result.text;
    }
    this.town.say(result.text);
    this.renderRoom();
    this.audio.collect(2);
  }

  resetField() {
    this.player.x = this.width * 0.5;
    this.player.y = this.height * 0.68;
    this.player.angles = createFourDAngles();
    this.pointer.x = this.player.x;
    this.pointer.y = this.player.y;
    this.orbs = [];
    this.shards = [];
    this.particles = [];
    this.trail = [];
    this.shake = 0;
    this.flash = 0;
    this.deathTimer = 0;
    this.run = createRun();
    this.mods = createMods({});
  }

  gameOver() {
    this.best = saveBestScore(this.score);
    const reward = applyRunToMeta(this.meta, {
      score: this.score,
      orbs: this.run.orbs,
      drafts: this.run.drafts,
    });
    const payout = wellPayout(this.score);
    this.hero = {
      ...this.hero,
      cash: this.hero.cash + payout,
      hp: Math.max(1, this.hero.hp - 18),
    };
    this.meta.hero = this.hero;
    this.meta.best = this.best;
    saveMeta(this.meta);
    const unlockNames = reward.unlocks.map((id) => boonById(id)?.name ?? id);
    if (unlockNames.length) this.audio.jackpot();
    const bits = [`Crawled out with $${payout}.`, `Score ${this.score}.`, `+${reward.gained} XP.`];
    if (unlockNames.length) bits.push(`Unlocked ${unlockNames.join(", ")}.`);
    this.enterTown({ atWell: true });
    this.town.say(bits.join(" "));
    this.renderMeta();
    this.syncHud();
  }

  renderMeta() {
    if (!this.ui.rank) return;
    this.ui.rank.textContent = titleForXp(this.meta.xp);
    const next = nextUnlock(this.meta);
    if (next) {
      const boon = boonById(next.id);
      this.ui.nextUnlock.textContent = `NEXT ${boon?.name ?? next.id} · ${next.need} XP`;
      this.ui.xpBar.style.width = `${Math.round((1 - next.need / Math.max(next.xp, 1)) * 100)}%`;
    } else {
      this.ui.nextUnlock.textContent = "YOU'VE DONE IT ALL. STILL BROKE THOUGH.";
      this.ui.xpBar.style.width = "100%";
    }
  }

  syncTownHud() {
    if (!this.ui.townCash) return;
    this.ui.townCash.textContent = `$${this.hero.cash}`;
    this.ui.townClock.textContent = `Day ${this.hero.day}  ${this.clock()}`;
    this.ui.townHp.textContent = `HP ${this.hero.hp}`;
    this.ui.townStats.textContent = heroLine(this.hero);
  }

  syncHud() {
    this.ui.score.textContent = String(this.score);
    this.ui.best.textContent = String(this.best);
    this.ui.sliceChip.textContent = sliceName(this.run.polarity);
    this.ui.sliceChip.classList.toggle("kata", this.run.polarity < 0);
    this.ui.sliceChip.classList.toggle("folding", this.run.foldTimer > 0);
    if (this.combo >= 2 && (this.state === STATES.playing || this.state === STATES.draft)) {
      this.ui.combo.hidden = false;
      this.ui.combo.textContent = `x${this.combo}`;
    } else {
      this.ui.combo.hidden = true;
    }

    const folding = this.run.foldTimer > 0;
    const ready = this.run.foldCooldown <= 0 && this.state === STATES.playing;
    this.ui.foldLabel.textContent = folding ? "FOLDING" : this.run.foldCooldown > 0 ? this.run.foldCooldown.toFixed(1) : "FOLD";
    this.ui.fold.classList.toggle("ready", ready);
    this.ui.fold.classList.toggle("busy", !ready);

    const chips = relicChips(this.run.stacks)
      .map((chip) => `<span class="relic${chip.cursed ? " cursed" : ""}${chip.tier >= 4 ? " evo" : ""}">${chip.tag}${chip.level > 1 ? ` ${chip.level}` : ""}</span>`)
      .join("");
    this.ui.relics.innerHTML = chips;
    if (this.ui.hunger) {
      this.ui.hunger.hidden = this.state !== STATES.playing && this.state !== STATES.draft;
      this.ui.hunger.textContent = hungerText(this.run);
    }
  }

  frame(time) {
    const dt = clamp((time - this.lastTime) / 1000, 0, 0.05);
    this.lastTime = time;
    this.update(dt);
    this.draw(dt);
    requestAnimationFrame(this.boundFrame);
  }

  update(dt) {
    if (this.scene !== "well") {
      this.town.update(dt);
      this.shake = Math.max(0, this.shake - dt * 8);
      this.flash = Math.max(0, this.flash - dt * 3);
      return;
    }

    const folding = this.run.foldTimer > 0;
    const speed =
      this.state === STATES.playing || this.state === STATES.draft
        ? (1 + this.combo * 0.08) * (folding ? 2.4 : 1)
        : 0.7;
    stepFourDAngles(this.player.angles, dt, speed);
    this.projectPlayer();
    this.updateCamera(dt);

    if (this.state === STATES.playing) {
      this.elapsed += dt;
      this.updateFold(dt);
      this.updatePlayer(dt);
      this.updateEchoes(dt);
      this.updateSpawns(dt);
      this.updateOrbs(dt);
      this.updateShards(dt);
      this.updateCombo(dt);
    } else if (this.state === STATES.dying) {
      this.deathTimer -= dt;
      if (this.deathTimer <= 0) this.gameOver();
    }

    this.updateParticles(dt);
    this.updateTrail(dt);
    this.shake = Math.max(0, this.shake - dt * 8);
    this.flash = Math.max(0, this.flash - dt * 3);
    this.driftStars(dt);
  }

  updateFold(dt) {
    if (this.run.foldTimer > 0) this.run.foldTimer = Math.max(0, this.run.foldTimer - dt);
    const recharge = this.mods.frenzy && this.combo >= 4 ? dt * 1.85 : this.mods.cascade && this.combo >= 6 ? dt * 1.4 : dt;
    if (this.run.foldCooldown > 0) this.run.foldCooldown = Math.max(0, this.run.foldCooldown - recharge);
    const foldingNow = this.run.foldTimer > 0;
    const ready = this.run.foldCooldown <= 0;
    this.ui.foldLabel.textContent = foldingNow ? "FOLDING" : this.run.foldCooldown > 0 ? this.run.foldCooldown.toFixed(1) : "FOLD";
    this.ui.fold.classList.toggle("ready", ready);
    this.ui.fold.classList.toggle("busy", !ready);
    this.ui.sliceChip.classList.toggle("folding", foldingNow);
  }

  tryFold(force = false) {
    if (this.state !== STATES.playing) return false;
    if (!force && this.run.foldCooldown > 0) return false;
    this.run.polarity *= -1;
    this.run.foldTimer = this.mods.foldDuration;
    this.run.foldCooldown = this.mods.foldCooldown;
    this.flash = 0.28;
    this.shake = Math.max(this.shake, 0.35);
    this.camera.punch = Math.max(this.camera.punch, 0.55);
    this.audio.fold();
    if (this.mods.echoCount > 0) {
      const n = this.mods.echoCount;
      for (let i = 0; i < n; i += 1) {
        const spread = n === 1 ? 0 : (i - (n - 1) / 2) * 22;
        this.run.echoes.push({
          x: this.player.x + spread,
          y: this.player.y,
          r: this.player.r * 0.9,
          polarity: -this.run.polarity,
          life: this.mods.echoLife,
        });
      }
    }
    if (this.mods.burst > 0) this.unfoldBurst();
    this.syncHud();
    return true;
  }

  unfoldBurst() {
    const radius = this.mods.burstRadius;
    for (let i = this.shards.length - 1; i >= 0; i -= 1) {
      const shard = this.shards[i];
      if (shard.slice === this.run.polarity || shard.slice === 0) continue;
      if (distance(shard.x, shard.y, this.player.x, this.player.y) > radius) continue;
      this.orbs.push({
        x: shard.x,
        y: shard.y,
        r: 11,
        phase: 0,
        life: this.mods.orbLife,
        slice: this.mods.prismBomb ? this.run.polarity : shard.slice,
        jackpot: false,
      });
      this.burst(shard.x, shard.y, SLICE_COLORS[String(shard.slice)].glow, 10);
      this.shards.splice(i, 1);
    }
  }

  showDraft() {
    this.state = STATES.draft;
    this.pointer.active = false;
    this.audio.draft();
    const choices = pickDraft(this.run.stacks, 3, Math.random, this.meta.unlocked);
    this.ui.draftTitle.textContent = choices.some((boon) => boon.tier >= 4) ? "EVOLUTION" : "Take a boon";
    this.ui.boonRow.innerHTML = "";
    for (const boon of choices) {
      const level = (this.run.stacks[boon.id] || 0) + 1;
      const fresh = !this.run.stacks[boon.id] && !(this.meta.seen || []).includes(boon.id);
      const button = document.createElement("button");
      button.type = "button";
      button.className = `boon-card${boon.cursed ? " cursed" : ""}${boon.tier >= 4 ? " evo" : ""}`;
      button.innerHTML = `<span class="tag">${boon.tier >= 4 ? boon.tag : `T${boon.tier} ${boon.tag}`}${fresh ? " · NEW" : ""}</span><strong>${boon.name}</strong><span>${boon.text}</span><em>${boon.tier >= 4 ? "UNLOCK EVOLUTION" : `Lv ${level}`}</em>`;
      button.addEventListener("click", () => this.takeBoon(boon.id));
      this.ui.boonRow.appendChild(button);
    }
    this.ui.draft.hidden = false;
  }

  takeBoon(id) {
    this.mods = applyBoon(this.run, id);
    this.meta.seen = this.meta.seen || [];
    if (!this.meta.seen.includes(id)) this.meta.seen.push(id);
    saveMeta(this.meta);
    this.audio.boon();
    this.ui.draft.hidden = true;
    this.state = STATES.playing;
    this.lastTime = performance.now();
    this.syncHud();
  }

  updatePlayer(dt) {
    this.player.x = damp(this.player.x, this.pointer.x, 14, dt);
    this.player.y = damp(this.player.y, this.pointer.y, 14, dt);
    const pad = this.player.r + 10;
    this.player.x = clamp(this.player.x, pad, this.width - pad);
    this.player.y = clamp(this.player.y, pad + 48, this.height - pad - 88);

    this.trail.push({
      x: this.player.x,
      y: this.player.y,
      r: this.player.r,
      polarity: this.run.polarity,
      life: 0.38,
    });
    if (this.trail.length > 16) this.trail.shift();

    if (this.fourD.tesseract && Math.random() < dt * 18) {
      const vertex = this.fourD.tesseract.vertices[Math.floor(Math.random() * 16)];
      this.particles.push({
        x: this.player.x + vertex.x,
        y: this.player.y + vertex.y,
        vx: vertex.x * 12 + rand(-18, 18),
        vy: vertex.y * 12 + rand(8, 40),
        life: rand(0.22, 0.45),
        max: 0.45,
        size: rand(1.2, 2.8),
        color: this.run.polarity > 0 ? "rgba(190, 245, 255, 0.85)" : "rgba(168, 120, 255, 0.8)",
      });
    }
  }

  projectPlayer() {
    const w = sliceWFromAngles(this.player.angles);
    const slice = hypersphereSliceRadius(w, 1);
    this.player.r = (20 + slice * 7) * this.mods.hitScale;
    const scale = (15 + slice * 4) * this.mods.hitScale;
    this.fourD.slice = slice;
    this.fourD.tesseract = projectTesseract(this.player.angles, scale);
    this.fourD.cell16 = projectCell16(this.player.angles, scale * 1.15);
  }

  collectors() {
    const points = [
      { x: this.player.x, y: this.player.y, r: this.player.r },
      ...this.run.echoes.map((echo) => ({ x: echo.x, y: echo.y, r: echo.r })),
    ];
    if (this.mods.orbit && this.fourD.cell16) {
      const count = Math.min(this.fourD.cell16.vertices.length, 2 + this.mods.orbit * 2);
      for (let i = 0; i < count; i += 1) {
        const vertex = this.fourD.cell16.vertices[i];
        points.push({
          x: this.player.x + vertex.x * 1.35,
          y: this.player.y + vertex.y * 1.35,
          r: 9 + this.mods.orbit * 3,
        });
      }
    }
    if (this.mods.phantomDual) {
      for (const echo of this.run.echoes) {
        points.push({ x: echo.x + 16, y: echo.y - 10, r: 11 });
        points.push({ x: echo.x - 16, y: echo.y + 10, r: 11 });
      }
    }
    if (this.mods.splitRank) {
      const ang = this.elapsed * 2.4;
      const dist = 50 + this.mods.splitRank * 12;
      points.push({
        x: this.player.x + Math.cos(ang) * dist,
        y: this.player.y + Math.sin(ang) * dist,
        r: 13 + this.mods.splitRank * 2,
        split: true,
      });
    }
    return points;
  }

  updateEchoes(dt) {
    for (const echo of this.run.echoes) echo.life -= dt;
    this.run.echoes = this.run.echoes.filter((echo) => echo.life > 0);
  }

  updateSpawns(dt) {
    const rates = spawnIntervals(this.elapsed);
    const shardInterval = rates.shard / (1 + this.mods.shardExtra * 0.28);
    this.orbTimer -= dt;
    this.shardTimer -= dt;

    if (this.orbTimer <= 0) {
      this.spawnOrb();
      this.orbTimer = rates.orb;
    }
    if (this.shardTimer <= 0) {
      const extras = 1 + this.mods.shardExtra;
      for (let i = 0; i < extras; i += 1) this.spawnShard(rates.shardSpeed * this.mods.shardSpeed);
      this.shardTimer = shardInterval;
    }
  }

  spawnOrb() {
    const r = rand(9, 13);
    const jackpot = this.mods.jackpot > 0 && Math.random() < 0.08 + this.mods.jackpot * 0.06;
    const pos = keepAwayFrom(
      rand(28, this.width - 28),
      rand(90, this.height * 0.62),
      this.player.x,
      this.player.y,
      90,
    );
    this.orbs.push({
      x: pos.x,
      y: pos.y,
      r: jackpot ? r + 6 : r,
      phase: rand(0, Math.PI * 2),
      life: this.mods.orbLife,
      slice: pickSlice(Math.random, 0.28),
      jackpot,
    });
  }

  spawnShard(speed) {
    const r = rand(16, 32);
    const fromTop = Math.random() < 0.7;
    const x = rand(r + 8, this.width - r - 8);
    const y = fromTop ? -r - 10 : rand(-20, this.height * 0.2);
    const pos = keepAwayFrom(x, y, this.player.x, this.player.y, 140);
    this.shards.push({
      x: pos.x,
      y: pos.y,
      r,
      vx: rand(-40, 40),
      vy: speed + rand(-20, 40),
      rot: rand(0, Math.PI * 2),
      spin: rand(-2.4, 2.4),
      sides: 5 + Math.floor(Math.random() * 3),
      slice: pickSlice(Math.random, this.mods.bulkChance),
    });
  }

  updateOrbs(dt) {
    const magnets = this.collectors();
    for (let i = this.orbs.length - 1; i >= 0; i -= 1) {
      const orb = this.orbs[i];
      orb.life -= dt;
      orb.phase += dt * 3;
      orb.y += Math.sin(orb.phase) * 8 * dt;

      let eaten = false;
      for (const magnet of magnets) {
        const d = distance(orb.x, orb.y, magnet.x, magnet.y);
        if (d < this.mods.magnet && d > 1) {
          const pull = (1 - d / this.mods.magnet) * 120 * dt;
          orb.x += ((magnet.x - orb.x) / d) * pull;
          orb.y += ((magnet.y - orb.y) / d) * pull;
        }
        if (circleHit(orb.x, orb.y, orb.r, magnet.x, magnet.y, magnet.r)) {
          this.collectOrb(orb);
          this.orbs.splice(i, 1);
          eaten = true;
          break;
        }
      }
      if (!eaten && orb.life <= 0) this.orbs.splice(i, 1);
    }
  }

  collectOrb(orb) {
    this.combo += 1;
    this.comboTimer = this.mods.comboHold;
    this.run.orbs += 1;
    const mult =
      orbMultiplier({
        orbSlice: orb.slice,
        polarity: this.run.polarity,
        alignedStacks: this.mods.aligned,
        jackpot: Boolean(orb.jackpot),
      }) * this.mods.scoreMult;
    this.score += Math.round(orbPoints(this.combo) * mult);
    this.flash = Math.min(0.5, 0.12 + this.combo * 0.01 + (orb.jackpot ? 0.25 : 0));
    if (orb.jackpot) this.audio.jackpot();
    else this.audio.collect(this.combo);
    this.burst(orb.x, orb.y, orb.jackpot ? "#fff4c2" : SLICE_COLORS[String(orb.slice)].orb, orb.jackpot ? 22 : 14);
    if (this.mods.cascade && orb.slice === this.run.polarity) {
      this.run.foldCooldown = Math.max(0, this.run.foldCooldown - 0.6 * this.mods.cascade);
      if (this.combo >= 5 && this.run.foldCooldown <= 0) this.tryFold();
    }
    this.syncHud();
    if (this.state === STATES.playing && this.run.orbs >= this.run.nextDraft) {
      this.showDraft();
    }
  }

  updateShards(dt) {
    const folding = this.run.foldTimer > 0;
    const bulkPhased = folding && this.run.foldTimer > this.mods.foldDuration - this.mods.bulkPhase;
    const slow = folding ? 0.55 : 1;
    for (let i = this.shards.length - 1; i >= 0; i -= 1) {
      const shard = this.shards[i];
      const ghost = !shardCollides({
        shardSlice: shard.slice,
        polarity: this.run.polarity,
        folding,
        bulkPhased,
        twinSlice: Boolean(this.mods.twinSlice),
      });
      shard.x += shard.vx * dt * slow;
      shard.y += shard.vy * dt * slow;
      shard.rot += shard.spin * dt;
      shard.ghost = ghost;

      if (this.mods.hungryGhosts) {
        const eaten = this.run.echoes.some((echo) => echo.polarity === shard.slice && circleHit(shard.x, shard.y, shard.r, echo.x, echo.y, echo.r));
        if (eaten) {
          this.orbs.push({
            x: shard.x,
            y: shard.y,
            r: 11,
            phase: 0,
            life: this.mods.orbLife,
            slice: shard.slice,
            jackpot: false,
          });
          this.burst(shard.x, shard.y, SLICE_COLORS[String(shard.slice)].glow, 8);
          this.shards.splice(i, 1);
          continue;
        }
      }

      if (
        !ghost &&
        circleHit(shard.x, shard.y, shard.r * 0.82, this.player.x, this.player.y, this.player.r * 0.82)
      ) {
        this.hitPlayer();
        return;
      }
      if (shard.y - shard.r > this.height + 40 || shard.x < -80 || shard.x > this.width + 80) {
        this.shards.splice(i, 1);
      }
    }
  }

  hitPlayer() {
    if (this.run.glassCharges > 0) {
      this.run.glassCharges -= 1;
      this.tryFold(true);
      if (this.mods.burst) this.unfoldBurst();
      this.flash = 0.6;
      this.shake = 1;
      this.burst(this.player.x, this.player.y, "#ffffff", 20);
      return;
    }
    this.state = STATES.dying;
    this.deathTimer = 0.85;
    this.shake = 1.2;
    this.flash = 0.55;
    this.audio.hit();
    this.burst(this.player.x, this.player.y, "#5ce1ff", 18);
    this.burst(this.player.x, this.player.y, "#a878ff", 14);
    if (this.fourD.tesseract) {
      for (const vertex of this.fourD.tesseract.vertices) {
        this.particles.push({
          x: this.player.x + vertex.x,
          y: this.player.y + vertex.y,
          vx: vertex.x * 18 + rand(-40, 40),
          vy: vertex.y * 18 + rand(-40, 40),
          life: rand(0.4, 0.8),
          max: 0.8,
          size: rand(1.8, 4),
          color: vertex.w >= 0 ? "#e8ffff" : "#b08cff",
        });
      }
    }
    this.syncHud();
  }

  updateCombo(dt) {
    if (this.combo <= 0) return;
    this.comboTimer -= dt;
    if (this.comboTimer <= 0) {
      if (this.mods.comboHold > 2) {
        this.combo = Math.min(this.combo, 2);
        this.comboTimer = this.mods.comboHold;
      } else {
        this.combo = 0;
      }
      this.syncHud();
    }
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      p.vy *= 0.98;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  updateTrail(dt) {
    for (const t of this.trail) t.life -= dt;
    this.trail = this.trail.filter((t) => t.life > 0);
  }

  driftStars(dt) {
    for (const star of this.stars) {
      star.t += dt * 0.04 * (0.4 + star.size);
      star.tw += dt * 2;
      if (star.t > 1.05) star.t -= 1.15;
    }
  }

  burst(x, y, color, count) {
    for (let i = 0; i < count; i += 1) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(40, 220);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: rand(0.3, 0.7),
        max: 0.7,
        size: rand(1.4, 4.2),
        color,
      });
    }
  }

  draw() {
    const { ctx, width, height } = this;
    ctx.clearRect(0, 0, width, height);

    if (this.scene !== "well") {
      this.town.draw(ctx);
      return;
    }

    const shakeX = this.shake ? rand(-8, 8) * this.shake : 0;
    const shakeY = this.shake ? rand(-8, 8) * this.shake : 0;
    ctx.save();
    ctx.translate(shakeX, shakeY);

    this.drawWell();
    this.drawStars();
    this.drawSorted();
    this.drawParticles();

    ctx.restore();

    if (this.flash > 0) {
      const tint = this.run.polarity > 0 ? `rgba(160, 230, 255, ${this.flash * 0.28})` : `rgba(210, 140, 255, ${this.flash * 0.28})`;
      ctx.fillStyle = tint;
      ctx.fillRect(0, 0, width, height);
    }
  }

  drawWell() {
    const { ctx, width, height } = this;
    const { farLeft, farRight, nearLeft, nearRight, vp } = floorCorners(this.world(), this.camera);
    const ana = this.run.polarity >= 0;

    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, ana ? "#071018" : "#140814");
    sky.addColorStop(0.35, "#0b0618");
    sky.addColorStop(1, "#04020a");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    const mouth = ctx.createRadialGradient(vp.x, vp.y, 4, vp.x, vp.y, width * 0.42);
    mouth.addColorStop(0, ana ? "rgba(120, 230, 255, 0.42)" : "rgba(210, 130, 255, 0.42)");
    mouth.addColorStop(0.18, ana ? "rgba(40, 90, 180, 0.2)" : "rgba(90, 40, 140, 0.22)");
    mouth.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = mouth;
    ctx.fillRect(0, 0, width, height);

    ctx.beginPath();
    ctx.moveTo(nearLeft.x, nearLeft.y);
    ctx.lineTo(farLeft.x, farLeft.y);
    ctx.lineTo(vp.x, vp.y);
    ctx.lineTo(farRight.x, farRight.y);
    ctx.lineTo(nearRight.x, nearRight.y);
    ctx.closePath();
    const floor = ctx.createLinearGradient(0, vp.y, 0, nearLeft.y);
    floor.addColorStop(0, ana ? "rgba(28, 48, 90, 0.55)" : "rgba(48, 24, 78, 0.55)");
    floor.addColorStop(1, "rgba(8, 6, 16, 0.92)");
    ctx.fillStyle = floor;
    ctx.fill();
    ctx.strokeStyle = ana ? "rgba(92, 225, 255, 0.28)" : "rgba(210, 130, 255, 0.28)";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(nearLeft.x, nearLeft.y);
    ctx.lineTo(vp.x, vp.y);
    ctx.lineTo(nearRight.x, nearRight.y);
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.stroke();

    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = "rgba(180, 210, 255, 0.5)";
    for (let i = 1; i <= 8; i += 1) {
      const y = this.height * (i / 9);
      const a = projectPoint(0, y, this.world(), this.camera);
      const b = projectPoint(this.width, y, this.world(), this.camera);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    for (let i = 1; i <= 6; i += 1) {
      const x = this.width * (i / 7);
      const a = projectPoint(x, 0, this.world(), this.camera);
      const b = projectPoint(x, this.height, this.world(), this.camera);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ctx.beginPath();
    ctx.ellipse(vp.x, vp.y + 8, 34 + this.camera.punch * 40, 12 + this.camera.punch * 10, 0, 0, Math.PI * 2);
    ctx.strokeStyle = ana ? "rgba(160, 245, 255, 0.7)" : "rgba(230, 170, 255, 0.7)";
    ctx.lineWidth = 2;
    ctx.stroke();

    const ghost = vanishingPoint(this.world(), { ...this.camera, shear: this.camera.shear * -0.55 });
    ctx.beginPath();
    ctx.ellipse(ghost.x, ghost.y + 6, 18, 7, 0, 0, Math.PI * 2);
    ctx.strokeStyle = ana ? "rgba(210, 130, 255, 0.25)" : "rgba(92, 225, 255, 0.25)";
    ctx.stroke();
  }

  drawStars() {
    const { ctx } = this;
    const vp = vanishingPoint(this.world(), this.camera);
    const { nearLeft, nearRight } = floorCorners(this.world(), this.camera);
    for (const star of this.stars) {
      const p = 0.08 + star.t * 0.9;
      let x;
      let y;
      if (star.side < 0) {
        x = nearLeft.x + (vp.x - nearLeft.x) * (1 - p);
        y = nearLeft.y + (vp.y - nearLeft.y) * (1 - p);
      } else if (star.side > 0) {
        x = nearRight.x + (vp.x - nearRight.x) * (1 - p);
        y = nearRight.y + (vp.y - nearRight.y) * (1 - p);
      } else {
        const along = projectPoint(this.width * (0.15 + (star.tw % 1) * 0.7), star.t * this.height, this.world(), this.camera);
        x = along.x;
        y = along.y;
      }
      const alpha = 0.2 + Math.abs(Math.sin(star.tw)) * 0.7;
      ctx.fillStyle = `rgba(230, 236, 255, ${alpha * (0.35 + p)})`;
      ctx.beginPath();
      ctx.arc(x, y, star.size * (0.4 + p), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawShadow(x, y, r, alpha) {
    const v = this.view(x, y);
    const { ctx } = this;
    ctx.save();
    ctx.translate(v.x, v.y + 6 * v.s);
    ctx.scale(1, 0.32);
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.beginPath();
    ctx.arc(0, 0, r * v.s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawSorted() {
    const items = [
      ...this.orbs.map((e) => ({ y: e.y, kind: "orb", e })),
      ...this.shards.map((e) => ({ y: e.y, kind: "shard", e })),
      ...this.trail.map((e) => ({ y: e.y, kind: "trail", e })),
      ...this.run.echoes.map((e) => ({ y: e.y, kind: "echo", e })),
    ];
    if (this.mods.splitRank && this.state !== STATES.dying && this.state !== STATES.over) {
      const ang = this.elapsed * 2.4;
      const dist = 50 + this.mods.splitRank * 12;
      items.push({
        y: this.player.y + Math.sin(ang) * dist,
        kind: "split",
        e: {
          x: this.player.x + Math.cos(ang) * dist,
          y: this.player.y + Math.sin(ang) * dist,
        },
      });
    }
    if (this.state !== STATES.dying && this.state !== STATES.over) {
      items.push({ y: this.player.y, kind: "player" });
    }
    items.sort((a, b) => a.y - b.y);
    for (const item of items) {
      if (item.kind === "orb") this.drawOrb(item.e);
      else if (item.kind === "shard") this.drawShard(item.e);
      else if (item.kind === "trail") this.drawTrailBit(item.e);
      else if (item.kind === "echo") this.drawEcho(item.e);
      else if (item.kind === "split") this.drawSplit(item.e);
      else this.drawPlayer();
    }
  }

  drawOrb(orb) {
    const v = this.view(orb.x, orb.y);
    const pulse = 1 + Math.sin(orb.phase) * 0.08;
    const color = orb.jackpot ? { glow: "#fff4c2", orb: "#ffe27a" } : SLICE_COLORS[String(orb.slice)];
    this.drawShadow(orb.x, orb.y, orb.r, 0.25);
    const { ctx } = this;
    ctx.save();
    ctx.translate(v.x, v.y);
    ctx.scale(v.s, v.s * 0.92);
    ctx.shadowColor = color.glow;
    ctx.shadowBlur = orb.jackpot ? 24 : 16;
    ctx.fillStyle = color.orb;
    ctx.beginPath();
    ctx.arc(0, 0, orb.r * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath();
    ctx.arc(-orb.r * 0.28, -orb.r * 0.28, orb.r * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawShard(shard) {
    const v = this.view(shard.x, shard.y);
    const color = SLICE_COLORS[String(shard.slice)];
    this.drawShadow(shard.x, shard.y, shard.r, shard.ghost ? 0.08 : 0.3);
    const { ctx } = this;
    ctx.save();
    ctx.translate(v.x, v.y);
    ctx.scale(v.s, v.s * 0.88);
    ctx.rotate(shard.rot);
    ctx.globalAlpha = shard.ghost ? 0.28 : 1;
    ctx.shadowColor = color.glow;
    ctx.shadowBlur = shard.ghost ? 6 : 16;
    ctx.beginPath();
    for (let i = 0; i < shard.sides; i += 1) {
      const angle = (i / shard.sides) * Math.PI * 2;
      const radius = shard.r * (i % 2 === 0 ? 1 : 0.68);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = color.fill;
    ctx.fill();
    ctx.strokeStyle = color.stroke;
    ctx.lineWidth = 2;
    ctx.setLineDash(shard.slice === 0 ? [] : shard.ghost ? [5, 4] : []);
    ctx.stroke();
    ctx.restore();
  }

  drawTrailBit(t) {
    const v = this.view(t.x, t.y);
    const a = t.life / 0.38;
    const { ctx } = this;
    ctx.fillStyle = t.polarity > 0 ? `rgba(92, 225, 255, ${a * 0.12})` : `rgba(180, 110, 255, ${a * 0.12})`;
    ctx.beginPath();
    ctx.ellipse(v.x, v.y, (t.r || this.player.r) * v.s * (0.55 + a * 0.5), (t.r || this.player.r) * v.s * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawEcho(echo) {
    const v = this.view(echo.x, echo.y);
    const a = clamp(echo.life / this.mods.echoLife, 0, 1);
    const { ctx } = this;
    ctx.strokeStyle = echo.polarity > 0 ? `rgba(92, 225, 255, ${a * 0.7})` : `rgba(200, 120, 255, ${a * 0.7})`;
    ctx.lineWidth = 2 * v.s;
    ctx.beginPath();
    ctx.ellipse(v.x, v.y, echo.r * v.s, echo.r * v.s * 0.45, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawSplit(split) {
    const v = this.view(split.x, split.y);
    const { ctx } = this;
    ctx.strokeStyle = "rgba(255, 226, 122, 0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(v.x, v.y, (13 + this.mods.splitRank * 2) * v.s, (13 + this.mods.splitRank * 2) * v.s * 0.45, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawPlayer() {
    const { ctx, player, fourD } = this;
    if (!fourD.tesseract || !fourD.cell16) this.projectPlayer();
    const { tesseract, cell16, slice } = fourD;
    const v = this.view(player.x, player.y);
    this.drawShadow(player.x, player.y, player.r, 0.35);
    ctx.save();
    ctx.translate(v.x, v.y);
    ctx.scale(v.s, v.s * 1.12);
    if (this.run.foldTimer > 0) {
      ctx.translate(rand(-3, 3), rand(-3, 3));
    }

    const core = ctx.createRadialGradient(0, 0, 2, 0, 0, player.r * 1.35);
    core.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    core.addColorStop(0.22, this.run.polarity > 0 ? "rgba(170, 240, 255, 0.55)" : "rgba(210, 160, 255, 0.55)");
    core.addColorStop(0.55, "rgba(120, 90, 255, 0.16)");
    core.addColorStop(1, "rgba(92, 225, 255, 0)");
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(0, 0, player.r * 1.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = this.run.polarity > 0 ? `rgba(92, 225, 255, ${0.35 + slice * 0.2})` : `rgba(210, 130, 255, ${0.35 + slice * 0.2})`;
    ctx.lineWidth = this.run.foldTimer > 0 ? 2.4 : 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, 8 + slice * 16, 0, Math.PI * 2);
    ctx.stroke();

    for (const face of tesseract.faces) {
      const ana = (face.w + 1.6) / 3.2;
      ctx.fillStyle = `rgba(${Math.round(90 + ana * 80)}, ${Math.round(140 + ana * 90)}, 255, 0.07)`;
      ctx.beginPath();
      ctx.moveTo(face.points[0].x, face.points[0].y);
      for (let i = 1; i < face.points.length; i += 1) {
        ctx.lineTo(face.points[i].x, face.points[i].y);
      }
      ctx.closePath();
      ctx.fill();
    }

    ctx.lineCap = "round";
    for (const edge of tesseract.edges) {
      const ana = (edge.a.w + edge.b.w + 3.2) / 6.4;
      ctx.strokeStyle = `rgba(${Math.round(120 + ana * 110)}, ${Math.round(210 + ana * 30)}, 255, ${0.28 + ana * 0.45})`;
      ctx.lineWidth = 1.1 + ana * 1.6;
      ctx.beginPath();
      ctx.moveTo(edge.a.x, edge.a.y);
      ctx.lineTo(edge.b.x, edge.b.y);
      ctx.stroke();
    }

    for (const edge of cell16.edges) {
      const ana = (edge.a.w + edge.b.w + 3.2) / 6.4;
      ctx.strokeStyle = `rgba(255, 230, ${Math.round(160 + ana * 70)}, ${0.22 + ana * 0.4})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(edge.a.x, edge.a.y);
      ctx.lineTo(edge.b.x, edge.b.y);
      ctx.stroke();
    }

    for (const vertex of tesseract.vertices) {
      const ana = (vertex.w + 1.6) / 3.2;
      ctx.fillStyle = vertex.w >= 0 ? `rgba(255, 255, 255, ${0.45 + ana * 0.5})` : `rgba(170, 110, 255, ${0.4 + (1 - ana) * 0.4})`;
      ctx.beginPath();
      ctx.arc(vertex.x, vertex.y, 1.6 + ana * 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    const moving = distance(this.player.x, this.player.y, this.pointer.x, this.pointer.y) > 6;
    if (moving && this.state === STATES.playing) this.walkCycle += 0.35;
    drawStick(ctx, v.x, v.y + 12 * v.s, {
      scale: Math.max(0.85, 1.05 * v.s),
      facing: this.pointer.x >= this.player.x ? 1 : -1,
      walk: this.walkCycle,
      hat: Boolean(this.hero.items?.hat) || this.hero.cha >= 6,
      bat: Boolean(this.hero.items?.bat),
      color: "#111",
    });
  }

  drawParticles() {
    const { ctx } = this;
    for (const p of this.particles) {
      const a = p.life / (p.max || 0.6);
      const v = this.view(p.x, p.y);
      ctx.globalAlpha = clamp(a, 0, 1);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(v.x, v.y, p.size * v.s, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}
