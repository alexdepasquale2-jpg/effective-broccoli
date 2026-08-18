import { BUILDINGS, STREET_WIDTH, skyForHour } from "./rpg.js";
import { clamp, damp } from "./utils.js";
import { drawSpeech, drawStick } from "./stick.js";

export class Town {
  constructor(game) {
    this.game = game;
    this.playerX = 220;
    this.targetX = 220;
    this.facing = 1;
    this.walk = 0;
    this.cameraX = 0;
    this.npcs = [
      { x: 500, facing: -1, walk: 0, color: "#222", phrase: "Hire me? LOL." },
      { x: 860, facing: 1, walk: 1.2, color: "#333", phrase: "U of S ruined me." },
      { x: 1280, facing: -1, walk: 2.1, color: "#111", phrase: "First round's on you." },
      { x: 1580, facing: 1, walk: 3.4, color: "#444", phrase: "I pawned my spine." },
      { x: 1760, facing: -1, walk: 0.8, color: "#225", phrase: "I still have that rash." },
      { x: 2020, facing: 1, walk: 2.8, color: "#222", phrase: "Bless you, you disaster." },
      { x: 2320, facing: 1, walk: 0.4, color: "#2a1040", phrase: "Don't go in the well." },
    ];
    this.clouds = Array.from({ length: 7 }, (_, i) => ({
      x: 80 + i * 340,
      y: 36 + (i % 3) * 22,
      s: 0.7 + (i % 4) * 0.25,
      v: 8 + (i % 3) * 4,
    }));
    this.speech = "Tap a building. Become somebody.";
    this.speechTimer = 4;
    this.entered = null;
  }

  groundY() {
    return this.game.height * 0.78;
  }

  update(dt) {
    const speed = 220;
    const dx = this.targetX - this.playerX;
    if (Math.abs(dx) > 2) {
      this.facing = dx > 0 ? 1 : -1;
      this.playerX += Math.sign(dx) * Math.min(Math.abs(dx), speed * dt);
      this.walk += dt * 10;
    } else {
      this.playerX = this.targetX;
      this.walk *= 0.85;
      if (this.entered && this.game.state === "town") {
        const building = this.entered;
        this.entered = null;
        this.game.openRoom(building);
      }
    }
    this.cameraX = damp(this.cameraX, this.playerX - this.game.width * 0.42, 7, dt);
    this.cameraX = clamp(this.cameraX, 0, Math.max(0, STREET_WIDTH - this.game.width));
    this.speechTimer = Math.max(0, this.speechTimer - dt);
    for (const npc of this.npcs) {
      npc.walk += dt * 0.8;
      npc.x += Math.sin(npc.walk) * 18 * dt;
      npc.facing = Math.cos(npc.walk) >= 0 ? 1 : -1;
    }
    for (const cloud of this.clouds) {
      cloud.x += cloud.v * dt;
      if (cloud.x > STREET_WIDTH + 120) cloud.x = -160;
    }
  }

  say(text) {
    this.speech = text;
    this.speechTimer = 3.6;
  }

  tap(screenX) {
    const worldX = screenX + this.cameraX;
    const building = BUILDINGS.find((b) => worldX >= b.x - 28 && worldX <= b.x + b.w + 28);
    if (building) {
      this.targetX = building.x + building.w * 0.5;
      this.entered = building;
      this.say(`Walking to ${building.name}...`);
      return;
    }
    this.entered = null;
    this.targetX = clamp(worldX, 40, STREET_WIDTH - 40);
  }

  draw(ctx) {
    const { width, height } = this.game;
    const hero = this.game.hero;
    const pal = skyForHour(hero.hour);
    const ground = this.groundY();
    ctx.fillStyle = pal.sky;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(-this.cameraX * 0.35, 0);
    for (const cloud of this.clouds) this.drawCloud(ctx, cloud);
    ctx.restore();

    if (pal.night) {
      ctx.fillStyle = "#fff8e0";
      ctx.beginPath();
      ctx.arc(width * 0.82, height * 0.12, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pal.sky;
      ctx.beginPath();
      ctx.arc(width * 0.84, height * 0.11, 16, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = "#fff38a";
      ctx.beginPath();
      ctx.arc(width * 0.82, height * 0.14, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(-this.cameraX, 0);

    ctx.fillStyle = pal.ground;
    ctx.fillRect(0, ground, STREET_WIDTH + width, height - ground);
    ctx.fillStyle = "#3d8c40";
    ctx.fillRect(0, ground, STREET_WIDTH + width, 10);
    ctx.fillStyle = "#5a5a5a";
    ctx.fillRect(0, ground + 10, STREET_WIDTH + width, 18);
    ctx.fillStyle = "#ece07a";
    for (let x = 20; x < STREET_WIDTH; x += 46) {
      ctx.fillRect(x, ground + 17, 22, 4);
    }

    this.drawTree(ctx, 320, ground);
    this.drawTree(ctx, 1120, ground);
    this.drawTree(ctx, 1620, ground);
    this.drawBillboard(ctx, 780, ground);

    for (const b of BUILDINGS) {
      this.drawBuilding(ctx, b, ground, pal.night);
    }

    for (const npc of this.npcs) {
      drawStick(ctx, npc.x, ground, { scale: 0.92, facing: npc.facing, walk: npc.walk, color: npc.color });
    }

    drawStick(ctx, this.playerX, ground, {
      scale: 1.08,
      facing: this.facing,
      walk: this.walk,
      hat: Boolean(hero.items?.hat) || hero.cha >= 6,
      bat: Boolean(hero.items?.bat),
      color: "#111",
    });
    if (this.speechTimer > 0) {
      drawSpeech(ctx, this.playerX, ground - 64, this.speech);
    } else {
      const near = this.npcs.find((npc) => Math.abs(npc.x - this.playerX) < 70);
      if (near) drawSpeech(ctx, near.x, ground - 64, near.phrase);
    }

    ctx.fillStyle = "#111";
    ctx.font = "bold 13px Comic Neue, Trebuchet MS, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("PAPER THIN BLVD", 40, ground + 52);

    ctx.restore();
  }

  drawCloud(ctx, cloud) {
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cloud.x, cloud.y, 28 * cloud.s, 14 * cloud.s, 0, 0, Math.PI * 2);
    ctx.ellipse(cloud.x + 22 * cloud.s, cloud.y + 2, 20 * cloud.s, 12 * cloud.s, 0, 0, Math.PI * 2);
    ctx.ellipse(cloud.x - 18 * cloud.s, cloud.y + 4, 16 * cloud.s, 10 * cloud.s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  drawTree(ctx, x, ground) {
    ctx.fillStyle = "#6b3f16";
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 3;
    ctx.fillRect(x - 6, ground - 48, 12, 48);
    ctx.strokeRect(x - 6, ground - 48, 12, 48);
    ctx.fillStyle = "#2f8f3a";
    ctx.beginPath();
    ctx.arc(x, ground - 62, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  drawBillboard(ctx, x, ground) {
    ctx.fillStyle = "#777";
    ctx.fillRect(x, ground - 70, 8, 70);
    ctx.fillRect(x + 86, ground - 70, 8, 70);
    ctx.fillStyle = "#fff4c2";
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 3;
    ctx.fillRect(x - 10, ground - 118, 114, 52);
    ctx.strokeRect(x - 10, ground - 118, 114, 52);
    ctx.fillStyle = "#111";
    ctx.font = "bold 12px Comic Neue, Trebuchet MS, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("GET A JOB", x + 47, ground - 96);
    ctx.font = "11px Comic Neue, Trebuchet MS, sans-serif";
    ctx.fillText("then another one", x + 47, ground - 80);
  }

  drawBuilding(ctx, b, ground, night) {
    const h = b.id === "uni" || b.id === "church" ? 128 : 110;
    const y = ground - h;
    ctx.fillStyle = b.color;
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 3;
    ctx.fillRect(b.x, y, b.w, h);
    ctx.strokeRect(b.x, y, b.w, h);

    ctx.fillStyle = b.roof;
    ctx.beginPath();
    ctx.moveTo(b.x - 8, y);
    ctx.lineTo(b.x + b.w / 2, y - (b.id === "church" ? 46 : 28));
    ctx.lineTo(b.x + b.w + 8, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (b.id === "church") {
      ctx.beginPath();
      ctx.moveTo(b.x + b.w / 2, y - 70);
      ctx.lineTo(b.x + b.w / 2, y - 46);
      ctx.moveTo(b.x + b.w / 2 - 8, y - 62);
      ctx.lineTo(b.x + b.w / 2 + 8, y - 62);
      ctx.stroke();
    }

    if (b.id === "well") {
      ctx.fillStyle = "#05030c";
      ctx.beginPath();
      ctx.ellipse(b.x + b.w / 2, ground - 8, 42, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#5ce1ff";
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.ellipse(b.x + b.w / 2, ground - 8, 18, 6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "#111";
    } else {
      const glow = night ? "#ffe56b" : "#f5e6a8";
      ctx.fillStyle = glow;
      ctx.fillRect(b.x + 18, y + 28, 22, 22);
      ctx.fillRect(b.x + b.w - 40, y + 28, 22, 22);
      ctx.strokeRect(b.x + 18, y + 28, 22, 22);
      ctx.strokeRect(b.x + b.w - 40, y + 28, 22, 22);
      ctx.fillStyle = "#4a2a12";
      ctx.fillRect(b.x + b.w / 2 - 14, ground - 46, 28, 46);
      ctx.strokeRect(b.x + b.w / 2 - 14, ground - 46, 28, 46);
    }

    if (b.id === "burger") {
      ctx.fillStyle = "#ffd24a";
      ctx.font = "bold 28px Bangers, Impact, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("M", b.x + b.w / 2, y + 26);
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 2;
      ctx.strokeText("M", b.x + b.w / 2, y + 26);
    }

    if (b.id === "clinic") {
      ctx.fillStyle = "#c0392b";
      ctx.fillRect(b.x + b.w / 2 - 4, y + 18, 8, 22);
      ctx.fillRect(b.x + b.w / 2 - 11, y + 24, 22, 8);
    }

    ctx.fillStyle = "#111";
    ctx.font = "bold 13px Comic Neue, Trebuchet MS, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(b.name, b.x + b.w / 2, y - (b.id === "church" ? 78 : 36));
  }
}
