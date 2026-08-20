import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { INTERACT_RANGE, PHYSICS, type EntityDef, type WelcomeMessage } from '@glimmer/shared';

/**
 * The renderer.
 *
 * Everything is drawn procedurally. Glitch's CC0 art is a later milestone
 * (M2); shapes are enough to prove the loop, and building the render tree
 * around named layers now means swapping in sprites later touches only this
 * file.
 */

const TREE_TRUNK = 0x7a5233;
const TREE_FRUIT = 0xd7443e;
const TREE_WOOD = 0x8fae5d;

export interface EntityView {
  def: EntityDef;
  container: Container;
  canopy: Graphics;
  ready: boolean;
}

export class Renderer {
  readonly app = new Application();
  readonly world = new Container();

  private readonly layers = new Container();
  private readonly entityLayer = new Container();
  private readonly actorLayer = new Container();
  private readonly entities = new Map<string, EntityView>();
  private readonly actorViews = new Map<string, Container>();

  private worldWidth = 0;
  private worldHeight = 0;

  async init(mount: HTMLElement, sky: number): Promise<void> {
    await this.app.init({
      background: sky,
      resizeTo: mount,
      antialias: true,
    });
    mount.appendChild(this.app.canvas);
    this.world.addChild(this.layers, this.entityLayer, this.actorLayer);
    this.app.stage.addChild(this.world);
  }

  buildLocation(location: WelcomeMessage['location']): void {
    this.worldWidth = location.width;
    this.worldHeight = location.height;
    this.layers.removeChildren();
    this.entityLayer.removeChildren();
    this.entities.clear();

    for (const layer of location.layers) {
      if (!layer.fill) continue;
      const g = new Graphics();
      // Layers are drawn wider than the world so parallax never exposes an edge.
      g.rect(-location.width, layer.y, location.width * 3, layer.height ?? location.height);
      g.fill(Number(layer.fill.replace('#', '0x')));
      g.label = layer.id;
      // Stash the parallax factor for the camera to read back.
      (g as Graphics & { parallax?: number }).parallax = layer.parallax;
      this.layers.addChild(g);
    }

    // Platform edges, so the player can see what is standable.
    const edges = new Graphics();
    for (const p of location.platforms) {
      edges.rect(p.x1, p.y - 6, p.x2 - p.x1, 6);
      edges.fill(0x3d7a38);
    }
    this.layers.addChild(edges);

    for (const def of location.entities) {
      const view = this.buildEntity(def);
      this.entities.set(def.id, view);
      this.entityLayer.addChild(view.container);
    }
  }

  private buildEntity(def: EntityDef): EntityView {
    const container = new Container();
    container.x = def.x;
    container.y = def.y;

    if (def.kind === 'decor') {
      const rock = new Graphics();
      rock.ellipse(0, -14, 30, 16).fill(0x8b8b7a);
      container.addChild(rock);
      return { def, container, canopy: rock, ready: true };
    }

    const trunk = new Graphics();
    trunk.rect(-9, -70, 18, 70).fill(TREE_TRUNK);

    const canopy = new Graphics();
    const isFruit = def.yield?.item === 'apple';
    canopy.circle(0, -104, 46).fill(isFruit ? TREE_FRUIT : TREE_WOOD);
    canopy.circle(-30, -84, 30).fill(isFruit ? TREE_FRUIT : TREE_WOOD);
    canopy.circle(30, -84, 30).fill(isFruit ? TREE_FRUIT : TREE_WOOD);

    container.addChild(trunk, canopy);

    if (def.verbs.includes('harvest')) {
      container.eventMode = 'static';
      container.cursor = 'pointer';
      container.hitArea = { contains: (x: number, y: number) => Math.hypot(x, y + 90) < 60 };
    }

    return { def, container, canopy, ready: true };
  }

  onEntityClick(fn: (entityId: string) => void): void {
    for (const [id, view] of this.entities) {
      view.container.on('pointertap', () => fn(id));
    }
  }

  setEntityReady(entityId: string, ready: boolean): void {
    const view = this.entities.get(entityId);
    if (!view || view.ready === ready) return;
    view.ready = ready;
    // A spent tree is visibly bare rather than silently unusable.
    view.canopy.alpha = ready ? 1 : 0.35;
  }

  entityDefs(): EntityDef[] {
    return [...this.entities.values()].map((v) => v.def);
  }

  /** Highlights entities the player is close enough to use. */
  updateReachable(playerX: number, playerY: number): void {
    for (const view of this.entities.values()) {
      if (!view.def.verbs.includes('harvest')) continue;
      const inRange =
        Math.hypot(playerX - view.def.x, playerY - view.def.y) <= INTERACT_RANGE && view.ready;
      view.container.scale.set(inRange ? 1.04 : 1);
    }
  }

  upsertActor(id: string, name: string, isSelf: boolean): Container {
    const existing = this.actorViews.get(id);
    if (existing) return existing;

    const container = new Container();
    const body = new Graphics();
    const w = PHYSICS.playerHalfWidth;
    const h = PHYSICS.playerHeight;
    body.roundRect(-w, -h, w * 2, h, 10).fill(isSelf ? 0xf2c14e : 0xe07a5f);
    body.circle(0, -h - 4, 15).fill(0xffe3b3);

    const label = new Text({
      text: name,
      style: new TextStyle({
        fontFamily: 'system-ui, sans-serif',
        fontSize: 13,
        fill: 0x1c2b1a,
        fontWeight: '600',
      }),
    });
    label.anchor.set(0.5, 1);
    label.y = -h - 24;

    container.addChild(body, label);
    this.actorViews.set(id, container);
    this.actorLayer.addChild(container);
    return container;
  }

  moveActor(id: string, x: number, y: number, facing: -1 | 1): void {
    const view = this.actorViews.get(id);
    if (!view) return;
    view.x = x;
    view.y = y;
    view.scale.x = facing;
  }

  removeActor(id: string): void {
    const view = this.actorViews.get(id);
    if (!view) return;
    view.destroy({ children: true });
    this.actorViews.delete(id);
  }

  hasActor(id: string): boolean {
    return this.actorViews.has(id);
  }

  actorIds(): string[] {
    return [...this.actorViews.keys()];
  }

  /** Centres the camera on a point, clamped to the world, and applies parallax. */
  centreOn(x: number, y: number): void {
    const view = this.app.screen;
    const cameraX = Math.min(
      Math.max(x, view.width / 2),
      Math.max(this.worldWidth - view.width / 2, view.width / 2),
    );
    const cameraY = Math.min(
      Math.max(y, view.height / 2),
      Math.max(this.worldHeight - view.height / 2, view.height / 2),
    );

    const offsetX = view.width / 2 - cameraX;
    const offsetY = view.height / 2 - cameraY;

    this.world.x = 0;
    this.world.y = 0;
    this.entityLayer.x = offsetX;
    this.entityLayer.y = offsetY;
    this.actorLayer.x = offsetX;
    this.actorLayer.y = offsetY;

    for (const child of this.layers.children) {
      const parallax = (child as Graphics & { parallax?: number }).parallax ?? 1;
      // Parallax applies horizontally only. Scaling the vertical offset too
      // slides distant bands down past the ground as the camera clamps, which
      // reads as the horizon sinking rather than as depth.
      child.x = offsetX * parallax;
      child.y = offsetY;
    }
  }
}
