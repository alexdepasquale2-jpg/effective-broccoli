import { clamp, damp, distance, rand, randInt } from "./utils.js";
import { INCIDENT_TYPES, Incident } from "./incidentData.js";
import { AudioBus } from "./audio.js";
import { loadRecord, saveRecord, mergeRun } from "./storage.js";
import { accounting, createChronicle, recordBeat, recordThread } from "./chronicle.js";
import { createWorld, applyEffects, conditionOf, DOMAINS, TOTAL_DAYS, seasonFor, worldAverage, worldVerdict } from "./world.js";
import { depthFor, nextDepth, streakMultiplier, stillnessRate } from "./resources.js";

export const STATES = {
  TITLE: "TITLE",
  PLAYING: "PLAYING",
  ENDED: "ENDED",
};

export class Game {
  constructor(canvas, ui) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ui = ui;
    this.audio = new AudioBus();
    this.record = loadRecord();

    this.state = STATES.TITLE;
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

    // Simulation & Chronicle
    this.world = createWorld();
    this.chronicle = createChronicle();
    this.stillness = 0;
    this.peakStillness = 0;
    this.stillnessStreak = 0;
    this.energy = 100;
    this.elapsed = 0;
    this.dayTimer = 60; // 60s day cycle

    // Interactive Action Player
    this.player = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      speed: 180,
      isActing: false,
      actTimer: 0,
      auraRadius: 40,
      standStillTimer: 0,
    };

    // World Incidents & Particles
    this.incidents = [];
    this.particles = [];
    this.floatingTexts = [];
    this.ambientMotes = [];
    this.ripples = [];
    this.spawnerTimer = 3.0;

    // Controls
    this.keys = {};
    this.virtualJoystick = { active: false, startX: 0, startY: 0, curX: 0, curY: 0, dx: 0, dy: 0 };

    this.init();
  }

  init() {
    this.resize();
    this.bindInputs();
    this.initAmbientMotes();
    this.syncHud();
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

  initAmbientMotes() {
    this.ambientMotes = Array.from({ length: 65 }, () => ({
      x: rand(-900, 900),
      y: rand(-900, 900),
      size: rand(1.2, 3.2),
      alpha: rand(0.2, 0.6),
      driftX: rand(-12, 12),
      driftY: rand(-15, -4),
      phase: rand(0, Math.PI * 2),
    }));
  }

  bindInputs() {
    // Keyboard
    window.addEventListener("keydown", (e) => {
      this.keys[e.code] = true;
      if (e.code === "Space" || e.code === "KeyJ") {
        this.playerAct();
      }
    });
    window.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
    });

    // Touch / Mouse Joystick
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const onStart = (e) => {
      this.audio.unlock();
      if (e.target.closest("button, .sheet")) return;
      const pos = getPos(e);
      this.virtualJoystick.active = true;
      this.virtualJoystick.startX = pos.x;
      this.virtualJoystick.startY = pos.y;
      this.virtualJoystick.curX = pos.x;
      this.virtualJoystick.curY = pos.y;
      this.virtualJoystick.dx = 0;
      this.virtualJoystick.dy = 0;
    };

    const onMove = (e) => {
      if (!this.virtualJoystick.active) return;
      const pos = getPos(e);
      this.virtualJoystick.curX = pos.x;
      this.virtualJoystick.curY = pos.y;
      const rawDx = pos.x - this.virtualJoystick.startX;
      const rawDy = pos.y - this.virtualJoystick.startY;
      const dist = Math.hypot(rawDx, rawDy) || 1;
      const maxDist = 55;
      const factor = Math.min(dist, maxDist) / dist;
      this.virtualJoystick.dx = (rawDx * factor) / maxDist;
      this.virtualJoystick.dy = (rawDy * factor) / maxDist;
    };

    const onEnd = () => {
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

  playerAct() {
    if (this.state !== STATES.PLAYING || this.player.isActing) return;
    this.player.isActing = true;
    this.player.actTimer = 0.25;
    this.stillnessStreak = 0; // Action disrupts stillness!
    this.audio.reach("act");
    this.shake = 0.4;

    // Create action shockwave
    this.particles.push({
      type: "act_shockwave",
      x: this.player.x,
      y: this.player.y,
      radius: 20,
      maxRadius: 85,
      life: 0.35,
      maxLife: 0.35,
    });
  }

  start() {
    this.audio.unlock();
    this.state = STATES.PLAYING;
    this.world = createWorld();
    this.chronicle = createChronicle();
    this.stillness = 0;
    this.peakStillness = 0;
    this.stillnessStreak = 0;
    this.energy = 100;
    this.elapsed = 0;
    this.dayTimer = 60;

    this.player.x = 0;
    this.player.y = 0;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.standStillTimer = 0;

    this.incidents = [];
    this.particles = [];
    this.floatingTexts = [];
    this.spawnerTimer = 1.0;

    this.ui.overlay.hidden = true;
    this.ui.hud.hidden = false;
    this.ui.endSheet.hidden = true;
    this.ui.chronicleSheet.hidden = true;

    this.createFloatingText(0, -50, "Breathe. When you stand still, the Stillness aura expands.", "#80deea");
    this.syncHud();
  }

  frame(time) {
    const dt = clamp((time - this.lastTime) / 1000, 0, 0.05);
    this.lastTime = time;

    this.update(dt);
    this.draw();

    requestAnimationFrame(this.boundFrame);
  }

  update(dt) {
    if (this.state !== STATES.PLAYING) return;

    this.elapsed += dt;
    this.dayTimer -= dt;

    this.updatePlayerMovement(dt);
    this.updateStillness(dt);
    this.updateSpawner(dt);
    this.updateIncidents(dt);
    this.updateParticles(dt);
    this.updateCamera(dt);

    if (this.dayTimer <= 0) {
      this.finishSession();
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
      const speed = this.player.speed;
      const nx = mx / (dist > 1 ? dist : 1);
      const ny = my / (dist > 1 ? dist : 1);
      this.player.vx = nx * speed;
      this.player.vy = ny * speed;
      this.player.x += this.player.vx * dt;
      this.player.y += this.player.vy * dt;
      this.player.standStillTimer = 0;
    } else {
      this.player.vx = 0;
      this.player.vy = 0;
      this.player.standStillTimer += dt;
    }

    // World border constraint (Circle map radius ~800)
    const pDist = Math.hypot(this.player.x, this.player.y);
    if (pDist > 780) {
      this.player.x = (this.player.x / pDist) * 780;
      this.player.y = (this.player.y / pDist) * 780;
    }

    // Handle act timer
    if (this.player.isActing) {
      this.player.actTimer -= dt;
      if (this.player.actTimer <= 0) {
        this.player.isActing = false;
      }
    }
  }

  updateStillness(dt) {
    // Standing still expands your peaceful aura & rapidly generates Stillness score!
    if (this.player.standStillTimer > 0.4) {
      this.stillnessStreak += dt;
      this.player.auraRadius = damp(this.player.auraRadius, 140, 3.5, dt);
    } else {
      this.stillnessStreak = Math.max(0, this.stillnessStreak - dt * 2);
      this.player.auraRadius = damp(this.player.auraRadius, 40, 5.0, dt);
    }

    const depth = depthFor(this.stillness);
    this.stillness += stillnessRate(depth.level, this.stillnessStreak) * dt;
    this.peakStillness = Math.max(this.peakStillness, this.stillness);
    this.syncHud();
  }

  updateSpawner(dt) {
    this.spawnerTimer -= dt;
    if (this.spawnerTimer <= 0 && this.incidents.length < 6) {
      this.spawnerTimer = rand(4.0, 7.5);
      const keys = Object.keys(INCIDENT_TYPES);
      const chosenKey = keys[randInt(0, keys.length - 1)];

      // Spawn at random location around world
      const angle = rand(0, Math.PI * 2);
      const spawnDist = rand(150, 550);
      const sx = this.player.x + Math.cos(angle) * spawnDist;
      const sy = this.player.y + Math.sin(angle) * spawnDist;

      this.incidents.push(new Incident(chosenKey, sx, sy));
      this.audio.arrive(INCIDENT_TYPES[chosenKey].loud);
    }
  }

  updateIncidents(dt) {
    const playerSpeed = Math.hypot(this.player.vx, this.player.vy);

    for (let i = this.incidents.length - 1; i >= 0; i--) {
      const inc = this.incidents[i];
      const res = inc.update(dt, this.player.x, this.player.y, playerSpeed, this.player.isActing);

      if (res) {
        this.incidents.splice(i, 1);
        this.handleIncidentResolution(res);
      }
    }
  }

  handleIncidentResolution(res) {
    // Record into chronicle
    this.chronicle = recordBeat(this.chronicle, {
      choice: res.action,
      need: res.need,
      threadTitle: res.title,
      text: res.text,
    });

    if (res.right) {
      this.audio.resolve(0);
      this.flash = 0.35;
      this.createFloatingText(res.x, res.y - 30, `✨ ${res.title}: Right choice (${res.action.toUpperCase()})`, "#00e676");
      this.createFloatingText(res.x, res.y - 50, res.text, "#e0f2f1");
    } else {
      this.audio.resolve(2);
      this.shake = 0.5;
      this.createFloatingText(res.x, res.y - 30, `⚠️ ${res.title}: Disrupted (${res.action.toUpperCase()})`, "#ff5252");
      this.createFloatingText(res.x, res.y - 50, res.text, "#ffcdd2");
    }

    // Ripple effects
    this.ripples.push({
      x: res.x,
      y: res.y,
      r: 10,
      maxR: res.right ? 120 : 60,
      color: res.right ? "#00e676" : "#ff5252",
      life: 0.8,
      maxLife: 0.8,
    });
  }

  updateParticles(dt) {
    // Ambient motes
    for (const m of this.ambientMotes) {
      m.x += m.driftX * dt;
      m.y += m.driftY * dt;
      m.phase += dt * 2;
      if (m.y < -900) m.y = 900;
      if (m.y > 900) m.y = -900;
      if (m.x < -900) m.x = 900;
      if (m.x > 900) m.x = -900;
    }

    // Floating text
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.y -= 18 * dt;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }

    // Ripples
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.life -= dt;
      r.r += (r.maxR - r.r) * 6 * dt;
      if (r.life <= 0) this.ripples.splice(i, 1);
    }

    // Action particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.type === "act_shockwave") {
        p.radius += (p.maxRadius - p.radius) * 12 * dt;
      }
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    this.shake = Math.max(0, this.shake - dt * 2.5);
    this.flash = Math.max(0, this.flash - dt * 2);
  }

  updateCamera(dt) {
    this.camera.x += (this.player.x - this.camera.x) * Math.min(1, 8 * dt);
    this.camera.y += (this.player.y - this.camera.y) * Math.min(1, 8 * dt);
  }

  createFloatingText(x, y, text, color = "#ffffff") {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      life: 2.8,
    });
  }

  finishSession() {
    this.state = STATES.ENDED;
    this.record = mergeRun(this.record, {
      world: this.world,
      chronicle: this.chronicle,
      peakStillness: this.peakStillness,
    });
    saveRecord(this.record);

    const summary = accounting(this.chronicle);
    this.ui.endTitle.textContent = "The Cycle Ends";
    this.ui.endStats.innerHTML = `
      <p class="stat-row"><span>Deepest Stillness</span><b>${Math.floor(this.peakStillness)}</b></p>
      <p class="stat-row"><span>Depth Achieved</span><b>${depthFor(this.peakStillness).name}</b></p>
      <p class="stat-row"><span>Time Lived</span><b>${Math.round(this.elapsed)}s</b></p>
    `;
    this.ui.endLines.innerHTML = summary.lines.map((l) => `<p>${l}</p>`).join("");
    this.ui.endVerdict.textContent = summary.verdict;
    this.ui.endSheet.hidden = false;
  }

  syncHud() {
    if (!this.ui.stillness) return;
    const depth = depthFor(this.stillness);
    const next = nextDepth(this.stillness);
    const streak = this.stillnessStreak;

    this.ui.stillness.textContent = String(Math.floor(this.stillness));
    this.ui.multiplier.textContent = `×${streakMultiplier(streak).toFixed(1)}`;
    this.ui.depthName.textContent = depth.name;
    this.ui.depthTrack.style.width = next
      ? `${clamp(((this.stillness - depth.at) / (next.at - depth.at)) * 100, 0, 100)}%`
      : "100%";

    this.ui.dayLabel.textContent = `Time: ${Math.ceil(this.dayTimer)}s`;
    this.ui.seasonLabel.textContent = this.player.standStillTimer > 0.4 ? "🧘 Channelling Stillness" : "🏃 Moving";
    this.ui.tally.textContent = `${this.chronicle.passed} passed · ${this.chronicle.tended} tended · ${this.chronicle.acted} acted`;
  }

  draw() {
    const { ctx, width, height } = this;
    ctx.clearRect(0, 0, width, height);

    const sx = this.shake ? rand(-6, 6) * this.shake : 0;
    const sy = this.shake ? rand(-6, 6) * this.shake : 0;

    ctx.save();
    ctx.translate(width / 2 + sx - this.camera.x, height / 2 + sy - this.camera.y);

    // 1. Draw World Terrain (Living interactive zen garden)
    this.drawTerrain(ctx);

    // 2. Draw Incidents (Whirlwinds, Fires, Crying Strangers, etc.)
    this.drawIncidents(ctx);

    // 3. Draw Player & Stillness Aura
    this.drawPlayer(ctx);

    // 4. Draw Ripples & Effects
    this.drawEffects(ctx);

    ctx.restore();

    // 5. Draw Touch Joystick
    this.drawJoystick(ctx);

    // 6. Ambient Screen Flash
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.flash * 0.3})`;
      ctx.fillRect(0, 0, width, height);
    }
  }

  drawTerrain(ctx) {
    // Deep dark mystical valley lawn
    const radius = 800;
    const grad = ctx.createRadialGradient(0, 0, 50, 0, 0, radius);
    grad.addColorStop(0, "#101d24");
    grad.addColorStop(0.7, "#081017");
    grad.addColorStop(1, "#020508");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Subtle stone ring sanctuary
    ctx.strokeStyle = "rgba(128, 222, 234, 0.15)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 780, 0, Math.PI * 2);
    ctx.stroke();

    // Ambient floating light motes
    for (const m of this.ambientMotes) {
      ctx.fillStyle = `rgba(178, 235, 242, ${m.alpha})`;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawIncidents(ctx) {
    for (const inc of this.incidents) {
      ctx.save();
      ctx.translate(inc.x, inc.y);

      // Radial timer progress ring
      const progress = clamp(inc.timer / inc.totalDuration, 0, 1);
      ctx.strokeStyle = inc.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, inc.radius, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
      ctx.stroke();

      // Outer dashed interaction boundary
      ctx.strokeStyle = `${inc.color}55`;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, inc.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Visual animated element inside
      if (inc.type === "whirlwind") {
        // Rotating dust spiral
        ctx.strokeStyle = "#ffcc80";
        ctx.lineWidth = 2.5;
        for (let i = 0; i < 3; i++) {
          const ang = inc.animPhase + (i * Math.PI * 2) / 3;
          ctx.beginPath();
          ctx.arc(Math.cos(ang) * 14, Math.sin(ang) * 14, 18, 0, Math.PI);
          ctx.stroke();
        }
      } else if (inc.type === "wildfire") {
        // Flickering fire core
        ctx.fillStyle = "#ff7043";
        ctx.beginPath();
        ctx.arc(0, Math.sin(inc.animPhase) * 4, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffe082";
        ctx.beginPath();
        ctx.arc(0, -4, 12, 0, Math.PI * 2);
        ctx.fill();
      } else if (inc.type === "crying_stranger") {
        // Person sitting quietly
        ctx.fillStyle = "#80deea";
        ctx.beginPath();
        ctx.arc(0, -10, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-6, 0, 12, 14);
      } else {
        // General glowing incident orb
        ctx.fillStyle = inc.color;
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();
      }

      // Title & Action prompts
      ctx.font = "bold 13px Inter, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText(inc.title, 0, -inc.radius - 12);

      // Show Tend progress if player is standing still inside
      if (inc.tendTimer > 0) {
        ctx.fillStyle = "#00e676";
        ctx.fillRect(-30, inc.radius + 8, (inc.tendTimer / 2.0) * 60, 4);
      }

      ctx.restore();
    }
  }

  drawPlayer(ctx) {
    ctx.save();
    ctx.translate(this.player.x, this.player.y);

    // 1. Stillness Channeling Aura Ring
    const auraGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, this.player.auraRadius);
    auraGrad.addColorStop(0, "rgba(128, 222, 234, 0.45)");
    auraGrad.addColorStop(0.7, "rgba(128, 222, 234, 0.15)");
    auraGrad.addColorStop(1, "rgba(128, 222, 234, 0)");
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, this.player.auraRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(128, 222, 234, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, this.player.auraRadius, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Player Body (Glowing Monk / Wanderer)
    ctx.fillStyle = "#e0f7fa";
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#006064";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Eyes
    ctx.fillStyle = "#004d40";
    ctx.beginPath();
    ctx.arc(-4, -2, 2, 0, Math.PI * 2);
    ctx.arc(4, -2, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawEffects(ctx) {
    // Ripples
    for (const r of this.ripples) {
      ctx.strokeStyle = `${r.color}${Math.round(r.life * 255).toString(16).padStart(2, "0")}`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Action Shockwaves
    for (const p of this.particles) {
      if (p.type === "act_shockwave") {
        ctx.strokeStyle = "rgba(255, 138, 101, 0.75)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Floating text
    for (const ft of this.floatingTexts) {
      ctx.font = "bold 13px Inter, sans-serif";
      ctx.fillStyle = ft.color;
      ctx.textAlign = "center";
      ctx.fillText(ft.text, ft.x, ft.y);
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

    ctx.fillStyle = "rgba(128, 222, 234, 0.75)";
    ctx.beginPath();
    ctx.arc(j.startX + j.dx * 50, j.startY + j.dy * 50, 22, 0, Math.PI * 2);
    ctx.fill();
  }
}
