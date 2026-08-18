import { NODES, WORLD_WIDTH, effectiveFear, speciesFor, yearLabel } from "./ancestors.js";
import { clamp, damp } from "./utils.js";
import { drawHominid, drawSpeech } from "./stick.js";

export class Wilds {
  constructor(game) {
    this.game = game;
    this.playerX = 240;
    this.targetX = 240;
    this.facing = 1;
    this.walk = 0;
    this.cameraX = 0;
    this.speech = "Tap the wilds. Investigate fear. Grow neurons.";
    this.speechTimer = 5;
    this.targetNode = null;
    this.senseMode = false;
    this.trees = Array.from({ length: 24 }, (_, i) => ({
      x: 80 + i * 118 + (i % 3) * 20,
      h: 70 + (i % 5) * 16,
      w: 26 + (i % 4) * 8,
    }));
  }

  groundY() {
    return this.game.height * 0.76;
  }

  nodeAt(worldX) {
    const y = this.groundY();
    return (
      NODES.find((node) => {
        const nx = node.x;
        return Math.abs(worldX - nx) < 42 && (!node.atCamp || Math.abs(this.playerX - nx) < 80);
      }) || null
    );
  }

  update(dt) {
    const speed = this.game.clan && this.game.hasNeuron?.("motricity") ? 250 : 190;
    const dx = this.targetX - this.playerX;
    if (Math.abs(dx) > 2) {
      this.facing = dx > 0 ? 1 : -1;
      this.playerX += Math.sign(dx) * Math.min(Math.abs(dx), speed * dt);
      this.walk += dt * 9;
    } else {
      this.playerX = this.targetX;
      this.walk *= 0.85;
      if (this.targetNode) {
        const node = this.targetNode;
        this.targetNode = null;
        this.game.useNode(node);
      }
    }
    this.cameraX = damp(this.cameraX, this.playerX - this.game.width * 0.4, 7, dt);
    this.cameraX = clamp(this.cameraX, 0, Math.max(0, WORLD_WIDTH - this.game.width));
    this.speechTimer = Math.max(0, this.speechTimer - dt);
  }

  say(text) {
    this.speech = text;
    this.speechTimer = 3.8;
  }

  tap(screenX) {
    const worldX = screenX + this.cameraX;
    const node = this.nodeAt(worldX);
    if (node) {
      this.targetX = node.x;
      this.targetNode = node;
      this.say(`Heading to ${node.name}...`);
      return;
    }
    this.targetNode = null;
    this.targetX = clamp(worldX, 40, WORLD_WIDTH - 40);
  }

  draw(ctx) {
    const { width, height } = this.game;
    const clan = this.game.clan;
    const ground = this.groundY();
    const hour = (performance.now() / 14000) % 1;
    const dusk = hour > 0.72 || hour < 0.18;

    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, dusk ? "#2a3d52" : "#7ec0e8");
    sky.addColorStop(1, dusk ? "#4a3528" : "#b8e4a4");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(-this.cameraX * 0.25, 0);
    for (let i = 0; i < 6; i += 1) {
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.beginPath();
      ctx.arc(120 + i * 280, 40 + (i % 2) * 18, 24, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(-this.cameraX, 0);

    ctx.fillStyle = "#3f7d32";
    ctx.fillRect(0, ground, WORLD_WIDTH + width, height - ground);
    ctx.fillStyle = "#2f5f25";
    ctx.fillRect(0, ground + 8, WORLD_WIDTH + width, 16);

    for (const tree of this.trees) this.drawTree(ctx, tree.x, ground, tree.h, tree.w);

    this.drawCamp(ctx, 220, ground);
    this.drawRiver(ctx, 820, ground);

    for (const node of NODES) {
      if (node.atCamp) continue;
      this.drawNode(ctx, node, ground, clan);
    }

    drawHominid(ctx, 330, ground, { scale: 0.95, facing: -1, walk: 0.6, kind: "clan" });
    drawHominid(ctx, 300, ground, { scale: 0.72, facing: 1, walk: 1.1, kind: "baby" });

    drawHominid(ctx, this.playerX, ground, {
      scale: 1.05,
      facing: this.facing,
      walk: this.walk,
      kind: "player",
      tool: clan.tools.rock,
    });

    if (this.speechTimer > 0) drawSpeech(ctx, this.playerX, ground - 70, this.speech);

    ctx.restore();

    if (this.senseMode) {
      ctx.fillStyle = "rgba(120, 220, 255, 0.08)";
      ctx.fillRect(0, 0, width, height);
    }
  }

  drawTree(ctx, x, ground, h, w) {
    ctx.fillStyle = "#4a2b12";
    ctx.fillRect(x - 5, ground - h + 20, 10, h - 20);
    ctx.fillStyle = "#2f8a3a";
    ctx.beginPath();
    ctx.arc(x, ground - h, w, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#1c4d20";
    ctx.stroke();
  }

  drawCamp(ctx, x, ground) {
    ctx.fillStyle = "#6a4a2a";
    ctx.beginPath();
    ctx.moveTo(x - 70, ground - 8);
    ctx.lineTo(x, ground - 78);
    ctx.lineTo(x + 70, ground - 8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#2a1a0c";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#ff6a2a";
    ctx.beginPath();
    ctx.arc(x, ground - 20, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  drawRiver(ctx, x, ground) {
    ctx.fillStyle = "#4aa3d8";
    ctx.beginPath();
    ctx.ellipse(x, ground + 4, 120, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#2d6f9c";
    ctx.stroke();
  }

  drawNode(ctx, node, ground, clan) {
    const known = clan.known.includes(node.id);
    const fear = effectiveFear(node, clan);
    const highlight = this.senseMode || !known;
    const y = ground - (node.type === "food" ? 34 : 18);

    if (!known) {
      ctx.fillStyle = `rgba(120, 20, 40, ${0.12 + fear / 180})`;
      ctx.beginPath();
      ctx.arc(node.x, ground - 40, 34 + fear * 0.15, 0, Math.PI * 2);
      ctx.fill();
    }

    if (node.type === "food") {
      ctx.fillStyle = known ? "#2f9a32" : "#174f1a";
      ctx.beginPath();
      ctx.arc(node.x, y, 16, 0, Math.PI * 2);
      ctx.fill();
    } else if (node.type === "water") {
      ctx.fillStyle = "#58b7ff";
      ctx.fillRect(node.x - 18, ground - 10, 36, 8);
    } else if (node.type === "alter") {
      ctx.fillStyle = "#777";
      ctx.beginPath();
      ctx.arc(node.x - 8, ground - 8, 10, 0, Math.PI * 2);
      ctx.arc(node.x + 10, ground - 12, 14, 0, Math.PI * 2);
      ctx.fill();
    } else if (node.type === "danger") {
      ctx.strokeStyle = "#6a4a12";
      ctx.lineWidth = 3;
      for (let i = 0; i < 5; i += 1) {
        ctx.beginPath();
        ctx.moveTo(node.x - 20 + i * 8, ground);
        ctx.lineTo(node.x - 16 + i * 8, ground - 40 - (i % 2) * 8);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = known ? "#3a2850" : "#1a1028";
      ctx.fillRect(node.x - 22, ground - 52, 44, 44);
    }

    if (highlight && (!known || this.senseMode)) {
      ctx.strokeStyle = this.senseMode ? "#9ef2ff" : "#ffcc55";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(node.x - 24, ground - 56, 48, 52);
      ctx.setLineDash([]);
      if (!known) {
        ctx.fillStyle = "#fff";
        ctx.font = "bold 16px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("?", node.x, ground - 28);
      }
    }

    if (known || this.senseMode) {
      ctx.fillStyle = "#111";
      ctx.font = "11px Comic Neue, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(node.name, node.x, ground - 58);
    }
  }
}

export function hudLine(clan) {
  const sp = speciesFor(clan);
  return `${sp.name} · ${yearLabel(clan.year)} · NE ${clan.neuronalEnergy}`;
}
