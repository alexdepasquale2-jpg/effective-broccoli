import { AudioBus } from "./audio.js";
import { pickEvent, resolveEvent } from "./events.js";
import { createLedger, recordChoice, summarize } from "./ledger.js";
import {
  DEPTHS,
  arrivalInterval,
  depthForStillness,
  nextDepth,
  passBonus,
  stillnessRate,
  streakMultiplier,
  tierForDepth,
} from "./stillness.js";
import { loadRecord, mergeSession, saveRecord } from "./storage.js";
import { clamp, damp, formatDuration, pointInRect, rand } from "./utils.js";

export const STATES = {
  TITLE: "TITLE",
  PLAYING: "PLAYING",
  ENDED: "ENDED",
};

const MAX_ON_SCREEN = 3;
const ECHO_LIFE = 6.5;

export class Game {
  constructor(canvas, ui) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ui = ui;
    this.audio = new AudioBus();

    this.state = STATES.TITLE;
    this.record = loadRecord();

    this.width = 640;
    this.height = 480;
    this.dpr = 1;
    this.lastTime = 0;
    this.running = false;
    this.boundFrame = (t) => this.frame(t);

    this.reset();
    this.resize();
    this.bindInput();
    this.syncHud();
    this.draw();
  }

  reset() {
    this.elapsed = 0;
    this.stillness = 0;
    this.peakStillness = 0;
    this.lastActionAt = 0;
    this.depthLevel = 0;
    this.maxDepthLevel = 0;
    this.ledger = createLedger();
    this.cards = [];
    this.echoes = [];
    this.ripples = [];
    this.recentIds = [];
    this.arrivalTimer = 6;
    this.breath = 0;
    this.rippleTimer = 2;
    this.coreGlow = 0;
    this.seedMotes();
  }

  seedMotes() {
    this.motes = Array.from({ length: 80 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: rand(0.6, 2.1),
      drift: rand(-6, 6),
      rise: rand(-9, -2),
      phase: rand(0, Math.PI * 2),
      alpha: rand(0.12, 0.5),
    }));
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

  bindInput() {
    this.canvas.addEventListener("pointerdown", (e) => {
      this.audio.unlock();
      if (this.state !== STATES.PLAYING) return;
      const rect = this.canvas.getBoundingClientRect();
      this.tapAt(e.clientX - rect.left, e.clientY - rect.top);
    });

    window.addEventListener("resize", () => this.resize());
    window.visualViewport?.addEventListener("resize", () => this.resize());
    window.addEventListener(
      "touchmove",
      (e) => {
        if (e.target.closest("button, .sheet")) return;
        e.preventDefault();
      },
      { passive: false },
    );
  }

  tapAt(x, y) {
    for (const card of this.cards) {
      if (card.phase !== "settled") continue;
      if (pointInRect(x, y, card.x, card.y, card.w, card.h)) {
        this.resolveCard(card, true);
        return;
      }
    }
  }

  // The button that does nothing. It does nothing.
  pressNothing() {
    if (this.state !== STATES.PLAYING) return;
    this.audio.nothing();
    this.ledger = { ...this.ledger, buttonPresses: this.ledger.buttonPresses + 1 };
    this.lastActionAt = this.elapsed;
    this.pushEcho("You pressed it. Nothing happened.", "#7d8aa8");
    this.syncHud();
  }

  play() {
    this.audio.unlock();
    this.reset();
    this.state = STATES.PLAYING;
    this.ui.overlay.hidden = true;
    this.ui.hud.hidden = false;
    this.ui.dock.hidden = false;
    this.ui.ledgerSheet.hidden = true;
    this.ui.endSheet.hidden = true;
    this.pushEcho("Something will happen soon. You do not have to meet it.", "#93a4c4");
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
    this.breath += dt;
    this.updateMotes(dt);
    this.updateRipples(dt);
    this.coreGlow = Math.max(0, this.coreGlow - dt * 1.6);

    if (this.state !== STATES.PLAYING) {
      this.updateEchoes(dt);
      this.layoutCards(dt);
      return;
    }

    this.elapsed += dt;

    const streak = this.elapsed - this.lastActionAt;
    this.stillness += stillnessRate(this.depthLevel, streak) * dt;
    this.peakStillness = Math.max(this.peakStillness, this.stillness);

    // Depth follows stillness both ways. Reaching into the world pulls you back out.
    const depth = depthForStillness(this.stillness);
    const deepened = depth.level > this.depthLevel;
    this.depthLevel = depth.level;
    this.maxDepthLevel = Math.max(this.maxDepthLevel, depth.level);

    if (deepened) {
      this.audio.deepen();
      this.coreGlow = 1;
      this.pushEcho(`Depth: ${depth.name}.`, "#a8e6d4");
      if (depth.level >= 7) {
        this.endSession(true);
        return;
      }
    }

    this.rippleTimer -= dt;
    if (this.rippleTimer <= 0) {
      this.rippleTimer = Math.max(1.6, 4.2 - this.depthLevel * 0.3);
      this.ripples.push({ r: 0, life: 1 });
    }

    this.arrivalTimer -= dt;
    if (this.arrivalTimer <= 0 && this.cards.filter((c) => c.phase !== "resolving").length < MAX_ON_SCREEN) {
      this.spawnEvent();
      this.arrivalTimer = arrivalInterval(this.depthLevel) * rand(0.8, 1.2);
    }

    this.updateCards(dt);
    this.updateEchoes(dt);
    this.syncHud();
  }

  spawnEvent() {
    const tier = tierForDepth(this.depthLevel);
    const event = pickEvent(tier, Math.random, this.recentIds);
    this.recentIds = [event.id, ...this.recentIds].slice(0, 8);

    this.cards.push({
      event,
      phase: "incoming",
      remaining: event.window,
      x: this.width + 40,
      y: 0,
      w: 0,
      h: 0,
      slot: 0,
      exit: 0,
      exitKind: null,
      jitter: rand(0, Math.PI * 2),
    });
    this.audio.arrive();
  }

  updateCards(dt) {
    for (const card of this.cards) {
      if (card.phase === "settled") {
        card.remaining -= dt;
        if (card.remaining <= 0) this.resolveCard(card, false);
      } else if (card.phase === "incoming") {
        card.remaining -= dt * 0.35;
      }
    }
    this.layoutCards(dt);
    this.cards = this.cards.filter((c) => c.phase !== "resolving" || c.exit < 1);
  }

  layoutCards(dt) {
    const { width, height } = this;
    const cardW = Math.min(width - 32, 430);
    const baseY = height * 0.46;
    const gap = 12;

    const live = this.cards.filter((c) => c.phase !== "resolving");
    live.forEach((card, index) => (card.slot = index));

    let stackY = baseY;
    for (const card of this.cards) {
      const ctx = this.ctx;
      const lines = wrapText(ctx, card.event.text, cardW - 36, "16px 'Cormorant Garamond', Georgia, serif");
      card.lines = lines;
      card.w = cardW;
      card.h = 30 + lines.length * 24 + 44;

      if (card.phase === "resolving") {
        card.exit = Math.min(1, card.exit + dt * 1.25);
        continue;
      }

      const targetX = (width - cardW) / 2;
      const targetY = stackY;
      stackY += card.h + gap;

      if (card.phase === "incoming") {
        card.x = damp(card.x, targetX, 5, dt);
        card.y = card.y === 0 ? targetY : damp(card.y, targetY, 8, dt);
        if (Math.abs(card.x - targetX) < 2) {
          card.x = targetX;
          card.phase = "settled";
        }
      } else {
        card.x = damp(card.x, targetX, 9, dt);
        card.y = damp(card.y, targetY, 9, dt);
      }
    }
  }

  resolveCard(card, acted) {
    if (card.phase === "resolving") return;
    const resolution = resolveEvent(card.event, acted);
    this.ledger = recordChoice(this.ledger, resolution);

    if (acted) {
      this.stillness = Math.max(0, this.stillness - resolution.cost);
      this.lastActionAt = this.elapsed;
      this.audio.act();
      this.pushEcho(resolution.text, resolution.madeWorse ? "#e08a8a" : resolution.helped ? "#a8e6d4" : "#c3b7d6");
    } else {
      this.stillness += passBonus(this.depthLevel);
      this.audio.pass();
      this.ripples.push({ r: 0, life: 1 });
      this.pushEcho(resolution.text, resolution.missed ? "#d8c48a" : "#93b8c4");
    }

    card.phase = "resolving";
    card.exit = 0;
    card.exitKind = acted ? "act" : "pass";
    this.coreGlow = Math.max(this.coreGlow, acted ? 0.35 : 0.7);
    this.syncHud();
  }

  pushEcho(text, color) {
    this.echoes.unshift({ text, color, life: ECHO_LIFE });
    this.echoes = this.echoes.slice(0, 3);
  }

  updateEchoes(dt) {
    for (const echo of this.echoes) echo.life -= dt;
    this.echoes = this.echoes.filter((e) => e.life > 0);
  }

  updateMotes(dt) {
    for (const mote of this.motes) {
      mote.x += (mote.drift / this.width) * dt;
      mote.y += (mote.rise / this.height) * dt;
      mote.phase += dt * 0.5;
      if (mote.y < -0.05) mote.y = 1.05;
      if (mote.x < -0.05) mote.x = 1.05;
      if (mote.x > 1.05) mote.x = -0.05;
    }
  }

  updateRipples(dt) {
    for (const ripple of this.ripples) {
      ripple.r += dt * 62;
      ripple.life -= dt * 0.38;
    }
    this.ripples = this.ripples.filter((r) => r.life > 0);
  }

  endSession(reachedNothing = false) {
    if (this.state === STATES.ENDED) return;
    this.state = STATES.ENDED;
    this.record = mergeSession(this.record, {
      stillness: this.peakStillness,
      depthLevel: this.maxDepthLevel,
      ledger: this.ledger,
    });
    saveRecord(this.record);

    const summary = summarize(this.ledger);
    this.ui.endTitle.textContent = reachedNothing ? "Nothing" : "You stopped";
    this.ui.endLead.textContent = reachedNothing
      ? "You reached the bottom of the quiet. It took no effort at all."
      : "Here is what your attention actually accomplished.";
    this.ui.endStats.innerHTML = `
      <p class="stat-row"><span>Deepest stillness</span><b>${Math.floor(this.peakStillness)}</b></p>
      <p class="stat-row"><span>Depth reached</span><b>${DEPTHS[this.maxDepthLevel].name}</b></p>
      <p class="stat-row"><span>Time spent</span><b>${formatDuration(this.elapsed)}</b></p>
    `;
    this.ui.endLines.innerHTML = summary.lines.map((l) => `<p>${l}</p>`).join("");
    this.ui.endVerdict.textContent = summary.verdict;
    this.ui.endSheet.hidden = false;
    this.ui.dock.hidden = true;
  }

  openLedger() {
    const summary = summarize(this.ledger);
    this.ui.ledgerLines.innerHTML = summary.lines.map((l) => `<p>${l}</p>`).join("");
    this.ui.ledgerVerdict.textContent = summary.verdict;
    this.ui.ledgerSheet.hidden = false;
  }

  closeLedger() {
    this.ui.ledgerSheet.hidden = true;
  }

  syncHud() {
    if (!this.ui.stillness) return;
    const depth = depthForStillness(this.stillness);
    const next = nextDepth(this.stillness);
    const streak = this.elapsed - this.lastActionAt;

    this.ui.stillness.textContent = String(Math.floor(this.stillness));
    this.ui.depthName.textContent = depth.name;
    this.ui.multiplier.textContent = `×${streakMultiplier(streak).toFixed(1)}`;
    this.ui.progress.style.width = next
      ? `${clamp(((this.stillness - depth.at) / (next.at - depth.at)) * 100, 0, 100)}%`
      : "100%";
    this.ui.untouched.textContent = `${this.ledger.passed} let pass · ${this.ledger.acted} acted on`;
  }

  // ------------------------------------------------------------------ draw

  draw() {
    const { ctx, width, height } = this;
    const depth = depthForStillness(this.stillness);
    ctx.clearRect(0, 0, width, height);

    const coreX = width / 2;
    const coreY = height * 0.26;

    this.drawBackground(ctx, width, height, depth, coreX, coreY);
    this.drawMotes(ctx, width, height);
    this.drawRipples(ctx, coreX, coreY);
    this.drawCore(ctx, coreX, coreY, depth);
    this.drawEchoes(ctx, coreX, coreY);
    this.drawCards(ctx);
    this.drawVignette(ctx, width, height);
  }

  drawBackground(ctx, width, height, depth, coreX, coreY) {
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, depth.tint);
    sky.addColorStop(0.55, shade(depth.tint, -0.45));
    sky.addColorStop(1, "#05070c");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(coreX, coreY, 10, coreX, coreY, Math.max(width, height) * 0.62);
    glow.addColorStop(0, `rgba(150, 210, 220, ${0.09 + this.depthLevel * 0.012 + this.coreGlow * 0.09})`);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  }

  drawMotes(ctx, width, height) {
    for (const mote of this.motes) {
      const twinkle = 0.6 + Math.sin(mote.phase) * 0.4;
      ctx.fillStyle = `rgba(198, 224, 236, ${mote.alpha * twinkle})`;
      ctx.beginPath();
      ctx.arc(mote.x * width, mote.y * height, mote.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawRipples(ctx, cx, cy) {
    for (const ripple of this.ripples) {
      ctx.strokeStyle = `rgba(160, 220, 214, ${ripple.life * 0.22})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, ripple.r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  drawCore(ctx, cx, cy, depth) {
    // Breathing slows the deeper you go.
    const cycle = (this.breath / depth.breath) * Math.PI * 2;
    const swell = Math.sin(cycle);
    const base = 30 + this.depthLevel * 2.4;
    const r = base + swell * 7;

    ctx.save();
    ctx.translate(cx, cy);

    for (let i = 3; i >= 1; i--) {
      ctx.strokeStyle = `rgba(150, 214, 208, ${0.05 + i * 0.02 + this.coreGlow * 0.06})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, r + i * 13 + swell * 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    const fill = ctx.createRadialGradient(0, 0, 2, 0, 0, r);
    fill.addColorStop(0, `rgba(226, 248, 244, ${0.5 + this.coreGlow * 0.3})`);
    fill.addColorStop(0.55, "rgba(126, 194, 194, 0.16)");
    fill.addColorStop(1, "rgba(126, 194, 194, 0)");
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(196, 240, 232, ${0.35 + this.coreGlow * 0.4})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  drawEchoes(ctx, cx, coreY) {
    const startY = coreY + 78 + this.depthLevel * 2;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    let y = startY;
    this.echoes.forEach((echo, index) => {
      const fade = clamp(echo.life / 1.4, 0, 1) * clamp((ECHO_LIFE - echo.life) / 0.35, 0, 1);
      const alpha = fade * (index === 0 ? 1 : 0.45);
      const font = index === 0 ? "italic 17px 'Cormorant Garamond', Georgia, serif" : "italic 14px 'Cormorant Garamond', Georgia, serif";
      const lines = wrapText(ctx, echo.text, Math.min(this.width - 56, 420), font);
      ctx.font = font;
      ctx.fillStyle = withAlpha(echo.color, alpha);
      for (const line of lines) {
        ctx.fillText(line, cx, y);
        y += index === 0 ? 23 : 19;
      }
      y += 8;
    });
  }

  drawCards(ctx) {
    for (const card of this.cards) {
      const event = card.event;
      const exiting = card.phase === "resolving";
      const t = card.exit;

      let alpha = 1;
      let offsetX = 0;
      let offsetY = 0;
      let scale = 1;

      if (exiting) {
        alpha = 1 - t;
        if (card.exitKind === "pass") {
          // Dissolves upward, into the quiet.
          offsetY = -t * 70;
          scale = 1 - t * 0.06;
        } else {
          // Snaps shut. You touched it.
          offsetX = Math.sin(t * 34) * (1 - t) * 7;
          scale = 1 - t * 0.14;
        }
      } else if (card.phase === "incoming") {
        alpha = 0.55;
      }

      const jitter = event.loud && !exiting ? Math.sin(this.breath * 7 + card.jitter) * 1.1 : 0;
      const x = card.x + offsetX + jitter;
      const y = card.y + offsetY;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x + card.w / 2, y + card.h / 2);
      ctx.scale(scale, scale);
      ctx.translate(-card.w / 2, -card.h / 2);

      const accent = event.loud ? "#d98a76" : "#7fb3b8";
      roundRect(ctx, 0, 0, card.w, card.h, 14);
      ctx.fillStyle = event.loud ? "rgba(38, 26, 30, 0.82)" : "rgba(20, 32, 40, 0.78)";
      ctx.fill();
      ctx.strokeStyle = withAlpha(accent, event.loud ? 0.7 : 0.42);
      ctx.lineWidth = event.loud ? 1.8 : 1.1;
      ctx.stroke();

      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.font = "16px 'Cormorant Garamond', Georgia, serif";
      ctx.fillStyle = "rgba(233, 240, 246, 0.94)";
      card.lines.forEach((line, i) => ctx.fillText(line, 18, 16 + i * 24));

      const labelY = card.h - 40;
      ctx.font = "600 12px Inter, system-ui, sans-serif";
      const labelW = ctx.measureText(event.actLabel.toUpperCase()).width + 30;
      roundRect(ctx, 18, labelY, Math.max(96, labelW), 26, 13);
      ctx.fillStyle = withAlpha(accent, 0.16);
      ctx.fill();
      ctx.strokeStyle = withAlpha(accent, 0.55);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.font = "600 12px Inter, system-ui, sans-serif";
      ctx.fillStyle = withAlpha(accent, 0.95);
      ctx.textAlign = "center";
      ctx.fillText(event.actLabel.toUpperCase(), 18 + Math.max(96, labelW) / 2, labelY + 8);

      ctx.textAlign = "right";
      ctx.font = "11px Inter, system-ui, sans-serif";
      ctx.fillStyle = "rgba(190, 208, 220, 0.4)";
      ctx.fillText("or do nothing", card.w - 18, labelY + 9);

      // The window draining away on its own.
      const pct = clamp(card.remaining / event.window, 0, 1);
      ctx.fillStyle = "rgba(255,255,255,0.07)";
      ctx.fillRect(18, card.h - 9, card.w - 36, 2);
      ctx.fillStyle = withAlpha(accent, 0.6);
      ctx.fillRect(18, card.h - 9, (card.w - 36) * pct, 2);

      ctx.restore();
    }
  }

  drawVignette(ctx, width, height) {
    const v = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.35, width / 2, height / 2, Math.max(width, height) * 0.78);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(0,0,0,0.5)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, width, height);
  }
}

// ---------------------------------------------------------------- helpers

const wrapCache = new Map();

function wrapText(ctx, text, maxWidth, font) {
  const key = `${font}|${Math.round(maxWidth)}|${text}`;
  const cached = wrapCache.get(key);
  if (cached) return cached;

  ctx.font = font;
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  wrapCache.set(key, lines);
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = Number.parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function withAlpha(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1)})`;
}

function shade(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  const f = (v) => Math.round(clamp(v + v * amount, 0, 255));
  return `rgb(${f(r)}, ${f(g)}, ${f(b)})`;
}
