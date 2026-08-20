import type { ConnectionStatus } from './net.ts';
import type { InventorySlot, ItemDef, SkillState } from '@glimmer/shared';

/**
 * The DOM layer sitting over the canvas: sign-in, pack, skills, and messages.
 * Kept as plain DOM rather than a framework -- it is a handful of nodes, and
 * one less dependency is one less thing to keep current.
 */
export class UI {
  private readonly root: HTMLElement;
  private readonly hud: HTMLElement;
  private readonly slotsEl: HTMLElement;
  private readonly skillsEl: HTMLElement;
  private readonly toastsEl: HTMLElement;
  private readonly statusEl: HTMLElement;
  private readonly locationEl: HTMLElement;

  private itemNames = new Map<string, string>();

  constructor(root: HTMLElement) {
    this.root = root;
    this.root.innerHTML = TEMPLATE;
    this.hud = must(root, '#hud');
    this.slotsEl = must(root, '#slots');
    this.skillsEl = must(root, '#skills');
    this.toastsEl = must(root, '#toasts');
    this.statusEl = must(root, '#status');
    this.locationEl = must(root, '#location-name');
  }

  get stage(): HTMLElement {
    return must(this.root, '#stage');
  }

  /** Resolves once the player is signed in, with nothing left on screen. */
  async signIn(): Promise<void> {
    const panel = must(this.root, '#auth');
    const form = must(this.root, '#auth-form') as HTMLFormElement;
    const error = must(this.root, '#auth-error');
    const username = must(this.root, '#username') as HTMLInputElement;
    const password = must(this.root, '#password') as HTMLInputElement;
    const submit = must(this.root, '#auth-submit') as HTMLButtonElement;
    const toggle = must(this.root, '#auth-toggle') as HTMLButtonElement;

    // Already signed in from a previous visit?
    if ((await fetch('/api/me')).ok) {
      panel.remove();
      this.hud.hidden = false;
      return;
    }

    let mode: 'login' | 'register' = 'register';
    const render = () => {
      submit.textContent = mode === 'register' ? 'Begin' : 'Return';
      toggle.textContent =
        mode === 'register' ? 'I already have a character' : 'I need a new character';
    };
    render();

    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      mode = mode === 'register' ? 'login' : 'register';
      error.textContent = '';
      render();
    });

    return new Promise<void>((resolve) => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        error.textContent = '';
        submit.disabled = true;
        try {
          const res = await fetch(`/api/${mode}`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ username: username.value, password: password.value }),
          });
          if (!res.ok) {
            const body = (await res.json().catch(() => null)) as { error?: string } | null;
            error.textContent = body?.error ?? 'That did not work.';
            return;
          }
          panel.remove();
          this.hud.hidden = false;
          resolve();
        } catch {
          error.textContent = 'Could not reach the server.';
        } finally {
          submit.disabled = false;
        }
      });
    });
  }

  setItemCatalogue(items: ItemDef[]): void {
    this.itemNames = new Map(items.map((i) => [i.id, i.name]));
  }

  setLocationName(name: string): void {
    this.locationEl.textContent = name;
  }

  setStatus(status: ConnectionStatus): void {
    this.statusEl.dataset.state = status;
    this.statusEl.textContent =
      status === 'online'
        ? 'connected'
        : status === 'offline'
          ? 'reconnecting…'
          : status === 'reconnecting'
            ? 'reconnecting…'
            : 'connecting…';
  }

  setInventory(slots: InventorySlot[]): void {
    this.slotsEl.innerHTML = '';
    for (let i = 0; i < 10; i++) {
      const slot = slots.find((s) => s.slot === i);
      const el = document.createElement('div');
      el.className = 'slot';
      if (slot) {
        el.title = this.itemNames.get(slot.item) ?? slot.item;
        el.innerHTML = `<span class="slot-name">${escapeHtml(
          this.itemNames.get(slot.item) ?? slot.item,
        )}</span><span class="slot-count">${slot.count}</span>`;
        el.classList.add('filled');
      }
      this.slotsEl.appendChild(el);
    }
  }

  setSkills(skills: SkillState[], nameFor: (id: string) => string): void {
    this.skillsEl.innerHTML = '';
    for (const skill of skills) {
      const el = document.createElement('div');
      el.className = 'skill';
      el.innerHTML = `<span>${escapeHtml(nameFor(skill.id))}</span><span class="level">lv ${
        skill.level
      }</span><span class="xp">${skill.xp} xp</span>`;
      this.skillsEl.appendChild(el);
    }
  }

  toast(message: string, kind: 'good' | 'bad' | 'note' = 'note'): void {
    const el = document.createElement('div');
    el.className = `toast toast-${kind}`;
    el.textContent = message;
    this.toastsEl.appendChild(el);
    setTimeout(() => el.classList.add('fading'), 2200);
    setTimeout(() => el.remove(), 3000);
  }
}

function must(root: HTMLElement, selector: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) throw new Error(`missing element ${selector}`);
  return el;
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
  );
}

const TEMPLATE = `
<div id="stage"></div>

<div id="hud" hidden>
  <div id="hud-top">
    <span id="location-name"></span>
    <span id="status">connecting…</span>
  </div>
  <div id="skills"></div>
  <div id="toasts"></div>
  <div id="hud-bottom">
    <div id="slots"></div>
    <p id="hint">move with <kbd>A</kbd> <kbd>D</kbd> or arrows &middot; <kbd>space</kbd> to jump &middot; click a trant to harvest</p>
  </div>
</div>

<div id="auth">
  <form id="auth-form">
    <h1>Project Glimmer</h1>
    <p class="tagline">A world dreamed by eleven giants.</p>
    <label for="username">Name</label>
    <input id="username" name="username" autocomplete="username" required minlength="3" maxlength="24" />
    <label for="password">Password</label>
    <input id="password" name="password" type="password" autocomplete="current-password" required minlength="8" />
    <button id="auth-submit" type="submit">Begin</button>
    <button id="auth-toggle" type="button" class="link">I already have a character</button>
    <p id="auth-error" role="alert"></p>
  </form>
</div>
`;
