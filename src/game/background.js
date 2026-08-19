/**
 * Tactical map backdrop: latitude/longitude hatching, a rotating radar sweep
 * and a drifting scanline. Purely decorative and holds no game state, so
 * every scene can draw it and transitions never flash an empty canvas.
 */

const HATCH = 44;        // spacing of the map grid, design units
const SWEEP_RATE = 0.55; // radians per second

export class Background {
  constructor() {
    this.time = 0;
    this.sweep = 0;
    this.scan = 0;
  }

  update(dt, viewport) {
    this.time += dt;
    this.sweep = (this.sweep + SWEEP_RATE * dt) % (Math.PI * 2);
    this.scan = (this.scan + 90 * dt) % (viewport.height + 120);
  }

  render(ctx, viewport) {
    const { width: w, height: h } = viewport;

    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#08120c');
    g.addColorStop(1, '#040806');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Map hatching.
    ctx.strokeStyle = 'rgba(80, 200, 130, .07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= w; x += HATCH) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (let y = 0; y <= h; y += HATCH) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();

    // Radar sweep, centred on the board.
    const cx = w / 2;
    const cy = h / 2;
    const rad = Math.hypot(w, h) / 2;
    const grad = ctx.createLinearGradient(
      cx, cy,
      cx + Math.cos(this.sweep) * rad, cy + Math.sin(this.sweep) * rad
    );
    grad.addColorStop(0, 'rgba(90, 255, 170, .12)');
    grad.addColorStop(1, 'rgba(90, 255, 170, 0)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(this.sweep) * rad, cy + Math.sin(this.sweep) * rad);
    ctx.stroke();

    // Range rings.
    ctx.strokeStyle = 'rgba(90, 255, 170, .06)';
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(cx, cy, (rad / 3.2) * i, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Drifting scanline.
    ctx.fillStyle = 'rgba(120, 255, 190, .05)';
    ctx.fillRect(0, this.scan - 60, w, 60);
  }
}
