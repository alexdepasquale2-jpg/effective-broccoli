import { AudioBus } from "./audio.js";
import {
  NEURONS,
  NODES,
  clanLine,
  createClan,
  evolutionLeap,
  hasNeuron,
  interact,
  investigate,
  leapReady,
  reinforce,
  rest,
  speciesFor,
  tickNeeds,
} from "./ancestors.js";
import { applyLeapToMeta, emptyMeta, nextMilestone, titleForLeaps } from "./meta.js";
import { loadMeta, saveMeta } from "./storage.js";
import { Wilds, hudLine } from "./wilds.js";

const STATES = {
  menu: "menu",
  playing: "playing",
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
    this.meta = loadMeta(emptyMeta);
    this.clan = this.meta.clan || createClan();
    this.pointer = { active: false, sx: 0 };
    this.wilds = new Wilds(this);
    this.running = false;
    this.boundFrame = (time) => this.frame(time);
    this.flash = 0;

    this.resize();
    this.bindInput();
    this.bindUi();
    this.syncHud();
    this.renderMeta();
    this.draw();
  }

  startLoop() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.boundFrame);
  }

  hasNeuron(id) {
    return hasNeuron(this.clan, id);
  }

  uiTarget(event) {
    return event.target?.closest?.(
      "#play, #overlay, #clan-hud, #action-bar, #neurons, #interact, .neuron-card, .act-btn",
    );
  }

  bindInput() {
    const toLocal = (event) => {
      const rect = this.canvas.getBoundingClientRect();
      this.pointer.sx = Math.max(0, Math.min(this.width, event.clientX - rect.left));
    };

    const onDown = (event) => {
      this.audio.unlock();
      if (this.uiTarget(event)) return;
      this.pointer.active = true;
      toLocal(event);
    };

    const onUp = (event) => {
      if (this.pointer.active && this.state === STATES.playing && !this.uiTarget(event)) {
        this.wilds.tap(this.pointer.sx);
      }
      this.pointer.active = false;
    };

    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener(
      "touchmove",
      (event) => {
        if (event.target.closest("button, #neurons, #interact, .overlay")) return;
        event.preventDefault();
      },
      { passive: false },
    );
    window.addEventListener("resize", () => this.resize());
    window.visualViewport?.addEventListener("resize", () => this.resize());
  }

  bindUi() {
    this.ui.play?.addEventListener("click", () => this.play());
    this.ui.senseBtn?.addEventListener("click", () => this.toggleSenses());
    this.ui.restBtn?.addEventListener("click", () => this.doRest());
    this.ui.neuronBtn?.addEventListener("click", () => this.openNeurons());
    this.ui.leapBtn?.addEventListener("click", () => this.tryLeap());
    this.ui.neuronClose?.addEventListener("click", () => this.closeNeurons());
    this.ui.interactClose?.addEventListener("click", () => this.closeInteract());
    this.ui.interactInvestigate?.addEventListener("click", () => this.investigateCurrent());
    this.ui.interactUse?.addEventListener("click", () => this.useCurrent());
  }

  play() {
    this.audio.unlock();
    this.audio.start();
    this.state = STATES.playing;
    this.ui.overlay.hidden = true;
    this.ui.clanHud.hidden = false;
    this.ui.actionBar.hidden = false;
    this.wilds.say("Investigate fear. Eat. Drink. Reinforce neurons at camp.");
    this.syncHud();
  }

  save() {
    this.meta.clan = this.clan;
    saveMeta(this.meta);
  }

  useNode(node) {
    const atCamp = node.type === "camp";
    const nearBond = node.type === "bond";
    if (atCamp || nearBond) {
      this.openInteract(node);
      return;
    }
    if (!this.clan.known.includes(node.id)) {
      const result = investigate(this.clan, node);
      this.applyResult(result);
      return;
    }
    this.openInteract(node);
  }

  openInteract(node) {
    if (!this.ui.interact) return;
    this.currentNode = node;
    this.ui.interact.hidden = false;
    this.ui.interactTitle.textContent = node.name;
    const known = this.clan.known.includes(node.id);
    const fear = node.fear || 0;
    this.ui.interactFlavor.textContent = known
      ? `Mapped. Fear ${Math.round(fear * 0.35)}.`
      : `Unknown. Fear ${fear}. Investigate to conquer it.`;
    this.ui.interactInvestigate.hidden = known;
    this.ui.interactUse.textContent = this.actionLabel(node);
  }

  closeInteract() {
    this.currentNode = null;
    if (this.ui.interact) this.ui.interact.hidden = true;
  }

  actionLabel(node) {
    if (node.type === "camp") return "Rest clan";
    if (node.type === "bond") return "Groom clanmate";
    if (node.type === "food") return "Eat";
    if (node.type === "water") return "Drink";
    if (node.type === "alter") return "Crack rock";
    if (node.type === "danger") return "Stalk grass";
    return "Interact";
  }

  investigateCurrent() {
    if (!this.currentNode) return;
    const result = investigate(this.clan, this.currentNode);
    this.applyResult(result);
    this.openInteract(this.currentNode);
  }

  useCurrent() {
    if (!this.currentNode) return;
    if (this.currentNode.type === "camp") {
      this.doRest();
      this.closeInteract();
      return;
    }
    const result = interact(this.clan, this.currentNode);
    this.applyResult(result);
    if (result.ok) this.closeInteract();
  }

  applyResult(result) {
    if (!result.ok) {
      this.wilds.say(result.reason);
      return;
    }
    this.clan = result.clan;
    this.flash = 0.25;
    if (result.text) this.wilds.say(result.text);
    if (result.fearHit > 30) this.audio.hit();
    else this.audio.collect(2);
    this.save();
    this.syncHud();
    this.renderNeurons();
  }

  toggleSenses() {
    if (!this.hasNeuron("olfactory") && !this.hasNeuron("predator")) {
      this.wilds.say("Reinforce senses first.");
      return;
    }
    this.wilds.senseMode = !this.wilds.senseMode;
    this.ui.senseBtn.classList.toggle("active", this.wilds.senseMode);
    this.wilds.say(this.wilds.senseMode ? "Intelligence highlights the wilds." : "Senses dim.");
  }

  doRest() {
    const result = rest(this.clan);
    this.applyResult(result);
    this.audio.draft();
  }

  openNeurons() {
    if (!this.ui.neurons) return;
    this.ui.neurons.hidden = false;
    this.renderNeurons();
  }

  closeNeurons() {
    if (this.ui.neurons) this.ui.neurons.hidden = true;
  }

  renderNeurons() {
    if (!this.ui.neuronRow) return;
    this.ui.neuronRow.innerHTML = "";
    for (const neuron of NEURONS) {
      const owned = this.hasNeuron(neuron.id);
      const discovered = this.clan.discovered.includes(neuron.id);
      const progress = this.clan.progress[neuron.id] || 0;
      const button = document.createElement("button");
      button.type = "button";
      button.className = `neuron-card${owned ? " owned" : ""}${discovered ? " ready" : ""}`;
      const status = owned ? "REINFORCED" : discovered ? `READY · costs ${neuron.cost} NE` : `${progress}/${neuron.need}`;
      button.innerHTML = `<span class="tag">${neuron.cat}</span><strong>${neuron.name}</strong><span>${neuron.text}</span><em>${status}</em>`;
      button.disabled = !discovered || owned || this.clan.neuronalEnergy < neuron.cost;
      button.addEventListener("click", () => {
        const result = reinforce(this.clan, neuron.id);
        if (!result.ok) {
          this.wilds.say(result.reason);
          return;
        }
        this.clan = result.clan;
        this.audio.boon();
        this.wilds.say(result.text);
        this.save();
        this.syncHud();
        this.renderNeurons();
      });
      this.ui.neuronRow.appendChild(button);
    }
  }

  tryLeap() {
    const result = evolutionLeap(this.clan);
    if (!result.ok) {
      this.wilds.say(result.reason);
      return;
    }
    this.clan = result.clan;
    const reward = applyLeapToMeta(this.meta, this.clan);
    this.save();
    this.audio.jackpot();
    this.wilds.say(result.text);
    this.ui.result.hidden = false;
    this.ui.result.textContent = `${result.text}\n+${reward.gained} lineage XP`;
    this.renderMeta();
    this.syncHud();
  }

  renderMeta() {
    if (!this.ui.rank) return;
    this.ui.rank.textContent = titleForLeaps(this.meta.leaps || 0);
    const next = nextMilestone(this.meta);
    if (next) {
      this.ui.nextUnlock.textContent = `NEXT ${next.name} · ${next.need} leaps`;
      this.ui.xpBar.style.width = `${Math.round((1 - next.need / Math.max(next.leaps, 1)) * 100)}%`;
    } else {
      this.ui.nextUnlock.textContent = "Your lineage owns the savanna.";
      this.ui.xpBar.style.width = "100%";
    }
  }

  syncHud() {
    if (!this.ui.energy) return;
    this.ui.energy.textContent = `${Math.round(this.clan.energy)}`;
    this.ui.thirst.textContent = `${Math.round(this.clan.thirst)}`;
    this.ui.fear.textContent = `${Math.round(this.clan.fear)}`;
    this.ui.bond.textContent = `${Math.round(this.clan.bonding)}`;
    this.ui.ne.textContent = `${this.clan.neuronalEnergy}`;
    this.ui.clanLine.textContent = clanLine(this.clan);
    this.ui.hudLine.textContent = hudLine(this.clan);
    const sp = speciesFor(this.clan);
    this.ui.species.textContent = sp.name;
    if (this.ui.leapBtn) {
      this.ui.leapBtn.disabled = !leapReady(this.clan);
      this.ui.leapBtn.classList.toggle("ready", leapReady(this.clan));
    }
    if (this.ui.discovered) {
      this.ui.discovered.textContent = `${this.clan.reinforced.length} neurons · ${this.clan.known.length}/${NODES.length} mapped`;
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
  }

  frame(time) {
    const dt = Math.min(0.05, (time - this.lastTime) / 1000);
    this.lastTime = time;
    this.update(dt);
    this.draw();
    requestAnimationFrame(this.boundFrame);
  }

  update(dt) {
    if (this.state !== STATES.playing) return;
    this.wilds.update(dt);
    this.clan = tickNeeds(this.clan, dt);
    if (this.clan.energy <= 0 || this.clan.thirst <= 0) {
      this.clan.energy = Math.max(20, this.clan.energy);
      this.clan.thirst = Math.max(20, this.clan.thirst);
      this.clan.fear = Math.min(this.clan.fearMax, this.clan.fear + 20);
      this.wilds.say("You collapse. Crawl back to camp.");
      this.wilds.targetX = 220;
    }
    this.flash = Math.max(0, this.flash - dt * 2.5);
    this.syncHud();
  }

  draw() {
    const { ctx, width, height } = this;
    ctx.clearRect(0, 0, width, height);
    if (this.state === STATES.playing) this.wilds.draw(ctx);
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255, 230, 160, ${this.flash * 0.25})`;
      ctx.fillRect(0, 0, width, height);
    }
  }
}
