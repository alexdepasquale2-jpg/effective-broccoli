import { ALLIES } from "./farmingData.js";
import { distance, rand, circleHit } from "./utils.js";

export class Ally {
  constructor(type, x, y) {
    const data = ALLIES[type] || ALLIES.carrotSprite;
    this.type = type;
    this.id = Math.random().toString(36).substring(2, 9);
    this.name = data.name;
    this.icon = data.icon;
    this.desc = data.desc;
    this.x = x;
    this.y = y;
    this.size = data.size;
    this.color = data.color;
    this.maxHp = data.hp;
    this.hp = this.maxHp;
    this.damage = data.damage;
    this.cooldown = data.cooldown;
    this.cooldownTimer = Math.random() * 0.5;
    this.range = data.range;
    this.attackType = data.type;
    this.speed = data.speed;

    this.target = null;
    this.animPhase = Math.random() * Math.PI * 2;
    this.activeDuration = 80; // Survives across nights
  }

  takeDamage(amount) {
    this.hp -= amount;
    return this.hp <= 0;
  }

  update(dt, monsters, playerX, playerY, createProjectileCallback, createDamageNumberCallback) {
    this.animPhase += dt * 5;
    this.cooldownTimer -= dt;

    // Follow player if no monsters nearby
    let closest = null;
    let minDist = this.range;

    for (const m of monsters) {
      const d = distance(this.x, this.y, m.x, m.y);
      if (d < minDist) {
        minDist = d;
        closest = m;
      }
    }

    if (closest) {
      // Attack target
      const dx = closest.x - this.x;
      const dy = closest.y - this.y;
      const d = Math.hypot(dx, dy) || 1;

      // Keep optimal range or charge if melee
      if (this.attackType === "melee_slam" || this.attackType === "earthquake") {
        if (d > 35) {
          this.x += (dx / d) * this.speed * dt;
          this.y += (dy / d) * this.speed * dt;
        }
      } else {
        // Ranged kite
        if (d > this.range * 0.7) {
          this.x += (dx / d) * this.speed * dt;
          this.y += (dy / d) * this.speed * dt;
        } else if (d < 50) {
          this.x -= (dx / d) * this.speed * dt;
          this.y -= (dy / d) * this.speed * dt;
        }
      }

      // Execute attack when ready
      if (this.cooldownTimer <= 0) {
        this.cooldownTimer = this.cooldown;
        this.performAttack(closest, monsters, createProjectileCallback, createDamageNumberCallback);
      }
    } else {
      // Roam / follow near player
      const dPlayer = distance(this.x, this.y, playerX, playerY);
      if (dPlayer > 85) {
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const d = Math.hypot(dx, dy) || 1;
        this.x += (dx / d) * this.speed * dt;
        this.y += (dy / d) * this.speed * dt;
      } else {
        // Gentle hover
        this.x += Math.sin(this.animPhase) * 12 * dt;
        this.y += Math.cos(this.animPhase) * 12 * dt;
      }
    }
  }

  performAttack(target, monsters, createProjectile, createDamageNumber) {
    if (this.attackType === "ranged") {
      // Thorn arrow
      const angle = Math.atan2(target.y - this.y, target.x - this.x);
      createProjectile({
        type: "ally_thorn",
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * 360,
        vy: Math.sin(angle) * 360,
        damage: this.damage,
        life: 0.8,
        color: this.color,
      });
    } else if (this.attackType === "melee_slam") {
      // Ground slam AOE
      for (const m of monsters) {
        if (distance(this.x, this.y, m.x, m.y) < 65 + m.size) {
          m.takeDamage(this.damage, (m.x - this.x) * 4, (m.y - this.y) * 4);
          createDamageNumber(m.x, m.y, this.damage, "#8d6e63");
        }
      }
      createProjectile({
        type: "ground_shockwave",
        x: this.x,
        y: this.y,
        radius: 65,
        duration: 0.3,
        color: "#8d6e63",
      });
    } else if (this.attackType === "lifesteal_beam") {
      // Crimson beam
      target.takeDamage(this.damage);
      createDamageNumber(target.x, target.y, this.damage, "#e91e63");
      createProjectile({
        type: "crimson_beam",
        x: this.x,
        y: this.y,
        tx: target.x,
        ty: target.y,
        duration: 0.25,
      });
    } else if (this.attackType === "earthquake") {
      // Treant roots cluster
      for (let i = 0; i < 3; i++) {
        const rx = target.x + rand(-40, 40);
        const ry = target.y + rand(-40, 40);
        createProjectile({
          type: "root_spike",
          x: rx,
          y: ry,
          radius: 45,
          damage: this.damage,
          duration: 0.4,
          hitMonsters: new Set(),
        });
      }
    } else if (this.attackType === "plasma_breath") {
      // Cosmic dragon breath
      const angle = Math.atan2(target.y - this.y, target.x - this.x);
      for (let i = 0; i < 3; i++) {
        const spread = (i - 1) * 0.18;
        createProjectile({
          type: "cosmic_plasma",
          x: this.x,
          y: this.y,
          vx: Math.cos(angle + spread) * 400,
          vy: Math.sin(angle + spread) * 400,
          damage: this.damage,
          pierce: 10,
          life: 1.0,
        });
      }
    }
  }
}
