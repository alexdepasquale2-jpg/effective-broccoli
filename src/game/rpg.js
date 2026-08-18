export function createHero() {
  return {
    str: 1,
    int: 1,
    cha: 1,
    karma: 0,
    cash: 20,
    day: 1,
    hour: 8,
    hp: 100,
    hpMax: 100,
    items: { hat: false, bat: false },
  };
}

export const STREET_WIDTH = 2500;

export const BUILDINGS = [
  { id: "pad", name: "Your Pad", x: 140, w: 150, color: "#d4b483", roof: "#8b5a2b" },
  { id: "burger", name: "McStick's", x: 380, w: 170, color: "#e4453a", roof: "#b11f18" },
  { id: "uni", name: "U of S", x: 640, w: 210, color: "#6d82ff", roof: "#3140a8" },
  { id: "gym", name: "The Gym", x: 940, w: 160, color: "#8a8a8a", roof: "#333333" },
  { id: "bar", name: "Sky's Bar", x: 1180, w: 170, color: "#c26a21", roof: "#7a3b0e" },
  { id: "pawn", name: "Pawn Shop", x: 1440, w: 150, color: "#e2c14a", roof: "#9a7a12" },
  { id: "clinic", name: "Clinic", x: 1680, w: 150, color: "#f4f4f4", roof: "#c0392b" },
  { id: "church", name: "Church", x: 1920, w: 160, color: "#efe6d0", roof: "#5a3a1a" },
  { id: "well", name: "The Well", x: 2180, w: 180, color: "#2a1840", roof: "#0e0718" },
];

export const FLAVOR = {
  pad: "Your apartment smells like ambition and old pizza.",
  burger: "Would you like fries with your soul?",
  uni: "They teach you things. Then they bill you for it.",
  gym: "Pain is weakness leaving the stick.",
  bar: "Sky says the first round is never on her.",
  pawn: "We buy junk. We sell dreams. No refunds.",
  clinic: "If you can walk in, we can overcharge you.",
  church: "Pray up. Sin down. Collection plate either way.",
  well: "A hole in the street that eats dimensions. Typical Tuesday.",
};

export const ACTIONS = {
  pad: [
    { id: "sleep", name: "Sleep", hours: 8, hp: 50, text: "You sleep. Tomorrow you will still be a stick." },
    { id: "tv", name: "Watch TV", hours: 2, cha: 1, text: "Infomercials count as a social life." },
    { id: "stare", name: "Stare at the wall", hours: 1, text: "You consider your life. The wall wins." },
  ],
  burger: [
    { id: "flip", name: "Flip burgers", hours: 4, cash: 36, text: "Minimum wage. Maximum grease." },
    { id: "eat", name: "Eat a burger", hours: 1, cash: -6, hp: 22, text: "It is technically food." },
    { id: "manager", name: "Shift manager", hours: 4, cash: 80, int: 1, need: { int: 8 }, text: "You yell at other sticks about pickles." },
  ],
  uni: [
    { id: "study", name: "Study", hours: 3, int: 2, cash: -4, text: "Your brain hurts in a productive way." },
    { id: "class", name: "Take a class", hours: 4, int: 4, cash: -20, need: { cash: 20 }, text: "Student loans are a personality trait." },
    { id: "professor", name: "Guest lecture", hours: 3, cash: 140, cha: 1, need: { int: 18 }, text: "You teach 4D ethics. Nobody passes." },
  ],
  gym: [
    { id: "workout", name: "Work out", hours: 2, str: 2, hp: -6, text: "Pain is weakness leaving the stick." },
    { id: "protein", name: "Shady protein", hours: 1, str: 4, cash: -18, karma: -2, hp: -8, need: { cash: 18 }, text: "Gains now. Court dates later." },
    { id: "spot", name: "Spot a meathead", hours: 1, str: 1, cha: 1, need: { str: 8 }, text: "You grunt in harmony. Friendship." },
  ],
  bar: [
    { id: "beer", name: "Have a beer", hours: 1, cha: 2, cash: -8, hp: -4, karma: -1, need: { cash: 8 }, text: "Charm up. Liver down." },
    { id: "coffee", name: "Drink coffee", hours: 1, cha: 1, int: 1, cash: -4, need: { cash: 4 }, text: "You vibrate at a higher frequency." },
    { id: "brawl", name: "Start a brawl", hours: 1, str: 2, karma: -3, cash: 18, hp: -22, need: { str: 6 }, text: "You win a tooth and $18." },
  ],
  pawn: [
    { id: "sell", name: "Pawn junk", hours: 1, cash: 14, text: "They give you $14 for your dignity." },
    { id: "hat", name: "Buy a cool hat", hours: 1, cha: 3, cash: -40, item: "hat", need: { cash: 40 }, text: "The hat does 90% of the talking." },
    { id: "bat", name: "Buy a nail bat", hours: 1, str: 2, cash: -55, item: "bat", need: { cash: 55 }, text: "Diplomacy is now optional." },
  ],
  clinic: [
    { id: "stitches", name: "Get stitches", hours: 1, cash: -25, hp: 40, need: { cash: 25 }, text: "They use office tape. You feel amazing." },
    { id: "physical", name: "Cheap physical", hours: 1, cash: -10, hp: 16, need: { cash: 10 }, text: "The doctor is a stick with a clipboard." },
  ],
  church: [
    { id: "pray", name: "Pray", hours: 1, karma: 4, text: "You feel slightly less doomed." },
    { id: "plate", name: "Rob the plate", hours: 1, cash: 16, karma: -5, text: "God saw that. So did the priest." },
  ],
  well: [
    { id: "dive", name: "Dive the 4D well", hours: 2, special: "well", text: "You jump into a hole in reality. Typical Tuesday." },
  ],
};

export function clockLabel(hour) {
  const h = ((Math.floor(hour) % 24) + 24) % 24;
  const suffix = h >= 12 ? "PM" : "AM";
  const twelve = h % 12 === 0 ? 12 : h % 12;
  return `${twelve}:00 ${suffix}`;
}

export function skyForHour(hour) {
  const h = ((hour % 24) + 24) % 24;
  if (h < 6) return { sky: "#0f1a33", ground: "#16351a", ambient: 0.35, night: true };
  if (h < 8) return { sky: "#f0a36b", ground: "#3e8a3e", ambient: 0.7, night: false };
  if (h < 17) return { sky: "#7ec8e8", ground: "#4caf50", ambient: 1, night: false };
  if (h < 20) return { sky: "#e07a4c", ground: "#3d7a3d", ambient: 0.75, night: false };
  return { sky: "#1b2a4a", ground: "#1e4a24", ambient: 0.45, night: true };
}

export function missingNeed(hero, action) {
  const need = action.need || {};
  if (need.cash && hero.cash < need.cash) return `Need $${need.cash}.`;
  if (need.str && hero.str < need.str) return `Need ${need.str} STR.`;
  if (need.int && hero.int < need.int) return `Need ${need.int} INT.`;
  if (need.cha && hero.cha < need.cha) return `Need ${need.cha} CHA.`;
  if (need.karmaMin && hero.karma < need.karmaMin) return "Not enough good karma.";
  if (need.karmaMax && hero.karma > need.karmaMax) return "Too much good karma.";
  return null;
}

export function canAffordTime(hero, action) {
  if (action.id === "sleep") return true;
  return hero.hour + (action.hours || 0) < 26;
}

export function applyAction(hero, action) {
  const blocked = missingNeed(hero, action);
  if (blocked) return { ok: false, reason: blocked, hero };
  if (!canAffordTime(hero, action)) {
    return { ok: false, reason: "You're a zombie. Go sleep.", hero };
  }
  if (hero.hp <= 0 && action.id !== "sleep") {
    return { ok: false, reason: "You are a floor decoration. Sleep.", hero };
  }

  const next = { ...hero, items: { hat: false, bat: false, ...(hero.items || {}) } };
  next.cash += action.cash || 0;
  next.str += action.str || 0;
  next.int += action.int || 0;
  next.cha += action.cha || 0;
  next.karma += action.karma || 0;
  next.hp = Math.max(0, Math.min(next.hpMax, next.hp + (action.hp || 0)));
  if (action.item) next.items[action.item] = true;
  if (action.id === "sleep") {
    next.hour = 8;
    next.day += 1;
    next.hp = next.hpMax;
  } else {
    next.hour += action.hours || 0;
    while (next.hour >= 24) {
      next.hour -= 24;
      next.day += 1;
    }
  }
  if (next.cash < 0) next.cash = 0;
  return { ok: true, hero: next, text: action.text, special: action.special || null };
}

export function wellPayout(score) {
  return Math.max(8, Math.floor((Number(score) || 0) / 7));
}

export function buildingAt(x) {
  return BUILDINGS.find((b) => x >= b.x && x <= b.x + b.w) || null;
}

export function heroLine(hero) {
  return `STR ${hero.str}   INT ${hero.int}   CHA ${hero.cha}   KARMA ${hero.karma}`;
}

export function actionLabel(action) {
  const bits = [action.name];
  if (action.hours) bits.push(`${action.hours}h`);
  if (action.cash) bits.push(`${action.cash > 0 ? "+" : "-"}$${Math.abs(action.cash)}`);
  if (action.str) bits.push(`+${action.str} STR`);
  if (action.int) bits.push(`+${action.int} INT`);
  if (action.cha) bits.push(`+${action.cha} CHA`);
  if (action.karma) bits.push(`${action.karma > 0 ? "+" : ""}${action.karma} KARMA`);
  if (action.hp) bits.push(`${action.hp > 0 ? "+" : ""}${action.hp} HP`);
  return bits.join(" · ");
}
