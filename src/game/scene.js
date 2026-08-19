import { conditionOf, seasonFor } from "./world.js";

// Where each domain physically sits in the valley, in scene-normalised space.
export const PLACES = {
  world: { x: 0.5, y: 0.44, scale: 0.5, name: "the far city" },
  work: { x: 0.24, y: 0.63, scale: 0.85, name: "the workshop" },
  town: { x: 0.74, y: 0.6, scale: 0.8, name: "the town" },
  self: { x: 0.22, y: 0.87, scale: 1.15, name: "your house" },
  kin: { x: 0.76, y: 0.85, scale: 1.05, name: "the family house" },
};

const RIVER_Y = 0.735;

function mulberry(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Scene {
  constructor() {
    const rng = mulberry(20260819);
    this.rng = rng;
    this.stars = Array.from({ length: 110 }, () => ({
      x: rng(),
      y: rng() * 0.62,
      r: 0.5 + rng() * 1.3,
      tw: rng() * Math.PI * 2,
    }));
    this.weather = Array.from({ length: 90 }, () => ({
      x: rng(),
      y: rng(),
      speed: 0.4 + rng() * 0.9,
      sway: rng() * Math.PI * 2,
      size: 0.5 + rng() * 1.6,
    }));
    this.trees = Array.from({ length: 16 }, () => ({
      x: rng(),
      y: 0.78 + rng() * 0.2,
      h: 0.5 + rng() * 0.6,
    }));
    this.walkers = Array.from({ length: 5 }, (_, i) => ({
      t: rng(),
      speed: 0.018 + rng() * 0.02,
      dir: i % 2 === 0 ? 1 : -1,
      lane: 0.9 + rng() * 0.07,
    }));
    this.rect = { x: 0, y: 0, w: 0, h: 0 };
  }

  layout(width, height) {
    const h = Math.round(height * 0.54);
    this.rect = { x: 0, y: 0, w: width, h };
    return this.rect;
  }

  place(domain) {
    const p = PLACES[domain] || PLACES.town;
    const { x, y, w, h } = this.rect;
    return { x: x + p.x * w, y: y + p.y * h, scale: p.scale };
  }

  // The mote hovering over a place, where a thread visibly lives.
  motePosition(domain, index = 0) {
    const base = this.place(domain);
    return { x: base.x + (index % 2 === 0 ? -14 : 14), y: base.y - 46 * base.scale };
  }

  update(dt) {
    for (const w of this.weather) {
      w.y += w.speed * dt * 0.16;
      w.sway += dt * 1.4;
      if (w.y > 1.05) {
        w.y = -0.05;
        w.x = this.rng();
      }
    }
    for (const walker of this.walkers) {
      walker.t += walker.speed * walker.dir * dt;
      if (walker.t > 1.08) walker.t = -0.08;
      if (walker.t < -0.08) walker.t = 1.08;
    }
  }

  draw(ctx, { world, dayProgress, time, activeDomains = [] }) {
    const { x, y, w, h } = this.rect;
    const season = seasonFor(world.day);
    const light = this.lightLevel(dayProgress);

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    this.drawSky(ctx, season, light, dayProgress);
    this.drawStars(ctx, light, time);
    this.drawSunMoon(ctx, dayProgress, light);
    this.drawHills(ctx, season, light);
    this.drawFarCity(ctx, world, light, time);
    this.drawRiver(ctx, season, light, time, world);
    this.drawFields(ctx, season, light, world);
    this.drawTrees(ctx, season, light, world);

    // Far things first, near things last.
    this.drawBuilding(ctx, world, "work", light, time);
    this.drawTownCluster(ctx, world, light, time);
    this.drawWalkers(ctx, world, light);
    this.drawBuilding(ctx, world, "kin", light, time);
    this.drawBuilding(ctx, world, "self", light, time);

    this.drawWeather(ctx, season, light);
    this.drawMotes(ctx, activeDomains, time);
    this.drawHaze(ctx, light);

    ctx.restore();
  }

  // 0 = deep night, 1 = full noon. The day visibly runs out.
  lightLevel(dayProgress) {
    const p = Math.max(0, Math.min(1, dayProgress));
    return Math.max(0.06, Math.sin(p * Math.PI) * 0.94 + 0.06);
  }

  drawSky(ctx, season, light, dayProgress) {
    const { x, y, w, h } = this.rect;
    const dusk = dayProgress > 0.72;
    const dawn = dayProgress < 0.2;

    const top = mix(season.sky[0], dusk ? "#3a2038" : dawn ? "#3d3352" : "#0a1020", 1 - light);
    const bottom = mix(season.sky[1], dusk ? "#c96a44" : dawn ? "#c9857a" : "#101a2c", 1 - light * 0.85);

    const grad = ctx.createLinearGradient(0, y, 0, y + h);
    grad.addColorStop(0, top);
    grad.addColorStop(0.68, bottom);
    grad.addColorStop(1, mix(bottom, "#1a1a12", 0.45));
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
  }

  drawStars(ctx, light, time) {
    if (light > 0.55) return;
    const { x, y, w, h } = this.rect;
    const alpha = (0.55 - light) / 0.55;
    for (const star of this.stars) {
      const tw = 0.55 + Math.sin(time * 1.6 + star.tw) * 0.45;
      ctx.fillStyle = `rgba(226, 238, 250, ${alpha * tw * 0.85})`;
      ctx.beginPath();
      ctx.arc(x + star.x * w, y + star.y * h, star.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawSunMoon(ctx, dayProgress, light) {
    const { x, y, w, h } = this.rect;
    const p = Math.max(0, Math.min(1, dayProgress));
    const sx = x + (0.1 + p * 0.8) * w;
    const sy = y + h * (0.52 - Math.sin(p * Math.PI) * 0.42);
    const isDay = light > 0.3;

    const glow = ctx.createRadialGradient(sx, sy, 2, sx, sy, isDay ? 78 : 42);
    glow.addColorStop(0, isDay ? "rgba(255, 240, 200, 0.85)" : "rgba(214, 230, 255, 0.5)");
    glow.addColorStop(1, "rgba(255, 240, 200, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sx, sy, isDay ? 78 : 42, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isDay ? "#ffe9a8" : "#dde8f6";
    ctx.beginPath();
    ctx.arc(sx, sy, isDay ? 15 : 10, 0, Math.PI * 2);
    ctx.fill();
  }

  drawHills(ctx, season, light) {
    const { x, y, w, h } = this.rect;
    const horizon = y + h * 0.56;

    const far = shade(mix(season.ground, "#4a5a7a", 0.55), -0.35 + light * 0.3);
    ctx.fillStyle = far;
    ctx.beginPath();
    ctx.moveTo(x, horizon + 26);
    for (let i = 0; i <= 12; i += 1) {
      const px = x + (i / 12) * w;
      const py = horizon - Math.sin(i * 0.9) * 20 - Math.cos(i * 0.4) * 12;
      ctx.lineTo(px, py);
    }
    ctx.lineTo(x + w, horizon + 26);
    ctx.closePath();
    ctx.fill();

    const near = shade(mix(season.ground, "#3a4a62", 0.3), -0.2 + light * 0.35);
    ctx.fillStyle = near;
    ctx.beginPath();
    ctx.moveTo(x, horizon + 60);
    for (let i = 0; i <= 10; i += 1) {
      const px = x + (i / 10) * w;
      const py = horizon + 16 - Math.sin(i * 1.4 + 2) * 16;
      ctx.lineTo(px, py);
    }
    ctx.lineTo(x + w, horizon + 60);
    ctx.closePath();
    ctx.fill();
  }

  drawFields(ctx, season, light, world) {
    const { x, y, w, h } = this.rect;
    const riverY = y + h * RIVER_Y;
    const health = (world.domains.town + world.domains.self) / 200;
    const grass = shade(mix(season.ground, "#6b5a3a", 1 - health), -0.18 + light * 0.4);

    ctx.fillStyle = grass;
    ctx.fillRect(x, riverY + 14, w, y + h - riverY - 14 + 4);

    // The lane the walkers use.
    ctx.strokeStyle = shade(grass, 0.25);
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(x - 10, y + h * 0.93);
    ctx.bezierCurveTo(x + w * 0.35, y + h * 0.88, x + w * 0.6, y + h * 0.96, x + w + 10, y + h * 0.9);
    ctx.stroke();
  }

  drawRiver(ctx, season, light, time, world) {
    const { x, y, w, h } = this.rect;
    const riverY = y + h * RIVER_Y;
    const swollen = world.domains.town < 40;
    const band = swollen ? 26 : 17;

    const grad = ctx.createLinearGradient(0, riverY - band, 0, riverY + band);
    grad.addColorStop(0, shade(swollen ? "#6b5a3a" : "#4a7f9e", -0.25 + light * 0.4));
    grad.addColorStop(1, shade(swollen ? "#4a3d28" : "#2d5a78", -0.3 + light * 0.4));
    ctx.fillStyle = grad;
    ctx.fillRect(x, riverY - band, w, band * 2);

    ctx.strokeStyle = `rgba(232, 244, 255, ${0.1 + light * 0.16})`;
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      for (let px = 0; px <= w; px += 12) {
        const py = riverY - band * 0.55 + i * band * 0.38 + Math.sin(px * 0.03 + time * 1.1 + i) * 2.2;
        if (px === 0) ctx.moveTo(x + px, py);
        else ctx.lineTo(x + px, py);
      }
      ctx.stroke();
    }

    // The bridge everybody stands on to make decisions badly.
    const bx = x + w * 0.5;
    ctx.strokeStyle = shade("#6b5334", -0.1 + light * 0.3);
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(bx - 40, riverY - band - 3);
    ctx.quadraticCurveTo(bx, riverY - band - 15, bx + 40, riverY - band - 3);
    ctx.stroke();
    ctx.lineWidth = 2;
    for (let i = -3; i <= 3; i += 1) {
      const px = bx + i * 12;
      ctx.beginPath();
      ctx.moveTo(px, riverY - band - 6);
      ctx.lineTo(px, riverY + band * 0.2);
      ctx.stroke();
    }
  }

  drawTrees(ctx, season, light, world) {
    const { x, y, w, h } = this.rect;
    const riverY = y + h * RIVER_Y;
    const health = world.domains.town / 100;
    const bare = season.id === "still";
    const autumn = season.id === "turn";

    for (const tree of this.trees) {
      const tx = x + tree.x * w;
      const ty = riverY + 18 + tree.y * (y + h - riverY - 18) * 0.55;
      const size = 8 + tree.h * 11;

      ctx.strokeStyle = shade("#3d2b18", -0.1 + light * 0.35);
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx, ty - size * 0.85);
      ctx.stroke();

      if (bare) continue;
      const leaf = autumn ? "#b5732c" : health > 0.5 ? "#3f7a33" : "#6b6b30";
      ctx.fillStyle = shade(leaf, -0.15 + light * 0.4);
      ctx.beginPath();
      ctx.arc(tx, ty - size, size * 0.72, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawFarCity(ctx, world, light, time) {
    const { x, y, w, h } = this.rect;
    const p = this.place("world");
    const condition = conditionOf(world, "world");
    const alive = condition.key !== "failing";
    const spread = w * 0.3;

    for (let i = 0; i < 11; i += 1) {
      const bx = p.x - spread / 2 + (i / 10) * spread;
      const bh = 10 + ((i * 37) % 26);
      ctx.fillStyle = shade("#2a3a52", -0.35 + light * 0.35);
      ctx.fillRect(bx, p.y - bh, 9, bh);

      if (alive && light < 0.5) {
        const flicker = Math.sin(time * 0.8 + i * 2.1) > -0.4;
        if (flicker) {
          ctx.fillStyle = `rgba(255, 214, 140, ${(0.5 - light) * 1.5 * (world.domains.world / 100)})`;
          ctx.fillRect(bx + 2, p.y - bh + 4, 2, 2);
          ctx.fillRect(bx + 5, p.y - bh + 9, 2, 2);
        }
      }
    }
  }

  drawTownCluster(ctx, world, light, time) {
    const p = this.place("town");
    const condition = conditionOf(world, "town");
    const count = condition.key === "failing" ? 3 : condition.key === "struggling" ? 4 : 6;

    for (let i = 0; i < count; i += 1) {
      const ox = (i - count / 2) * 17;
      const oy = (i % 2) * -7;
      this.drawHouse(ctx, {
        x: p.x + ox,
        y: p.y + oy,
        scale: p.scale * 0.62,
        world,
        domain: "town",
        light,
        time,
        seed: i,
      });
    }
  }

  drawBuilding(ctx, world, domain, light, time) {
    const p = this.place(domain);
    this.drawHouse(ctx, { x: p.x, y: p.y, scale: p.scale, world, domain, light, time, seed: 0 });

    if (domain === "work") {
      const condition = conditionOf(world, "work");
      if (condition.key !== "failing") {
        // Smoke means the workshop is running.
        ctx.strokeStyle = `rgba(210, 216, 226, ${0.1 + (world.domains.work / 100) * 0.28})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        const sx = p.x + 13 * p.scale;
        const sy = p.y - 34 * p.scale;
        ctx.moveTo(sx, sy);
        for (let i = 1; i <= 5; i += 1) {
          ctx.lineTo(sx + Math.sin(time * 0.9 + i * 0.8) * i * 2.4, sy - i * 8);
        }
        ctx.stroke();
      }
    }
  }

  drawHouse(ctx, { x, y, scale, world, domain, light, time, seed }) {
    const condition = conditionOf(world, domain);
    const value = world.domains[domain] ?? 50;
    const w = 34 * scale;
    const h = 26 * scale;
    const failing = condition.key === "failing";
    const struggling = condition.key === "struggling";

    const wall = shade(failing ? "#4a4038" : struggling ? "#6b5c48" : "#8a7458", -0.18 + light * 0.42);
    const roof = shade(failing ? "#33291f" : "#5a3b2a", -0.2 + light * 0.4);

    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.ellipse(x, y + 2, w * 0.62, 4 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = wall;
    ctx.fillRect(x - w / 2, y - h, w, h);

    ctx.fillStyle = roof;
    ctx.beginPath();
    ctx.moveTo(x - w / 2 - 4 * scale, y - h);
    ctx.lineTo(x, y - h - 15 * scale);
    ctx.lineTo(x + w / 2 + 4 * scale, y - h);
    ctx.closePath();
    ctx.fill();

    if (domain === "work") {
      ctx.fillStyle = roof;
      ctx.fillRect(x + 10 * scale, y - h - 14 * scale, 6 * scale, 14 * scale);
    }

    // Windows: lit at night when a place still has life in it.
    const windowLit = light < 0.45 && value > 22;
    const warmth = Math.min(1, value / 80);
    const flicker = 0.82 + Math.sin(time * 1.3 + seed * 1.7) * 0.18;
    const wx = 6 * scale;
    const wy = 8 * scale;

    for (const offset of [-w * 0.24, w * 0.24]) {
      if (failing) {
        ctx.strokeStyle = shade("#2e241c", light * 0.5);
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.moveTo(x + offset - wx / 2, y - h + wy - wy / 2);
        ctx.lineTo(x + offset + wx / 2, y - h + wy + wy / 2);
        ctx.stroke();
        continue;
      }
      ctx.fillStyle = windowLit
        ? `rgba(255, 208, 130, ${0.35 + warmth * 0.6 * flicker})`
        : shade("#3a4450", -0.1 + light * 0.4);
      ctx.fillRect(x + offset - wx / 2, y - h + wy - wy / 2, wx, wy);
    }

    ctx.fillStyle = shade("#3d2b1c", -0.1 + light * 0.35);
    ctx.fillRect(x - 4 * scale, y - 11 * scale, 8 * scale, 11 * scale);

    if (condition.key === "flourishing") {
      ctx.fillStyle = shade("#4f8f3a", -0.1 + light * 0.4);
      ctx.beginPath();
      ctx.arc(x - w * 0.66, y - 4 * scale, 6 * scale, 0, Math.PI * 2);
      ctx.arc(x + w * 0.66, y - 3 * scale, 5 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawWalkers(ctx, world, light) {
    const { x, y, w, h } = this.rect;
    const life = (world.domains.town + world.domains.kin) / 200;
    const visible = Math.max(1, Math.round(this.walkers.length * life));

    this.walkers.slice(0, visible).forEach((walker) => {
      const t = Math.max(0, Math.min(1, walker.t));
      const px = x + t * w;
      const py = y + h * (walker.lane - 0.02) - Math.sin(t * Math.PI * 2) * 4;
      ctx.strokeStyle = `rgba(28, 26, 34, ${0.35 + light * 0.45})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px, py - 7);
      ctx.stroke();
      ctx.fillStyle = `rgba(28, 26, 34, ${0.35 + light * 0.45})`;
      ctx.beginPath();
      ctx.arc(px, py - 10, 2.4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawWeather(ctx, season, light) {
    const { x, y, w, h } = this.rect;
    if (season.weather === "none") return;

    for (const p of this.weather) {
      const px = x + ((p.x + Math.sin(p.sway) * 0.02) % 1) * w;
      const py = y + p.y * h;

      if (season.weather === "rain") {
        ctx.strokeStyle = `rgba(180, 208, 232, ${0.16 + light * 0.16})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px - 2, py + 9 * p.size);
        ctx.stroke();
      } else if (season.weather === "snow") {
        ctx.fillStyle = `rgba(238, 246, 255, ${0.3 + light * 0.4})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size * 1.3, 0, Math.PI * 2);
        ctx.fill();
      } else if (season.weather === "leaves") {
        ctx.fillStyle = `rgba(196, 122, 48, ${0.28 + light * 0.35})`;
        ctx.beginPath();
        ctx.ellipse(px, py, p.size * 2, p.size, p.sway, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  drawMotes(ctx, activeDomains, time) {
    const counts = {};
    for (const domain of activeDomains) {
      const index = counts[domain] = (counts[domain] || 0) + 1;
      const pos = this.motePosition(domain, index - 1);
      const pulse = 0.6 + Math.sin(time * 2.2 + index) * 0.4;

      const glow = ctx.createRadialGradient(pos.x, pos.y, 1, pos.x, pos.y, 22);
      glow.addColorStop(0, `rgba(255, 232, 176, ${0.5 * pulse})`);
      glow.addColorStop(1, "rgba(255, 232, 176, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(255, 244, 214, ${0.65 + pulse * 0.35})`;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawHaze(ctx, light) {
    const { x, y, w, h } = this.rect;
    const grad = ctx.createLinearGradient(0, y + h - 70, 0, y + h);
    grad.addColorStop(0, "rgba(6, 9, 16, 0)");
    grad.addColorStop(1, `rgba(6, 9, 16, ${0.55 + (1 - light) * 0.3})`);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y + h - 70, w, 70);
  }
}

// ---------------------------------------------------------------- colours

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = Number.parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function clamp255(v) {
  return Math.max(0, Math.min(255, Math.round(v)));
}

export function mix(a, b, amount) {
  const t = Math.max(0, Math.min(1, amount));
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return `rgb(${clamp255(ca.r + (cb.r - ca.r) * t)}, ${clamp255(ca.g + (cb.g - ca.g) * t)}, ${clamp255(
    ca.b + (cb.b - ca.b) * t,
  )})`;
}

export function shade(color, amount) {
  const c = color.startsWith("#") ? hexToRgb(color) : parseRgb(color);
  const f = (v) => clamp255(v + v * amount);
  return `rgb(${f(c.r)}, ${f(c.g)}, ${f(c.b)})`;
}

function parseRgb(value) {
  const parts = value.match(/\d+/g) || ["0", "0", "0"];
  return { r: Number(parts[0]), g: Number(parts[1]), b: Number(parts[2]) };
}
