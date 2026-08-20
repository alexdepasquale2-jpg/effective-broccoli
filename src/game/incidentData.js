import { clamp, distance, rand } from "./utils.js";

// Types of physical incidents in the world
// Each has:
// - need: "pass" (do nothing / stand calm nearby), "tend" (quietly accompany), "act" (actively strike/push)
// - loud: boolean (screaming visual effects vs subtle)
// - duration: time before it self-resolves
// - impactRadius: physical radius of the event
export const INCIDENT_TYPES = {
  // --- LOUD INCIDENTS (Look urgent & violent, but acting makes it worse or changes nothing) ---
  whirlwind: {
    id: "whirlwind",
    title: "Dust Devil",
    domain: "town",
    loud: true,
    need: "pass",
    duration: 8,
    radius: 70,
    color: "#d9906f",
    particleKind: "dust",
    onPassText: "The wind blew itself out into the grass.",
    onActText: "You swung into the dust. Your eyes burned and the wind blew out anyway.",
    onTendText: "You sheltered against the wall until it passed.",
  },
  wildfire: {
    id: "wildfire",
    title: "Brush Fire Flare",
    domain: "world",
    loud: true,
    need: "pass",
    duration: 9,
    radius: 80,
    color: "#ff5722",
    particleKind: "fire",
    onPassText: "The dry brush consumed itself and died at the rock line.",
    onActText: "You beat at the flames and scattered embers into dry gorse.",
    onTendText: "You watched the perimeter quietly.",
  },
  runaway_cart: {
    id: "runaway_cart",
    title: "Loose Wagon",
    domain: "work",
    loud: true,
    need: "pass",
    duration: 7,
    radius: 65,
    color: "#e65100",
    particleKind: "debris",
    onPassText: "The wagon coasted gently to a halt in the deep mud.",
    onActText: "You tried to grab the wheel and strained your shoulder as it stopped in the mud anyway.",
    onTendText: "You guided onlookers clear of the lane.",
  },
  brawlers: {
    id: "brawlers",
    title: "Tavern Argument",
    domain: "town",
    loud: true,
    need: "pass",
    duration: 8.5,
    radius: 75,
    color: "#c2185b",
    particleKind: "shout",
    onPassText: "Both exhausted their fury and walked away in silence.",
    onActText: "You stepped between them and took a stray elbow. They united against you.",
    onTendText: "You remained present. The temperature cooled.",
  },

  // --- QUIET INCIDENTS (Subtle, easy to ignore, but genuinely need care or direct help) ---
  crying_stranger: {
    id: "crying_stranger",
    title: "Weeping Stranger",
    domain: "kin",
    loud: false,
    need: "tend",
    duration: 12,
    radius: 55,
    color: "#80deea",
    particleKind: "tears",
    onPassText: "They sat alone in their grief for hours.",
    onActText: "You told them everything happens for a reason. They shrank away.",
    onTendText: "You sat quietly beside them on the bench. They slowly breathed easier.",
  },
  dying_sprout: {
    id: "dying_sprout",
    title: "Wilted Sapling",
    domain: "self",
    loud: false,
    need: "tend",
    duration: 11,
    radius: 50,
    color: "#aed581",
    particleKind: "leaves",
    onPassText: "The fragile sprout dried in the midday sun.",
    onActText: "You flooded the soil with excess water, rotting the roots.",
    onTendText: "You shaded the delicate leaves with your hands until the heat subsided.",
  },
  stuck_sheep: {
    id: "stuck_sheep",
    title: "Trapped Lamb",
    domain: "work",
    loud: false,
    need: "act",
    duration: 10,
    radius: 55,
    color: "#fff9c4",
    particleKind: "fleece",
    onPassText: "The lamb exhausted itself struggling in the bramble thorn.",
    onActText: "You cut the bramble vine with a swift stroke. It bolted back to the flock.",
    onTendText: "You stroked its head, but the thorn remained tightly wedged.",
  },
  fallen_elder: {
    id: "fallen_elder",
    title: "Fallen Elder",
    domain: "kin",
    loud: false,
    need: "act",
    duration: 9,
    radius: 55,
    color: "#ce93d8",
    particleKind: "pulse",
    onPassText: "Nobody noticed them on the gravel until dusk.",
    onActText: "You offered your arm and helped them safely to their feet.",
    onTendText: "You asked if they were okay while they remained on the ground.",
  },
};

export class Incident {
  constructor(typeKey, x, y) {
    const data = INCIDENT_TYPES[typeKey] || INCIDENT_TYPES.whirlwind;
    this.type = typeKey;
    this.title = data.title;
    this.domain = data.domain;
    this.loud = data.loud;
    this.need = data.need; // "pass", "tend", "act"
    this.x = x;
    this.y = y;
    this.radius = data.radius;
    this.color = data.color;
    this.particleKind = data.particleKind;

    this.timer = data.duration;
    this.totalDuration = data.duration;
    this.resolved = false;
    this.resolution = null; // { action: 'pass'|'tend'|'act', right: boolean, text: string }

    // Visual animation phase
    this.animPhase = Math.random() * Math.PI * 2;
    this.tendTimer = 0; // Accumulated time player stands calmly inside radius
  }

  update(dt, playerX, playerY, playerSpeed, playerIsActing) {
    if (this.resolved) return null;

    this.animPhase += dt * (this.loud ? 8 : 3);
    this.timer -= dt;

    const dist = distance(this.x, this.y, playerX, playerY);
    const inRange = dist < this.radius;

    // Check if player acts directly (Strike / Push)
    if (inRange && playerIsActing) {
      return this.resolve("act");
    }

    // Check if player is tending (standing peaceful inside radius for > 2.0s)
    if (inRange && playerSpeed < 15) {
      this.tendTimer += dt;
      if (this.tendTimer >= 2.0) {
        return this.resolve("tend");
      }
    } else {
      this.tendTimer = Math.max(0, this.tendTimer - dt * 1.5);
    }

    // Natural expiration -> Resolves via "pass" (doing nothing)
    if (this.timer <= 0) {
      return this.resolve("pass");
    }

    return null;
  }

  resolve(action) {
    this.resolved = true;
    const data = INCIDENT_TYPES[this.type];
    const right = action === this.need;

    let text = "";
    if (action === "act") text = data.onActText;
    else if (action === "tend") text = data.onTendText;
    else text = data.onPassText;

    this.resolution = {
      incidentType: this.type,
      title: this.title,
      domain: this.domain,
      action,
      need: this.need,
      right,
      loud: this.loud,
      text,
      x: this.x,
      y: this.y,
    };
    return this.resolution;
  }
}
