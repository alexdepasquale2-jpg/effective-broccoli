import { AudioBus } from "./audio.js";
import { accounting, createChronicle, recordBeat, recordCollapse, recordThread } from "./chronicle.js";
import {
  attuneLevel,
  autoRevealed,
  canAfford,
  costOf,
  createResources,
  depthFor,
  gainAttunement,
  nextDepth,
  spend,
  stillnessRate,
  streakMultiplier,
  vitalityRate,
} from "./resources.js";
import { Scene } from "./scene.js";
import { loadRecord, mergeRun, saveRecord } from "./storage.js";
import {
  REVEALS,
  THREADS,
  applyChoice,
  createRun,
  currentBeat,
  finishRun,
} from "./threads.js";
import { clamp, damp, pointInRect, rand } from "./utils.js";
import {
  DOMAINS,
  TOTAL_DAYS,
  applyEffects,
  conditionOf,
  createWorld,
  seasonFor,
  seedWeights,
  worldAverage,
  worldVerdict,
} from "./world.js";

export const STATES = { TITLE: "TITLE", DAY: "DAY", NIGHT: "NIGHT", ENDED: "ENDED" };

const DAY_LENGTH = 52;
const MAX_RUNS = 4;
const MAX_CARDS = 2;
const ECHO_LIFE = 7;

export class Game {
  constructor(canvas, ui) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ui = ui;
    this.audio = new AudioBus();
    this.scene = new Scene();
    this.record = loadRecord();

    this.state = STATES.TITLE;
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
    this.world = createWorld();
    this.resources = createResources();
    this.chronicle = createChronicle();
    this.runs = [];
    this.cards = [];
    this.echoes = [];
    this.usedThreadIds = [];
    this.dayTimer = DAY_LENGTH;
    this.elapsed = 0;
    this.lastActionAt = 0;
    this.time = 0;
    this.flash = 0;
    this.nightReport = [];
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
    this.scene.layout(width, height);
  }

  bindInput() {
    this.canvas.addEventListener("pointerdown", (e) => {
      this.audio.unlock();
      if (this.state !== STATES.DAY) return;
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
      if (card.phase !== "settled" || !card.hits) continue;
      for (const hit of card.hits) {
        if (pointInRect(x, y, hit.x, hit.y, hit.w, hit.h)) {
          if (hit.action === "watch") this.watchCard(card);
          else this.chooseCard(card, hit.action);
          return;
        }
      }
    }
  }

  // ------------------------------------------------------------- lifecycle

  start() {
    this.audio.unlock();
    this.reset();
    this.state = STATES.DAY;
    this.ui.overlay.hidden = true;
    this.ui.hud.hidden = false;
    this.ui.nightSheet.hidden = true;
    this.ui.endSheet.hidden = true;
    this.ui.chronicleSheet.hidden = true;
    this.seedDay();
    this.pushEcho("The valley wakes. Most of what happens here does not require you.", "#a9c6d8");
    this.syncHud();
  }

  seedDay() {
    const weights = seedWeights(this.world);
    const available = THREADS.filter((t) => !this.usedThreadIds.includes(t.id));
    const wanted = Math.min(this.world.day === 1 ? 2 : rand(0, 1) > 0.45 ? 2 : 1, MAX_RUNS - this.runs.length);

    for (let i = 0; i < wanted; i += 1) {
      const pool = available.filter((t) => !this.usedThreadIds.includes(t.id));
      if (!pool.length) return;

      const total = pool.reduce((sum, t) => sum + (weights[t.domain] || 1), 0);
      let roll = Math.random() * total;
      let picked = pool[0];
      for (const thread of pool) {
        roll -= weights[thread.domain] || 1;
        if (roll <= 0) {
          picked = thread;
          break;
        }
      }

      this.usedThreadIds.push(picked.id);
      const run = createRun(picked, this.world.day);
      run.cooldown = rand(1.5, 6 + i * 5);
      this.runs.push(run);
    }
  }

  frame(time) {
    const dt = clamp((time - this.lastTime) / 1000, 0, 0.05);
    this.lastTime = time;
    this.time += dt;
    this.update(dt);
    this.draw();
    requestAnimationFrame(this.boundFrame);
  }

  update(dt) {
    this.scene.update(dt);
    this.updateEchoes(dt);
    this.flash = Math.max(0, this.flash - dt * 2);
    if (this.state !== STATES.DAY) {
      this.layoutCards(dt);
      return;
    }

    this.elapsed += dt;
    this.dayTimer -= dt;

    const streak = this.elapsed - this.lastActionAt;
    const depth = depthFor(this.resources.stillness);
    this.resources.stillness += stillnessRate(depth.level, streak) * dt;
    this.resources.peakStillness = Math.max(this.resources.peakStillness, this.resources.stillness);
    this.resources.vitality = Math.min(
      this.resources.vitalityMax,
      this.resources.vitality + vitalityRate(streak, depth.level) * dt,
    );

    this.scheduleBeats(dt);
    this.updateCards(dt);
    this.syncHud();

    if (this.dayTimer <= 0) this.endDay();
  }

  scheduleBeats(dt) {
    for (const run of this.runs) {
      if (run.done || run.card) continue;
      run.cooldown -= dt;
      if (run.cooldown <= 0 && this.cards.filter((c) => c.phase !== "resolving").length < MAX_CARDS) {
        this.presentBeat(run);
      }
    }
  }

  presentBeat(run) {
    const beat = currentBeat(run);
    if (!beat) return;

    const revealed = autoRevealed(this.resources, run.thread);
    const card = {
      run,
      beat,
      remaining: beat.window,
      revealed,
      phase: "incoming",
      x: this.width + 60,
      y: 0,
      w: 0,
      h: 0,
      exit: 0,
      exitKind: null,
      hits: [],
      jitter: rand(0, Math.PI * 2),
    };
    run.card = card;
    this.cards.push(card);
    this.audio.arrive(run.thread.loud);
  }

  updateCards(dt) {
    for (const card of this.cards) {
      if (card.phase === "settled") {
        card.remaining -= dt;
        if (card.remaining <= 0) this.chooseCard(card, "pass", true);
      } else if (card.phase === "incoming") {
        card.remaining -= dt * 0.3;
      }
    }
    this.layoutCards(dt);
    this.cards = this.cards.filter((c) => c.phase !== "resolving" || c.exit < 1);
  }

  watchCard(card) {
    if (card.revealed) return;
    if (!canAfford(this.resources, "watch", this.resources.fatigue)) {
      this.pushEcho("You have nothing left to look with.", "#d08a8a");
      return;
    }
    this.resources = spend(this.resources, "watch", 0);
    this.resources = gainAttunement(this.resources, 7);
    card.revealed = true;
    this.lastActionAt = this.elapsed;
    this.audio.watch();
    this.syncHud();
  }

  chooseCard(card, choice, automatic = false) {
    if (card.phase === "resolving") return;

    if (choice !== "pass") {
      if (!canAfford(this.resources, choice, this.resources.fatigue)) {
        this.pushEcho("You do not have it in you right now.", "#d08a8a");
        return;
      }
      this.resources = spend(this.resources, choice, this.resources.fatigue);
      this.lastActionAt = this.elapsed;
      this.audio.reach(choice);
    } else if (!automatic) {
      this.audio.pass();
    } else {
      this.audio.pass();
    }

    const { run: updatedRun, resolution } = applyChoice(card.run, choice);
    const run = this.runs.find((r) => r.id === card.run.id);
    Object.assign(run, updatedRun, { card: null });

    this.chronicle = recordBeat(this.chronicle, {
      choice,
      need: resolution.need,
      threadTitle: resolution.threadTitle,
      text: resolution.text,
    });

    if (resolution.right) {
      this.resources = gainAttunement(this.resources, 5);
      this.resources.standing = Math.min(100, this.resources.standing + 1);
    } else if (choice !== "pass") {
      this.resources.standing = Math.max(0, this.resources.standing - 1);
    }

    const tone = resolution.right ? "#a9dcc4" : choice === "pass" ? "#9db6cc" : "#dba98a";
    this.pushEcho(resolution.text, tone);

    card.phase = "resolving";
    card.exit = 0;
    card.exitKind = choice;

    if (run.done) {
      this.finishThread(run);
    } else {
      run.cooldown = rand(9, 20);
    }

    this.syncHud();
    if (this.resources.vitality <= 0) this.collapse();
  }

  finishThread(run) {
    const { ending, counterfactual } = finishRun(run);
    this.world = applyEffects(this.world, ending.effects || {});
    this.chronicle = recordThread(this.chronicle, {
      threadTitle: run.thread.title,
      domain: run.thread.domain,
      ending,
      counterfactual,
      });
    this.nightReport.push({
      title: run.thread.title,
      domain: run.thread.domain,
      ending,
      counterfactual,
      changed: ending.key !== counterfactual.key,
      better: ending.rank < counterfactual.rank,
    });
    this.runs = this.runs.filter((r) => r.id !== run.id);
    this.flash = 0.5;
    this.audio.resolve(ending.rank);
  }

  collapse() {
    this.chronicle = recordCollapse(this.chronicle);
    this.world = applyEffects(this.world, { self: -6, work: -3 });
    this.resources.vitality = Math.round(this.resources.vitalityMax * 0.45);
    this.resources.collapses += 1;
    this.audio.collapse();
    this.flash = 0.9;
    this.nightReport.push({ collapse: true });
    this.endDay();
  }

  endDay() {
    if (this.state !== STATES.DAY) return;
    this.state = STATES.NIGHT;

    // Anything still open at dusk is not decided tonight. It waits for morning.
    for (const card of this.cards) {
      if (card.phase === "settled" || card.phase === "incoming") {
        card.phase = "resolving";
        card.exit = 0.4;
        card.exitKind = "pass";
        const run = this.runs.find((r) => r.id === card.run.id);
        if (run) {
          run.card = null;
          run.cooldown = rand(3, 12);
        }
      }
    }

    this.resources.fatigue = 0;
    this.renderNight();
    this.audio.dusk();
  }

  sleep() {
    this.ui.nightSheet.hidden = true;
    this.nightReport = [];

    if (this.world.day >= TOTAL_DAYS) {
      this.finish();
      return;
    }

    this.world = { ...this.world, day: this.world.day + 1 };
    this.dayTimer = DAY_LENGTH;
    this.state = STATES.DAY;
    this.resources.vitality = Math.min(
      this.resources.vitalityMax,
      this.resources.vitality + 34,
    );
    this.seedDay();
    this.audio.dawn();
    const season = seasonFor(this.world.day);
    this.pushEcho(`Day ${this.world.day}. ${season.name}.`, "#c9dcea");
    this.syncHud();
  }

  finish() {
    this.state = STATES.ENDED;

    // Threads still running simply run on without you.
    for (const run of this.runs) {
      let tail = run;
      while (!tail.done) {
        tail = applyChoice(tail, "pass").run;
      }
      const { ending, counterfactual } = finishRun(tail);
      this.world = applyEffects(this.world, ending.effects || {});
      this.chronicle = recordThread(this.chronicle, {
        threadTitle: run.thread.title,
        domain: run.thread.domain,
        ending,
        counterfactual,
      });
    }
    this.runs = [];

    this.record = mergeRun(this.record, {
      world: this.world,
      chronicle: this.chronicle,
      peakStillness: this.resources.peakStillness,
    });
    saveRecord(this.record);
    this.renderEnd();
  }

  // -------------------------------------------------------------------- UI

  renderNight() {
    const season = seasonFor(this.world.day);
    this.ui.nightTitle.textContent = `Night of day ${this.world.day}`;
    this.ui.nightSub.textContent = `${season.name} · ${this.runs.length} ${this.runs.length === 1 ? "story" : "stories"} still running`;

    const rows = this.nightReport.map((entry) => {
      if (entry.collapse) {
        return `<p class="night-row collapse">You ran yourself out. The day finished without you in it.</p>`;
      }
      const tag = entry.changed
        ? entry.better
          ? `<span class="tag good">your doing</span>`
          : `<span class="tag bad">your doing</span>`
        : `<span class="tag flat">would have happened anyway</span>`;
      return `<p class="night-row"><b>${entry.title}: ${entry.ending.title}</b> ${tag}<br /><span class="dim">${entry.ending.text}</span></p>`;
    });

    this.ui.nightBody.innerHTML = rows.length
      ? rows.join("")
      : `<p class="night-row dim">Nothing finished today. Everything is still in motion, which is the usual state of things.</p>`;

    this.ui.nightWorld.innerHTML = DOMAINS.map((domain) => {
      const value = Math.round(this.world.domains[domain.id]);
      const condition = conditionOf(this.world, domain.id);
      return `<div class="meter"><span class="meter-name">${domain.name}</span><div class="meter-track"><div class="meter-fill ${condition.key}" style="width:${value}%"></div></div><span class="meter-state">${condition.name}</span></div>`;
    }).join("");

    this.ui.sleepBtn.textContent = this.world.day >= TOTAL_DAYS ? "Let the year end" : "Sleep";
    this.ui.nightSheet.hidden = false;
  }

  renderEnd() {
    const summary = accounting(this.chronicle);
    const avg = Math.round(worldAverage(this.world));

    this.ui.endTitle.textContent = "The year, accounted for";
    this.ui.endWorld.innerHTML = DOMAINS.map((domain) => {
      const value = Math.round(this.world.domains[domain.id]);
      const condition = conditionOf(this.world, domain.id);
      return `<div class="meter"><span class="meter-name">${domain.name}</span><div class="meter-track"><div class="meter-fill ${condition.key}" style="width:${value}%"></div></div><span class="meter-state">${condition.name}</span></div>`;
    }).join("");

    this.ui.endStats.innerHTML = `
      <p class="stat-row"><span>The valley</span><b>${avg}</b></p>
      <p class="stat-row"><span>Deepest stillness</span><b>${Math.floor(this.resources.peakStillness)}</b></p>
      <p class="stat-row"><span>Read of the world</span><b>${attuneLevel(this.resources.attunement).name}</b></p>
    `;
    this.ui.endLines.innerHTML = summary.lines.map((l) => `<p>${l}</p>`).join("");
    this.ui.endWorldVerdict.textContent = worldVerdict(this.world);
    this.ui.endVerdict.textContent = summary.verdict;
    this.ui.endSheet.hidden = false;
  }

  openChronicle() {
    const summary = accounting(this.chronicle);
    const recent = this.chronicle.entries.slice(-14).reverse();
    this.ui.chronicleLines.innerHTML = summary.lines.map((l) => `<p>${l}</p>`).join("");
    this.ui.chronicleLog.innerHTML = recent
      .map((entry) => {
        if (entry.kind === "collapse") return `<p class="log-row collapse">${entry.text}</p>`;
        if (entry.kind === "thread") {
          return `<p class="log-row"><b>${entry.threadTitle}</b> — ${entry.ending}${
            entry.changed ? (entry.better ? " <i>(you changed this)</i>" : " <i>(you changed this, for the worse)</i>") : " <i>(unchanged by you)</i>"
          }</p>`;
        }
        const verb = { pass: "let it pass", tend: "tended", act: "acted", watch: "watched" }[entry.choice];
        return `<p class="log-row dim">${entry.threadTitle} — you ${verb}.</p>`;
      })
      .join("");
    this.ui.chronicleSheet.hidden = false;
  }

  closeChronicle() {
    this.ui.chronicleSheet.hidden = true;
  }

  syncHud() {
    if (!this.ui.stillness) return;
    const depth = depthFor(this.resources.stillness);
    const next = nextDepth(this.resources.stillness);
    const streak = this.elapsed - this.lastActionAt;
    const season = seasonFor(this.world.day);

    this.ui.stillness.textContent = String(Math.floor(this.resources.stillness));
    this.ui.multiplier.textContent = `×${streakMultiplier(streak).toFixed(1)}`;
    this.ui.depthName.textContent = depth.name;
    this.ui.depthTrack.style.width = next
      ? `${clamp(((this.resources.stillness - depth.at) / (next.at - depth.at)) * 100, 0, 100)}%`
      : "100%";

    this.ui.vitality.style.width = `${clamp((this.resources.vitality / this.resources.vitalityMax) * 100, 0, 100)}%`;
    this.ui.vitalityText.textContent = `${Math.round(this.resources.vitality)}`;
    this.ui.dayLabel.textContent = `Day ${this.world.day} / ${TOTAL_DAYS}`;
    this.ui.seasonLabel.textContent = season.name;
    this.ui.attuneLabel.textContent = attuneLevel(this.resources.attunement).name;
    this.ui.tally.textContent = `${this.chronicle.passed} passed · ${this.chronicle.tended} tended · ${this.chronicle.acted} acted`;
  }

  pushEcho(text, color) {
    this.echoes.unshift({ text, color, life: ECHO_LIFE });
    this.echoes = this.echoes.slice(0, 2);
  }

  updateEchoes(dt) {
    for (const echo of this.echoes) echo.life -= dt;
    this.echoes = this.echoes.filter((e) => e.life > 0);
  }

  // ----------------------------------------------------------------- cards

  layoutCards(dt) {
    const ctx = this.ctx;
    const sceneRect = this.scene.rect;
    const cardW = Math.min(this.width - 26, 440);
    const gap = 10;
    let stackY = sceneRect.y + sceneRect.h + 64;

    for (const card of this.cards) {
      const lines = wrapText(ctx, card.beat.text, cardW - 34, "16px 'Cormorant Garamond', Georgia, serif");
      card.lines = lines;
      card.w = cardW;
      card.h = 30 + lines.length * 22 + (card.revealed ? 22 : 0) + 52;

      if (card.phase === "resolving") {
        card.exit = Math.min(1, card.exit + dt * 1.3);
        stackY += card.h + gap;
        continue;
      }

      const targetX = (this.width - cardW) / 2;
      const targetY = stackY;
      stackY += card.h + gap;

      if (card.phase === "incoming") {
        card.x = damp(card.x, targetX, 5.5, dt);
        card.y = card.y === 0 ? targetY : damp(card.y, targetY, 9, dt);
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

  // ------------------------------------------------------------------ draw

  draw() {
    const { ctx, width, height } = this;
    ctx.clearRect(0, 0, width, height);

    const dayProgress = this.state === STATES.DAY ? 1 - this.dayTimer / DAY_LENGTH : 0.94;
    const activeDomains = this.cards
      .filter((c) => c.phase !== "resolving")
      .map((c) => c.run.thread.domain);

    this.scene.draw(ctx, { world: this.world, dayProgress, time: this.time, activeDomains });

    const belowY = this.scene.rect.y + this.scene.rect.h;
    const grad = ctx.createLinearGradient(0, belowY, 0, height);
    grad.addColorStop(0, "#080c14");
    grad.addColorStop(1, "#04060a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, belowY, width, height - belowY);

    this.drawEchoes(ctx, belowY);
    this.drawTethers(ctx);
    this.drawCards(ctx);

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255, 246, 220, ${this.flash * 0.2})`;
      ctx.fillRect(0, 0, width, height);
    }
  }

  drawEchoes(ctx, belowY) {
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    let y = belowY + 12;

    this.echoes.forEach((echo, index) => {
      const fade = clamp(echo.life / 1.6, 0, 1) * clamp((ECHO_LIFE - echo.life) / 0.3, 0, 1);
      const alpha = fade * (index === 0 ? 1 : 0.4);
      const font = index === 0
        ? "italic 15px 'Cormorant Garamond', Georgia, serif"
        : "italic 13px 'Cormorant Garamond', Georgia, serif";
      const lines = wrapText(ctx, echo.text, Math.min(this.width - 44, 430), font);
      ctx.font = font;
      ctx.fillStyle = withAlpha(echo.color, alpha);
      for (const line of lines.slice(0, 3)) {
        ctx.fillText(line, this.width / 2, y);
        y += index === 0 ? 20 : 17;
      }
      y += 4;
    });
  }

  drawTethers(ctx) {
    const counts = {};
    for (const card of this.cards) {
      if (card.phase === "resolving") continue;
      const domain = card.run.thread.domain;
      const index = (counts[domain] = (counts[domain] || 0) + 1) - 1;
      const mote = this.scene.motePosition(domain, index);
      const top = { x: card.x + card.w / 2, y: card.y };

      ctx.strokeStyle = "rgba(255, 232, 176, 0.16)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 6]);
      ctx.beginPath();
      ctx.moveTo(mote.x, mote.y);
      ctx.bezierCurveTo(mote.x, mote.y + 40, top.x, top.y - 40, top.x, top.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  drawCards(ctx) {
    for (const card of this.cards) {
      const thread = card.run.thread;
      const exiting = card.phase === "resolving";
      const t = card.exit;

      let alpha = exiting ? 1 - t : card.phase === "incoming" ? 0.6 : 1;
      let offsetY = 0;
      let offsetX = 0;
      let scale = 1;

      if (exiting) {
        if (card.exitKind === "pass") {
          offsetY = -t * 58;
          scale = 1 - t * 0.05;
        } else {
          offsetX = Math.sin(t * 30) * (1 - t) * 6;
          scale = 1 - t * 0.12;
        }
      }

      const jitter = thread.loud && !exiting ? Math.sin(this.time * 7 + card.jitter) * 1 : 0;
      const x = card.x + offsetX + jitter;
      const y = card.y + offsetY;
      const accent = thread.loud ? "#d9906f" : "#7fb6bc";

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x + card.w / 2, y + card.h / 2);
      ctx.scale(scale, scale);
      ctx.translate(-card.w / 2, -card.h / 2);

      roundRect(ctx, 0, 0, card.w, card.h, 13);
      ctx.fillStyle = thread.loud ? "rgba(36, 24, 24, 0.9)" : "rgba(16, 26, 34, 0.9)";
      ctx.fill();
      ctx.strokeStyle = withAlpha(accent, thread.loud ? 0.65 : 0.4);
      ctx.lineWidth = thread.loud ? 1.7 : 1.1;
      ctx.stroke();

      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.font = "600 10px Inter, system-ui, sans-serif";
      ctx.fillStyle = withAlpha(accent, 0.8);
      ctx.fillText(`${thread.title.toUpperCase()}  ·  ${thread.domain.toUpperCase()}`, 17, 12);

      ctx.font = "16px 'Cormorant Garamond', Georgia, serif";
      ctx.fillStyle = "rgba(234, 242, 248, 0.95)";
      card.lines.forEach((line, i) => ctx.fillText(line, 17, 30 + i * 22));

      let cursor = 30 + card.lines.length * 22;
      if (card.revealed) {
        ctx.font = "italic 13px 'Cormorant Garamond', Georgia, serif";
        ctx.fillStyle = "rgba(169, 220, 196, 0.9)";
        ctx.fillText(REVEALS[card.beat.need], 17, cursor + 2);
        cursor += 22;
      }

      // The three things you can do, and the one you can decline to do.
      const buttonY = cursor + 8;
      const hits = [];
      let bx = 17;

      if (!card.revealed) {
        bx = this.drawPill(ctx, { x: bx, y: buttonY, label: "WATCH", accent: "#9fb8d8", card, hits, action: "watch", cost: costOf("watch").vitality });
      }
      bx = this.drawPill(ctx, { x: bx, y: buttonY, label: card.beat.tend.label.toUpperCase(), accent: "#8fc9a8", card, hits, action: "tend", cost: costOf("tend", this.resources.fatigue).vitality });
      bx = this.drawPill(ctx, { x: bx, y: buttonY, label: card.beat.act.label.toUpperCase(), accent: "#d9a06f", card, hits, action: "act", cost: costOf("act", this.resources.fatigue).vitality });

      ctx.font = "11px Inter, system-ui, sans-serif";
      ctx.fillStyle = "rgba(190, 208, 220, 0.42)";
      ctx.textAlign = "right";
      ctx.fillText("let it pass", card.w - 17, buttonY + 9);
      hits.push({ action: "pass", x: card.w - 90, y: buttonY - 4, w: 80, h: 30 });

      // Everything above was laid out card-local; lift it into screen space.
      card.hits = hits.map((hit) => ({ ...hit, x: hit.x + x, y: hit.y + y }));

      const pct = clamp(card.remaining / card.beat.window, 0, 1);
      ctx.fillStyle = "rgba(255,255,255,0.07)";
      ctx.fillRect(17, card.h - 8, card.w - 34, 2);
      ctx.fillStyle = withAlpha(accent, 0.6);
      ctx.fillRect(17, card.h - 8, (card.w - 34) * pct, 2);

      ctx.restore();
    }
  }

  drawPill(ctx, { x, y, label, accent, hits, action, cost }) {
    ctx.font = "600 11px Inter, system-ui, sans-serif";
    const text = cost > 0 ? `${label}  ${cost}` : label;
    const w = Math.min(150, ctx.measureText(text).width + 22);
    const affordable = canAfford(this.resources, action, this.resources.fatigue);

    roundRect(ctx, x, y, w, 26, 13);
    ctx.fillStyle = withAlpha(accent, affordable ? 0.16 : 0.05);
    ctx.fill();
    ctx.strokeStyle = withAlpha(accent, affordable ? 0.6 : 0.18);
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = withAlpha(accent, affordable ? 0.95 : 0.3);
    ctx.fillText(text, x + w / 2, y + 8);
    ctx.textAlign = "left";

    hits.push({ action, x, y, w, h: 26 });
    return x + w + 7;
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

function withAlpha(hex, alpha) {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = Number.parseInt(full, 16);
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${clamp(alpha, 0, 1)})`;
}
