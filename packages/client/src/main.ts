import { TICK_MS, type Actor, type ItemDef, type SkillState } from '@glimmer/shared';
import './style.css';
import { Keyboard } from './input.ts';
import { Connection } from './net.ts';
import { PredictedPlayer, RemoteActor } from './prediction.ts';
import { Renderer } from './render.ts';
import { UI } from './ui.ts';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('missing #app');

const ui = new UI(root);
await ui.signIn();

const renderer = new Renderer();
const keyboard = new Keyboard();
const predicted = new PredictedPlayer();
const remotes = new Map<string, RemoteActor>();
const skills = new Map<string, SkillState>();

let selfId = '';
let itemNames = new Map<string, string>();
let skillNames = new Map<string, string>();
let started = false;

const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
const connection = new Connection(`${wsProtocol}//${location.host}/ws`);

connection.onStatus((status) => ui.setStatus(status));

connection.onMessage((msg) => {
  switch (msg.t) {
    case 'welcome': {
      selfId = msg.youId;
      ui.setLocationName(msg.location.name);

      if (!started) {
        void start(msg.location.sky);
        started = true;
      }

      renderer.buildLocation(msg.location);
      renderer.onEntityClick((entityId) => {
        connection.send({ t: 'interact', seq: 0, entityId, verb: 'harvest' });
      });
      predicted.setWorld(msg.location.platforms, msg.location.width);

      const you = msg.actors.find((a) => a.id === selfId);
      if (you) {
        predicted.reset(you);
        renderer.upsertActor(selfId, you.name, true);
      }

      remotes.clear();
      for (const actor of msg.actors) {
        if (actor.id === selfId) continue;
        addRemote(actor);
      }

      ui.setInventory(msg.inventory);
      for (const s of msg.skills) skills.set(s.id, s);
      refreshSkills();

      for (const state of msg.entityStates) {
        renderer.setEntityReady(state.id, state.readyAt <= Date.now());
      }
      break;
    }

    case 'snapshot': {
      if (msg.you && msg.ackSeq !== undefined) predicted.reconcile(msg.you, msg.ackSeq);

      const seen = new Set<string>();
      for (const actor of msg.actors) {
        seen.add(actor.id);
        if (actor.id === selfId) continue;
        const remote = remotes.get(actor.id);
        if (remote) remote.setTarget(actor);
        else addRemote(actor);
      }

      for (const id of msg.left) removeRemote(id);
      // A player who vanishes without a `left` (server restart) still goes.
      for (const id of [...remotes.keys()]) {
        if (!seen.has(id)) removeRemote(id);
      }

      for (const state of msg.entityStates) {
        renderer.setEntityReady(state.id, state.readyAt <= Date.now());
      }
      break;
    }

    case 'inventory':
      ui.setInventory(msg.slots);
      break;

    case 'skill': {
      skills.set(msg.id, { id: msg.id, xp: msg.xp, level: msg.level });
      refreshSkills();
      const name = skillNames.get(msg.id) ?? msg.id;
      ui.toast(`+${msg.gained} ${name}`, 'good');
      if (msg.levelledUp) ui.toast(`${name} is now level ${msg.level}!`, 'good');
      break;
    }

    case 'harvested':
      if (msg.byId === selfId) {
        const name = itemNames.get(msg.item) ?? msg.item;
        ui.toast(`You got ${msg.count} × ${name}`, 'good');
      }
      break;

    case 'say':
      ui.toast(`${msg.fromName}: ${msg.text}`, 'note');
      break;

    case 'error':
      ui.toast(msg.message, 'bad');
      break;

    case 'pong':
      break;
  }
});

function addRemote(actor: Actor): void {
  remotes.set(actor.id, new RemoteActor(actor));
  renderer.upsertActor(actor.id, actor.name, false);
}

function removeRemote(id: string): void {
  if (id === selfId) return;
  remotes.delete(id);
  renderer.removeActor(id);
}

function refreshSkills(): void {
  ui.setSkills([...skills.values()], (id) => skillNames.get(id) ?? id);
}

async function start(sky: string): Promise<void> {
  await renderer.init(ui.stage, Number(sky.replace('#', '0x')));

  // Names for the handful of things this location can give you.
  const content = (await fetch('/api/content').then((r) => r.json())) as {
    items: ItemDef[];
    skills: { id: string; name: string; level: number }[];
  };
  itemNames = new Map(content.items.map((i) => [i.id, i.name]));
  skillNames = new Map(
    content.skills.map((s) => [s.id, s.level > 1 ? `${s.name} ${roman(s.level)}` : s.name]),
  );
  ui.setItemCatalogue(content.items);
  refreshSkills();

  // Input is sampled and sent at the server's tick rate.
  setInterval(() => {
    const input = keyboard.sample();
    const seq = predicted.apply(input);
    connection.send({ t: 'input', seq, dx: input.dx, jump: input.jump });
  }, TICK_MS);

  renderer.app.ticker.add((ticker) => {
    const dt = ticker.deltaMS / 1000;
    renderer.moveActor(selfId, predicted.body.x, predicted.body.y, predicted.body.facing);
    for (const [id, remote] of remotes) {
      remote.interpolate(dt);
      renderer.moveActor(id, remote.x, remote.y, remote.facing);
    }
    renderer.updateReachable(predicted.body.x, predicted.body.y);
    renderer.centreOn(predicted.body.x, predicted.body.y - 80);
  });
}

function roman(n: number): string {
  const table: [number, string][] = [
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let out = '';
  let rest = n;
  for (const [value, glyph] of table) {
    while (rest >= value) {
      out += glyph;
      rest -= value;
    }
  }
  return out;
}

connection.connect();
