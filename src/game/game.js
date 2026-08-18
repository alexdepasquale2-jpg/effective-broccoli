import {
  createFourDAngles,
  hypersphereSliceRadius,
  projectCell16,
  projectTesseract,
  sliceWFromAngles,
  stepFourDAngles,
} from "./hypercube.js";
import { AudioBus } from "./audio.js";
import { loadBestScore, saveBestScore } from "./storage.js";
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
  playing: "playing",
  dying: "dying",
  over: "over",
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
    this.best = loadBestScore();
    this.combo = 0;
    this.comboTimer = 0;
    this.shake = 0;
    this.flash = 0;
    this.orbTimer = 0;
    this.shardTimer = 0;
    this.deathTimer = 0;
    this.player = { x: 0, y: 0, r: 22, angles: createFourDAngles() };
    this.fourD = { tesseract: null, cell16: null, slice: 1 };
    this.pointer = { x: 0, y: 0, active: false };
    this.orbs = [];
    this.shards = [];
    this.particles = [];
    this.trail = [];
    this.stars = [];
    this.running = false;
    this.boundFrame = (time) => this.frame(time);

    this.resize();
    this.resetField();
    this.bindInput();
    this.syncHud();
    this.draw(0);
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
    this.seedStars();
  }

  seedStars() {
    const count = Math.round((this.width * this.height) / 9000);
    this.stars = Array.from({ length: clamp(count, 50, 140) }, () => ({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      z: rand(0.2, 1.2),
      tw: rand(0, Math.PI * 2),
      size: rand(0.6, 2.2),
    }));
  }

  bindInput() {
    const toLocal = (event) => {
      const rect = this.canvas.getBoundingClientRect();
      this.pointer.x = clamp(event.clientX - rect.left, 0, this.width);
      this.pointer.y = clamp(event.clientY - rect.top, 0, this.height);
    };

    const onDown = (event) => {
      this.audio.unlock();
      this.pointer.active = true;
      toLocal(event);
      if (this.state === STATES.playing) {
        try {
          event.target?.setPointerCapture?.(event.pointerId);
        } catch {
          // Some mobile browsers reject capture on non-canvas targets.
        }
      }
    };

    const onMove = (event) => {
      if (!this.pointer.active && this.state !== STATES.playing) return;
      toLocal(event);
    };

    const onUp = () => {
      this.pointer.active = false;
    };

    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener(
      "touchmove",
      (event) => {
        event.preventDefault();
      },
      { passive: false },
    );
    window.addEventListener("resize", () => this.resize());
    window.visualViewport?.addEventListener("resize", () => this.resize());
    document.addEventListener("visibilitychange", () => {
      this.lastTime = performance.now();
    });
  }

  play() {
    this.audio.unlock();
    this.audio.start();
    this.state = STATES.playing;
    this.resetField();
    this.elapsed = 0;
    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.orbTimer = 0.15;
    this.shardTimer = 1.1;
    this.ui.overlay.hidden = true;
    this.ui.hud.hidden = false;
    this.syncHud();
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
  }

  gameOver() {
    this.best = saveBestScore(this.score);
    this.state = STATES.over;
    this.ui.title.textContent = "Aether";
    this.ui.subtitle.hidden = true;
    this.ui.result.hidden = false;
    this.ui.result.textContent = `Score ${this.score}  ·  Best ${this.best}`;
    this.ui.play.textContent = "Play again";
    this.ui.overlay.hidden = false;
    this.syncHud();
  }

  syncHud() {
    this.ui.score.textContent = String(this.score);
    this.ui.best.textContent = String(this.best);
    if (this.combo >= 2 && this.state === STATES.playing) {
      this.ui.combo.hidden = false;
      this.ui.combo.textContent = `x${this.combo}`;
    } else {
      this.ui.combo.hidden = true;
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
    const speed = this.state === STATES.playing ? 1 + this.combo * 0.08 : 0.7;
    stepFourDAngles(this.player.angles, dt, speed);
    this.projectPlayer();

    if (this.state === STATES.playing) {
      this.elapsed += dt;
      this.updatePlayer(dt);
      this.updateSpawns(dt);
      this.updateOrbs(dt);
      this.updateShards(dt);
      this.updateCombo(dt);
    } else if (this.state === STATES.dying) {
      this.deathTimer -= dt;
      if (this.deathTimer <= 0) {
        this.gameOver();
      }
    }

    this.updateParticles(dt);
    this.updateTrail(dt);
    this.shake = Math.max(0, this.shake - dt * 8);
    this.flash = Math.max(0, this.flash - dt * 3);
    this.driftStars(dt);
  }

  updatePlayer(dt) {
    this.player.x = damp(this.player.x, this.pointer.x, 14, dt);
    this.player.y = damp(this.player.y, this.pointer.y, 14, dt);
    const pad = this.player.r + 10;
    this.player.x = clamp(this.player.x, pad, this.width - pad);
    this.player.y = clamp(this.player.y, pad + 48, this.height - pad - 24);

    this.trail.push({
      x: this.player.x,
      y: this.player.y,
      r: this.player.r,
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
        color: vertex.w > 0 ? "rgba(190, 245, 255, 0.85)" : "rgba(168, 120, 255, 0.8)",
      });
    }
  }

  projectPlayer() {
    const w = sliceWFromAngles(this.player.angles);
    const slice = hypersphereSliceRadius(w, 1);
    this.player.r = 20 + slice * 7;
    const scale = 15 + slice * 4;
    this.fourD.slice = slice;
    this.fourD.tesseract = projectTesseract(this.player.angles, scale);
    this.fourD.cell16 = projectCell16(this.player.angles, scale * 1.15);
  }

  updateSpawns(dt) {
    const rates = spawnIntervals(this.elapsed);
    this.orbTimer -= dt;
    this.shardTimer -= dt;

    if (this.orbTimer <= 0) {
      this.spawnOrb();
      this.orbTimer = rates.orb;
    }
    if (this.shardTimer <= 0) {
      this.spawnShard(rates.shardSpeed);
      this.shardTimer = rates.shard;
    }
  }

  spawnOrb() {
    const r = rand(9, 13);
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
      r,
      phase: rand(0, Math.PI * 2),
      life: 7,
    });
  }

  spawnShard(speed) {
    const r = rand(16, 32);
    const fromTop = Math.random() < 0.7;
    let x = rand(r + 8, this.width - r - 8);
    let y = fromTop ? -r - 10 : rand(-20, this.height * 0.2);
    const pos = keepAwayFrom(x, y, this.player.x, this.player.y, 140);
    const vx = rand(-40, 40);
    const vy = speed + rand(-20, 40);
    this.shards.push({
      x: pos.x,
      y: pos.y,
      r,
      vx,
      vy,
      rot: rand(0, Math.PI * 2),
      spin: rand(-2.4, 2.4),
      sides: 5 + Math.floor(Math.random() * 3),
    });
  }

  updateOrbs(dt) {
    for (let i = this.orbs.length - 1; i >= 0; i -= 1) {
      const orb = this.orbs[i];
      orb.life -= dt;
      orb.phase += dt * 3;
      orb.y += Math.sin(orb.phase) * 8 * dt;

      const magnet = 150;
      const d = distance(orb.x, orb.y, this.player.x, this.player.y);
      if (d < magnet && d > 1) {
        const pull = (1 - d / magnet) * 120 * dt;
        orb.x += ((this.player.x - orb.x) / d) * pull;
        orb.y += ((this.player.y - orb.y) / d) * pull;
      }

      if (circleHit(orb.x, orb.y, orb.r, this.player.x, this.player.y, this.player.r)) {
        this.collectOrb(orb);
        this.orbs.splice(i, 1);
        continue;
      }
      if (orb.life <= 0) this.orbs.splice(i, 1);
    }
  }

  collectOrb(orb) {
    this.combo += 1;
    this.comboTimer = 1.25;
    this.score += orbPoints(this.combo);
    this.flash = Math.min(0.35, 0.12 + this.combo * 0.01);
    this.audio.collect(this.combo);
    this.burst(orb.x, orb.y, "#ffd56a", 14);
    this.syncHud();
  }

  updateShards(dt) {
    for (let i = this.shards.length - 1; i >= 0; i -= 1) {
      const shard = this.shards[i];
      shard.x += shard.vx * dt;
      shard.y += shard.vy * dt;
      shard.rot += shard.spin * dt;

      if (circleHit(shard.x, shard.y, shard.r * 0.82, this.player.x, this.player.y, this.player.r * 0.82)) {
        this.hitPlayer();
        return;
      }
      if (shard.y - shard.r > this.height + 40 || shard.x < -80 || shard.x > this.width + 80) {
        this.shards.splice(i, 1);
      }
    }
  }

  hitPlayer() {
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
      this.combo = 0;
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
      star.y += star.z * 18 * dt;
      star.tw += dt * star.z;
      if (star.y > this.height + 4) {
        star.y = -4;
        star.x = Math.random() * this.width;
      }
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

    const shakeX = this.shake ? rand(-8, 8) * this.shake : 0;
    const shakeY = this.shake ? rand(-8, 8) * this.shake : 0;
    ctx.save();
    ctx.translate(shakeX, shakeY);

    this.drawBackdrop();
    this.drawStars();
    this.drawOrbs();
    this.drawShards();
    this.drawTrail();
    if (this.state !== STATES.dying && this.state !== STATES.over) {
      this.drawPlayer();
    }
    this.drawParticles();

    ctx.restore();

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255, 230, 180, ${this.flash * 0.35})`;
      ctx.fillRect(0, 0, width, height);
    }
  }

  drawBackdrop() {
    const { ctx, width, height } = this;
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#14082c");
    sky.addColorStop(0.45, "#0b0618");
    sky.addColorStop(1, "#05030c");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    const nebula = ctx.createRadialGradient(
      width * 0.7,
      height * 0.18,
      20,
      width * 0.7,
      height * 0.18,
      width * 0.7,
    );
    nebula.addColorStop(0, "rgba(118, 62, 196, 0.35)");
    nebula.addColorStop(1, "rgba(118, 62, 196, 0)");
    ctx.fillStyle = nebula;
    ctx.fillRect(0, 0, width, height);

    const nebula2 = ctx.createRadialGradient(
      width * 0.2,
      height * 0.75,
      10,
      width * 0.2,
      height * 0.75,
      width * 0.55,
    );
    nebula2.addColorStop(0, "rgba(32, 120, 180, 0.22)");
    nebula2.addColorStop(1, "rgba(32, 120, 180, 0)");
    ctx.fillStyle = nebula2;
    ctx.fillRect(0, 0, width, height);
  }

  drawStars() {
    const { ctx } = this;
    for (const star of this.stars) {
      const alpha = 0.25 + Math.abs(Math.sin(star.tw)) * 0.7;
      ctx.fillStyle = `rgba(230, 236, 255, ${alpha * star.z})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size * star.z, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawOrbs() {
    const { ctx } = this;
    for (const orb of this.orbs) {
      const pulse = 1 + Math.sin(orb.phase) * 0.08;
      ctx.save();
      ctx.shadowColor = "#ffd56a";
      ctx.shadowBlur = 18;
      ctx.fillStyle = "#ffe7a3";
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.r * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.beginPath();
      ctx.arc(orb.x - orb.r * 0.28, orb.y - orb.r * 0.28, orb.r * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawShards() {
    const { ctx } = this;
    for (const shard of this.shards) {
      ctx.save();
      ctx.translate(shard.x, shard.y);
      ctx.rotate(shard.rot);
      ctx.shadowColor = "#ff5d7a";
      ctx.shadowBlur = 16;
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
      ctx.fillStyle = "#3a1020";
      ctx.fill();
      ctx.strokeStyle = "#ff6d86";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }
  }

  drawTrail() {
    const { ctx } = this;
    for (const t of this.trail) {
      const a = t.life / 0.38;
      ctx.fillStyle = `rgba(92, 225, 255, ${a * 0.12})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, (t.r || this.player.r) * (0.55 + a * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawPlayer() {
    const { ctx, player, fourD } = this;
    if (!fourD.tesseract || !fourD.cell16) this.projectPlayer();
    const { tesseract, cell16, slice } = fourD;
    ctx.save();
    ctx.translate(player.x, player.y);

    const core = ctx.createRadialGradient(0, 0, 2, 0, 0, player.r * 1.35);
    core.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    core.addColorStop(0.22, "rgba(170, 240, 255, 0.55)");
    core.addColorStop(0.55, "rgba(120, 90, 255, 0.16)");
    core.addColorStop(1, "rgba(92, 225, 255, 0)");
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(0, 0, player.r * 1.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(186, 160, 255, ${0.18 + slice * 0.2})`;
    ctx.lineWidth = 1.2;
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
  }

  drawParticles() {
    const { ctx } = this;
    for (const p of this.particles) {
      const a = p.life / (p.max || 0.6);
      ctx.globalAlpha = clamp(a, 0, 1);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}
