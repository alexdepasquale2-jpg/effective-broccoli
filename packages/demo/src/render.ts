import { INTERACT_RANGE, PHYSICS, type EntityDef, type Location } from '@glimmer/shared';

/**
 * Canvas 2D renderer for the meadow.
 *
 * Deliberately not the client's PixiJS renderer: this page must be one
 * self-contained file, and the whole scene is soft shapes. Plain 2D canvas
 * draws it in a fraction of the bytes with no WebGL context to lose.
 */

const PALETTE = {
  skyTop: '#a5dcef',
  skyLow: '#cdeaf2',
  hillsFar: '#9ccf94',
  hillsNear: '#7bbb72',
  ground: '#4f9a4a',
  groundEdge: '#3d7a38',
  bark: '#6d4a2f',
  fruit: '#d7443e',
  fruitDeep: '#b8352f',
  wood: '#8fae5d',
  woodDeep: '#76944a',
  rock: '#9a9a86',
  self: '#f2c14e',
  selfSkin: '#ffe3b3',
} as const;

export interface Camera {
  x: number;
  y: number;
}

export class MeadowRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private dpr = 1;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly location: Location,
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas 2d unavailable');
    this.ctx = ctx;
    this.resize();
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = Math.round(rect.width * this.dpr);
    this.canvas.height = Math.round(rect.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  /** Camera centred on the player, clamped so the world edge never shows. */
  camera(px: number, py: number): Camera {
    const halfW = this.width / 2;
    const halfH = this.height / 2;
    return {
      x: clamp(px, halfW, Math.max(this.location.width - halfW, halfW)),
      y: clamp(py - 70, halfH, Math.max(this.location.height - halfH, halfH)),
    };
  }

  /** World point -> screen point, given a camera and a parallax factor. */
  private project(x: number, y: number, cam: Camera, parallax = 1): [number, number] {
    return [x - cam.x * parallax + this.width / 2, y - cam.y + this.height / 2];
  }

  draw(opts: {
    cam: Camera;
    playerX: number;
    playerY: number;
    facing: -1 | 1;
    walking: boolean;
    time: number;
    readyAt: Map<string, number>;
    now: number;
    hovered: string | null;
    reducedMotion: boolean;
  }): void {
    const { ctx } = this;
    const { cam, time, reducedMotion } = opts;

    ctx.clearRect(0, 0, this.width, this.height);

    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, this.height);
    sky.addColorStop(0, PALETTE.skyTop);
    sky.addColorStop(1, PALETTE.skyLow);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, this.width, this.height);

    this.drawClouds(cam, reducedMotion ? 0 : time);
    this.drawBand(cam, 0.2, 560, PALETTE.hillsFar, 26);
    this.drawBand(cam, 0.45, 640, PALETTE.hillsNear, 15);
    // The playable ground stays flat: its top edge is where the player stands.
    this.drawBand(cam, 1, 700, PALETTE.ground);

    // Platform lips, so what is standable is legible.
    ctx.fillStyle = PALETTE.groundEdge;
    for (const p of this.location.platforms) {
      const [sx, sy] = this.project(p.x1, p.y, cam);
      ctx.fillRect(sx, sy - 5, p.x2 - p.x1, 5);
    }

    for (const e of this.location.entities) {
      this.drawEntity(e, opts);
    }

    this.drawPlayer(opts);
  }

  /**
   * A distance band with a gently rolling top edge.
   *
   * Flat rectangles read as stripes rather than hills, and the horizon is most
   * of what sells the place. The undulation is a fixed function of world x, so
   * it scrolls with the band instead of swimming against it.
   */
  private drawBand(cam: Camera, parallax: number, worldY: number, fill: string, roll = 0): void {
    const { ctx } = this;
    const [, sy] = this.project(0, worldY, cam, parallax);
    const originX = cam.x * parallax;

    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(0, this.height + 40);
    ctx.lineTo(0, sy + crest(originX, roll));
    const step = 24;
    for (let x = step; x <= this.width; x += step) {
      ctx.lineTo(x, sy + crest(originX + x, roll));
    }
    ctx.lineTo(this.width, this.height + 40);
    ctx.closePath();
    ctx.fill();
  }

  private drawClouds(cam: Camera, time: number): void {
    const { ctx } = this;
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 7; i++) {
      const baseX = i * 460 + 120;
      const drift = (time * 6 * (0.4 + (i % 3) * 0.2)) % (this.location.width + 900);
      const [sx, sy] = this.project(baseX + drift - 300, 190 + (i % 4) * 62, cam, 0.12);
      const r = 34 + (i % 3) * 12;
      puff(ctx, sx, sy, r);
    }
    ctx.restore();
  }

  private drawEntity(
    e: EntityDef,
    opts: {
      cam: Camera;
      readyAt: Map<string, number>;
      now: number;
      time: number;
      hovered: string | null;
      reducedMotion: boolean;
      playerX: number;
      playerY: number;
    },
  ): void {
    const { ctx } = this;
    const [sx, sy] = this.project(e.x, e.y, opts.cam);

    if (e.kind === 'decor') {
      ctx.fillStyle = PALETTE.rock;
      ctx.beginPath();
      ctx.ellipse(sx, sy - 12, 28, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    const ready = (opts.readyAt.get(e.id) ?? 0) <= opts.now;
    const isFruit = e.yield?.item === 'apple';
    const inReach = Math.hypot(opts.playerX - e.x, opts.playerY - e.y) <= INTERACT_RANGE && ready;

    // A gentle sway: the world is dreamt, not static.
    const sway = opts.reducedMotion ? 0 : Math.sin(opts.time * 0.9 + e.x * 0.01) * 3;

    ctx.save();
    ctx.globalAlpha = ready ? 1 : 0.4;

    ctx.fillStyle = PALETTE.bark;
    ctx.beginPath();
    ctx.roundRect(sx - 8, sy - 72, 16, 72, 3);
    ctx.fill();

    const canopy = isFruit ? PALETTE.fruit : PALETTE.wood;
    const canopyDeep = isFruit ? PALETTE.fruitDeep : PALETTE.woodDeep;
    const cx = sx + sway;
    const cy = sy - 104;

    ctx.fillStyle = canopyDeep;
    puff(ctx, cx - 26, cy + 18, 30);
    puff(ctx, cx + 26, cy + 18, 30);
    ctx.fillStyle = canopy;
    puff(ctx, cx, cy, 46);
    puff(ctx, cx - 28, cy + 14, 27);
    puff(ctx, cx + 28, cy + 14, 27);

    if (inReach || opts.hovered === e.id) {
      ctx.globalAlpha = opts.hovered === e.id ? 0.95 : 0.6;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy + 6, 62, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawPlayer(opts: {
    cam: Camera;
    playerX: number;
    playerY: number;
    facing: -1 | 1;
    walking: boolean;
    time: number;
    reducedMotion: boolean;
  }): void {
    const { ctx } = this;
    const [sx, sy] = this.project(opts.playerX, opts.playerY, opts.cam);
    const w = PHYSICS.playerHalfWidth;
    const h = PHYSICS.playerHeight;
    const bob = opts.walking && !opts.reducedMotion ? Math.abs(Math.sin(opts.time * 9)) * 3 : 0;

    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = '#1d2a16';
    ctx.beginPath();
    ctx.ellipse(sx, sy - 2, w + 6, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = PALETTE.self;
    ctx.beginPath();
    ctx.roundRect(sx - w, sy - h - bob, w * 2, h, 11);
    ctx.fill();

    ctx.fillStyle = PALETTE.selfSkin;
    ctx.beginPath();
    ctx.arc(sx, sy - h - 6 - bob, 15, 0, Math.PI * 2);
    ctx.fill();

    // Eye, so the avatar reads as facing somewhere.
    ctx.fillStyle = '#3a2f1e';
    ctx.beginPath();
    ctx.arc(sx + opts.facing * 5, sy - h - 8 - bob, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }

  /** Which harvestable entity is under a screen point, if any. */
  hitTest(screenX: number, screenY: number, cam: Camera): EntityDef | null {
    for (const e of this.location.entities) {
      if (!e.verbs.includes('harvest')) continue;
      const [sx, sy] = this.project(e.x, e.y, cam);
      if (Math.hypot(screenX - sx, screenY - (sy - 98)) < 62) return e;
    }
    return null;
  }
}

function puff(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** Two out-of-phase sines, so the ridge line never looks periodic. */
function crest(x: number, amplitude: number): number {
  if (amplitude === 0) return 0;
  return (
    Math.sin(x * 0.0016) * amplitude + Math.sin(x * 0.0041 + 1.7) * amplitude * 0.45 - amplitude
  );
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), hi);
}
