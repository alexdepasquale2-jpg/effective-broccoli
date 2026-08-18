/**
 * Scrolling parallax backdrop, shared by every scene so transitions never
 * flash an empty canvas. It is purely decorative and holds no game state.
 */

const LAYERS = [
  { count: 26, speed: 12, size: 2.0, alpha: 0.30 },
  { count: 16, speed: 28, size: 3.0, alpha: 0.45 },
  { count: 8,  speed: 52, size: 4.5, alpha: 0.60 },
];

export class Background {
  constructor(viewport) {
    this.dots = [];
    this._w = viewport.width;
    for (let l = 0; l < LAYERS.length; l++) {
      for (let i = 0; i < LAYERS[l].count; i++) {
        this.dots.push({
          layer: l,
          x: Math.random() * viewport.width,
          y: Math.random() * viewport.height,
        });
      }
    }
  }

  update(dt, viewport) {
    // A rotation changes the design width; stretch the field to match so the
    // dots stay evenly spread instead of bunching at their old width.
    if (viewport.width !== this._w) {
      const k = viewport.width / this._w;
      for (const d of this.dots) d.x *= k;
      this._w = viewport.width;
    }

    for (const d of this.dots) {
      d.y += LAYERS[d.layer].speed * dt;
      if (d.y > viewport.height + 8) {
        d.y = -8;
        d.x = Math.random() * viewport.width;
      }
    }
  }

  render(ctx, viewport) {
    const g = ctx.createLinearGradient(0, 0, 0, viewport.height);
    g.addColorStop(0, '#171a33');
    g.addColorStop(1, '#0b0d1c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, viewport.width, viewport.height);

    for (const d of this.dots) {
      const L = LAYERS[d.layer];
      ctx.globalAlpha = L.alpha;
      ctx.fillStyle = '#9fb4ff';
      ctx.fillRect(d.x, d.y, L.size, L.size);
    }
    ctx.globalAlpha = 1;

    // Ground line the basket sits on.
    ctx.fillStyle = 'rgba(110,231,168,.14)';
    ctx.fillRect(0, viewport.height - 46, viewport.width, 46);
    ctx.fillStyle = 'rgba(110,231,168,.35)';
    ctx.fillRect(0, viewport.height - 46, viewport.width, 2);
  }
}
