import {
  ANTI_MOVES,
  BLOCKS,
  DEFAULT_VERBS,
  METHOD_SECTIONS,
  answerStep,
  completeSession,
  createSession,
  deleteSession,
  downloadText,
  drawConstraint,
  drawForcedHand,
  filledStepCount,
  formatForcedHand,
  getProtocol,
  goToStep,
  loadStore,
  saveStore,
  sessionTitle,
  sessionToMarkdown,
  slugify,
  startProtocol,
  upsertSession,
} from "../engine";
import type { AppStore, BlockId, GameContext, Session } from "../types";
import { escapeHtml, formatClock, nl2br, parseVerbs, renderRichText } from "./format";

type Route =
  | { name: "home" }
  | { name: "method" }
  | { name: "context" }
  | { name: "diagnose" }
  | { name: "play" }
  | { name: "card" }
  | { name: "tools" };

const ROUTE_HREF: Record<Route["name"], string> = {
  home: "#/",
  method: "#/method",
  context: "#/context",
  diagnose: "#/diagnose",
  play: "#/play",
  card: "#/card",
  tools: "#/tools",
};

function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, "") || "/";
  if (path.startsWith("/method")) return { name: "method" };
  if (path.startsWith("/context")) return { name: "context" };
  if (path.startsWith("/diagnose")) return { name: "diagnose" };
  if (path.startsWith("/play")) return { name: "play" };
  if (path.startsWith("/card")) return { name: "card" };
  if (path.startsWith("/tools")) return { name: "tools" };
  return { name: "home" };
}

export class App {
  private root: HTMLElement;
  private store: AppStore;
  private route: Route = { name: "home" };
  private remaining = 0;
  private paused = true;
  private ticker: number | null = null;
  private lastTick = 0;
  private draftBuffer = "";

  constructor(root: HTMLElement) {
    this.root = root;
    this.store = loadStore();
  }

  start(): void {
    this.route = parseRoute(window.location.hash);
    window.addEventListener("hashchange", () => {
      this.flushDraft();
      this.route = parseRoute(window.location.hash);
      this.paused = true;
      this.render();
      window.scrollTo(0, 0);
    });
    this.root.addEventListener("click", (event) => this.onClick(event));
    this.root.addEventListener("input", (event) => this.onInput(event));
    this.root.addEventListener("submit", (event) => this.onSubmit(event));
    this.root.addEventListener("change", (event) => this.onChange(event));
    this.render();
  }

  private persist(session?: Session): void {
    if (session) {
      this.store = upsertSession(this.store, session);
    }
    saveStore(this.store);
  }

  private active(): Session | undefined {
    return this.store.sessions.find((session) => session.id === this.store.activeId);
  }

  private requireSession(): Session {
    const existing = this.active();
    if (existing) {
      return existing;
    }
    const session = createSession();
    this.persist(session);
    return session;
  }

  private setRoute(name: Route["name"]): void {
    window.location.hash = ROUTE_HREF[name];
  }

  private flushDraft(): void {
    const session = this.active();
    if (!session?.protocolId) {
      return;
    }
    const protocol = getProtocol(session.protocolId);
    const step = protocol.steps[session.stepIndex];
    if (!step) {
      return;
    }
    const textarea = this.root.querySelector<HTMLTextAreaElement>("#step-answer");
    const value = textarea?.value ?? this.draftBuffer;
    if (value !== (session.answers[step.id] ?? "")) {
      this.persist(answerStep(session, step.id, value));
    }
  }

  private onClick(event: Event): void {
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-action]");
    if (!target) {
      return;
    }
    const action = target.dataset.action;
    if (!action) {
      return;
    }

    if (action === "new-session") {
      event.preventDefault();
      this.persist(createSession());
      this.setRoute("context");
      return;
    }
    if (action === "emergency") {
      event.preventDefault();
      const session = startProtocol(createSession(), "emergency", null);
      this.persist(session);
      this.beginStepTimer(session);
      this.setRoute("play");
      return;
    }
    if (action === "open-session") {
      event.preventDefault();
      this.store = { ...this.store, activeId: target.dataset.id ?? null };
      saveStore(this.store);
      const session = this.active();
      this.setRoute(session?.protocolId ? (session.completedAt ? "card" : "play") : "context");
      return;
    }
    if (action === "delete-session") {
      event.preventDefault();
      const id = target.dataset.id;
      if (id) {
        this.store = deleteSession(this.store, id);
        saveStore(this.store);
        this.render();
      }
      return;
    }
    if (action === "choose-block") {
      event.preventDefault();
      const blockId = target.dataset.block as BlockId;
      const block = BLOCKS.find((item) => item.id === blockId);
      if (!block) {
        return;
      }
      const session = startProtocol(this.requireSession(), block.protocolId, block.id);
      this.persist(session);
      this.beginStepTimer(session);
      this.setRoute("play");
      return;
    }
    if (action === "toggle-verb") {
      event.preventDefault();
      const verb = target.dataset.verb ?? "";
      const session = this.requireSession();
      const verbs = session.context.verbs.includes(verb)
        ? session.context.verbs.filter((item) => item !== verb)
        : [...session.context.verbs, verb];
      this.persist({
        ...session,
        context: { ...session.context, verbs },
        updatedAt: new Date().toISOString(),
      });
      this.render();
      return;
    }
    if (action === "next-step") {
      event.preventDefault();
      this.moveStep(1);
      return;
    }
    if (action === "prev-step") {
      event.preventDefault();
      this.moveStep(-1);
      return;
    }
    if (action === "goto-step") {
      event.preventDefault();
      this.flushDraft();
      const session = this.active();
      if (!session) {
        return;
      }
      const index = Number(target.dataset.index ?? 0);
      const next = goToStep(session, index);
      this.persist(next);
      this.beginStepTimer(next);
      this.render();
      return;
    }
    if (action === "toggle-pause") {
      event.preventDefault();
      this.paused = !this.paused;
      if (!this.paused) {
        this.lastTick = performance.now();
        this.ensureTicker();
      }
      this.renderTimerOnly();
      return;
    }
    if (action === "draw-constraint") {
      event.preventDefault();
      const session = this.active();
      if (!session) {
        return;
      }
      const constraint = drawConstraint(`${session.id}:${session.constraints.length}:${Date.now()}`, session.constraints);
      this.persist({
        ...session,
        constraints: [...session.constraints, constraint],
        updatedAt: new Date().toISOString(),
      });
      this.render();
      return;
    }
    if (action === "finish-card") {
      event.preventDefault();
      this.flushDraft();
      const session = this.active();
      if (!session) {
        return;
      }
      this.persist(completeSession(session));
      this.setRoute("card");
      return;
    }
    if (action === "copy-markdown") {
      event.preventDefault();
      const session = this.active();
      if (!session) {
        return;
      }
      const markdown = sessionToMarkdown(session);
      void navigator.clipboard.writeText(markdown);
      target.textContent = "Copied";
      window.setTimeout(() => {
        target.textContent = "Copy markdown";
      }, 1200);
      return;
    }
    if (action === "download-markdown") {
      event.preventDefault();
      const session = this.active();
      if (!session) {
        return;
      }
      downloadText(`${slugify(sessionTitle(session))}.md`, sessionToMarkdown(session));
      return;
    }
    if (action === "deal-hand") {
      event.preventDefault();
      const session = this.requireSession();
      const hand = drawForcedHand({
        seed: `${session.id}:reroll:${Date.now()}`,
        preferredVerbs: session.context.verbs,
      });
      this.persist({ ...session, forcedHand: hand, updatedAt: new Date().toISOString() });
      this.render();
      return;
    }
  }

  private onInput(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.id === "step-answer" && target instanceof HTMLTextAreaElement) {
      this.draftBuffer = target.value;
    }
  }

  private onChange(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.id === "custom-verb" && target instanceof HTMLInputElement && target.value.trim()) {
      const session = this.requireSession();
      const verb = target.value.trim().toLowerCase();
      if (!session.context.verbs.includes(verb)) {
        this.persist({
          ...session,
          context: { ...session.context, verbs: [...session.context.verbs, verb] },
          updatedAt: new Date().toISOString(),
        });
      }
      this.render();
    }
  }

  private onSubmit(event: Event): void {
    const form = event.target as HTMLFormElement;
    if (form.dataset.form !== "context") {
      return;
    }
    event.preventDefault();
    const data = new FormData(form);
    const session = this.requireSession();
    const extraVerbs = parseVerbs(String(data.get("extraVerbs") ?? ""));
    const context: GameContext = {
      title: String(data.get("title") ?? "").trim(),
      fantasy: String(data.get("fantasy") ?? "").trim(),
      verbs: [...new Set([...session.context.verbs, ...extraVerbs])],
      alreadyTrue: String(data.get("alreadyTrue") ?? "").trim(),
      stuckSentence: String(data.get("stuckSentence") ?? "").trim(),
    };
    this.persist({ ...session, context, updatedAt: new Date().toISOString() });
    this.setRoute("diagnose");
  }

  private moveStep(delta: number): void {
    this.flushDraft();
    const session = this.active();
    if (!session?.protocolId) {
      return;
    }
    const protocol = getProtocol(session.protocolId);
    const nextIndex = session.stepIndex + delta;
    if (nextIndex >= protocol.steps.length) {
      this.persist(completeSession(session));
      this.setRoute("card");
      return;
    }
    const next = goToStep(session, nextIndex);
    this.persist(next);
    this.beginStepTimer(next);
    this.render();
  }

  private beginStepTimer(session: Session): void {
    if (!session.protocolId) {
      return;
    }
    const step = getProtocol(session.protocolId).steps[session.stepIndex];
    this.remaining = step?.seconds ?? 0;
    this.paused = false;
    this.lastTick = performance.now();
    this.draftBuffer = session.answers[step?.id ?? ""] ?? "";
    this.ensureTicker();
  }

  private ensureTicker(): void {
    if (this.ticker !== null) {
      return;
    }
    const tick = (now: number) => {
      if (!this.paused && this.route.name === "play") {
        const elapsed = (now - this.lastTick) / 1000;
        this.lastTick = now;
        const previous = this.remaining;
        this.remaining = Math.max(0, this.remaining - elapsed);
        if (Math.floor(previous) !== Math.floor(this.remaining) || this.remaining === 0) {
          this.renderTimerOnly();
        }
      } else {
        this.lastTick = now;
      }
      this.ticker = window.requestAnimationFrame(tick);
    };
    this.ticker = window.requestAnimationFrame(tick);
  }

  private renderTimerOnly(): void {
    const timer = this.root.querySelector("[data-timer]");
    if (timer) {
      timer.textContent = formatClock(this.remaining);
      timer.classList.toggle("expired", this.remaining <= 0);
    }
    const pause = this.root.querySelector("[data-action='toggle-pause']");
    if (pause) {
      pause.textContent = this.paused ? "Resume" : "Pause";
    }
    const hint = this.root.querySelector("[data-expired-hint]");
    if (hint) {
      hint.toggleAttribute("hidden", this.remaining > 0);
    }
  }

  private render(): void {
    const session = this.active();
    this.root.innerHTML = `${this.renderChrome(this.renderView(session))}`;
    if (this.route.name === "play") {
      const area = this.root.querySelector<HTMLTextAreaElement>("#step-answer");
      area?.focus();
    }
  }

  private renderChrome(inner: string): string {
    const route = this.route.name;
    const link = (name: Route["name"], label: string) =>
      `<a href="${ROUTE_HREF[name]}" ${route === name ? 'aria-current="page"' : ""}>${label}</a>`;
    return `
      <div class="app-shell">
        <header class="topbar">
          <a class="brand" href="#/">
            <span class="brand-mark">Game writer's desk</span>
            <span class="brand-name">Next Beat</span>
          </a>
          <nav class="nav" aria-label="Primary">
            ${link("home", "Desk")}
            ${link("method", "Method")}
            ${link("diagnose", "Diagnose")}
            ${link("play", "Protocol")}
            ${link("tools", "Forced Hand")}
            ${link("card", "Card")}
          </nav>
        </header>
        <main class="page">${inner}</main>
        <footer class="footer">
          <span>One playable scene is a complete session.</span>
          <span>Do not add a continent.</span>
        </footer>
      </div>
    `;
  }

  private renderView(session: Session | undefined): string {
    switch (this.route.name) {
      case "home":
        return this.renderHome(session);
      case "method":
        return this.renderMethod();
      case "context":
        return this.renderContext(session ?? this.requireSession());
      case "diagnose":
        return this.renderDiagnose(session);
      case "play":
        return this.renderPlay(session);
      case "card":
        return this.renderCard(session);
      case "tools":
        return this.renderTools(session);
      default:
        return this.renderHome(session);
    }
  }

  private renderHome(session: Session | undefined): string {
    const sessions = this.store.sessions;
    return `
      <section class="hero">
        <div>
          <p class="kicker">A 12-minute protocol</p>
          <h1>Unlock the <em>next playable scene</em>.</h1>
          <p class="lede">
            Writer's block in games is rarely a lack of ideas. It is an unbounded possibility space,
            or a story that has not yet been forced to survive contact with a verb. This desk
            diagnoses the stall, locks one constraint, and walks you out with a beat card.
          </p>
          <dl class="principles">
            <div class="principle"><dt>Play first</dt><dd>If you cannot name a verb under pressure, you do not have a scene.</dd></div>
            <div class="principle"><dt>Lock one</dt><dd>A room, a debt, a liar, a timer. Constraint is the fuel.</dd></div>
            <div class="principle"><dt>Ugly draft</dt><dd>Eight bad lines, then extract a system. Do not polish here.</dd></div>
            <div class="principle"><dt>One beat</dt><dd>You do not owe the campaign. You owe the next playable unit.</dd></div>
          </dl>
          <div class="cta-row">
            <button class="btn-shot" data-action="new-session">Start a session</button>
            <button class="btn-ghost" data-action="emergency">Emergency 4 minutes</button>
            <a class="btn-ghost" href="#/method">Read the method</a>
          </div>
        </div>
        <aside class="desk-card">
          <p class="tiny">On the desk</p>
          <h2>Sessions</h2>
          ${
            sessions.length === 0
              ? `<p class="ink-muted">No cards yet. Start with context, or skip straight to a Forced Hand if the blank page is loud.</p>`
              : `<div class="session-list">${sessions
                  .map((item) => {
                    const protocol = item.protocolId ? getProtocol(item.protocolId).name : "Intake";
                    const count = item.protocolId ? `${filledStepCount(item)}/${getProtocol(item.protocolId).steps.length}` : "—";
                    return `<div class="session-row">
                      <button class="linkish" data-action="open-session" data-id="${escapeHtml(item.id)}" style="background:none;border:0;padding:0;text-align:left;color:inherit">
                        <strong>${escapeHtml(sessionTitle(item))}</strong>
                        <span class="tiny">${escapeHtml(protocol)} · ${escapeHtml(count)}</span>
                      </button>
                      <button class="tiny" data-action="delete-session" data-id="${escapeHtml(item.id)}" style="background:none;border:0">Delete</button>
                    </div>`;
                  })
                  .join("")}</div>`
          }
          ${
            session?.forcedHand
              ? `<p class="tiny" style="margin-top:1rem">Last Forced Hand</p><p>${escapeHtml(session.forcedHand.location)}</p>`
              : ""
          }
        </aside>
      </section>
    `;
  }

  private renderMethod(): string {
    return METHOD_SECTIONS.map(
      (section) => `
        <article class="method-block">
          <p class="tiny">${escapeHtml(section.id)}</p>
          <h2>${escapeHtml(section.title)}</h2>
          <p>${renderRichText(section.body)}</p>
        </article>
      `,
    ).join("");
  }

  private renderContext(session: Session): string {
    const ctx = session.context;
    return `
      <p class="kicker">Step 0 · optional, 90 seconds</p>
      <h1>What is already true?</h1>
      <p class="lede">Skip any field. Specifics help the Forced Hand aim. Do not worldbuild here.</p>
      <form class="desk-card form-grid" data-form="context">
        <label>
          <span>Working title</span>
          <input type="text" name="title" value="${escapeHtml(ctx.title)}" placeholder="Ash Harbor, or unnamed jam" />
        </label>
        <label>
          <span>Fantasy of play (sensation, not plot)</span>
          <input type="text" name="fantasy" value="${escapeHtml(ctx.fantasy)}" placeholder="I am a thief whose next idea is always worse" />
        </label>
        <div>
          <p class="field-label">Player verbs you actually have</p>
          <div class="chips">
            ${DEFAULT_VERBS.map((verb) => {
              const on = ctx.verbs.includes(verb);
              return `<button type="button" class="chip" data-action="toggle-verb" data-verb="${escapeHtml(verb)}" aria-pressed="${on}">${escapeHtml(verb)}</button>`;
            }).join("")}
          </div>
          <label style="margin-top:0.7rem;display:block">
            <span>Extra verbs</span>
            <input type="text" name="extraVerbs" id="custom-verb" placeholder="dock, ladle, stamp" />
          </label>
        </div>
        <label>
          <span>Already true (two sentences max)</span>
          <textarea name="alreadyTrue" placeholder="The city floods on purpose. You still owe the night cook.">${escapeHtml(ctx.alreadyTrue)}</textarea>
        </label>
        <label>
          <span>Where you are stuck (one sentence)</span>
          <textarea name="stuckSentence" placeholder="I keep writing continents instead of a first room.">${escapeHtml(ctx.stuckSentence)}</textarea>
        </label>
        <div class="cta-row">
          <button class="btn-ink" type="submit">Diagnose the block</button>
          <a class="btn" href="#/diagnose">Skip to diagnosis</a>
        </div>
      </form>
    `;
  }

  private renderDiagnose(session: Session | undefined): string {
    return `
      <p class="kicker">What does the stall feel like?</p>
      <h1>Diagnose, then write.</h1>
      <p class="lede">Different blocks need different desks. Pick the sentence that sounds like you. If you only have four minutes, deal an emergency hand instead.</p>
      <div class="cta-row">
        <button class="btn-shot" data-action="emergency">Emergency 4 minutes</button>
        ${session ? `<p class="muted" style="margin:0">Context: ${escapeHtml(sessionTitle(session))}</p>` : ""}
      </div>
      <div class="grid-blocks">
        ${BLOCKS.map(
          (block) => `
            <button class="block-card" data-action="choose-block" data-block="${block.id}">
              <p class="tiny">${escapeHtml(block.title)}</p>
              <p class="sounds">“${escapeHtml(block.soundsLike)}”</p>
              <p class="body">${escapeHtml(block.body)}</p>
            </button>
          `,
        ).join("")}
      </div>
    `;
  }

  private renderPlay(session: Session | undefined): string {
    if (!session?.protocolId) {
      return `
        <h1>No protocol yet.</h1>
        <p class="lede">Diagnose the block, or burn four minutes on a Forced Hand.</p>
        <div class="cta-row">
          <a class="btn-shot" href="#/diagnose">Diagnose</a>
          <button class="btn-ghost" data-action="emergency">Emergency 4 minutes</button>
        </div>
      `;
    }
    const protocol = getProtocol(session.protocolId);
    const step = protocol.steps[session.stepIndex];
    if (!step) {
      return `<h1>Protocol complete.</h1><a class="btn-shot" href="#/card">Open the beat card</a>`;
    }
    const filled = filledStepCount(session);
    const percent = Math.round((session.stepIndex / protocol.steps.length) * 100);
    const answer = session.answers[step.id] ?? this.draftBuffer;
    const lastConstraint = session.constraints[session.constraints.length - 1];
    return `
      <div class="protocol-layout">
        <aside class="rail">
          <p class="kicker">${escapeHtml(protocol.name)} · ${protocol.durationMin} min</p>
          <p class="muted">${escapeHtml(protocol.promise)}</p>
          <ol>
            ${protocol.steps
              .map((item, index) => {
                const done = (session.answers[item.id] ?? "").trim().length > 0;
                const active = index === session.stepIndex;
                return `<li><button data-action="goto-step" data-index="${index}" class="${active ? "active" : ""} ${done ? "done" : ""}">${index + 1}. ${escapeHtml(item.title)}</button></li>`;
              })
              .join("")}
          </ol>
        </aside>
        <section>
          ${
            session.forcedHand
              ? `<pre class="forced">${escapeHtml(formatForcedHand(session.forcedHand))}</pre>`
              : ""
          }
          <article class="step-paper paper">
            <div class="progress-bar" aria-hidden="true"><span style="width:${percent}%"></span></div>
            <div class="step-head">
              <div>
                <p class="tiny">Step ${session.stepIndex + 1} of ${protocol.steps.length} · ${filled} answered</p>
                <h2>${escapeHtml(step.title)}</h2>
              </div>
              <div>
                <div class="timer ${this.remaining <= 0 ? "expired" : ""}" data-timer>${formatClock(this.remaining)}</div>
                <button class="tiny" data-action="toggle-pause" style="background:none;border:0;width:100%;text-align:right">${this.paused ? "Resume" : "Pause"}</button>
              </div>
            </div>
            <p>${escapeHtml(step.prompt)}</p>
            <p class="why">${escapeHtml(step.why)}</p>
            <label>
              <span>Write here. Ugly is the assignment.</span>
              <textarea id="step-answer" data-step="${escapeHtml(step.id)}">${escapeHtml(answer)}</textarea>
            </label>
            <p class="hint" data-expired-hint ${this.remaining > 0 ? "hidden" : ""}>${escapeHtml(step.stuckHint)}</p>
            ${
              lastConstraint
                ? `<p class="hint"><strong>Constraint:</strong> ${escapeHtml(lastConstraint)}</p>`
                : ""
            }
            <div class="step-actions">
              <button class="btn" data-action="prev-step" ${session.stepIndex === 0 ? "disabled" : ""}>Back</button>
              <button class="btn-ink" data-action="next-step">${session.stepIndex === protocol.steps.length - 1 ? "Finish card" : "Next step"}</button>
              <button class="btn" data-action="draw-constraint">I'm stuck — draw a constraint</button>
              <button class="btn" data-action="deal-hand">Redeal Forced Hand</button>
              <button class="btn" data-action="finish-card">Skip to card</button>
            </div>
          </article>
        </section>
      </div>
    `;
  }

  private renderCard(session: Session | undefined): string {
    if (!session) {
      return `<h1>No card yet.</h1><a class="btn-shot" href="#/">Start at the desk</a>`;
    }
    const protocol = session.protocolId ? getProtocol(session.protocolId) : null;
    return `
      <p class="kicker">Production artifact</p>
      <div class="cta-row">
        <button class="btn-shot" data-action="copy-markdown">Copy markdown</button>
        <button class="btn-ghost" data-action="download-markdown">Download .md</button>
        <button class="btn-ghost" data-action="new-session">Another session</button>
      </div>
      <article class="beat-card paper">
        <p class="tiny">Beat card</p>
        <h1>${escapeHtml(sessionTitle(session))}</h1>
        <p class="meta">
          ${protocol ? escapeHtml(protocol.name) : "Intake only"}
          ${session.blockId ? ` · ${escapeHtml(BLOCKS.find((b) => b.id === session.blockId)?.title ?? "")}` : ""}
        </p>
        ${
          session.context.fantasy
            ? `<p><em>${escapeHtml(session.context.fantasy)}</em></p>`
            : ""
        }
        ${
          session.forcedHand
            ? `<pre class="forced" style="background:#221c16">${escapeHtml(formatForcedHand(session.forcedHand))}</pre>`
            : ""
        }
        ${
          protocol
            ? protocol.steps
                .map((step) => {
                  const answer = (session.answers[step.id] ?? "").trim();
                  return `<section class="answer-block">
                    <h3>${escapeHtml(step.title)}</h3>
                    <p>${answer ? nl2br(answer) : '<span class="empty">unanswered</span>'}</p>
                  </section>`;
                })
                .join("")
            : `<p class="ink-muted">This session never entered a protocol.</p>`
        }
      </article>
    `;
  }

  private renderTools(session: Session | undefined): string {
    const hand = session?.forcedHand;
    return `
      <p class="kicker">When diagnosis is too much</p>
      <h1>Forced Hand</h1>
      <p class="lede">A dealt scene: location, pressure, verb, complication, NPC, sensory. Reroll once if you must. Rename nouns. Do not add a second room.</p>
      <div class="tools-grid">
        <article class="desk-card">
          <h2>The hand</h2>
          ${
            hand
              ? `<pre class="forced" style="margin:0 0 1rem">${escapeHtml(formatForcedHand(hand))}</pre>`
              : `<p class="ink-muted">No hand dealt in this session yet.</p>`
          }
          <div class="cta-row">
            <button class="btn-ink" data-action="deal-hand">Deal / redeal</button>
            <button class="btn" data-action="emergency">Write it in 4 minutes</button>
          </div>
        </article>
        <article class="desk-card">
          <h2>Anti-moves</h2>
          <p class="ink-muted">Real jobs. Popular disguises of fear. Not this sitting.</p>
          <ul class="anti-list">
            ${ANTI_MOVES.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </article>
      </div>
    `;
  }
}
