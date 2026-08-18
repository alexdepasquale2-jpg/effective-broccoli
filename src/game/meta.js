import { createSave } from "./economy.js";

export function emptyMeta() {
  return {
    save: createSave(),
    bestCombo: 0,
  };
}

export function titleForCaught(caught) {
  if (caught >= 200) return "Reef Baron";
  if (caught >= 80) return "Abyss Trader";
  if (caught >= 30) return "Harpoon Captain";
  if (caught >= 10) return "Deck Hand";
  return "Dock Rat";
}
