import { rand, randInt, circleHit, distance } from "./utils.js";
import { MONSTERS } from "./farmingData.js";

export class Monster {
  constructor(type, x, y, nightNumber = 1) {
    const data = MONSTERS[type] || MONSTERS.crow;
    this.type = type;
    this.id = Math.random().toString(36).substring(2, 9);
    this.x = x;
    this.y = y;
    this.size = data.size;
    this.color = data.color;
    this.eyeColor = data.eyeColor;
    this.isBoss = Boolean(data.isBoss);

    // Scale with night wave number
    const hpScale = 1.0 + (nightNumber - 1) * 0.35;
    const dmgScale = 1.0 + (nightNumber - 1) * 0.2;
    this.maxHp = Math.round(data.hp * hpScale);
    this.hp = this.maxHp;
    this.damage = Math.round(data.damage * dmgScale);
    this.speed = data.speed + Math.min(30, (nightNumber - 1) * 3);
    this.xp = data.xp;
    this.behavior = data.behavior;

    this.hitTimer = 0;
    this.vx = 0;
    this.vy = 0;
    this.animPhase = Math.random() * Math.PI * 2;
  }

  takeDamage(amount, knockbackX = 0, knockbackY = 0) {
    this.hp -= amount;
    this.hitTimer = 0.15; // flash white
    this.vx += knockbackX;
    this.vy += knockbackY;
    return this.hp <= 0;
  }

  update(dt, playerX, playerY) {
    this.animPhase += dt * 6;
    if (this.hitTimer > 0) this.hitTimer -= dt;

    // Decay knockback velocity
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= Math.pow(0.01, dt);
    this.vy *= Math.pow(0.01, dt);

    // Track towards player
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.hypot(dx, dy) || 1;

    let moveSpeed = this.speed;
    if (this.behavior === "swoop") {
      // Swerving sine wave swoop
      const perpX = -dy / dist;
      const perpY = dx / dist;
      const wave = Math.sin(this.animPhase * 2) * 45;
      this.x += ((dx / dist) * moveSpeed + perpX * wave) * dt;
      this.y += ((dy / dist) * moveSpeed + perpY * wave) * dt;
    } else {
      this.x += (dx / dist) * moveSpeed * dt;
      this.y += (dy / dist) * moveSpeed * dt;
    }
  }
}

export class WaveSpawner {
  constructor() {
    this.timer = 0;
    this.bossSpawned = false;
  }

  reset() {
    this.timer = 0;
    this.bossSpawned = false;
  }

  update(dt, nightNumber, nightTimeRemaining, nightTotalDuration, playerX, playerY) {
    const spawned = [];
    this.timer += dt;

    // Spawn rate increases as night progresses
    const progress = 1.0 - nightTimeRemaining / nightTotalDuration; // 0.0 to 1.0
    const spawnInterval = Math.max(0.35, 1.4 - progress * 0.85 - nightNumber * 0.08);

    if (this.timer >= spawnInterval) {
      this.timer = 0;
      const count = randInt(1, 1 + Math.floor(progress * 3) + Math.floor(nightNumber / 2));

      for (let i = 0; i < count; i++) {
        // Pick monster type based on night and progress
        let type = "crow";
        const roll = Math.random();
        if (nightNumber >= 4 && roll > 0.7) {
          type = "weedMonster";
        } else if (nightNumber >= 2 && roll > 0.5) {
          type = "mole";
        } else if (nightNumber >= 3 && roll > 0.3) {
          type = "bat";
        }

        // Spawn on border ring around player (distance 350 - 480)
        const angle = Math.random() * Math.PI * 2;
        const dist = rand(360, 480);
        const mx = playerX + Math.cos(angle) * dist;
        const my = playerY + Math.sin(angle) * dist;
        spawned.push(new Monster(type, mx, my, nightNumber));
      }
    }

    // Boss spawn halfway through the night if night >= 2
    if (!this.bossSpawned && nightNumber >= 2 && progress >= 0.5) {
      this.bossSpawned = true;
      const angle = Math.random() * Math.PI * 2;
      const dist = 420;
      const mx = playerX + Math.cos(angle) * dist;
      const my = playerY + Math.sin(angle) * dist;
      spawned.push(new Monster("werewolf", mx, my, nightNumber));
    }

    return spawned;
  }
}
